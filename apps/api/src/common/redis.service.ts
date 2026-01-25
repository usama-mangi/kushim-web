import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';

/**
 * Redis service for caching and distributed locking
 * Supports multi-instance deployment with Redlock algorithm
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly redlock: Redlock;
  private readonly enabled: boolean;

  // Cache TTLs
  private readonly CONTEXT_GROUP_TTL = 300; // 5 minutes
  private readonly USER_PROFILE_TTL = 600; // 10 minutes
  private readonly PLATFORM_DATA_TTL = 180; // 3 minutes

  constructor() {
    // Redis is optional - gracefully degrade if not configured
    this.enabled = !!process.env.REDIS_URL;

    if (!this.enabled) {
      this.logger.warn('Redis not configured - caching and distributed locking disabled');
      this.client = null as any;
      this.redlock = null as any;
      return;
    }

    try {
      this.client = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        lazyConnect: true,
      });

      // Initialize Redlock for distributed locking
      this.redlock = new Redlock([this.client], {
        driftFactor: 0.01,
        retryCount: 3,
        retryDelay: 200,
        retryJitter: 200,
        automaticExtensionThreshold: 500,
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis connection error', err);
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      // Connect to Redis
      this.client.connect().catch((err) => {
        this.logger.error('Failed to connect to Redis', err);
        this.enabled = false;
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis', error);
      this.enabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Acquire a distributed lock
   * @param resource Unique identifier for the resource to lock
   * @param ttl Lock duration in milliseconds (default: 10s)
   */
  async acquireLock(resource: string, ttl = 10000): Promise<Redlock.Lock | null> {
    if (!this.enabled) {
      this.logger.debug(`Lock requested but Redis disabled: ${resource}`);
      return null;
    }

    try {
      const lock = await this.redlock.acquire([`locks:${resource}`], ttl);
      this.logger.debug(`Lock acquired: ${resource}`);
      return lock;
    } catch (error) {
      this.logger.warn(`Failed to acquire lock: ${resource}`, error);
      return null;
    }
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(lock: Redlock.Lock | null): Promise<void> {
    if (!lock) return;

    try {
      await lock.release();
      this.logger.debug('Lock released');
    } catch (error) {
      this.logger.warn('Failed to release lock', error);
    }
  }

  /**
   * Execute a function with a distributed lock
   * Falls back to executing without lock if Redis unavailable
   */
  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    ttl = 10000,
  ): Promise<T> {
    const lock = await this.acquireLock(resource, ttl);

    try {
      return await fn();
    } finally {
      await this.releaseLock(lock);
    }
  }

  // ============ Caching Methods ============

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(`Cache get failed: ${key}`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.enabled) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.warn(`Cache set failed: ${key}`, error);
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string | string[]): Promise<void> {
    if (!this.enabled) return;

    try {
      if (Array.isArray(key)) {
        await this.client.del(...key);
      } else {
        await this.client.del(key);
      }
    } catch (error) {
      this.logger.warn('Cache delete failed', error);
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.warn(`Cache pattern delete failed: ${pattern}`, error);
    }
  }

  // ============ Domain-Specific Cache Methods ============

  /**
   * Cache a context group
   */
  async cacheContextGroup(userId: string, groupId: string, data: unknown): Promise<void> {
    const key = `context_group:${userId}:${groupId}`;
    await this.set(key, data, this.CONTEXT_GROUP_TTL);
  }

  /**
   * Get cached context group
   */
  async getCachedContextGroup<T>(userId: string, groupId: string): Promise<T | null> {
    const key = `context_group:${userId}:${groupId}`;
    return this.get<T>(key);
  }

  /**
   * Invalidate all context groups for a user
   */
  async invalidateUserContextGroups(userId: string): Promise<void> {
    await this.delPattern(`context_group:${userId}:*`);
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(userId: string, data: unknown): Promise<void> {
    const key = `user_profile:${userId}`;
    await this.set(key, data, this.USER_PROFILE_TTL);
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile<T>(userId: string): Promise<T | null> {
    const key = `user_profile:${userId}`;
    return this.get<T>(key);
  }

  /**
   * Invalidate user profile cache
   */
  async invalidateUserProfile(userId: string): Promise<void> {
    await this.del(`user_profile:${userId}`);
  }

  /**
   * Cache platform data (e.g., GitHub issues, Jira tickets)
   */
  async cachePlatformData(
    platform: string,
    userId: string,
    dataSourceId: string,
    data: unknown,
  ): Promise<void> {
    const key = `platform:${platform}:${userId}:${dataSourceId}`;
    await this.set(key, data, this.PLATFORM_DATA_TTL);
  }

  /**
   * Get cached platform data
   */
  async getCachedPlatformData<T>(
    platform: string,
    userId: string,
    dataSourceId: string,
  ): Promise<T | null> {
    const key = `platform:${platform}:${userId}:${dataSourceId}`;
    return this.get<T>(key);
  }

  /**
   * Invalidate all platform data for a user
   */
  async invalidatePlatformData(userId: string): Promise<void> {
    await this.delPattern(`platform:*:${userId}:*`);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ enabled: boolean; info?: Record<string, string> }> {
    if (!this.enabled) {
      return { enabled: false };
    }

    try {
      const info = await this.client.info('stats');
      const lines = info.split('\r\n');
      const stats: Record<string, string> = {};

      for (const line of lines) {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            stats[key] = value;
          }
        }
      }

      return { enabled: true, info: stats };
    } catch (error) {
      this.logger.error('Failed to get Redis stats', error);
      return { enabled: true };
    }
  }
}

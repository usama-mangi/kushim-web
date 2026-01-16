import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnModuleDestroy
{
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const throttlerKey = `throttler:${throttlerName}:${key}`;
    const blockKey = `throttler:block:${throttlerName}:${key}`;

    // Check if blocked
    const ttlBlock = await this.redis.pttl(blockKey);
    if (ttlBlock > 0) {
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(ttlBlock / 1000),
      };
    }

    // Increment
    const multi = this.redis.multi();
    multi.incr(throttlerKey);
    multi.pttl(throttlerKey);

    const results = await multi.exec();
    if (!results) {
      throw new Error('Redis transaction failed');
    }

    const count = results[0][1] as number;
    let ttlRemaining = results[1][1] as number;

    // Handle TTL
    if (count === 1) {
      // First hit
      await this.redis.pexpire(throttlerKey, ttl);
      ttlRemaining = ttl;
    } else if (ttlRemaining === -1) {
      // Should have TTL but doesn't
      await this.redis.pexpire(throttlerKey, ttl);
      ttlRemaining = ttl;
    }

    // Check limit
    if (count > limit) {
      // Block
      await this.redis.set(blockKey, '1', 'PX', blockDuration);
      return {
        totalHits: count,
        timeToExpire: Math.ceil(ttlRemaining / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockDuration / 1000),
      };
    }

    return {
      totalHits: count,
      timeToExpire: Math.ceil(ttlRemaining / 1000),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}

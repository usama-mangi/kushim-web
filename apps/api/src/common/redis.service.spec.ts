import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

describe('RedisService - Distributed Locking', () => {
  let service: RedisService;
  let originalRedisUrl: string | undefined;

  beforeAll(() => {
    originalRedisUrl = process.env.REDIS_URL;
  });

  afterAll(() => {
    if (originalRedisUrl) {
      process.env.REDIS_URL = originalRedisUrl;
    } else {
      delete process.env.REDIS_URL;
    }
  });

  describe('when Redis is not configured', () => {
    beforeEach(async () => {
      delete process.env.REDIS_URL;

      const module: TestingModule = await Test.createTestingModule({
        providers: [RedisService],
      }).compile();

      service = module.get<RedisService>(RedisService);
    });

    it('should gracefully degrade without Redis', async () => {
      const result = await service.withLock('test-resource', async () => {
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should return null when acquiring lock', async () => {
      const lock = await service.acquireLock('test-resource');
      expect(lock).toBeNull();
    });

    it('should handle cache operations gracefully', async () => {
      await service.set('test-key', { data: 'value' });
      const result = await service.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('when Redis is configured', () => {
    beforeEach(async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      const module: TestingModule = await Test.createTestingModule({
        providers: [RedisService],
      }).compile();

      service = module.get<RedisService>(RedisService);

      // Wait for Redis connection
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    afterEach(async () => {
      await service.onModuleDestroy();
    });

    it('should acquire and release lock', async () => {
      const lock = await service.acquireLock('test-resource', 5000);
      expect(lock).toBeDefined();

      if (lock) {
        await service.releaseLock(lock);
      }
    });

    it('should execute function with lock', async () => {
      const result = await service.withLock(
        'test-resource',
        async () => {
          return 'executed';
        },
        5000,
      );

      expect(result).toBe('executed');
    });

    it('should prevent concurrent execution with same lock', async () => {
      const executionOrder: number[] = [];

      const task1 = service.withLock(
        'shared-resource',
        async () => {
          executionOrder.push(1);
          await new Promise((resolve) => setTimeout(resolve, 100));
          executionOrder.push(2);
        },
        2000,
      );

      // Start second task slightly after first
      await new Promise((resolve) => setTimeout(resolve, 10));

      const task2 = service.withLock(
        'shared-resource',
        async () => {
          executionOrder.push(3);
          await new Promise((resolve) => setTimeout(resolve, 100));
          executionOrder.push(4);
        },
        2000,
      );

      await Promise.all([task1, task2]);

      // Tasks should execute sequentially, not interleaved
      expect(executionOrder).toEqual([1, 2, 3, 4]);
    });

    it('should allow concurrent execution with different locks', async () => {
      const executionOrder: number[] = [];

      const task1 = service.withLock(
        'resource-1',
        async () => {
          executionOrder.push(1);
          await new Promise((resolve) => setTimeout(resolve, 50));
        },
        2000,
      );

      const task2 = service.withLock(
        'resource-2',
        async () => {
          executionOrder.push(2);
          await new Promise((resolve) => setTimeout(resolve, 50));
        },
        2000,
      );

      await Promise.all([task1, task2]);

      // Both tasks should have started (order may vary)
      expect(executionOrder).toContain(1);
      expect(executionOrder).toContain(2);
    });
  });

  describe('caching', () => {
    beforeEach(async () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      const module: TestingModule = await Test.createTestingModule({
        providers: [RedisService],
      }).compile();

      service = module.get<RedisService>(RedisService);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    afterEach(async () => {
      await service.onModuleDestroy();
    });

    it('should cache and retrieve values', async () => {
      const data = { id: '123', name: 'Test' };
      await service.set('test-key', data, 60);

      const retrieved = await service.get<typeof data>('test-key');
      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', async () => {
      const result = await service.get('non-existent');
      expect(result).toBeNull();
    });

    it('should delete cached values', async () => {
      await service.set('test-key', { data: 'value' }, 60);
      await service.del('test-key');

      const result = await service.get('test-key');
      expect(result).toBeNull();
    });

    it('should cache context groups', async () => {
      const groupData = { id: 'group-1', records: ['rec-1', 'rec-2'] };
      await service.cacheContextGroup('user-1', 'group-1', groupData);

      const retrieved = await service.getCachedContextGroup<typeof groupData>(
        'user-1',
        'group-1',
      );
      expect(retrieved).toEqual(groupData);
    });

    it('should invalidate user context groups', async () => {
      await service.cacheContextGroup('user-1', 'group-1', { data: '1' });
      await service.cacheContextGroup('user-1', 'group-2', { data: '2' });

      await service.invalidateUserContextGroups('user-1');

      const result1 = await service.getCachedContextGroup('user-1', 'group-1');
      const result2 = await service.getCachedContextGroup('user-1', 'group-2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should cache user profiles', async () => {
      const profile = { id: 'user-1', name: 'John Doe' };
      await service.cacheUserProfile('user-1', profile);

      const retrieved = await service.getCachedUserProfile<typeof profile>('user-1');
      expect(retrieved).toEqual(profile);
    });

    it('should cache platform data', async () => {
      const platformData = { issues: [1, 2, 3] };
      await service.cachePlatformData('github', 'user-1', 'ds-1', platformData);

      const retrieved = await service.getCachedPlatformData<typeof platformData>(
        'github',
        'user-1',
        'ds-1',
      );
      expect(retrieved).toEqual(platformData);
    });
  });
});

/**
 * Mock RedisService for unit tests
 * Use this to avoid hitting the actual Redis instance in unit tests
 */
export const createMockRedisService = () => {
  const locks = new Map<string, boolean>();

  return {
    // Distributed locking methods
    lock: jest.fn(async (key: string, ttl: number = 10000) => {
      if (locks.has(key)) {
        return false; // Lock already held
      }
      locks.set(key, true);
      return true;
    }),

    unlock: jest.fn(async (key: string) => {
      locks.delete(key);
      return true;
    }),

    // Caching methods
    get: jest.fn(async (key: string) => null),
    
    set: jest.fn(async (key: string, value: any, ttl?: number) => {
      return true;
    }),

    del: jest.fn(async (key: string | string[]) => {
      return Array.isArray(key) ? key.length : 1;
    }),

    // Pattern-based deletion
    deletePattern: jest.fn(async (pattern: string) => {
      return 0;
    }),

    // Cache invalidation helpers
    invalidateUserContextGroups: jest.fn(async (userId: string) => {
      return true;
    }),

    invalidateContextGroup: jest.fn(async (groupId: string) => {
      return true;
    }),

    // Check if Redis is enabled
    get enabled() {
      return true;
    },

    // Clear all locks (for test cleanup)
    _clearLocks: () => {
      locks.clear();
    },
  };
};

/**
 * Mock RedisService that always returns failure
 * Use this to test graceful degradation when Redis is unavailable
 */
export const createDisabledRedisService = () => {
  return {
    lock: jest.fn(async () => {
      throw new Error('Redis unavailable');
    }),

    unlock: jest.fn(async () => {
      throw new Error('Redis unavailable');
    }),

    get: jest.fn(async () => null),
    set: jest.fn(async () => false),
    del: jest.fn(async () => 0),
    deletePattern: jest.fn(async () => 0),

    get enabled() {
      return false;
    },
  };
};

# Distributed Locking Documentation

## Overview

Kushim uses **Redlock** algorithm for distributed locking across multiple API instances. This prevents race conditions and ensures data consistency when multiple instances process the same resources concurrently.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   API #1    │     │   API #2    │     │   API #3    │
│             │     │             │     │             │
│ ┌─────────┐ │     │ ┌─────────┐ │     │ ┌─────────┐ │
│ │ Redlock │ │     │ │ Redlock │ │     │ │ Redlock │ │
│ └────┬────┘ │     │ └────┬────┘ │     │ └────┬────┘ │
└──────┼──────┘     └──────┼──────┘     └──────┼──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                      ┌────▼────┐
                      │  Redis  │
                      │ (Locks) │
                      └─────────┘
```

## Implementation

### RedisService

Located in `apps/api/src/common/redis.service.ts`, provides:

1. **Distributed Locking** (`withLock`, `acquireLock`, `releaseLock`)
2. **Caching** (`get`, `set`, `del`)
3. **Domain-specific caching** (context groups, user profiles, platform data)

### Configuration

Set `REDIS_URL` in `.env`:

```bash
# Local Redis
REDIS_URL="redis://localhost:6379"

# Redis with auth
REDIS_URL="redis://:password@localhost:6379"

# Redis Cluster
REDIS_URL="redis://user:password@redis.example.com:6379/0"
```

**Graceful degradation:** If Redis is not configured, the system runs without locking (single-instance mode only).

## Locking Strategy

### Redlock Algorithm

Kushim uses the **Redlock** algorithm which provides:

- **Safety:** At most one lock holder at any given time
- **Liveness:** Eventually all lock requests succeed (deadlock-free)
- **Fault tolerance:** Works even if some Redis nodes fail

### Configuration

```typescript
this.redlock = new Redlock([this.client], {
  driftFactor: 0.01,        // Clock drift factor (1%)
  retryCount: 3,            // Retry attempts
  retryDelay: 200,          // Base delay between retries (ms)
  retryJitter: 200,         // Random jitter to prevent thundering herd
  automaticExtensionThreshold: 500, // Auto-extend before expiry
});
```

## Usage

### Basic Lock Usage

```typescript
import { RedisService } from './common/redis.service';

@Injectable()
export class MyService {
  constructor(private readonly redis: RedisService) {}

  async processResource(resourceId: string) {
    // Acquire lock, execute function, release lock
    return await this.redis.withLock(
      `process:${resourceId}`,  // Lock identifier
      async () => {
        // Critical section - only one instance executes this
        return await this.doWork(resourceId);
      },
      15000  // Lock TTL: 15 seconds
    );
  }
}
```

### Manual Lock Management

```typescript
async manualLocking() {
  const lock = await this.redis.acquireLock('my-resource', 10000);
  
  if (!lock) {
    // Failed to acquire lock (another instance holds it)
    this.logger.warn('Could not acquire lock');
    return;
  }

  try {
    // Critical section
    await this.doWork();
  } finally {
    // Always release lock
    await this.redis.releaseLock(lock);
  }
}
```

### Current Usage in Kushim

#### Relationship Discovery

**Location:** `apps/api/src/records/relationship.service.ts`

```typescript
async discoverRelationships(newRecord: UnifiedRecord) {
  const lockResource = `relationship_discovery:${newRecord.id}`;
  
  return await this.redisService.withLock(
    lockResource,
    async () => {
      // Prevent concurrent relationship discovery for same record
      return await this.prisma.$transaction(async (tx) => {
        // Find candidates, calculate scores, create links
        // ...
      });
    },
    15000  // 15-second TTL (longer than transaction timeout)
  );
}
```

**Why it's needed:**
- Prevents duplicate link creation when multiple instances process the same record
- Ensures atomic relationship discovery across instances
- Works with Prisma transactions for maximum consistency

## Lock Patterns

### 1. Resource-Level Locking

Lock individual resources (recommended):

```typescript
await this.redis.withLock(`user:${userId}:action`, async () => {
  // Process user-specific action
});
```

### 2. Global Locking

Lock entire operations (use sparingly):

```typescript
await this.redis.withLock('global:data-migration', async () => {
  // Only one instance runs migration
});
```

### 3. Multiple Resource Locking

Lock multiple related resources:

```typescript
// Sort IDs to prevent deadlocks
const ids = [id1, id2].sort();
await this.redis.withLock(`merge:${ids.join(':')}`, async () => {
  // Merge operation
});
```

## Lock TTL Guidelines

| Operation Type | Recommended TTL | Rationale |
|----------------|-----------------|-----------|
| Quick queries | 2-5 seconds | Fast operations, short hold time |
| Record creation | 5-10 seconds | Moderate complexity |
| Relationship discovery | 10-15 seconds | Complex graph operations |
| Batch processing | 30-60 seconds | Long-running operations |
| Migrations | 5-10 minutes | One-time operations |

**Rule of thumb:** TTL should be 2-3x the expected operation duration.

## Monitoring

### Check Active Locks

```bash
# Connect to Redis
redis-cli

# List all active locks
KEYS locks:*

# Check lock details
GET locks:relationship_discovery:abc123

# Count active locks
EVAL "return #redis.call('keys', 'locks:*')" 0
```

### Lock Metrics

```typescript
// Get Redis stats
const stats = await this.redisService.getStats();
console.log(stats);
```

### Common Issues

#### Lock Leak Detection

If locks aren't released:

```bash
# Find locks older than 1 minute
redis-cli --scan --pattern "locks:*" | while read key; do
  ttl=$(redis-cli TTL "$key")
  if [ $ttl -gt 60 ]; then
    echo "Leaked lock: $key (TTL: ${ttl}s)"
  fi
done
```

#### High Lock Contention

If many instances compete for same lock:

```bash
# Monitor lock failures in logs
grep "Failed to acquire lock" /var/log/kushim-api.log | wc -l
```

**Solutions:**
1. Increase retry count/delay in Redlock config
2. Partition work to reduce contention
3. Add queue-based processing (BullMQ)

## Testing

### Unit Tests

Run unit tests for RedisService:

```bash
cd apps/api
npm test redis.service.spec.ts
```

### Multi-Instance Test

Test with 3+ instances:

```bash
cd apps/api
./test-distributed-locking.sh
```

This script:
1. Starts 3 API instances on different ports
2. Triggers concurrent operations
3. Monitors lock acquisition/release
4. Verifies no race conditions

### Manual Testing

```bash
# Terminal 1: Start instance 1
PORT=3001 npm run start:dev

# Terminal 2: Start instance 2
PORT=3002 npm run start:dev

# Terminal 3: Trigger concurrent operations
curl -X POST http://localhost:3001/ingestion/trigger
curl -X POST http://localhost:3002/ingestion/trigger

# Check logs for lock messages
grep "Lock acquired\|Lock released" logs/*.log
```

## Performance Impact

### Latency

- **Lock acquisition:** 1-5ms (local Redis)
- **Lock acquisition:** 10-50ms (remote Redis)
- **Lock release:** 1-2ms

### Throughput

- Single-instance: No impact (locks acquired immediately)
- Multi-instance: Serialized operations (throughput = 1 / operation_duration)

### Optimization Tips

1. **Narrow lock scope** - Only lock critical sections
2. **Use separate locks** - Don't use one lock for everything
3. **Fast operations** - Minimize time holding locks
4. **Queue instead of lock** - For high-contention scenarios

## Production Deployment

### High Availability

**Option 1: Redis Sentinel**

```bash
# Master-slave with automatic failover
REDIS_URL="redis://sentinel1:26379,sentinel2:26379,sentinel3:26379"
```

**Option 2: Redis Cluster**

```bash
# Sharded Redis cluster
REDIS_URL="redis://cluster-node1:6379,cluster-node2:6379"
```

### Monitoring

Set up alerts for:

1. **Lock acquisition failures** - May indicate contention or Redis issues
2. **Lock TTL expiration** - Operations taking too long
3. **Redis unavailability** - System falls back to single-instance mode

### Scaling

**Horizontal scaling:**
- Add more API instances (Redlock handles it)
- No code changes required
- Monitor Redis memory usage

**Redis scaling:**
- Use Redis Cluster for >10 API instances
- Separate Redis for locks vs cache
- Monitor connection pool exhaustion

## Troubleshooting

### "Failed to acquire lock"

**Cause:** Another instance holds the lock

**Solution:** Normal behavior. Operation will retry or fail gracefully.

### "Lock released after TTL expiry"

**Cause:** Operation took longer than TTL

**Solution:** Increase TTL or optimize operation speed.

### "Redis connection error"

**Cause:** Redis is down

**Solution:** System degrades gracefully. Fix Redis, then restart API instances.

### Deadlock Detection

Redlock prevents deadlocks, but check for:

```bash
# Locks held for unusually long time
redis-cli --scan --pattern "locks:*" | while read key; do
  ttl=$(redis-cli TTL "$key")
  echo "$key: ${ttl}s remaining"
done
```

## Best Practices

1. ✅ **Always use try-finally** when manually managing locks
2. ✅ **Set appropriate TTLs** based on operation duration
3. ✅ **Use `withLock()` helper** for automatic cleanup
4. ✅ **Monitor lock failures** in production
5. ✅ **Test with multiple instances** before deploying
6. ❌ **Don't nest locks** (can cause deadlocks)
7. ❌ **Don't hold locks during I/O** (keep it short)
8. ❌ **Don't use same lock for unrelated operations**

## References

- [Redlock Algorithm](https://redis.io/topics/distlock)
- [node-redlock Documentation](https://github.com/mike-marcacci/node-redlock)
- [Redis Best Practices](https://redis.io/topics/best-practices)
- [Kushim System Architecture](../docs/SADD.pdf)

---

**Status:** ✅ Production-ready  
**Last Updated:** 2026-01-29  
**Next Review:** After first production deployment

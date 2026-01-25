# Redis Configuration Guide

## Overview

Kushim uses Redis for two critical capabilities:
1. **Distributed Locking** - Prevents duplicate relationship discovery across multiple API instances
2. **Caching** - Improves performance by caching context groups, user profiles, and platform data

Redis is **optional** but **highly recommended** for production deployments with multiple API instances.

---

## Installation

### Docker (Recommended)

```bash
docker run -d \
  --name kushim-redis \
  -p 6379:6379 \
  redis:7-alpine redis-server --appendonly yes
```

### Docker Compose

Add to your `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: kushim-redis
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

### Native Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

---

## Configuration

### Environment Variables

```bash
# Required for Redis support
REDIS_URL="redis://localhost:6379"

# With password
REDIS_URL="redis://:your_password@localhost:6379"

# Remote Redis
REDIS_URL="redis://user:password@redis.example.com:6379/0"
```

### Production Redis Configuration

For production, configure Redis with:

1. **Persistence** (AOF + RDB)
2. **Password authentication**
3. **Memory limits**
4. **Eviction policy**

**redis.conf:**
```conf
# Persistence
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000

# Security
requirepass your_strong_password_here
protected-mode yes

# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Performance
tcp-backlog 511
timeout 300
```

---

## How Kushim Uses Redis

### 1. Distributed Locking (Redlock)

**Purpose:** Prevent duplicate link creation when multiple API instances process the same record simultaneously.

**Implementation:**
- Locks acquired before relationship discovery
- Lock TTL: 15 seconds (longer than transaction timeout)
- Automatic release after operation completes
- Falls back gracefully if Redis unavailable (single-instance mode)

**Lock Key Pattern:**
```
locks:relationship_discovery:{recordId}
```

### 2. Caching

**Context Groups** (TTL: 5 minutes)
```
context_group:{userId}:{recordId}:{depth}
```

**User Profiles** (TTL: 10 minutes)
```
user_profile:{userId}
```

**Platform Data** (TTL: 3 minutes)
```
platform:{platform}:{userId}:{dataSourceId}
```

### Cache Invalidation

Automatic invalidation occurs on:
- Context group creation/modification
- User profile updates
- New data ingestion

---

## Monitoring

### Check Redis Connection

```bash
# Connect to Redis CLI
redis-cli

# Test connection
PING
# Should return: PONG

# Check keys
KEYS *

# Monitor commands in real-time
MONITOR
```

### API Metrics Endpoint

```bash
curl http://localhost:3001/health/redis
```

Returns:
```json
{
  "enabled": true,
  "info": {
    "total_commands_processed": "12345",
    "instantaneous_ops_per_sec": "42",
    "used_memory_human": "1.23M",
    "connected_clients": "3"
  }
}
```

### Application Logs

Look for Redis-related logs:
```
[RedisService] Redis connected successfully
[RedisService] Lock acquired: relationship_discovery:abc123
[GraphService] Cache hit for context group: record123:2
```

---

## Troubleshooting

### Redis Not Available

**Symptom:** Logs show `Redis not configured - caching and distributed locking disabled`

**Resolution:**
1. Check `REDIS_URL` is set in `.env`
2. Verify Redis is running: `redis-cli ping`
3. Check network connectivity
4. Review application logs for connection errors

**Graceful Degradation:**
- System continues to work without Redis
- No caching (slower performance)
- No distributed locking (single-instance only)

### Connection Refused

**Symptom:** `Failed to connect to Redis: ECONNREFUSED`

**Resolution:**
```bash
# Check Redis status
sudo systemctl status redis-server

# Start Redis
sudo systemctl start redis-server

# Check firewall
sudo ufw allow 6379
```

### Authentication Failed

**Symptom:** `ERR AUTH failed`

**Resolution:**
- Update `REDIS_URL` with correct password: `redis://:password@localhost:6379`
- Or disable auth in redis.conf (not recommended for production)

### Memory Issues

**Symptom:** `OOM command not allowed when used memory > 'maxmemory'`

**Resolution:**
1. Increase `maxmemory` in redis.conf
2. Configure eviction policy: `maxmemory-policy allkeys-lru`
3. Monitor cache usage

---

## Performance Tuning

### Cache Hit Rates

Monitor cache effectiveness:
```bash
redis-cli INFO stats | grep keyspace_hits
```

**Target Hit Rate:** >70%

If hit rate is low:
- Increase TTL values
- Review cache key patterns
- Check if cache is being invalidated too frequently

### Lock Contention

If you see many "Failed to acquire lock" warnings:
- Increase lock retry count (default: 3)
- Increase retry delay (default: 200ms)
- Review concurrent request patterns

### Memory Usage

```bash
redis-cli INFO memory
```

Optimize memory:
- Use shorter TTLs for less critical data
- Enable compression (handled by ioredis automatically)
- Monitor key count: `redis-cli DBSIZE`

---

## Multi-Instance Deployment

For horizontal scaling with multiple API instances:

### Requirements

1. **Shared Redis instance** (all API instances connect to same Redis)
2. **Persistent Redis storage** (AOF enabled)
3. **Redis replication** (optional, for high availability)

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  API Node 1 │────▶│    Redis    │◀────│  API Node 2 │
│  (Port 3001)│     │  (Redlock)  │     │  (Port 3002)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                                        │
       └────────────────┬───────────────────────┘
                        ▼
                 ┌─────────────┐
                 │  PostgreSQL │
                 │   + Neo4j   │
                 └─────────────┘
```

### Testing Multi-Instance Setup

1. Start Redis:
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

2. Start API instance 1:
   ```bash
   PORT=3001 REDIS_URL=redis://localhost:6379 npm run start
   ```

3. Start API instance 2:
   ```bash
   PORT=3002 REDIS_URL=redis://localhost:6379 npm run start
   ```

4. Test concurrent ingestion:
   ```bash
   # Send same record to both instances simultaneously
   curl -X POST http://localhost:3001/records &
   curl -X POST http://localhost:3002/records &
   ```

5. Verify no duplicate links created (check logs for "Lock acquired")

---

## Redis High Availability

For production, use Redis Sentinel or Redis Cluster:

### Redis Sentinel (Master-Slave Replication)

```yaml
services:
  redis-master:
    image: redis:7-alpine
    command: redis-server --appendonly yes

  redis-replica:
    image: redis:7-alpine
    command: redis-server --replicaof redis-master 6379

  redis-sentinel:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
```

Update `REDIS_URL`:
```bash
REDIS_URL="redis://sentinel1:26379,sentinel2:26379,sentinel3:26379?sentinelMasterId=mymaster"
```

---

## Security Best Practices

1. **Always use password authentication** in production
2. **Bind to specific interfaces** (not 0.0.0.0)
3. **Use TLS for remote connections**
4. **Limit maxclients** to prevent resource exhaustion
5. **Disable dangerous commands** (FLUSHALL, CONFIG, etc.)

**Example secure configuration:**
```conf
requirepass your_strong_password
bind 127.0.0.1
protected-mode yes
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
maxclients 10000
```

---

## Cost Optimization

For cloud deployments:

### AWS ElastiCache
- Start with `cache.t3.micro` ($13/month)
- Scale to `cache.t3.small` for production
- Enable automatic failover

### Redis Cloud
- Free tier: 30MB (sufficient for testing)
- Standard: $7/month for 250MB
- Production: $50/month for 2GB

### Self-Hosted
- DigitalOcean Droplet: $6/month (1GB RAM)
- Sufficient for small deployments

---

## Summary

| Feature | Without Redis | With Redis |
|---------|---------------|------------|
| Multi-instance support | ❌ No | ✅ Yes |
| Context group caching | ❌ No | ✅ Yes (5min TTL) |
| User profile caching | ❌ No | ✅ Yes (10min TTL) |
| Duplicate link prevention | ⚠️ DB constraints only | ✅ Distributed locks |
| Performance | Baseline | 🚀 2-5x faster |

**Recommendation:** Deploy Redis for any production environment with >100 users or >1 API instance.

---

**Last Updated:** 2026-01-25

# Performance Optimizations - Quick Reference

## 🚀 Quick Start

```bash
# 1. Start Redis
docker-compose up redis -d

# 2. Apply database migration (when DB is running)
cd apps/backend
npm run migrate

# 3. Start backend
npm run dev
```

## 📊 Performance Features

### Cache Service

```typescript
// Inject in constructor
constructor(private readonly cacheService: CacheService) {}

// Get from cache
const data = await this.cacheService.get('key');

// Set with TTL (seconds)
await this.cacheService.set('key', data, 300);

// Invalidate by pattern
await this.cacheService.invalidatePattern('customer:*');
```

### Rate Limiting

```typescript
// Controller level
@RateLimit({ points: 100, duration: 60 })
@Controller('api')
export class MyController {}

// Method level
@RateLimit({ points: 10, duration: 60 })
@Post('expensive')
async expensiveOperation() {}
```

### Cache Interceptor

```typescript
@Get(':id')
@CacheKey('resource:{id}')
@CacheTTL(300)
async getResource(@Param('id') id: string) {}
```

### Pagination

```typescript
@Get('items')
async getItems(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
) {
  return await this.service.findPaginated(page, limit);
}
```

## 🔧 Configuration

### Environment Variables (.env)

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
DATABASE_URL="postgresql://...?connection_limit=20"
```

## 📈 Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| API Response (p95) | < 200ms | ✅ Caching + Compression |
| DB Query (p95) | < 50ms | ✅ Indexes + Optimization |
| Cache Hit Rate | > 70% | ✅ Strategic caching |
| Bandwidth | -60-80% | ✅ gzip compression |

## 🏗️ Files Created

```
src/common/
├── cache/
│   ├── cache.service.ts        # Redis wrapper
│   └── cache.module.ts         # Global module
├── guards/
│   └── rate-limit.guard.ts     # Rate limiter
├── interceptors/
│   └── cache.interceptor.ts    # Auto-caching
└── dto/
    └── pagination.dto.ts       # Pagination types
```

## 📚 Documentation

- **PERFORMANCE.md** - Detailed documentation
- **PERFORMANCE_USAGE.md** - Code examples
- **OPTIMIZATION_SUMMARY.md** - Implementation summary
- **prisma/MIGRATION_README.md** - DB migration guide

## ✅ Verification

```bash
# Build check
npm run build

# Check Redis
docker ps | grep redis
redis-cli ping

# Test caching
curl http://localhost:3001/api/compliance/controls
# Second call should be faster

# Check rate limit headers
curl -I http://localhost:3001/api/compliance/controls
```

## 🔍 Common Patterns

### Service with Caching

```typescript
async getData(id: string) {
  const key = `data:${id}`;
  
  // Try cache
  const cached = await this.cacheService.get(key);
  if (cached) return cached;
  
  // Fetch from DB
  const data = await this.prisma.model.findUnique({ where: { id } });
  
  // Cache it
  await this.cacheService.set(key, data, 300);
  return data;
}
```

### Cache Invalidation on Update

```typescript
async update(id: string, data: any) {
  const updated = await this.prisma.model.update({
    where: { id },
    data,
  });
  
  // Invalidate cache
  await this.cacheService.del(`data:${id}`);
  await this.cacheService.invalidatePattern('list:*');
  
  return updated;
}
```

### Paginated List

```typescript
async findPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.prisma.model.findMany({ skip, take: limit }),
    this.prisma.model.count(),
  ]);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Cache not working | Check Redis connection, verify logs |
| Slow queries | Check if migration applied, run EXPLAIN |
| 429 Too Many Requests | Adjust rate limits or check if legitimate |
| Build errors | Run `npm install`, check TypeScript version |

## 🎯 Next Steps

1. ✅ All code implemented
2. ⏳ Apply database migration (when DB available)
3. ⏳ Update frontend for pagination
4. ⏳ Load testing
5. ⏳ Production deployment

---

**Questions?** See full documentation in `PERFORMANCE.md`

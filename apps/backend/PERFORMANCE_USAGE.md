# Performance Optimizations - Usage Examples

## Table of Contents
1. [Using Cache Service](#using-cache-service)
2. [Applying Rate Limits](#applying-rate-limits)
3. [Using Cache Interceptor](#using-cache-interceptor)
4. [Pagination Examples](#pagination-examples)
5. [Cache Invalidation Patterns](#cache-invalidation-patterns)

## Using Cache Service

### Basic Operations

```typescript
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class MyService {
  constructor(private readonly cacheService: CacheService) {}

  async getData(id: string) {
    const cacheKey = `mydata:${id}`;
    
    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const data = await this.database.findById(id);
    
    // Store in cache (5 minutes TTL)
    await this.cacheService.set(cacheKey, data, 300);
    
    return data;
  }
}
```

### Batch Operations

```typescript
// Multi-get
const keys = ['user:1', 'user:2', 'user:3'];
const users = await this.cacheService.mget(keys);

// Multi-set
await this.cacheService.mset([
  { key: 'user:1', value: user1, ttl: 300 },
  { key: 'user:2', value: user2, ttl: 300 },
]);
```

### Cache Invalidation

```typescript
// Delete single key
await this.cacheService.del('mydata:123');

// Delete multiple keys
await this.cacheService.del(['key1', 'key2', 'key3']);

// Pattern-based deletion (be careful!)
await this.cacheService.invalidatePattern('mydata:*');
```

## Applying Rate Limits

### Controller-Level Rate Limiting

```typescript
import { RateLimit } from '../common/guards/rate-limit.guard';

// Apply to entire controller
@Controller('api')
@RateLimit({ points: 100, duration: 60 }) // 100 req/min
export class ApiController {
  // All methods inherit this limit
}
```

### Method-Level Rate Limiting

```typescript
@Controller('api')
export class ApiController {
  // Stricter limit for expensive operation
  @Post('process')
  @RateLimit({ points: 10, duration: 60 }) // 10 req/min
  async processData() {
    // Expensive operation
  }

  // Normal limit
  @Get('data')
  @RateLimit({ points: 100, duration: 60 })
  async getData() {
    // Normal operation
  }
}
```

### Custom Rate Limit Keys

```typescript
// Rate limit by customer instead of user
@RateLimit({ 
  points: 1000, 
  duration: 60,
  keyPrefix: 'customer-api'
})
```

## Using Cache Interceptor

### Basic Usage

```typescript
import { CacheKey, CacheTTL } from '../common/interceptors/cache.interceptor';

@Controller('products')
export class ProductsController {
  @Get()
  @CacheKey('products:list') // Static key
  @CacheTTL(300) // 5 minutes
  async getProducts() {
    return this.productsService.findAll();
  }
}
```

### Dynamic Cache Keys

```typescript
@Get(':id')
@CacheKey('product:{id}') // {id} replaced from route params
@CacheTTL(600) // 10 minutes
async getProduct(@Param('id') id: string) {
  return this.productsService.findById(id);
}

@Get('customer/:customerId/products')
@CacheKey('products:{customerId}') // Multi-tenant caching
@CacheTTL(300)
async getCustomerProducts(@Param('customerId') customerId: string) {
  return this.productsService.findByCustomer(customerId);
}
```

### With Query Parameters

```typescript
@Get('search')
@CacheKey('products:search') // Query params auto-appended
@CacheTTL(180) // 3 minutes
async searchProducts(
  @Query('q') query: string,
  @Query('category') category: string,
) {
  // Cache key becomes: products:search?category=electronics&q=laptop
  return this.productsService.search(query, category);
}
```

## Pagination Examples

### Basic Pagination

```typescript
@Get('items')
async getItems(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
) {
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    this.prisma.item.findMany({ skip, take: limit }),
    this.prisma.item.count(),
  ]);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### With Filters and Sorting

```typescript
@Get('items')
async getItems(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  @Query('status') status?: string,
  @Query('sortBy') sortBy: string = 'createdAt',
  @Query('order') order: 'asc' | 'desc' = 'desc',
) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};
  const orderBy = { [sortBy]: order };

  const [items, total] = await Promise.all([
    this.prisma.item.findMany({ where, skip, take: limit, orderBy }),
    this.prisma.item.count({ where }),
  ]);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

## Cache Invalidation Patterns

### On Entity Update

```typescript
@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async update(id: string, data: UpdateProductDto) {
    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    // Invalidate specific product cache
    await this.cacheService.del(`product:${id}`);
    
    // Invalidate list cache
    await this.cacheService.invalidatePattern('products:list*');

    return updated;
  }
}
```

### On Batch Operations

```typescript
async bulkUpdate(ids: string[], data: UpdateProductDto) {
  await this.prisma.product.updateMany({
    where: { id: { in: ids } },
    data,
  });

  // Invalidate multiple product caches
  const keys = ids.map(id => `product:${id}`);
  await this.cacheService.del(keys);
  
  // Invalidate all list caches
  await this.cacheService.invalidatePattern('products:*');
}
```

### Multi-Tenant Cache Invalidation

```typescript
async invalidateCustomerCache(customerId: string) {
  // Invalidate all cache entries for this customer
  await this.cacheService.invalidatePattern(`*:${customerId}:*`);
}
```

### Time-Based Invalidation

```typescript
// Cache with short TTL for frequently changing data
await this.cacheService.set('live-stats', stats, 10); // 10 seconds

// Cache with long TTL for static data
await this.cacheService.set('config', config, 3600); // 1 hour
```

## Advanced Patterns

### Cache-Aside Pattern

```typescript
async getDataWithFallback(id: string) {
  const key = `data:${id}`;
  
  try {
    // Try cache first
    const cached = await this.cacheService.get(key);
    if (cached) return cached;

    // Fetch from primary source
    const data = await this.fetchFromDatabase(id);
    
    // Cache for next time
    await this.cacheService.set(key, data);
    
    return data;
  } catch (error) {
    // On cache failure, still return data
    console.error('Cache error:', error);
    return await this.fetchFromDatabase(id);
  }
}
```

### Lazy Cache Warming

```typescript
@Injectable()
export class CacheWarmingService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly complianceService: ComplianceService,
  ) {}

  async warmCache(customerId: string) {
    // Pre-load commonly accessed data
    const [controls, alerts, trends] = await Promise.all([
      this.complianceService.getAllControls(customerId, 1, 50),
      this.complianceService.getRecentAlerts(customerId, 1, 10),
      this.complianceService.getTrends(customerId, 7),
    ]);

    // Data is now cached from service calls
    console.log('Cache warmed for customer:', customerId);
  }
}
```

### Circuit Breaker with Cache

```typescript
async getDataWithCircuitBreaker(id: string) {
  const key = `data:${id}`;
  const errorKey = `error:${id}`;
  
  // Check if circuit is open
  const errorCount = await this.cacheService.get(errorKey) || 0;
  if (errorCount > 5) {
    // Return cached data if available
    const cached = await this.cacheService.get(key);
    if (cached) return cached;
    throw new Error('Service unavailable');
  }

  try {
    const data = await this.fetchFromExternalService(id);
    await this.cacheService.set(key, data, 300);
    return data;
  } catch (error) {
    // Increment error counter
    await this.cacheService.increment(errorKey, 1, 60);
    
    // Try to return stale cache
    const cached = await this.cacheService.get(key);
    if (cached) return cached;
    
    throw error;
  }
}
```

## Performance Tips

1. **Choose appropriate TTL**:
   - Static data: 1 hour+
   - Frequently updated: 1-5 minutes
   - Real-time: 10-30 seconds

2. **Use selective caching**:
   - Cache expensive operations (DB joins, aggregations)
   - Don't cache simple lookups by ID
   - Don't cache write operations

3. **Invalidate smartly**:
   - Use specific keys when possible
   - Use patterns for related data
   - Avoid `*` pattern (invalidates everything)

4. **Monitor cache performance**:
   - Track hit rate
   - Monitor cache size
   - Watch for hot keys

5. **Handle cache failures gracefully**:
   - Always have a fallback
   - Don't throw errors on cache misses
   - Log cache errors for monitoring

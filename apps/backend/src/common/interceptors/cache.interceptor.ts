import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';
import { Reflector } from '@nestjs/core';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

export const CacheKey = (key: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_KEY_METADATA, key, descriptor.value);
    return descriptor;
  };
};

export const CacheTTL = (ttl: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Get cache key template from metadata
    const cacheKeyTemplate = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      handler,
    );

    if (!cacheKeyTemplate) {
      return next.handle();
    }

    // Build cache key from template and request
    const cacheKey = this.buildCacheKey(cacheKeyTemplate, request);

    // Get TTL from metadata or use default
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler) || 300;

    // Try to get from cache
    const cachedValue = await this.cacheService.get(cacheKey);
    if (cachedValue !== null) {
      return of(cachedValue);
    }

    // If not in cache, execute handler and cache result
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheService.set(cacheKey, response, ttl);
      }),
    );
  }

  private buildCacheKey(template: string, request: any): string {
    let key = template;

    // Replace :customerId with actual customerId from user
    if (request.user?.customerId) {
      key = key.replace(':customerId', request.user.customerId);
    }

    // Replace :userId with actual userId
    if (request.user?.sub) {
      key = key.replace(':userId', request.user.sub);
    }

    // Replace route params
    if (request.params) {
      Object.keys(request.params).forEach((param) => {
        key = key.replace(`:${param}`, request.params[param]);
      });
    }

    // Add query params if they exist
    if (request.query && Object.keys(request.query).length > 0) {
      const queryString = Object.keys(request.query)
        .sort()
        .map((k) => `${k}=${request.query[k]}`)
        .join('&');
      key = `${key}?${queryString}`;
    }

    return key;
  }
}

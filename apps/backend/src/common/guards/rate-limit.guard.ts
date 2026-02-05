import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../cache/cache.service';

export const RATE_LIMIT_METADATA = 'rateLimit';

export interface RateLimitConfig {
  points: number; // Number of requests allowed
  duration: number; // Time window in seconds
  keyPrefix?: string; // Optional prefix for rate limit key
}

export const RateLimit = (config: RateLimitConfig) => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(RATE_LIMIT_METADATA, config, descriptor.value);
      return descriptor;
    } else {
      // Class decorator
      Reflect.defineMetadata(RATE_LIMIT_METADATA, config, target);
      return target;
    }
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  // Default limits for different user roles
  private readonly defaultLimits = {
    user: { points: 100, duration: 60 }, // 100 requests per minute
    admin: { points: 500, duration: 60 }, // 500 requests per minute
  };

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get rate limit config from method or class decorator
    let config = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_METADATA,
      handler,
    );

    if (!config) {
      config = this.reflector.get<RateLimitConfig>(
        RATE_LIMIT_METADATA,
        controller,
      );
    }

    // If no explicit config, use default based on user role
    if (!config) {
      const userRole = request.user?.role || 'user';
      config = this.defaultLimits[userRole] || this.defaultLimits.user;
    }

    // Build rate limit key
    const key = this.buildRateLimitKey(config, request);

    // Check rate limit
    const { allowed, remaining, resetTime } = await this.checkRateLimit(
      key,
      config,
    );

    // Set rate limit headers
    response.header('X-RateLimit-Limit', config.points.toString());
    response.header('X-RateLimit-Remaining', remaining.toString());
    response.header('X-RateLimit-Reset', resetTime.toString());

    if (!allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          error: 'Too Many Requests',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private buildRateLimitKey(config: RateLimitConfig, request: any): string {
    const prefix = config.keyPrefix || 'ratelimit';
    const customerId = request.user?.customerId || 'anonymous';
    const userId = request.user?.sub || 'anonymous';
    const endpoint = `${request.method}:${request.route?.path || request.path}`;

    return `${prefix}:${customerId}:${userId}:${endpoint}`;
  }

  private async checkRateLimit(
    key: string,
    config: RateLimitConfig,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = Math.floor(now / (config.duration * 1000));
    const rateLimitKey = `${key}:${windowStart}`;

    // Increment counter
    const current = await this.cacheService.increment(
      rateLimitKey,
      1,
      config.duration,
    );

    const allowed = current <= config.points;
    const remaining = Math.max(0, config.points - current);
    const resetTime = (windowStart + 1) * config.duration * 1000;

    return { allowed, remaining, resetTime };
  }
}

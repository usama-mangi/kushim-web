import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '../logger/logger.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly metrics: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const { statusCode } = response;

          // Extract route pattern for metrics
          const route = this.getRoutePattern(request);

          // Record metrics
          this.metrics.recordHttpRequest(method, route, statusCode, duration);

          // Log request with performance metrics
          this.logger.logRequest(method, url, statusCode, duration, {
            ip,
            userAgent,
            requestId: request.id,
            userId: request.user?.id,
            customerId: request.user?.customerId,
          });

          // Warn on slow requests (>500ms)
          if (duration > 500) {
            this.logger.logPerformance(`Slow request: ${method} ${url}`, duration, {
              method,
              url,
              statusCode,
              ip,
            });
          }
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = error.status || 500;
          const route = this.getRoutePattern(request);

          // Record error metrics
          this.metrics.recordHttpRequest(method, route, statusCode, duration);

          // Log error
          this.logger.error(
            `Request error: ${method} ${url}`,
            error.stack,
            {
              method,
              url,
              statusCode,
              duration,
              ip,
              userAgent,
              error: error.message,
              requestId: request.id,
              userId: request.user?.id,
              customerId: request.user?.customerId,
            },
          );
        },
      }),
    );
  }

  private getRoutePattern(request: any): string {
    // Try to get the route pattern from the request
    const route = request.route?.path;
    if (route) {
      return route;
    }

    // Fallback to URL path with parameter normalization
    const path = request.url.split('?')[0];
    return this.normalizeRoute(path);
  }

  private normalizeRoute(path: string): string {
    // Replace UUIDs and IDs with placeholders for better metric grouping
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }
}

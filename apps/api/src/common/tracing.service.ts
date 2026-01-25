import { Injectable } from '@nestjs/common';
import { trace, Span, SpanStatusCode, context, Tracer } from '@opentelemetry/api';

/**
 * Tracing service for creating custom spans
 * Wraps OpenTelemetry API for easier use in NestJS services
 */
@Injectable()
export class TracingService {
  private readonly tracer: Tracer;
  private readonly enabled: boolean;

  constructor() {
    this.enabled = process.env.TRACING_ENABLED === 'true';
    this.tracer = trace.getTracer('kushim-api', '1.0.0');
  }

  /**
   * Create a span and execute a function within it
   * Automatically handles errors and span status
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>,
  ): Promise<T> {
    if (!this.enabled) {
      // Tracing disabled - execute without span
      return fn({} as Span);
    }

    return this.tracer.startActiveSpan(name, async (span) => {
      try {
        // Add custom attributes
        if (attributes) {
          for (const [key, value] of Object.entries(attributes)) {
            span.setAttribute(key, value);
          }
        }

        const result = await fn(span);
        
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        // Record error in span
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Create a child span within the current active span
   */
  async withChildSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>,
  ): Promise<T> {
    if (!this.enabled) {
      return fn({} as Span);
    }

    const activeContext = context.active();
    return context.with(activeContext, async () => {
      return this.withSpan(name, fn, attributes);
    });
  }

  /**
   * Add an event to the current active span
   */
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    if (!this.enabled) return;

    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Set an attribute on the current active span
   */
  setAttribute(key: string, value: string | number | boolean): void {
    if (!this.enabled) return;

    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute(key, value);
    }
  }

  /**
   * Record an exception in the current active span
   */
  recordException(error: Error): void {
    if (!this.enabled) return;

    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Get the current trace ID (useful for logging correlation)
   */
  getTraceId(): string | undefined {
    if (!this.enabled) return undefined;

    const span = trace.getActiveSpan();
    if (span) {
      return span.spanContext().traceId;
    }
    return undefined;
  }

  /**
   * Check if tracing is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

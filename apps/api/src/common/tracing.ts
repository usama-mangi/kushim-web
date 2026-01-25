import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ConsoleSpanExporter, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

/**
 * OpenTelemetry Tracing Configuration
 * 
 * Instruments the application with distributed tracing for:
 * - HTTP requests (NestJS controllers)
 * - Database queries (Prisma, Neo4j)
 * - Redis operations
 * - External API calls (GitHub, Jira, Slack, Google)
 * 
 * Supports multiple exporters:
 * - Jaeger (default for development/staging)
 * - OTLP (for production with Datadog, New Relic, etc.)
 * - Console (for debugging)
 */

export function initializeTracing() {
  const tracingEnabled = process.env.TRACING_ENABLED === 'true';
  
  if (!tracingEnabled) {
    console.log('[Tracing] Disabled - Set TRACING_ENABLED=true to enable');
    return null;
  }

  // Service identification
  const resource = Resource.default().merge(
    new Resource({
      [SEMRESATTRS_SERVICE_NAME]: process.env.SERVICE_NAME || 'kushim-api',
      [SEMRESATTRS_SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    })
  );

  // Configure trace exporter based on environment
  const exporter = createTraceExporter();

  const sdk = new NodeSDK({
    resource,
    spanProcessors: [new BatchSpanProcessor(exporter)],
    instrumentations: [
      getNodeAutoInstrumentations({
        // Auto-instrument common libraries
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          ignoreIncomingRequestHook: (request) => {
            // Ignore health checks and metrics endpoints
            const url = request.url || '';
            return url.includes('/health') || url.includes('/metrics');
          },
        },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-nestjs-core': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true }, // PostgreSQL
        '@opentelemetry/instrumentation-redis-4': { enabled: true }, // Redis
        '@opentelemetry/instrumentation-dns': { enabled: false }, // Too noisy
        '@opentelemetry/instrumentation-fs': { enabled: false }, // Too noisy
      }),
    ],
  });

  sdk.start();
  console.log(`[Tracing] Initialized with ${getExporterType()} exporter`);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('[Tracing] Shutdown complete'))
      .catch((error) => console.error('[Tracing] Error shutting down', error));
  });

  return sdk;
}

function createTraceExporter() {
  const exporterType = process.env.TRACING_EXPORTER || 'jaeger';

  switch (exporterType) {
    case 'jaeger':
      // Jaeger exporter for development/staging
      return new JaegerExporter({
        endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
        // Jaeger agent endpoint (alternative): udp://localhost:6831
      });

    case 'otlp':
      // OTLP exporter for production (Datadog, New Relic, Honeycomb, etc.)
      return new OTLPTraceExporter({
        url: process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
        headers: {
          // Add auth headers for production (e.g., Datadog API key)
          ...(process.env.OTLP_HEADERS ? JSON.parse(process.env.OTLP_HEADERS) : {}),
        },
      });

    case 'console':
      // Console exporter for debugging
      return new ConsoleSpanExporter();

    default:
      console.warn(`[Tracing] Unknown exporter type: ${exporterType}, using Jaeger`);
      return new JaegerExporter({
        endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      });
  }
}

function getExporterType(): string {
  return process.env.TRACING_EXPORTER || 'jaeger';
}

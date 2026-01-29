# Distributed Tracing Guide

## Overview

Kushim uses **OpenTelemetry** for distributed tracing across all services. This provides end-to-end visibility into request flows, performance bottlenecks, and error propagation across the entire stack.

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ HTTP Request (with trace headers)
         ▼
┌─────────────────┐
│   API Server    │──────► Auto-instrumentation captures:
│   (NestJS)      │        - HTTP requests/responses
└────────┬────────┘        - Controller execution
         │                 - Service method calls
         ├─────────────────┬─────────────────┬──────────────────┐
         ▼                 ▼                 ▼                  ▼
   ┌──────────┐      ┌──────────┐     ┌──────────┐      ┌───────────┐
   │PostgreSQL│      │  Neo4j   │     │  Redis   │      │  External │
   │ (Prisma) │      │  (Graph) │     │ (Cache)  │      │    APIs   │
   └──────────┘      └──────────┘     └──────────┘      └───────────┘
         │                 │                 │                  │
         └─────────────────┴─────────────────┴──────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Trace Collector    │
                        │   (Jaeger/OTLP)      │
                        └──────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Tracing Backend    │
                        │ (Jaeger/Datadog/etc) │
                        └──────────────────────┘
```

## Configuration

### Environment Variables

```bash
# Enable/disable tracing
TRACING_ENABLED="true"

# Service identification
SERVICE_NAME="kushim-api"
SERVICE_VERSION="1.0.0"

# Exporter type: jaeger, otlp, console
TRACING_EXPORTER="jaeger"

# Jaeger configuration (when TRACING_EXPORTER=jaeger)
JAEGER_ENDPOINT="http://localhost:14268/api/traces"

# OTLP configuration (when TRACING_EXPORTER=otlp)
OTLP_ENDPOINT="http://localhost:4318/v1/traces"
OTLP_HEADERS='{"DD-API-KEY":"your_datadog_api_key"}'
```

### Supported Exporters

#### 1. Jaeger (Default - Development/Staging)

**Setup:**
```bash
# Run Jaeger all-in-one with Docker
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest

# Configure in .env
TRACING_ENABLED="true"
TRACING_EXPORTER="jaeger"
JAEGER_ENDPOINT="http://localhost:14268/api/traces"
```

**Access UI:** http://localhost:16686

#### 2. OTLP (Production - Datadog, New Relic, Honeycomb)

**Datadog:**
```bash
TRACING_ENABLED="true"
TRACING_EXPORTER="otlp"
OTLP_ENDPOINT="https://http-intake.logs.datadoghq.com/v1/input"
OTLP_HEADERS='{"DD-API-KEY":"your_datadog_api_key","DD-SITE":"datadoghq.com"}'
```

**New Relic:**
```bash
TRACING_ENABLED="true"
TRACING_EXPORTER="otlp"
OTLP_ENDPOINT="https://otlp.nr-data.net:4318/v1/traces"
OTLP_HEADERS='{"api-key":"your_new_relic_license_key"}'
```

**Honeycomb:**
```bash
TRACING_ENABLED="true"
TRACING_EXPORTER="otlp"
OTLP_ENDPOINT="https://api.honeycomb.io:443"
OTLP_HEADERS='{"x-honeycomb-team":"your_api_key","x-honeycomb-dataset":"kushim"}'
```

#### 3. Console (Debugging)

```bash
TRACING_ENABLED="true"
TRACING_EXPORTER="console"
```

Outputs spans to console (useful for debugging locally).

## Auto-Instrumentation

The following are automatically instrumented (no code changes required):

### HTTP Requests
- ✅ Incoming HTTP requests (NestJS controllers)
- ✅ Outgoing HTTP requests (fetch, axios)
- ✅ Request/response headers
- ✅ Status codes and errors

### Databases
- ✅ PostgreSQL queries (via Prisma)
- ✅ Query text and parameters (sanitized)
- ✅ Connection pool metrics

### Redis
- ✅ All Redis commands
- ✅ Command arguments
- ✅ Response times

### External APIs
- ✅ GitHub API calls
- ✅ Slack API calls
- ✅ Jira API calls
- ✅ Google API calls

## Manual Instrumentation

### Using TracingService

```typescript
import { TracingService } from '../common/tracing.service';

@Injectable()
export class MyService {
  constructor(private readonly tracing: TracingService) {}

  async complexOperation() {
    return await this.tracing.withSpan(
      'my-service.complex-operation',
      async (span) => {
        // Add custom attributes
        span.setAttribute('user.id', 'user-123');
        span.setAttribute('operation.type', 'batch');

        // Business logic here
        const result = await this.doWork();

        // Add events
        span.addEvent('work.completed', {
          'records.processed': result.length,
        });

        return result;
      },
      {
        'service.name': 'MyService',
        'operation.name': 'complexOperation',
      }
    );
  }
}
```

### Creating Child Spans

```typescript
async processRecords(records: Record[]) {
  return await this.tracing.withSpan('process-records', async (parentSpan) => {
    const results = [];

    for (const record of records) {
      // Each iteration creates a child span
      const result = await this.tracing.withChildSpan(
        'process-single-record',
        async (childSpan) => {
          childSpan.setAttribute('record.id', record.id);
          return await this.processOne(record);
        }
      );
      results.push(result);
    }

    return results;
  });
}
```

### Adding Events

```typescript
async syncData() {
  return await this.tracing.withSpan('sync-data', async (span) => {
    this.tracing.addEvent('sync.started');

    const data = await this.fetchData();
    this.tracing.addEvent('data.fetched', { 'count': data.length });

    await this.processData(data);
    this.tracing.addEvent('data.processed');

    return data;
  });
}
```

### Error Tracking

```typescript
async riskyOperation() {
  try {
    return await this.performOperation();
  } catch (error) {
    // Automatically recorded in span
    this.tracing.recordException(error);
    throw error;
  }
}
```

## Current Usage

### Relationship Discovery

**File:** `apps/api/src/records/relationship.service.ts`

```typescript
async discoverRelationships(newRecord: UnifiedRecord) {
  return await this.tracingService.withSpan(
    'relationship.discovery',
    async (span) => {
      span.setAttribute('record.id', newRecord.id);
      span.setAttribute('record.platform', newRecord.sourcePlatform);

      // ... discovery logic ...

      span.addEvent('relationship.discovery.candidates_found', {
        'candidates.count': candidates.length,
      });

      return result;
    }
  );
}
```

## Trace Context Propagation

### HTTP Headers

Traces propagate across HTTP boundaries using standard headers:

```
traceparent: 00-<trace-id>-<span-id>-01
tracestate: vendor=value
```

### Cross-Service Calls

```typescript
// Trace context is automatically propagated
const response = await fetch('https://api.github.com/user', {
  headers: {
    // OpenTelemetry automatically injects trace headers
    Authorization: `Bearer ${token}`,
  },
});
```

## Viewing Traces

### Jaeger UI

1. Open http://localhost:16686
2. Select service: `kushim-api`
3. Click "Find Traces"

**Features:**
- Search by operation name, tags, duration
- View trace timeline (Gantt chart)
- Inspect span details and tags
- Compare traces
- Trace dependency graph

### Common Queries

**Slow requests:**
```
service=kushim-api duration>1s
```

**Failed requests:**
```
service=kushim-api error=true
```

**Specific user:**
```
service=kushim-api user.id=user-123
```

**Database queries:**
```
service=kushim-api component=prisma
```

## Performance Impact

### Overhead

- **Memory:** ~10-20MB per instance
- **CPU:** <1% in production
- **Latency:** <1ms per span
- **Network:** ~5KB per trace (batched)

### Sampling

For high-traffic applications, enable sampling:

```typescript
// In tracing.ts
const sdk = new NodeSDK({
  resource,
  spanProcessors: [new BatchSpanProcessor(exporter)],
  sampler: new TraceIdRatioBasedSampler(0.1), // Sample 10%
  // ...
});
```

## Best Practices

### 1. Meaningful Span Names

```typescript
// ✅ Good
await this.tracing.withSpan('ingestion.fetch-github-issues', async (span) => {

// ❌ Bad
await this.tracing.withSpan('do-work', async (span) => {
```

### 2. Add Context Attributes

```typescript
// ✅ Good
span.setAttribute('user.id', userId);
span.setAttribute('platform', 'github');
span.setAttribute('record.count', records.length);

// ❌ Bad
span.setAttribute('data', JSON.stringify(data)); // Too large
```

### 3. Use Events for Milestones

```typescript
// ✅ Good
span.addEvent('cache.hit');
span.addEvent('database.query-completed', { rows: 100 });

// ❌ Bad
span.addEvent('processing'); // Too vague
```

### 4. Don't Over-Instrument

```typescript
// ❌ Too granular
for (const item of items) {
  await this.tracing.withSpan('process-item', ...); // Creates 1000s of spans
}

// ✅ Better
await this.tracing.withSpan('process-items', async (span) => {
  for (const item of items) {
    // Process without individual spans
  }
  span.setAttribute('items.processed', items.length);
});
```

### 5. Sanitize Sensitive Data

```typescript
// ❌ Bad
span.setAttribute('user.password', password);
span.setAttribute('api.token', token);

// ✅ Good
span.setAttribute('user.id', userId);
span.setAttribute('api.provider', 'github');
```

## Troubleshooting

### Traces Not Appearing

1. **Check if tracing is enabled:**
   ```bash
   echo $TRACING_ENABLED  # Should be "true"
   ```

2. **Check exporter endpoint:**
   ```bash
   curl http://localhost:14268/api/traces  # Should return 405 (method not allowed)
   ```

3. **Check logs:**
   ```bash
   grep "\[Tracing\]" /var/log/kushim-api.log
   ```

### High Memory Usage

- Enable sampling to reduce trace volume
- Decrease batch size in span processor
- Increase batch timeout to reduce processing frequency

### Missing Spans

- Ensure `await` is used with `withSpan()`
- Check that child spans are created within parent span context
- Verify auto-instrumentation packages are installed

## Monitoring Metrics

### Trace Metrics to Monitor

1. **Trace Volume**
   - Traces per minute
   - Spans per trace (avg)
   - Alert if > 100 spans per trace (too granular)

2. **Performance**
   - P50, P95, P99 latencies per operation
   - Slowest operations
   - Latency regressions

3. **Errors**
   - Error rate per operation
   - Failed traces
   - Exception types

4. **Dependencies**
   - External API latencies
   - Database query times
   - Cache hit rates

## Integration with Logging

Correlate traces with logs using trace IDs:

```typescript
const traceId = this.tracing.getTraceId();
this.logger.log(`Processing record`, { traceId, recordId });
```

**In logs:**
```json
{
  "message": "Processing record",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "recordId": "rec-123",
  "timestamp": "2026-01-29T21:00:00Z"
}
```

**Search Jaeger with trace ID from logs:**
```
traceID=4bf92f3577b34da6a3ce929d0e0e4736
```

## Production Deployment

### Datadog Setup

1. Install Datadog agent on servers
2. Configure OTLP receiver in Datadog
3. Set environment variables:
   ```bash
   TRACING_ENABLED="true"
   TRACING_EXPORTER="otlp"
   OTLP_ENDPOINT="https://http-intake.logs.datadoghq.com/v1/input"
   OTLP_HEADERS='{"DD-API-KEY":"<your-key>","DD-SITE":"datadoghq.com"}'
   ```

### Sampling Strategy

**Production (high traffic):**
```bash
# Sample 10% of traces
TRACE_SAMPLE_RATE="0.1"
```

**Staging:**
```bash
# Sample 100% of traces
TRACE_SAMPLE_RATE="1.0"
```

### Alerts

Set up alerts for:
- P99 latency > 2s
- Error rate > 1%
- Missing traces (service down)
- Trace volume spikes

## References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [NestJS OpenTelemetry](https://docs.nestjs.com/opentelemetry)
- [Datadog APM](https://docs.datadoghq.com/tracing/)

---

**Status:** ✅ Production-ready  
**Last Updated:** 2026-01-29  
**Next Steps:** Enable in staging environment and monitor for 1 week before production rollout

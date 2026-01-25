# Distributed Tracing Guide

## Overview

Kushim uses **OpenTelemetry** for distributed tracing to monitor request flows, identify performance bottlenecks, and debug issues across services. Tracing provides visibility into:

- HTTP request latency and errors
- Database query performance (PostgreSQL, Neo4j)
- Redis cache operations
- External API calls (GitHub, Jira, Slack, Google)
- Relationship discovery and linking operations
- ML scoring pipeline

---

## Quick Start

### 1. Run Jaeger Locally (Docker)

```bash
docker run -d \
  --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest
```

Access Jaeger UI: **http://localhost:16686**

### 2. Enable Tracing

Update `.env`:
```bash
TRACING_ENABLED="true"
TRACING_EXPORTER="jaeger"
JAEGER_ENDPOINT="http://localhost:14268/api/traces"
SERVICE_NAME="kushim-api"
```

### 3. Start Application

```bash
npm run start
```

### 4. Generate Traces

Trigger some activity:
```bash
# OAuth login and ingestion
curl -X POST http://localhost:3001/ingestion/run/{dataSourceId}

# Relationship discovery
curl -X POST http://localhost:3001/records

# Graph queries
curl http://localhost:3001/graph/context/{recordId}
```

### 5. View Traces in Jaeger

1. Open http://localhost:16686
2. Select service: **kushim-api**
3. Click "Find Traces"
4. Explore individual traces to see request flow

---

## What Gets Traced

### Automatic Instrumentation

OpenTelemetry auto-instruments:

✅ **HTTP Requests** - All incoming API requests  
✅ **Express/NestJS** - Controller and middleware execution  
✅ **PostgreSQL** - All Prisma database queries  
✅ **Redis** - Cache get/set operations and distributed locks  
✅ **HTTP Client** - External API calls (GitHub, Jira, etc.)

### Custom Spans

We've added custom spans for business-critical operations:

**Relationship Discovery** (`relationship.discovery`)
- Attributes: `record.id`, `record.platform`, `record.type`, `user.id`
- Events: `relationship.discovery.complete` with `candidates.count`
- Duration: Full linking operation including ML scoring

**Ingestion** (`ingestion.run`)
- Attributes: `datasource.id`, `datasource.platform`, `user.id`
- Duration: Full ingestion pipeline from fetch to storage

**Additional custom spans** can be added to any service using `TracingService`.

---

## Trace Structure Example

```
ingestion.run (5.2s)
├─ http.request.fetch (2.1s) ← GitHub API call
├─ db.query.insert (0.3s) ← PostgreSQL insert
├─ relationship.discovery (2.5s)
│  ├─ db.query.select (0.1s) ← Find candidates
│  ├─ ml.scoring (1.2s) ← ML score calculation
│  └─ db.query.insert (0.2s) ← Create links
└─ redis.set (0.05s) ← Cache invalidation
```

---

## Configuration

### Environment Variables

```bash
# Required
TRACING_ENABLED="true"  # Master switch

# Optional
TRACING_EXPORTER="jaeger"  # jaeger | otlp | console
SERVICE_NAME="kushim-api"
SERVICE_VERSION="1.0.0"

# Jaeger-specific
JAEGER_ENDPOINT="http://localhost:14268/api/traces"

# OTLP-specific (for Datadog, New Relic, etc.)
OTLP_ENDPOINT="http://localhost:4318/v1/traces"
OTLP_HEADERS='{"DD-API-KEY":"your_key"}'
```

### Exporter Options

| Exporter | Use Case | Setup Complexity |
|----------|----------|------------------|
| **jaeger** | Local development, staging | Easy (Docker one-liner) |
| **otlp** | Production (Datadog, New Relic, Honeycomb) | Medium (SaaS account required) |
| **console** | Debugging (prints to stdout) | None |

---

## Production Deployment

### Option 1: Jaeger (Self-Hosted)

**Pros:**
- Open source and free
- Full control over data
- Rich UI for trace exploration

**Cons:**
- Requires infrastructure management
- No built-in alerting

**Deployment:**

```yaml
# docker-compose.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "14268:14268"  # Collector
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
    volumes:
      - jaeger-data:/badger

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
    volumes:
      - es-data:/usr/share/elasticsearch/data
```

### Option 2: Datadog APM (Recommended for Production)

**Pros:**
- Managed service (no infrastructure)
- Built-in alerting and dashboards
- Correlates traces with logs and metrics
- Auto-discovery of services

**Cons:**
- Costs money ($15-50/host/month)

**Setup:**

1. Sign up for Datadog
2. Get API key
3. Update `.env`:
   ```bash
   TRACING_ENABLED="true"
   TRACING_EXPORTER="otlp"
   OTLP_ENDPOINT="https://http-intake.logs.datadoghq.com/v1/traces"
   OTLP_HEADERS='{"DD-API-KEY":"your_api_key","DD-SITE":"datadoghq.com"}'
   ```

### Option 3: New Relic

```bash
TRACING_ENABLED="true"
TRACING_EXPORTER="otlp"
OTLP_ENDPOINT="https://otlp.nr-data.net:4318/v1/traces"
OTLP_HEADERS='{"api-key":"your_license_key"}'
```

### Option 4: Honeycomb

```bash
TRACING_ENABLED="true"
TRACING_EXPORTER="otlp"
OTLP_ENDPOINT="https://api.honeycomb.io/v1/traces"
OTLP_HEADERS='{"x-honeycomb-team":"your_api_key"}'
```

---

## Adding Custom Spans

### Using TracingService

```typescript
import { TracingService } from '../common/tracing.service';

@Injectable()
export class MyService {
  constructor(private tracingService: TracingService) {}

  async myMethod() {
    return await this.tracingService.withSpan(
      'my.operation.name',
      async (span) => {
        // Add custom attributes
        span.setAttribute('user.id', userId);
        span.setAttribute('item.count', items.length);

        // Your business logic
        const result = await this.doWork();

        // Add events
        span.addEvent('work.completed', { result: 'success' });

        return result;
      },
      {
        // Initial attributes (optional)
        'operation.type': 'batch',
      }
    );
  }
}
```

### Nested Spans (Parent-Child Relationships)

```typescript
async parentOperation() {
  return await this.tracingService.withSpan('parent.operation', async () => {
    // Child span 1
    await this.tracingService.withChildSpan('child.operation.1', async () => {
      await this.doSomething();
    });

    // Child span 2
    await this.tracingService.withChildSpan('child.operation.2', async () => {
      await this.doSomethingElse();
    });
  });
}
```

---

## Best Practices

### 1. Span Naming

✅ **Good:**
- `relationship.discovery`
- `ingestion.github.fetch`
- `ml.scoring.semantic`

❌ **Bad:**
- `doStuff`
- `process`
- `function1`

**Convention:** `{domain}.{operation}[.{detail}]`

### 2. Attributes

Always add context-rich attributes:

```typescript
span.setAttribute('user.id', userId);
span.setAttribute('record.platform', 'github');
span.setAttribute('record.type', 'issue');
span.setAttribute('candidates.count', candidates.length);
```

**Standard attributes:**
- `user.id` - User performing action
- `tenant.id` - Tenant isolation
- `http.status_code` - Response status
- `error.message` - Error details

### 3. Events vs Attributes

**Attributes:** Metadata about the entire operation
```typescript
span.setAttribute('datasource.id', id);  // Describes the whole span
```

**Events:** Point-in-time occurrences within a span
```typescript
span.addEvent('cache.miss');  // Something happened at this moment
span.addEvent('retry.attempt', { attempt: 2 });
```

### 4. Error Handling

Errors are automatically recorded, but you can add context:

```typescript
try {
  await riskyOperation();
} catch (error) {
  span.setAttribute('error.category', 'auth_failure');
  throw error;  // tracingService.withSpan handles recordException
}
```

### 5. Performance

- Don't trace every tiny function (overhead ~0.1ms/span)
- Focus on:
  - HTTP request handlers
  - Database operations
  - External API calls
  - Business-critical operations (>10ms)

---

## Monitoring & Alerting

### Key Metrics to Track

1. **Request Latency (P95, P99)**
   - Target: <500ms for API requests
   - Alert if P99 >2s

2. **Error Rate**
   - Target: <1%
   - Alert if >5% in 5 minutes

3. **Slow Operations**
   - `relationship.discovery` >5s
   - `ingestion.run` >30s
   - Database queries >1s

4. **External API Latency**
   - GitHub API >2s
   - Jira API >3s

### Sample Jaeger Queries

**Find slow requests:**
```
minDuration=5s
```

**Find errors:**
```
error=true
```

**Specific user:**
```
user.id={userId}
```

**Specific platform:**
```
datasource.platform=github
```

---

## Troubleshooting

### No Traces Appearing

**Check Jaeger is running:**
```bash
curl http://localhost:16686/api/services
```

**Check TRACING_ENABLED:**
```bash
echo $TRACING_ENABLED  # Should be "true"
```

**Check application logs:**
```
[Tracing] Initialized with jaeger exporter  ← Should see this on startup
```

### Jaeger Connection Refused

**Symptom:** `ECONNREFUSED localhost:14268`

**Fix:**
```bash
# Restart Jaeger
docker restart jaeger

# Or use alternative endpoint (UDP)
JAEGER_ENDPOINT="udp://localhost:6831"
```

### Missing Spans

**Symptom:** Some operations don't show in traces

**Causes:**
- Tracing initialized after module import
- `TRACING_ENABLED=false`
- Async operations not awaited

**Fix:** Ensure `initializeTracing()` is first import in `main.ts`

### High Overhead

**Symptom:** Application slower with tracing enabled

**Solutions:**
1. Reduce sampling rate (currently 100%):
   ```typescript
   // In tracing.ts
   sampler: new ParentBasedSampler({
     root: new TraceIdRatioBasedSampler(0.1), // 10% sampling
   })
   ```

2. Use batch exporter (already configured)
3. Disable console exporter in production

---

## Trace Correlation with Logs

Every log entry can include trace ID for correlation:

```typescript
const traceId = this.tracingService.getTraceId();
this.logger.log(`Processing request [traceId: ${traceId}]`);
```

Search logs by trace ID to see detailed execution flow.

---

## Cost Estimation (Production)

### Self-Hosted Jaeger
- **Infrastructure:** ~$20-50/month (1 server + storage)
- **Maintenance:** 2-4 hours/month
- **Total:** $20-50/month + engineer time

### Datadog APM
- **Pricing:** $15-31/host/month
- **Indexed spans:** $1.70 per million
- **Estimated:** $50-150/month for small deployment
- **Total:** $50-150/month (fully managed)

### New Relic
- **Pricing:** $0.30 per GB ingested
- **Estimated:** $30-100/month
- **Total:** $30-100/month

### Honeycomb
- **Free tier:** 20M events/month
- **Pro:** $100/month for 100M events
- **Total:** Free - $100/month

**Recommendation:** Start with free Honeycomb tier or self-hosted Jaeger, upgrade to Datadog for production.

---

## Next Steps

1. **Enable tracing in development** to familiarize yourself with the UI
2. **Add custom spans** to business-critical operations
3. **Set up alerting** on slow queries and high error rates
4. **Deploy to staging** with Jaeger
5. **Deploy to production** with Datadog/New Relic

---

## Resources

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Jaeger UI Guide](https://www.jaegertracing.io/docs/latest/frontend-ui/)
- [Datadog APM](https://docs.datadoghq.com/tracing/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)

---

**Last Updated:** 2026-01-25

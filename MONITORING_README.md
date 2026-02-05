# Monitoring & Observability - Quick Start

Production-grade monitoring infrastructure for the Kushim compliance platform.

## 🎯 What's Included

- ✅ **Sentry** - Error tracking & performance monitoring
- ✅ **Winston** - Structured logging with rotation
- ✅ **Prometheus** - Custom metrics & system metrics
- ✅ **Slack Alerts** - Real-time notifications
- ✅ **Health Checks** - Kubernetes-ready probes
- ✅ **Performance Monitoring** - APM & slow query detection

## 🚀 Quick Start

### 1. Configure Environment Variables

```bash
# Backend (.env)
SENTRY_DSN="https://xxx@sentry.io/xxx"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx/xxx/xxx"
LOG_LEVEL="info"

# Frontend (apps/web/.env.local)
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
```

### 2. Start the Application

```bash
npm run dev
```

### 3. Verify Monitoring

```bash
# Health check
curl http://localhost:3001/api/health

# Metrics
curl http://localhost:3001/api/metrics

# Check logs
tail -f apps/backend/logs/application-$(date +%Y-%m-%d).log
```

## 📊 Available Endpoints

- `GET /api/health` - Basic health check
- `GET /api/health/ready` - Readiness probe (includes DB check)
- `GET /api/health/live` - Liveness probe
- `GET /api/metrics` - Prometheus metrics
- `GET /api/metrics/json` - JSON metrics

## 💻 Usage Examples

### Logging

```typescript
import { CustomLoggerService } from '@/common/logger/logger.service';

constructor(private readonly logger: CustomLoggerService) {}

this.logger.log('User action', { userId: user.id });
this.logger.error('Operation failed', error.stack, { context });
this.logger.logSecurityEvent('Failed login', { ip: '1.2.3.4' });
```

### Metrics

```typescript
import { MetricsService } from '@/common/metrics/metrics.service';

constructor(private readonly metrics: MetricsService) {}

this.metrics.recordHttpRequest('GET', '/api/users', 200, 45);
this.metrics.recordComplianceCheck('CC1.1', 'passed', 2000);
this.metrics.recordCacheHit('user-cache');
```

### Alerts

```typescript
import { AlertsService } from '@/common/monitoring/alerts.service';

constructor(private readonly alerts: AlertsService) {}

await this.alerts.alertHighErrorRate(7.5);
await this.alerts.alertDatabaseConnectionFailure(error.message);
```

## 📚 Documentation

- **Comprehensive Guide**: [docs/MONITORING.md](./docs/MONITORING.md)
- **Quick Reference**: [docs/MONITORING_QUICK_REFERENCE.md](./docs/MONITORING_QUICK_REFERENCE.md)
- **Implementation Summary**: [MONITORING_IMPLEMENTATION_SUMMARY.md](./MONITORING_IMPLEMENTATION_SUMMARY.md)
- **Checklist**: [MONITORING_CHECKLIST.md](./MONITORING_CHECKLIST.md)
- **Code Examples**: [apps/backend/src/examples/monitoring-integration.example.ts](./apps/backend/src/examples/monitoring-integration.example.ts)

## 🎨 Log Format

Structured JSON logs with daily rotation:

```json
{
  "timestamp": "2024-01-15 10:30:00",
  "level": "info",
  "message": "HTTP Request",
  "method": "GET",
  "url": "/api/users",
  "statusCode": 200,
  "responseTime": "45ms",
  "userId": "abc123"
}
```

## 📈 Key Metrics

| Metric | Description | Endpoint |
|--------|-------------|----------|
| `http_request_duration_ms` | Request duration | /api/metrics |
| `db_query_duration_ms` | Database query time | /api/metrics |
| `cache_hits_total` | Cache hits | /api/metrics |
| `compliance_checks_total` | Compliance checks | /api/metrics |
| `integration_calls_total` | Integration API calls | /api/metrics |

## 🔔 Alert Types

| Alert | Threshold | Channel |
|-------|-----------|---------|
| High Error Rate | >5% | Slack + Email |
| Slow Response | >500ms | Slack |
| DB Connection Failure | Any | Slack + Email |
| Security Event | Any | Slack + Email |

## 🛠️ Configuration Options

### Backend Environment Variables

```bash
# Required
SENTRY_DSN=""                          # Sentry error tracking
SLACK_WEBHOOK_URL=""                   # Slack alerts

# Optional
LOG_LEVEL="info"                       # error, warn, info, debug
LOGTAIL_TOKEN=""                       # Logtail integration
SENTRY_TRACES_SAMPLE_RATE="0.1"       # Performance sampling
SENTRY_PROFILES_SAMPLE_RATE="0.1"     # Profiling sampling
```

### Frontend Environment Variables

```bash
NEXT_PUBLIC_SENTRY_DSN=""              # Frontend error tracking
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE="0.1"
NEXT_PUBLIC_SENTRY_REPLAY_SAMPLE_RATE="0.1"
```

## 🔍 Troubleshooting

### View Recent Errors

```bash
tail -100 apps/backend/logs/error-*.log
```

### Check Slow Queries

```bash
grep "SLOW_QUERY" apps/backend/logs/application-*.log
```

### Monitor Real-time Logs

```bash
tail -f apps/backend/logs/application-*.log | grep ERROR
```

## 🎯 SLA Targets

- **Uptime**: 99.9%
- **API Response Time (p95)**: <500ms
- **Database Query (p95)**: <100ms
- **Error Rate**: <1%
- **Time to Detect**: <5 min
- **Time to Resolve (P1)**: <1 hour

## 📦 Project Structure

```
apps/backend/src/common/
├── logger/                    # Winston logging service
│   ├── logger.service.ts
│   └── logger.module.ts
├── metrics/                   # Prometheus metrics
│   ├── metrics.service.ts
│   ├── metrics.controller.ts
│   └── metrics.module.ts
├── monitoring/                # Alerts & health checks
│   ├── sentry.config.ts
│   ├── alerts.service.ts
│   ├── health.controller.ts
│   └── monitoring.module.ts
├── interceptors/              # Performance tracking
│   └── performance.interceptor.ts
└── filters/                   # Error handling
    └── global-exception.filter.ts

apps/web/
├── lib/
│   └── sentry.ts             # Frontend Sentry config
└── components/
    ├── ErrorBoundary.tsx     # Error boundary
    └── SentryProvider.tsx    # Sentry provider
```

## ✅ Next Steps

1. **Configure Sentry** - Get DSN from https://sentry.io
2. **Set up Slack** - Create webhook at https://api.slack.com/messaging/webhooks
3. **Test Monitoring** - Trigger errors and verify Sentry capture
4. **Set up Dashboards** - Import Grafana panels (optional)
5. **Configure Uptime** - Add monitors at Better Uptime (optional)

## 🤝 Support

- **Documentation**: See docs/MONITORING.md
- **Issues**: GitHub Issues
- **Email**: support@kushim.io

## 📝 License

Proprietary - Kushim Platform

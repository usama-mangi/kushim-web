# Monitoring Quick Reference

Quick reference guide for common monitoring tasks.

## Quick Links

- **Metrics**: `http://localhost:3001/api/metrics`
- **Health**: `http://localhost:3001/api/health`
- **Logs**: `apps/backend/logs/`
- **Sentry**: `https://sentry.io/organizations/YOUR_ORG/projects/`

## Common Commands

### View Logs
```bash
# Tail application logs
tail -f apps/backend/logs/application-$(date +%Y-%m-%d).log

# Tail error logs
tail -f apps/backend/logs/error-$(date +%Y-%m-%d).log

# Search for errors
grep "ERROR" apps/backend/logs/application-*.log

# Search for specific user
grep "userId.*abc123" apps/backend/logs/application-*.log
```

### Check Metrics
```bash
# Get all metrics
curl http://localhost:3001/api/metrics

# Get metrics as JSON
curl http://localhost:3001/api/metrics/json | jq

# Check specific metric
curl http://localhost:3001/api/metrics | grep http_requests_total
```

### Health Checks
```bash
# Basic health
curl http://localhost:3001/api/health

# Readiness (includes DB)
curl http://localhost:3001/api/health/ready

# Liveness
curl http://localhost:3001/api/health/live
```

## Code Snippets

### Log a Message
```typescript
this.logger.log('Message', { userId: '123' });
this.logger.error('Error message', error.stack, { context: 'data' });
this.logger.warn('Warning', { threshold: 80 });
```

### Record Metrics
```typescript
// HTTP request
this.metrics.recordHttpRequest('GET', '/api/users', 200, 45);

// Database query
this.metrics.recordDbQuery('SELECT', 'User', 25);

// Cache hit/miss
this.metrics.recordCacheHit('user-cache');

// Compliance check
this.metrics.recordComplianceCheck('CC1.1', 'passed', 2000);
```

### Send Alerts
```typescript
// High error rate
await this.alerts.alertHighErrorRate(7.5);

// Database failure
await this.alerts.alertDatabaseConnectionFailure(error.message);

// Custom alert
await this.alerts.sendAlert({
  title: 'Alert Title',
  message: 'Alert message',
  severity: 'warning',
  context: { key: 'value' }
});
```

### Sentry Integration
```typescript
import { captureSentryException, setSentryUser } from '@/common/monitoring/sentry.config';

// Capture exception
try {
  await operation();
} catch (error) {
  captureSentryException(error, { customerId });
  throw error;
}

// Set user context
setSentryUser({ id: user.id, email: user.email });
```

## Alert Thresholds

| Alert | Threshold | Severity |
|-------|-----------|----------|
| Error Rate | >5% | Critical |
| Response Time | >500ms | Error |
| Database Query | >100ms | Warning |
| Memory Usage | >80% | Error |
| Cache Hit Rate | <80% | Warning |

## Troubleshooting Checklist

### High Error Rate
- [ ] Check Sentry for error details
- [ ] Review error logs
- [ ] Check database connectivity
- [ ] Verify external API status
- [ ] Check recent deployments

### Slow Performance
- [ ] Check metrics for slow endpoints
- [ ] Review slow query logs
- [ ] Check cache hit rate
- [ ] Monitor database load
- [ ] Check memory/CPU usage

### Service Down
- [ ] Check health endpoints
- [ ] Verify database connection
- [ ] Check Redis connection
- [ ] Review application logs
- [ ] Check infrastructure status

## Environment Variables

### Backend (.env)
```bash
# Sentry
SENTRY_DSN=""
SENTRY_TRACES_SAMPLE_RATE="0.1"

# Logging
LOG_LEVEL="info"
LOGTAIL_TOKEN=""

# Alerts
SLACK_WEBHOOK_URL=""
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE="0.1"
NEXT_PUBLIC_SENTRY_REPLAY_SAMPLE_RATE="0.1"
```

## Useful Queries

### Prometheus/Grafana

```promql
# Error rate
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m]) * 100

# p95 response time
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

# Cache hit rate
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) * 100

# Compliance success rate
rate(compliance_checks_total{status="passed"}[5m]) / rate(compliance_checks_total[5m]) * 100
```

## Support

- Documentation: `/docs/MONITORING.md`
- On-call: oncall@kushim.io
- Slack: #monitoring

# Monitoring & Observability Guide

This document provides a comprehensive guide to the monitoring and observability infrastructure for the Kushim platform.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [Setup & Configuration](#setup--configuration)
- [Metrics & Dashboards](#metrics--dashboards)
- [Alerts & Notifications](#alerts--notifications)
- [Troubleshooting](#troubleshooting)
- [On-Call Procedures](#on-call-procedures)

---

## Overview

Kushim implements a production-grade monitoring stack that provides visibility into system health, performance, and errors.

### Monitoring Stack

| Component | Purpose | Tool |
|-----------|---------|------|
| Error Tracking | Capture and track application errors | Sentry |
| Logging | Structured application logs | Winston |
| Metrics | Prometheus-compatible metrics | prom-client |
| Alerts | Real-time notifications | Slack, Email |
| Uptime Monitoring | External health checks | Better Uptime |
| Performance | APM and profiling | Sentry Profiling |

### Key Features

- ✅ **Centralized Error Tracking** - All errors reported to Sentry with context
- ✅ **Structured Logging** - JSON-formatted logs with daily rotation
- ✅ **Prometheus Metrics** - Custom business metrics + system metrics
- ✅ **Real-time Alerts** - Slack notifications for critical issues
- ✅ **Performance Monitoring** - Track slow queries, requests, and operations
- ✅ **Health Checks** - Kubernetes-ready liveness/readiness probes
- ✅ **User Context** - Track errors by user and customer

---

## Components

### 1. Sentry Error Tracking

**Location**: 
- Backend: `apps/backend/src/common/monitoring/sentry.config.ts`
- Frontend: `apps/web/lib/sentry.ts`

**Features**:
- Automatic error capture
- Stack traces with source maps
- User context and breadcrumbs
- Performance monitoring
- Session replay (frontend)
- Release tracking

**Configuration**:
```bash
# Backend (.env)
SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_RELEASE="kushim@1.0.0"
SENTRY_TRACES_SAMPLE_RATE="0.1"
SENTRY_PROFILES_SAMPLE_RATE="0.1"

# Frontend (.env.local)
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_SENTRY_RELEASE="kushim@1.0.0"
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE="0.1"
NEXT_PUBLIC_SENTRY_REPLAY_SAMPLE_RATE="0.1"
```

**Usage**:
```typescript
import { captureSentryException, setSentryUser } from '@/common/monitoring/sentry.config';

// Capture exception with context
try {
  await riskyOperation();
} catch (error) {
  captureSentryException(error, { customerId, operation: 'riskyOperation' });
  throw error;
}

// Set user context
setSentryUser({
  id: user.id,
  email: user.email,
  customerId: user.customerId,
});
```

### 2. Winston Logging

**Location**: `apps/backend/src/common/logger/logger.service.ts`

**Log Levels**:
- `error` - Errors and exceptions
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug information

**Log Outputs**:
- Console (development only)
- `logs/application-YYYY-MM-DD.log` (info+)
- `logs/error-YYYY-MM-DD.log` (errors only)
- Logtail/Papertrail (optional)

**Configuration**:
```bash
LOG_LEVEL="info"  # error, warn, info, debug
LOGTAIL_TOKEN=""  # Optional: Logtail integration
```

**Usage**:
```typescript
import { CustomLoggerService } from '@/common/logger/logger.service';

constructor(private readonly logger: CustomLoggerService) {}

// Standard logging
this.logger.log('User logged in', { userId: user.id });
this.logger.error('Failed to fetch data', error.stack, { userId: user.id });
this.logger.warn('Rate limit approaching', { endpoint: '/api/data' });

// Specialized logging
this.logger.logRequest('GET', '/api/users', 200, 45);
this.logger.logSecurityEvent('Failed login attempt', { ip: '1.2.3.4' });
this.logger.logComplianceEvent('Control check passed', { controlId: 'CC1.1' });
this.logger.logPerformance('Database query', 150, { query: 'SELECT ...' });
this.logger.logSlowQuery('SELECT * FROM users', 75);
```

**Log Rotation**:
- Daily rotation at midnight
- Gzip compression enabled
- 14 days retention (info logs)
- 30 days retention (error logs)
- Max 20MB per file

### 3. Prometheus Metrics

**Location**: `apps/backend/src/common/metrics/metrics.service.ts`

**Endpoints**:
- `GET /api/metrics` - Prometheus format
- `GET /api/metrics/json` - JSON format

**Metric Categories**:

#### HTTP Metrics
- `http_request_duration_ms` - Request duration histogram
- `http_requests_total` - Total request counter
- `http_request_errors_total` - Error counter

#### Database Metrics
- `db_query_duration_ms` - Query duration histogram
- `db_queries_total` - Query counter
- `db_connection_pool_size` - Connection pool gauge

#### Cache Metrics
- `cache_hits_total` - Cache hit counter
- `cache_misses_total` - Cache miss counter

#### Queue Metrics
- `queue_jobs_total` - Job counter
- `queue_job_duration_ms` - Job duration histogram
- `queue_jobs_failed_total` - Failed job counter

#### Compliance Metrics
- `compliance_checks_total` - Check counter
- `compliance_checks_failed_total` - Failed check counter
- `compliance_check_duration_ms` - Check duration histogram

#### Integration Metrics
- `integration_calls_total` - API call counter
- `integration_calls_failed_total` - Failed call counter
- `integration_call_duration_ms` - Call duration histogram

#### Evidence Metrics
- `evidence_collected_total` - Evidence counter
- `evidence_verified_total` - Verification counter

#### Business Metrics
- `active_users` - Active user gauge
- `active_customers` - Active customer gauge

**Usage**:
```typescript
import { MetricsService } from '@/common/metrics/metrics.service';

constructor(private readonly metrics: MetricsService) {}

// Record HTTP request
this.metrics.recordHttpRequest('GET', '/api/users', 200, 45);

// Record database query
this.metrics.recordDbQuery('SELECT', 'User', 25);

// Record cache hit/miss
this.metrics.recordCacheHit('user-cache');
this.metrics.recordCacheMiss('user-cache');

// Record queue job
this.metrics.recordQueueJob('compliance-check', 'completed', 1500, 'checkControl');

// Record compliance check
this.metrics.recordComplianceCheck('CC1.1', 'passed', 2000);

// Record integration call
this.metrics.recordIntegrationCall('aws', 'listUsers', 'success', 500);

// Record evidence collection
this.metrics.recordEvidenceCollected('mfa-status', 'okta');

// Update business metrics
this.metrics.setActiveUsers(1234);
this.metrics.setActiveCustomers(56);
```

### 4. Alerts & Notifications

**Location**: `apps/backend/src/common/monitoring/alerts.service.ts`

**Alert Channels**:
- Slack (via webhook)
- Email (for critical alerts)

**Alert Severity Levels**:
- `critical` 🚨 - Immediate action required
- `error` ❌ - Attention needed soon
- `warning` ⚠️ - Monitor situation
- `info` ℹ️ - Informational

**Configuration**:
```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx/xxx/xxx"
```

**Predefined Alerts**:
```typescript
import { AlertsService } from '@/common/monitoring/alerts.service';

constructor(private readonly alerts: AlertsService) {}

// High error rate
await this.alerts.alertHighErrorRate(7.5, { endpoint: '/api/users' });

// Slow response time
await this.alerts.alertSlowResponse(850, '/api/compliance/check');

// Database connection failure
await this.alerts.alertDatabaseConnectionFailure(error.message);

// Redis connection failure
await this.alerts.alertRedisConnectionFailure(error.message);

// Integration failure
await this.alerts.alertIntegrationFailure('AWS', error.message);

// Security event
await this.alerts.alertSecurityEvent('Multiple failed login attempts', { ip: '1.2.3.4' });

// Compliance check failure
await this.alerts.alertComplianceCheckFailure('CC1.1', 'MFA not enabled', { userId });
```

**Custom Alerts**:
```typescript
await this.alerts.sendAlert({
  title: 'Custom Alert',
  message: 'Something important happened',
  severity: 'warning',
  context: {
    customField: 'value',
    timestamp: new Date().toISOString(),
  },
});
```

### 5. Health Checks

**Location**: `apps/backend/src/common/monitoring/health.controller.ts`

**Endpoints**:

#### `GET /api/health`
Basic health check - returns uptime and status.

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345.67,
  "environment": "production"
}
```

#### `GET /api/health/ready`
Readiness check - includes database connectivity.

```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": "ok"
  }
}
```

#### `GET /api/health/live`
Liveness check - minimal check for process health.

```json
{
  "status": "alive",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Kubernetes Integration**:
```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 6. Performance Monitoring

**Location**: `apps/backend/src/common/interceptors/performance.interceptor.ts`

**Features**:
- Automatic request/response timing
- Metrics recording
- Slow request detection (>500ms)
- Error tracking integration

**Thresholds**:
- Slow request: >500ms
- Slow database query: >50ms

---

## Setup & Configuration

### 1. Initial Setup

```bash
# Install dependencies (already done via npm install)
cd apps/backend
npm install

cd apps/web
npm install
```

### 2. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Configure Sentry
SENTRY_DSN="https://xxx@sentry.io/xxx"

# Configure Slack
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx/xxx/xxx"

# Configure logging
LOG_LEVEL="info"

# Optional: Logtail/Papertrail
LOGTAIL_TOKEN="your-token"
```

### 3. Frontend Configuration

```bash
# apps/web/.env.local
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_SENTRY_RELEASE="kushim@1.0.0"
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE="0.1"
NEXT_PUBLIC_SENTRY_REPLAY_SAMPLE_RATE="0.1"
```

### 4. Verify Setup

```bash
# Start the application
npm run dev

# Check endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/metrics

# Check logs
tail -f apps/backend/logs/application-*.log
```

---

## Metrics & Dashboards

### Prometheus Integration

**Scrape Configuration**:
```yaml
scrape_configs:
  - job_name: 'kushim-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/api/metrics'
    scrape_interval: 15s
```

### Grafana Dashboard

**Recommended Panels**:

1. **HTTP Request Rate**
   - Query: `rate(http_requests_total[5m])`
   - Type: Graph

2. **HTTP Request Duration (p95)**
   - Query: `histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))`
   - Type: Graph

3. **Error Rate**
   - Query: `rate(http_request_errors_total[5m]) / rate(http_requests_total[5m]) * 100`
   - Type: Graph
   - Alert: >5%

4. **Database Query Duration**
   - Query: `histogram_quantile(0.95, rate(db_query_duration_ms_bucket[5m]))`
   - Type: Graph

5. **Cache Hit Rate**
   - Query: `rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) * 100`
   - Type: Gauge

6. **Compliance Check Success Rate**
   - Query: `rate(compliance_checks_total{status="passed"}[5m]) / rate(compliance_checks_total[5m]) * 100`
   - Type: Graph

7. **Active Users**
   - Query: `active_users`
   - Type: Gauge

8. **Queue Job Duration**
   - Query: `histogram_quantile(0.95, rate(queue_job_duration_ms_bucket[5m]))`
   - Type: Graph

### Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | >5% | Investigate immediately |
| Response Time (p95) | >500ms | Check for bottlenecks |
| Database Query (p95) | >100ms | Optimize queries |
| Cache Hit Rate | <80% | Review cache strategy |
| Queue Job Failures | >10/min | Check queue health |
| Memory Usage | >80% | Scale or optimize |
| CPU Usage | >80% | Scale or optimize |

---

## Alerts & Notifications

### Alert Rules

#### Critical Alerts (Immediate Response)

1. **High Error Rate**
   - Threshold: >5%
   - Channel: Slack + Email
   - Example: Database connection failures

2. **Database Connection Failure**
   - Threshold: Any failure
   - Channel: Slack + Email
   - Example: PostgreSQL down

3. **Redis Connection Failure**
   - Threshold: Any failure
   - Channel: Slack + Email
   - Example: Redis down

4. **Security Event**
   - Threshold: Any event
   - Channel: Slack + Email
   - Example: Multiple failed login attempts

#### Error Alerts (Response within 1 hour)

1. **Slow Response Time**
   - Threshold: >500ms average
   - Channel: Slack
   - Example: API endpoint degradation

2. **Integration Failure**
   - Threshold: >5 failures/min
   - Channel: Slack
   - Example: AWS API throttling

3. **High Memory Usage**
   - Threshold: >80%
   - Channel: Slack
   - Example: Memory leak

#### Warning Alerts (Monitor)

1. **Compliance Check Failure**
   - Threshold: Any failure
   - Channel: Slack
   - Example: Control check failed

2. **Cache Miss Rate**
   - Threshold: <50% hit rate
   - Channel: Slack
   - Example: Cache warming needed

3. **Slow Database Query**
   - Threshold: >100ms
   - Channel: Logs only
   - Example: Missing index

### Slack Alert Format

```
🚨 High Error Rate Detected
Error rate is 7.50% (threshold: 5.00%)

endpoint: /api/users
errorRate: 7.50%
threshold: 5.00%

Kushim Monitoring
```

---

## Troubleshooting

### Common Issues

#### 1. High Error Rate

**Symptoms**:
- Error rate >5%
- Multiple 500 errors in logs

**Investigation Steps**:
1. Check Sentry for recent errors
2. Review application logs: `tail -f logs/error-*.log`
3. Check database connectivity: `GET /api/health/ready`
4. Check Redis connectivity
5. Review recent deployments

**Resolution**:
- Identify root cause in Sentry
- Fix the issue and deploy
- Monitor error rate for improvement

#### 2. Slow Response Time

**Symptoms**:
- p95 response time >500ms
- Slow request warnings in logs

**Investigation Steps**:
1. Check `/api/metrics` for slow endpoints
2. Review slow query logs
3. Check database performance
4. Check external API latency

**Resolution**:
- Optimize slow queries
- Add database indexes
- Implement caching
- Rate limit external calls

#### 3. Database Connection Failures

**Symptoms**:
- Critical alert: Database connection failure
- Readiness probe failing
- 500 errors for all requests

**Investigation Steps**:
1. Check database status: `docker ps | grep postgres`
2. Check connection pool: Review metrics
3. Check database logs
4. Verify credentials and connection string

**Resolution**:
- Restart database if down
- Scale connection pool if exhausted
- Fix connection string if incorrect

#### 4. Memory Leaks

**Symptoms**:
- Memory usage increasing over time
- Application crashes
- OOM (Out of Memory) errors

**Investigation Steps**:
1. Monitor memory metrics in Prometheus
2. Check for memory leaks in Sentry profiling
3. Review large object allocations
4. Check for unclosed connections

**Resolution**:
- Identify leak source
- Fix code and deploy
- Restart application
- Consider memory limit increase

### Log Analysis

#### Find Recent Errors
```bash
# Last 100 errors
tail -100 logs/error-*.log

# Errors in last hour
grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" logs/error-*.log

# Errors for specific user
grep "userId.*abc123" logs/application-*.log
```

#### Find Slow Requests
```bash
# Requests >500ms
grep "PERFORMANCE.*Slow request" logs/application-*.log

# Slow database queries
grep "SLOW_QUERY" logs/application-*.log
```

#### Find Security Events
```bash
# All security events
grep "SECURITY" logs/application-*.log

# Failed login attempts
grep "Failed login attempt" logs/application-*.log
```

---

## On-Call Procedures

### Incident Response Process

#### 1. Alert Received

**Immediate Actions**:
- Acknowledge the alert
- Check Sentry for details
- Review recent logs
- Check `/api/metrics` for anomalies

#### 2. Assess Severity

**Critical (P0)**:
- Complete service outage
- Data loss risk
- Security breach
- >20% error rate

**High (P1)**:
- Partial service degradation
- >10% error rate
- Compliance failure

**Medium (P2)**:
- Performance degradation
- >5% error rate
- Integration failure

**Low (P3)**:
- Minor issues
- <5% error rate
- Warnings

#### 3. Investigate

**Investigation Checklist**:
- [ ] Check Sentry for error details
- [ ] Review application logs
- [ ] Check metrics dashboard
- [ ] Verify infrastructure health
- [ ] Review recent deployments
- [ ] Check external dependencies

#### 4. Mitigate

**Mitigation Options**:
- Rollback recent deployment
- Restart affected services
- Scale resources
- Enable circuit breaker
- Failover to backup

#### 5. Communicate

**Communication Channels**:
- Update incident channel
- Notify stakeholders
- Update status page
- Document timeline

#### 6. Resolve

**Resolution Steps**:
- Implement fix
- Deploy to production
- Verify metrics
- Monitor for regression
- Close alert

#### 7. Post-Mortem

**Post-Incident Review**:
- Document timeline
- Identify root cause
- List action items
- Update runbooks
- Share learnings

### Escalation Path

1. **On-Call Engineer** - Initial response
2. **Engineering Lead** - If unresolved in 30 minutes
3. **CTO** - If critical and unresolved in 1 hour

### Contact Information

- On-Call Phone: [On-call rotation]
- Slack Channel: #incidents
- Email: oncall@kushim.io

---

## Best Practices

### Logging

✅ **Do**:
- Use structured logging (JSON)
- Include context (userId, customerId, requestId)
- Log at appropriate levels
- Sanitize sensitive data

❌ **Don't**:
- Log passwords or tokens
- Use console.log in production
- Over-log in hot paths
- Log PII without redaction

### Metrics

✅ **Do**:
- Use consistent labels
- Keep cardinality low
- Use histograms for timing
- Document custom metrics

❌ **Don't**:
- Use high-cardinality labels (e.g., userId)
- Create metrics in hot paths
- Use counters for gauges
- Forget to increment counters

### Alerts

✅ **Do**:
- Set actionable thresholds
- Include context in alerts
- Test alert notifications
- Document response procedures

❌ **Don't**:
- Create noisy alerts
- Alert without action items
- Use email-only for critical alerts
- Ignore alert fatigue

### Performance

✅ **Do**:
- Monitor p95/p99 latencies
- Set realistic SLOs
- Optimize critical paths
- Use caching effectively

❌ **Don't**:
- Ignore slow queries
- Block on external APIs
- Skip performance testing
- Over-optimize prematurely

---

## SLA Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Uptime | 99.9% | Monthly |
| API Response Time (p95) | <500ms | Per endpoint |
| Database Query (p95) | <100ms | Per operation |
| Error Rate | <1% | Hourly |
| Time to Detect (TTD) | <5 min | Per incident |
| Time to Resolve (TTR) | <1 hour | P1 incidents |

---

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Better Uptime Documentation](https://betteruptime.com/docs)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-01-15 | Initial monitoring setup | System |

---

**Questions or Issues?**

Contact: support@kushim.io

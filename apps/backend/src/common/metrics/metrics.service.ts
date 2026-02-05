import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private register: client.Registry;

  // HTTP Metrics
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;
  private httpRequestErrors: client.Counter;

  // Database Metrics
  private dbQueryDuration: client.Histogram;
  private dbQueryTotal: client.Counter;
  private dbConnectionPool: client.Gauge;

  // Cache Metrics
  private cacheHits: client.Counter;
  private cacheMisses: client.Counter;

  // Queue Metrics
  private queueJobsTotal: client.Counter;
  private queueJobsDuration: client.Histogram;
  private queueJobsFailed: client.Counter;

  // Compliance Metrics
  private complianceChecksTotal: client.Counter;
  private complianceChecksFailed: client.Counter;
  private complianceCheckDuration: client.Histogram;

  // Integration Metrics
  private integrationCallsTotal: client.Counter;
  private integrationCallsFailed: client.Counter;
  private integrationCallDuration: client.Histogram;

  // Evidence Metrics
  private evidenceCollected: client.Counter;
  private evidenceVerified: client.Counter;

  // Business Metrics
  private activeUsers: client.Gauge;
  private activeCustomers: client.Gauge;

  constructor() {
    this.register = new client.Registry();

    // Set default labels
    this.register.setDefaultLabels({
      app: 'kushim-backend',
      environment: process.env.NODE_ENV || 'development',
    });

    // Collect default metrics (CPU, memory, etc.)
    client.collectDefaultMetrics({ register: this.register });

    this.initializeMetrics();
  }

  private initializeMetrics() {
    // HTTP Metrics
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
    });

    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestErrors = new client.Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'status_code'],
    });

    // Database Metrics
    this.dbQueryDuration = new client.Histogram({
      name: 'db_query_duration_ms',
      help: 'Duration of database queries in ms',
      labelNames: ['operation', 'model'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    });

    this.dbQueryTotal = new client.Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'model'],
    });

    this.dbConnectionPool = new client.Gauge({
      name: 'db_connection_pool_size',
      help: 'Current database connection pool size',
    });

    // Cache Metrics
    this.cacheHits = new client.Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_name'],
    });

    this.cacheMisses = new client.Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_name'],
    });

    // Queue Metrics
    this.queueJobsTotal = new client.Counter({
      name: 'queue_jobs_total',
      help: 'Total number of queue jobs processed',
      labelNames: ['queue', 'status'],
    });

    this.queueJobsDuration = new client.Histogram({
      name: 'queue_job_duration_ms',
      help: 'Duration of queue job processing in ms',
      labelNames: ['queue', 'job_name'],
      buckets: [100, 500, 1000, 5000, 10000, 30000, 60000],
    });

    this.queueJobsFailed = new client.Counter({
      name: 'queue_jobs_failed_total',
      help: 'Total number of failed queue jobs',
      labelNames: ['queue', 'job_name', 'error_type'],
    });

    // Compliance Metrics
    this.complianceChecksTotal = new client.Counter({
      name: 'compliance_checks_total',
      help: 'Total number of compliance checks performed',
      labelNames: ['control_id', 'status'],
    });

    this.complianceChecksFailed = new client.Counter({
      name: 'compliance_checks_failed_total',
      help: 'Total number of failed compliance checks',
      labelNames: ['control_id', 'reason'],
    });

    this.complianceCheckDuration = new client.Histogram({
      name: 'compliance_check_duration_ms',
      help: 'Duration of compliance checks in ms',
      labelNames: ['control_id'],
      buckets: [100, 500, 1000, 5000, 10000, 30000],
    });

    // Integration Metrics
    this.integrationCallsTotal = new client.Counter({
      name: 'integration_calls_total',
      help: 'Total number of integration API calls',
      labelNames: ['integration', 'operation', 'status'],
    });

    this.integrationCallsFailed = new client.Counter({
      name: 'integration_calls_failed_total',
      help: 'Total number of failed integration calls',
      labelNames: ['integration', 'operation', 'error_type'],
    });

    this.integrationCallDuration = new client.Histogram({
      name: 'integration_call_duration_ms',
      help: 'Duration of integration API calls in ms',
      labelNames: ['integration', 'operation'],
      buckets: [100, 500, 1000, 2000, 5000, 10000],
    });

    // Evidence Metrics
    this.evidenceCollected = new client.Counter({
      name: 'evidence_collected_total',
      help: 'Total number of evidence items collected',
      labelNames: ['type', 'integration'],
    });

    this.evidenceVerified = new client.Counter({
      name: 'evidence_verified_total',
      help: 'Total number of evidence items verified',
      labelNames: ['type', 'status'],
    });

    // Business Metrics
    this.activeUsers = new client.Gauge({
      name: 'active_users',
      help: 'Number of active users',
    });

    this.activeCustomers = new client.Gauge({
      name: 'active_customers',
      help: 'Number of active customers',
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.httpRequestErrors);
    this.register.registerMetric(this.dbQueryDuration);
    this.register.registerMetric(this.dbQueryTotal);
    this.register.registerMetric(this.dbConnectionPool);
    this.register.registerMetric(this.cacheHits);
    this.register.registerMetric(this.cacheMisses);
    this.register.registerMetric(this.queueJobsTotal);
    this.register.registerMetric(this.queueJobsDuration);
    this.register.registerMetric(this.queueJobsFailed);
    this.register.registerMetric(this.complianceChecksTotal);
    this.register.registerMetric(this.complianceChecksFailed);
    this.register.registerMetric(this.complianceCheckDuration);
    this.register.registerMetric(this.integrationCallsTotal);
    this.register.registerMetric(this.integrationCallsFailed);
    this.register.registerMetric(this.integrationCallDuration);
    this.register.registerMetric(this.evidenceCollected);
    this.register.registerMetric(this.evidenceVerified);
    this.register.registerMetric(this.activeUsers);
    this.register.registerMetric(this.activeCustomers);
  }

  // HTTP Metrics Methods
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });

    if (statusCode >= 400) {
      this.httpRequestErrors.inc({ method, route, status_code: statusCode });
    }
  }

  // Database Metrics Methods
  recordDbQuery(operation: string, model: string, duration: number) {
    this.dbQueryDuration.observe({ operation, model }, duration);
    this.dbQueryTotal.inc({ operation, model });
  }

  setDbConnectionPoolSize(size: number) {
    this.dbConnectionPool.set(size);
  }

  // Cache Metrics Methods
  recordCacheHit(cacheName: string) {
    this.cacheHits.inc({ cache_name: cacheName });
  }

  recordCacheMiss(cacheName: string) {
    this.cacheMisses.inc({ cache_name: cacheName });
  }

  getCacheHitRate(cacheName: string): number {
    const hits = this.cacheHits['hashMap']?.[`cache_name:${cacheName}`]?.value || 0;
    const misses = this.cacheMisses['hashMap']?.[`cache_name:${cacheName}`]?.value || 0;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }

  // Queue Metrics Methods
  recordQueueJob(queue: string, status: 'completed' | 'failed', duration: number, jobName?: string) {
    this.queueJobsTotal.inc({ queue, status });
    if (jobName) {
      this.queueJobsDuration.observe({ queue, job_name: jobName }, duration);
    }
  }

  recordQueueJobFailure(queue: string, jobName: string, errorType: string) {
    this.queueJobsFailed.inc({ queue, job_name: jobName, error_type: errorType });
  }

  // Compliance Metrics Methods
  recordComplianceCheck(controlId: string, status: 'passed' | 'failed', duration: number, reason?: string) {
    this.complianceChecksTotal.inc({ control_id: controlId, status });
    this.complianceCheckDuration.observe({ control_id: controlId }, duration);

    if (status === 'failed' && reason) {
      this.complianceChecksFailed.inc({ control_id: controlId, reason });
    }
  }

  // Integration Metrics Methods
  recordIntegrationCall(
    integration: string,
    operation: string,
    status: 'success' | 'failed',
    duration: number,
    errorType?: string,
  ) {
    this.integrationCallsTotal.inc({ integration, operation, status });
    this.integrationCallDuration.observe({ integration, operation }, duration);

    if (status === 'failed' && errorType) {
      this.integrationCallsFailed.inc({ integration, operation, error_type: errorType });
    }
  }

  // Evidence Metrics Methods
  recordEvidenceCollected(type: string, integration: string) {
    this.evidenceCollected.inc({ type, integration });
  }

  recordEvidenceVerified(type: string, status: 'verified' | 'failed') {
    this.evidenceVerified.inc({ type, status });
  }

  // Business Metrics Methods
  setActiveUsers(count: number) {
    this.activeUsers.set(count);
  }

  setActiveCustomers(count: number) {
    this.activeCustomers.set(count);
  }

  // Get metrics in Prometheus format
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Get metrics as JSON
  async getMetricsJSON(): Promise<any[]> {
    return this.register.getMetricsAsJSON();
  }

  // Clear all metrics (useful for testing)
  clearMetrics() {
    this.register.clear();
  }
}

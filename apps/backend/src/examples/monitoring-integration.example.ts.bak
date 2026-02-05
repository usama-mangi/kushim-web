/**
 * Example: Integrating Monitoring into Existing Services
 * 
 * This file demonstrates how to integrate the monitoring infrastructure
 * into your existing NestJS services.
 */

import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from '@/common/logger/logger.service';
import { MetricsService } from '@/common/metrics/metrics.service';
import { AlertsService } from '@/common/monitoring/alerts.service';
import { captureSentryException } from '@/common/monitoring/sentry.config';

/**
 * Example 1: Compliance Service Integration
 */
@Injectable()
export class ComplianceServiceExample {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly metrics: MetricsService,
    private readonly alerts: AlertsService,
  ) {}

  async runComplianceCheck(controlId: string, customerId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.logComplianceEvent(`Starting check for ${controlId}`, {
        controlId,
        customerId,
      });

      // Perform compliance check...
      const result = await this.performCheck(controlId);
      
      const duration = Date.now() - startTime;

      // Record metrics
      this.metrics.recordComplianceCheck(
        controlId,
        result.passed ? 'passed' : 'failed',
        duration,
        result.reason,
      );

      // Log result
      if (result.passed) {
        this.logger.logComplianceEvent(`Check passed for ${controlId}`, {
          controlId,
          customerId,
          duration,
        });
      } else {
        this.logger.warn(`Compliance check failed: ${controlId}`, {
          controlId,
          customerId,
          reason: result.reason,
          duration,
        });

        // Send alert for failure
        await this.alerts.alertComplianceCheckFailure(
          controlId,
          result.reason,
          { customerId },
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      this.logger.error(
        `Compliance check error: ${controlId}`,
        error.stack,
        { controlId, customerId, duration },
      );

      // Record failed metric
      this.metrics.recordComplianceCheck(
        controlId,
        'failed',
        duration,
        error.message,
      );

      // Capture in Sentry
      captureSentryException(error, {
        controlId,
        customerId,
        operation: 'complianceCheck',
      });

      throw error;
    }
  }

  private async performCheck(controlId: string): Promise<any> {
    // Implementation...
    return { passed: true, reason: null };
  }
}

/**
 * Example 2: Integration Service with Performance Monitoring
 */
@Injectable()
export class IntegrationServiceExample {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly metrics: MetricsService,
    private readonly alerts: AlertsService,
  ) {}

  async callExternalApi(
    integration: string,
    operation: string,
    params: any,
  ): Promise<any> {
    const startTime = Date.now();

    try {
      this.logger.logIntegrationEvent(integration, `Calling ${operation}`, {
        operation,
        params: this.sanitizeParams(params),
      });

      // Make API call...
      const result = await this.makeApiCall(integration, operation, params);
      
      const duration = Date.now() - startTime;

      // Record successful call
      this.metrics.recordIntegrationCall(
        integration,
        operation,
        'success',
        duration,
      );

      // Log performance if slow
      if (duration > 1000) {
        this.logger.logPerformance(
          `${integration} ${operation}`,
          duration,
          { integration, operation },
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Determine error type
      const errorType = error.response?.status === 429 
        ? 'rate_limit' 
        : 'api_error';

      // Record failed call
      this.metrics.recordIntegrationCall(
        integration,
        operation,
        'failed',
        duration,
        errorType,
      );

      // Log error
      this.logger.error(
        `Integration call failed: ${integration}.${operation}`,
        error.stack,
        {
          integration,
          operation,
          errorType,
          duration,
          statusCode: error.response?.status,
        },
      );

      // Send alert if multiple failures
      if (this.shouldAlert(integration, errorType)) {
        await this.alerts.alertIntegrationFailure(
          integration,
          error.message,
        );
      }

      // Capture in Sentry
      captureSentryException(error, {
        integration,
        operation,
        errorType,
      });

      throw error;
    }
  }

  private async makeApiCall(integration: string, operation: string, params: any): Promise<any> {
    // Implementation...
    return {};
  }

  private sanitizeParams(params: any): any {
    // Remove sensitive data before logging
    const sanitized = { ...params };
    delete sanitized.apiKey;
    delete sanitized.token;
    return sanitized;
  }

  private shouldAlert(integration: string, errorType: string): boolean {
    // Implement rate limiting for alerts
    return true; // Simplified
  }
}

/**
 * Example 3: Database Service with Query Monitoring
 */
@Injectable()
export class DatabaseServiceExample {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly metrics: MetricsService,
  ) {}

  async findUser(userId: string): Promise<any> {
    const startTime = Date.now();
    const operation = 'SELECT';
    const model = 'User';

    try {
      // Execute query...
      const user = await this.executeQuery(userId);
      
      const duration = Date.now() - startTime;

      // Record query metrics
      this.metrics.recordDbQuery(operation, model, duration);

      // Log slow queries
      if (duration > 50) {
        this.logger.logSlowQuery(
          `SELECT * FROM users WHERE id = '${userId}'`,
          duration,
          { operation, model },
        );
      }

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Still record metrics for failed queries
      this.metrics.recordDbQuery(operation, model, duration);

      // Log error
      this.logger.error(
        'Database query failed',
        error.stack,
        { operation, model, duration },
      );

      throw error;
    }
  }

  private async executeQuery(userId: string): Promise<any> {
    // Implementation...
    return {};
  }
}

/**
 * Example 4: Cache Service with Hit/Miss Tracking
 */
@Injectable()
export class CacheServiceExample {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly metrics: MetricsService,
  ) {}

  async get(key: string, cacheName: string = 'default'): Promise<any> {
    try {
      const value = await this.getCachedValue(key);

      if (value) {
        // Cache hit
        this.metrics.recordCacheHit(cacheName);
        this.logger.debug(`Cache hit: ${key}`, { cacheName });
        return value;
      } else {
        // Cache miss
        this.metrics.recordCacheMiss(cacheName);
        this.logger.debug(`Cache miss: ${key}`, { cacheName });
        return null;
      }
    } catch (error) {
      this.logger.error('Cache error', error.stack, { key, cacheName });
      
      // Treat errors as cache miss
      this.metrics.recordCacheMiss(cacheName);
      
      return null;
    }
  }

  async getCacheHitRate(cacheName: string): Promise<number> {
    return this.metrics.getCacheHitRate(cacheName);
  }

  private async getCachedValue(key: string): Promise<any> {
    // Implementation...
    return null;
  }
}

/**
 * Example 5: Queue Service with Job Monitoring
 */
@Injectable()
export class QueueServiceExample {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly metrics: MetricsService,
    private readonly alerts: AlertsService,
  ) {}

  async processJob(jobName: string, jobData: any): Promise<void> {
    const startTime = Date.now();
    const queueName = 'compliance-check';

    try {
      this.logger.log(`Processing job: ${jobName}`, {
        jobName,
        queue: queueName,
      });

      // Process job...
      await this.executeJob(jobName, jobData);
      
      const duration = Date.now() - startTime;

      // Record successful job
      this.metrics.recordQueueJob(queueName, 'completed', duration, jobName);

      this.logger.log(`Job completed: ${jobName}`, {
        jobName,
        queue: queueName,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed job
      this.metrics.recordQueueJob(queueName, 'failed', duration, jobName);
      this.metrics.recordQueueJobFailure(
        queueName,
        jobName,
        error.constructor.name,
      );

      // Log error
      this.logger.error(
        `Job failed: ${jobName}`,
        error.stack,
        {
          jobName,
          queue: queueName,
          duration,
          errorType: error.constructor.name,
        },
      );

      // Send alert if critical job
      if (this.isCriticalJob(jobName)) {
        await this.alerts.sendAlert({
          title: 'Critical Queue Job Failed',
          message: `Job ${jobName} failed in queue ${queueName}`,
          severity: 'error',
          context: {
            jobName,
            queue: queueName,
            error: error.message,
          },
        });
      }

      throw error;
    }
  }

  private async executeJob(jobName: string, jobData: any): Promise<void> {
    // Implementation...
  }

  private isCriticalJob(jobName: string): boolean {
    return ['critical-compliance-check', 'critical-evidence-collection'].includes(jobName);
  }
}

/**
 * Example 6: Evidence Service with Collection Tracking
 */
@Injectable()
export class EvidenceServiceExample {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly metrics: MetricsService,
  ) {}

  async collectEvidence(type: string, integration: string): Promise<void> {
    try {
      this.logger.log(`Collecting evidence: ${type} from ${integration}`, {
        type,
        integration,
      });

      // Collect evidence...
      await this.performCollection(type, integration);

      // Record successful collection
      this.metrics.recordEvidenceCollected(type, integration);

      this.logger.log(`Evidence collected: ${type}`, {
        type,
        integration,
      });
    } catch (error) {
      this.logger.error(
        `Evidence collection failed: ${type}`,
        error.stack,
        { type, integration },
      );

      throw error;
    }
  }

  async verifyEvidence(type: string, evidenceId: string): Promise<void> {
    try {
      // Verify evidence...
      const isValid = await this.performVerification(evidenceId);

      // Record verification
      this.metrics.recordEvidenceVerified(
        type,
        isValid ? 'verified' : 'failed',
      );

      if (isValid) {
        this.logger.log(`Evidence verified: ${evidenceId}`, { type });
      } else {
        this.logger.warn(`Evidence verification failed: ${evidenceId}`, { type });
      }
    } catch (error) {
      this.logger.error(
        `Evidence verification error: ${evidenceId}`,
        error.stack,
        { type },
      );

      this.metrics.recordEvidenceVerified(type, 'failed');

      throw error;
    }
  }

  private async performCollection(type: string, integration: string): Promise<void> {
    // Implementation...
  }

  private async performVerification(evidenceId: string): Promise<boolean> {
    // Implementation...
    return true;
  }
}

/**
 * Usage Summary:
 * 
 * 1. Inject services in constructor:
 *    - CustomLoggerService for logging
 *    - MetricsService for metrics
 *    - AlertsService for alerts
 * 
 * 2. Always use try-catch blocks for operations
 * 
 * 3. Record metrics for both success and failure
 * 
 * 4. Log with appropriate context (userId, customerId, etc.)
 * 
 * 5. Send alerts for critical failures
 * 
 * 6. Capture exceptions in Sentry with context
 * 
 * 7. Monitor performance and log slow operations
 */

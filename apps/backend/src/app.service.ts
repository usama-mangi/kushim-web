import { Injectable, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { type Queue } from 'bull';
import {
  QueueName,
  EvidenceCollectionJobType,
} from './shared/queue/queue.constants';
import { PrismaService } from './shared/prisma/prisma.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private redisClient: Redis;

  constructor(
    @InjectQueue(QueueName.EVIDENCE_COLLECTION)
    private evidenceQueue: Queue,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize Redis client for health checks
    const redisUrl = this.configService.get('REDIS_URL');
    if (redisUrl) {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });
    }
  }

  getHello(): object {
    return {
      status: 'ok',
      message: 'Kushim API - Compliance Automation Platform',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Basic health check
   */
  async healthCheck(): Promise<object> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  /**
   * Database health check
   */
  async healthCheckDb(): Promise<object> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      throw new HttpException(
        {
          status: 'error',
          database: 'disconnected',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Redis health check
   */
  async healthCheckRedis(): Promise<object> {
    try {
      if (!this.redisClient) {
        throw new Error('Redis client not initialized');
      }

      await this.redisClient.ping();
      return {
        status: 'ok',
        redis: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      throw new HttpException(
        {
          status: 'error',
          redis: 'disconnected',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Comprehensive readiness check
   */
  async readinessCheck(): Promise<object> {
    const checks = {
      database: false,
      redis: false,
      queue: false,
    };

    let isReady = true;

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      this.logger.error('Database readiness check failed', error);
      isReady = false;
    }

    // Check Redis
    try {
      if (this.redisClient) {
        await this.redisClient.ping();
        checks.redis = true;
      }
    } catch (error) {
      this.logger.error('Redis readiness check failed', error);
      isReady = false;
    }

    // Check queue
    try {
      const jobCounts = await this.evidenceQueue.getJobCounts();
      checks.queue = true;
    } catch (error) {
      this.logger.error('Queue readiness check failed', error);
      isReady = false;
    }

    if (!isReady) {
      throw new HttpException(
        {
          status: 'not_ready',
          checks,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Example method to demonstrate queue usage
   * This will be used by integration services in Week 3-4
   */
  async queueEvidenceCollection(
    customerId: string,
    integrationId: string,
    controlId: string,
    type: EvidenceCollectionJobType,
  ) {
    const job = await this.evidenceQueue.add(type, {
      customerId,
      integrationId,
      controlId,
      type,
    });

    this.logger.log(
      `Queued evidence collection job ${job.id} for customer ${customerId}`,
    );
    return { jobId: job.id };
  }
}

import { Injectable, LoggerService as NestLoggerService, Optional } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  userId?: string;
  customerId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

@Injectable()
export class CustomLoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(@Optional() context?: string) {
    this.context = context;
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'kushim-backend',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: this.createTransports(),
    });
  }

  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport for development
    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const ctx = context || this.context || 'Application';
              const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
              return `${timestamp} [${ctx}] ${level}: ${message}${metaStr}`;
            }),
          ),
        }),
      );
    }

    // File transport with daily rotation
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info',
      }),
    );

    // Error log file
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
      }),
    );

    // Logtail/Papertrail integration (if configured)
    if (process.env.LOGTAIL_TOKEN) {
      // Note: Install @logtail/winston if needed
      // const { Logtail } = require('@logtail/node');
      // const { LogtailTransport } = require('@logtail/winston');
      // const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
      // transports.push(new LogtailTransport(logtail));
    }

    return transports;
  }

  log(message: string, context?: LogContext) {
    this.logger.info(message, { context: this.context, ...context });
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { trace, context: this.context, ...context });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, { context: this.context, ...context });
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, { context: this.context, ...context });
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, { context: this.context, ...context });
  }

  // Request logging
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext,
  ) {
    this.logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      context: this.context,
      ...context,
    });
  }

  // Security event logging
  logSecurityEvent(event: string, context?: LogContext) {
    this.logger.warn(`[SECURITY] ${event}`, {
      context: this.context,
      ...context,
    });
  }

  // Compliance event logging
  logComplianceEvent(event: string, context?: LogContext) {
    this.logger.info(`[COMPLIANCE] ${event}`, {
      context: this.context,
      ...context,
    });
  }

  // Integration event logging
  logIntegrationEvent(integration: string, event: string, context?: LogContext) {
    this.logger.info(`[INTEGRATION:${integration.toUpperCase()}] ${event}`, {
      context: this.context,
      ...context,
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: LogContext) {
    const level = duration > 1000 ? 'warn' : 'info';
    this.logger.log(level, `[PERFORMANCE] ${operation} took ${duration}ms`, {
      context: this.context,
      duration,
      ...context,
    });
  }

  // Database query logging
  logSlowQuery(query: string, duration: number, context?: LogContext) {
    this.logger.warn(`[SLOW_QUERY] Query took ${duration}ms`, {
      query,
      duration,
      context: this.context,
      ...context,
    });
  }
}

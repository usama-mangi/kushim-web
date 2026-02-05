import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';
import { captureSentryException, setSentryContext } from '../monitoring/sentry.config';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    // Log the error
    this.logger.error(
      `Exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        statusCode: status,
        url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        userId: (request as any).user?.id,
        customerId: (request as any).user?.customerId,
      },
    );

    // Send to Sentry for server errors (500+)
    if (status >= 500 && exception instanceof Error) {
      setSentryContext('request', {
        url: request.url,
        method: request.method,
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        body: this.sanitizeBody(request.body),
      });

      captureSentryException(exception, {
        statusCode: status,
        userId: (request as any).user?.id,
        customerId: (request as any).user?.customerId,
      });
    }

    // Send response
    response.status(status).json(errorResponse);
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'accessToken'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

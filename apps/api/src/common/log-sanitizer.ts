import { Logger } from '@nestjs/common';

/**
 * Helper to sanitize sensitive data from logs
 * Prevents accidental logging of passwords, tokens, API keys, etc.
 */
export class LogSanitizer {
  private static readonly SENSITIVE_KEYS = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'access_token',
    'refresh_token',
    'apiKey',
    'api_key',
    'secret',
    'clientSecret',
    'client_secret',
    'apiToken',
    'mfaSecret',
    'encryptionKey',
    'privateKey',
    'credentials',
    'authorization',
  ];

  /**
   * Sanitize an object by redacting sensitive fields
   * @param data The object to sanitize
   * @param additionalKeys Additional keys to redact
   * @returns Sanitized copy of the object
   */
  static sanitize(data: any, additionalKeys: string[] = []): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const keysToRedact = [...this.SENSITIVE_KEYS, ...additionalKeys];
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item, additionalKeys));
    }

    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = keysToRedact.some(sensitiveKey => 
        lowerKey.includes(sensitiveKey.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitize(value, additionalKeys);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize and log an object at the specified level
   * @param logger NestJS Logger instance
   * @param level Log level ('log', 'debug', 'warn', 'error')
   * @param message Log message
   * @param data Data to sanitize and log
   */
  static logSafe(
    logger: Logger,
    level: 'log' | 'debug' | 'warn' | 'error',
    message: string,
    data?: any,
  ): void {
    const sanitized = data ? this.sanitize(data) : undefined;
    
    if (sanitized) {
      logger[level](message, sanitized);
    } else {
      logger[level](message);
    }
  }
}

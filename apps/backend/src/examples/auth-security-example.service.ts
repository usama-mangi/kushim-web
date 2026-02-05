import { Injectable, UnauthorizedException, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  AuditService,
  AuditAction,
  AuditSeverity,
} from '../audit/audit.service';

/**
 * Example service showing how to integrate AuditService
 *
 * This demonstrates logging security-related events throughout your application.
 */
@Injectable()
export class AuthExampleService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Example: Login with audit logging
   */
  async login(email: string, password: string, @Req() req: Request) {
    const user = await this.validateUser(email, password);

    if (!user) {
      await this.auditService.logLogin(
        'unknown',
        'unknown',
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown',
        false,
      );

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.logLogin(
      user.id,
      user.customerId,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
      true,
    );

    const isSuspicious = await this.auditService.detectSuspiciousActivity(
      user.customerId,
      user.id,
    );

    if (isSuspicious) {
      await this.auditService.logSecurityEvent(
        'Suspicious login pattern detected',
        {
          userId: user.id,
          customerId: user.customerId,
          ipAddress: req.ip || 'unknown',
        },
        {
          recentFailedAttempts: 5,
          action: 'login_flagged',
        },
      );
    }

    return { accessToken: 'jwt-token-here', user };
  }

  private async validateUser(email: string, password: string): Promise<any> {
    return { id: 'user-id', customerId: 'customer-id', email };
  }
}

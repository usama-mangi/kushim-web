import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';

export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  INTEGRATION_CONNECTED = 'INTEGRATION_CONNECTED',
  INTEGRATION_DISCONNECTED = 'INTEGRATION_DISCONNECTED',
  INTEGRATION_UPDATED = 'INTEGRATION_UPDATED',
  COMPLIANCE_CHECK_RUN = 'COMPLIANCE_CHECK_RUN',
  EVIDENCE_COLLECTED = 'EVIDENCE_COLLECTED',
  EVIDENCE_DELETED = 'EVIDENCE_DELETED',
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED = 'CUSTOMER_DELETED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  DATA_EXPORT = 'DATA_EXPORT',
  SECURITY_ALERT = 'SECURITY_ALERT',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface AuditContext {
  userId?: string;
  customerId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AuditMetadata {
  [key: string]: any;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    action: AuditAction,
    context: AuditContext,
    metadata?: AuditMetadata,
    severity: AuditSeverity = AuditSeverity.INFO,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          severity,
          userId: context.userId,
          customerId: context.customerId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
          metadata: metadata || {},
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async logLogin(
    userId: string,
    customerId: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
  ): Promise<void> {
    await this.log(
      AuditAction.USER_LOGIN,
      { userId, customerId, ipAddress, userAgent },
      { success },
      success ? AuditSeverity.INFO : AuditSeverity.WARNING,
    );
  }

  async logLogout(
    userId: string,
    customerId: string,
    ipAddress: string,
  ): Promise<void> {
    await this.log(AuditAction.USER_LOGOUT, {
      userId,
      customerId,
      ipAddress,
    });
  }

  async logDataChange(
    action: AuditAction,
    context: AuditContext,
    entityType: string,
    entityId: string,
    changes?: any,
  ): Promise<void> {
    await this.log(action, context, {
      entityType,
      entityId,
      changes,
    });
  }

  async logSecurityEvent(
    event: string,
    context: AuditContext,
    details?: any,
  ): Promise<void> {
    await this.log(
      AuditAction.SECURITY_ALERT,
      context,
      { event, details },
      AuditSeverity.WARNING,
    );
  }

  async getAuditLogs(
    customerId: string,
    filters?: {
      userId?: string;
      action?: AuditAction;
      severity?: AuditSeverity;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { customerId };

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async getRecentFailedLogins(customerId: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.prisma.auditLog.findMany({
      where: {
        customerId,
        action: AuditAction.USER_LOGIN,
        createdAt: { gte: since },
        metadata: {
          path: ['success'],
          equals: false,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async detectSuspiciousActivity(
    customerId: string,
    userId: string,
  ): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentFailedLogins = await this.prisma.auditLog.count({
      where: {
        customerId,
        userId,
        action: AuditAction.USER_LOGIN,
        createdAt: { gte: oneHourAgo },
        metadata: {
          path: ['success'],
          equals: false,
        },
      },
    });

    // Flag if more than 5 failed logins in the last hour
    return recentFailedLogins > 5;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    resource: string;
    payload?: any;
    ipAddress?: string;
  }) {
    try {
      // If userId is provided, verify it exists before logging
      if (data.userId) {
        const userExists = await this.prisma.user.findUnique({
          where: { id: data.userId },
          select: { id: true },
        });

        if (!userExists) {
          this.logger.warn(
            `Skipping audit log for non-existent user ${data.userId}: ${data.action} on ${data.resource}`,
          );
          return null;
        }
      }

      return this.prisma.activityLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          payload: data.payload,
          ipAddress: data.ipAddress,
        },
      });
    } catch (error) {
      this.logger.error('Audit Logging Failed', error);
      // Don't throw - audit logging should never break the main flow
      return null;
    }
  }

  async findAll() {
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      take: 100,
    });
  }
}

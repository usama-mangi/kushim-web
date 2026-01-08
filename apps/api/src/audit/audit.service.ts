import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    resource: string;
    payload?: any;
    ipAddress?: string;
  }) {
    return this.prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        payload: data.payload,
        ipAddress: data.ipAddress,
      },
    });
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
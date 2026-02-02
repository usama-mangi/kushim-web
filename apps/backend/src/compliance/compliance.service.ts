import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CheckStatus } from '@prisma/client';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllControls(customerId: string) {
    const controls = await this.prisma.control.findMany({
      include: {
        complianceChecks: {
          where: { customerId },
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });

    return controls.map(control => {
      const lastCheck = control.complianceChecks[0];
      return {
        id: control.id,
        name: control.title,
        description: control.description,
        category: control.category,
        status: lastCheck ? lastCheck.status : 'PENDING',
        lastCheck: lastCheck ? lastCheck.checkedAt : null,
        nextCheck: lastCheck ? lastCheck.nextCheckAt : null,
        frequency: control.frequency,
        integration: control.integrationType || 'MANUAL',
      };
    });
  }

  async getControlDetails(customerId: string, controlId: string) {
    const control = await this.prisma.control.findUnique({
      where: { id: controlId },
      include: {
        complianceChecks: {
          where: { customerId },
          orderBy: { checkedAt: 'desc' },
        },
        evidence: {
          where: { customerId },
          orderBy: { collectedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!control) {
      throw new NotFoundException(`Control ${controlId} not found`);
    }

    return control;
  }

  async getRecentAlerts(customerId: string) {
    const checks = await this.prisma.complianceCheck.findMany({
      where: { 
        customerId, 
        status: { in: [CheckStatus.FAIL, CheckStatus.WARNING] } 
      },
      include: { control: true },
      orderBy: { checkedAt: 'desc' },
      take: 10,
    });

    return checks.map(check => ({
      id: check.id,
      severity: check.status === CheckStatus.FAIL ? 'critical' : 'warning',
      message: check.errorMessage || `Control ${check.control.controlId} failed validation`,
      timestamp: check.checkedAt,
      controlId: check.controlId,
      controlName: check.control.title,
      acknowledged: false, // In a real app, this would be in the DB
    }));
  }
}

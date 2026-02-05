import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CheckStatus } from '@prisma/client';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getAllControls(
    customerId: string,
    frameworkId?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;
    const cacheKey = `controls:${customerId}:framework:${frameworkId || 'all'}:page:${page}:limit:${limit}`;

    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    
    // Filter by framework if provided
    if (frameworkId) {
      where.frameworkId = frameworkId;
    } else {
      // Get customer's active frameworks
      const customerFrameworks = await this.prisma.customerFramework.findMany({
        where: { customerId },
        select: { frameworkId: true },
      });
      
      if (customerFrameworks.length > 0) {
        where.frameworkId = { in: customerFrameworks.map(cf => cf.frameworkId) };
      }
    }

    const [controls, total] = await Promise.all([
      this.prisma.control.findMany({
        where,
        skip,
        take: limit,
        include: {
          framework: true,
          section: true,
          complianceChecks: {
            where: { customerId },
            orderBy: { checkedAt: 'desc' },
            take: 1,
            select: {
              status: true,
              checkedAt: true,
              nextCheckAt: true,
            },
          },
        },
      }),
      this.prisma.control.count({ where }),
    ]);

    const result = {
      data: controls.map((control) => {
        const lastCheck = control.complianceChecks[0];
        return {
          id: control.id,
          framework: control.framework.code,
          frameworkName: control.framework.name,
          section: control.section?.code,
          sectionName: control.section?.title,
          name: control.title,
          description: control.description,
          category: control.category,
          status: lastCheck ? lastCheck.status : 'PENDING',
          lastCheck: lastCheck ? lastCheck.checkedAt : null,
          nextCheck: lastCheck ? lastCheck.nextCheckAt : null,
          frequency: control.frequency,
          integration: control.integrationType || 'MANUAL',
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  async getControlDetails(customerId: string, controlId: string) {
    const cacheKey = `control:${customerId}:${controlId}`;

    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const control = await this.prisma.control.findUnique({
      where: { id: controlId },
      include: {
        complianceChecks: {
          where: { customerId },
          orderBy: { checkedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            checkedAt: true,
            nextCheckAt: true,
            errorMessage: true,
          },
        },
        evidence: {
          where: { customerId },
          orderBy: { collectedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            collectedAt: true,
            hash: true,
            integrationId: true,
          },
        },
      },
    });

    if (!control) {
      throw new NotFoundException(`Control ${controlId} not found`);
    }

    // Cache for 3 minutes
    await this.cacheService.set(cacheKey, control, 180);
    return control;
  }

  async getRecentAlerts(
    customerId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const cacheKey = `alerts:${customerId}:page:${page}:limit:${limit}`;

    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [checks, total] = await Promise.all([
      this.prisma.complianceCheck.findMany({
        where: {
          customerId,
          status: { in: [CheckStatus.FAIL, CheckStatus.WARNING] },
        },
        include: {
          control: {
            select: {
              id: true,
              controlId: true,
              title: true,
            },
          },
        },
        orderBy: { checkedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.complianceCheck.count({
        where: {
          customerId,
          status: { in: [CheckStatus.FAIL, CheckStatus.WARNING] },
        },
      }),
    ]);

    const result = {
      data: checks.map((check) => ({
        id: check.id,
        severity: check.status === CheckStatus.FAIL ? 'critical' : 'warning',
        message:
          check.errorMessage ||
          `Control ${check.control.controlId} failed validation`,
        timestamp: check.checkedAt,
        controlId: check.controlId,
        controlName: check.control.title,
        acknowledged: false,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 1 minute
    await this.cacheService.set(cacheKey, result, 60);
    return result;
  }

  async getTrends(customerId: string, days: number = 7) {
    const cacheKey = `trends:${customerId}:days:${days}`;

    // Try cache first (15 minutes TTL for compliance scores)
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const checks = await this.prisma.complianceCheck.findMany({
      where: {
        customerId,
        checkedAt: { gte: startDate },
      },
      orderBy: { checkedAt: 'asc' },
      select: {
        checkedAt: true,
        controlId: true,
        status: true,
      },
    });

    const dailyData: Record<string, Record<string, CheckStatus>> = {};

    checks.forEach((check) => {
      const day = check.checkedAt.toISOString().split('T')[0];
      if (!dailyData[day]) dailyData[day] = {};
      dailyData[day][check.controlId] = check.status;
    });

    const sortedDays = Object.keys(dailyData).sort();

    if (sortedDays.length === 0) {
      return [];
    }

    const result = sortedDays.map((day) => {
      const controlsInDay = Object.values(dailyData[day]);
      const passing = controlsInDay.filter(
        (s) => s === CheckStatus.PASS,
      ).length;
      const score =
        controlsInDay.length > 0 ? (passing / controlsInDay.length) * 100 : 0;

      return {
        name: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        score: Math.round(score),
      };
    });

    // Cache for 15 minutes (compliance scores)
    await this.cacheService.set(cacheKey, result, 900);
    return result;
  }

  async invalidateCache(customerId: string) {
    await this.cacheService.invalidatePattern(`*:${customerId}:*`);
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CheckStatus, CustomerFrameworkStatus } from '@prisma/client';

@Injectable()
export class FrameworksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all available frameworks
   */
  async listFrameworks() {
    const frameworks = await this.prisma.frameworkModel.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { controls: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return frameworks.map((fw) => ({
      id: fw.id,
      code: fw.code,
      name: fw.name,
      description: fw.description,
      version: fw.version,
      isActive: fw.isActive,
      createdAt: fw.createdAt,
      updatedAt: fw.updatedAt,
      controlCount: fw._count.controls,
    }));
  }

  /**
   * Get framework details by code
   */
  async getFramework(code: string) {
    const framework = await this.prisma.frameworkModel.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { controls: true },
        },
      },
    });

    if (!framework) {
      throw new NotFoundException(`Framework ${code} not found`);
    }

    return {
      id: framework.id,
      code: framework.code,
      name: framework.name,
      description: framework.description,
      version: framework.version,
      isActive: framework.isActive,
      createdAt: framework.createdAt,
      updatedAt: framework.updatedAt,
      controlCount: framework._count.controls,
      sections: framework.sections,
    };
  }

  /**
   * Get controls for a specific framework
   */
  async getControls(frameworkCode: string, sectionCode?: string) {
    const framework = await this.prisma.frameworkModel.findUnique({
      where: { code: frameworkCode.toUpperCase() },
    });

    if (!framework) {
      throw new NotFoundException(`Framework ${frameworkCode} not found`);
    }

    const where: any = { frameworkId: framework.id };

    if (sectionCode) {
      const section = await this.prisma.frameworkSection.findFirst({
        where: {
          frameworkId: framework.id,
          code: sectionCode,
        },
      });

      if (!section) {
        throw new NotFoundException(`Section ${sectionCode} not found in framework ${frameworkCode}`);
      }

      where.sectionId = section.id;
    }

    const controls = await this.prisma.control.findMany({
      where,
      include: {
        section: true,
      },
      orderBy: { controlId: 'asc' },
    });

    return controls;
  }

  /**
   * Get cross-framework mappings for a control
   */
  async getControlMappings(controlId: string) {
    const control = await this.prisma.control.findUnique({
      where: { id: controlId },
    });

    if (!control) {
      throw new NotFoundException(`Control ${controlId} not found`);
    }

    const mappings = await this.prisma.frameworkMapping.findMany({
      where: {
        OR: [
          { sourceControlId: controlId },
          { targetControlId: controlId },
        ],
      },
      include: {
        sourceControl: {
          include: {
            framework: true,
            section: true,
          },
        },
        targetControl: {
          include: {
            framework: true,
            section: true,
          },
        },
      },
    });

    return mappings.map((mapping) => ({
      id: mapping.id,
      sourceControl: mapping.sourceControl,
      targetControl: mapping.targetControl,
      mappingType: mapping.mappingType,
      notes: mapping.notes,
    }));
  }

  /**
   * Activate framework for a customer
   */
  async activateFramework(customerId: string, frameworkCode: string, targetDate?: Date) {
    const framework = await this.prisma.frameworkModel.findUnique({
      where: { code: frameworkCode.toUpperCase() },
    });

    if (!framework) {
      throw new NotFoundException(`Framework ${frameworkCode} not found`);
    }

    if (!framework.isActive) {
      throw new BadRequestException(`Framework ${frameworkCode} is not active`);
    }

    // Check if already activated
    const existing = await this.prisma.customerFramework.findUnique({
      where: {
        customerId_frameworkId: {
          customerId,
          frameworkId: framework.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Framework ${frameworkCode} is already activated for this customer`);
    }

    const customerFramework = await this.prisma.customerFramework.create({
      data: {
        customerId,
        frameworkId: framework.id,
        targetDate,
        status: CustomerFrameworkStatus.IN_PROGRESS,
      },
      include: {
        framework: true,
      },
    });

    return {
      id: customerFramework.id,
      customerId: customerFramework.customerId,
      frameworkId: customerFramework.frameworkId,
      framework: customerFramework.framework,
      targetDate: customerFramework.targetDate,
      status: customerFramework.status,
      createdAt: customerFramework.createdAt,
      updatedAt: customerFramework.updatedAt,
    };
  }

  /**
   * Deactivate framework for a customer
   */
  async deactivateFramework(customerId: string, frameworkCode: string) {
    const framework = await this.prisma.frameworkModel.findUnique({
      where: { code: frameworkCode.toUpperCase() },
    });

    if (!framework) {
      throw new NotFoundException(`Framework ${frameworkCode} not found`);
    }

    const customerFramework = await this.prisma.customerFramework.findUnique({
      where: {
        customerId_frameworkId: {
          customerId,
          frameworkId: framework.id,
        },
      },
    });

    if (!customerFramework) {
      throw new NotFoundException(`Framework ${frameworkCode} is not activated for this customer`);
    }

    await this.prisma.customerFramework.delete({
      where: {
        id: customerFramework.id,
      },
    });

    return { message: `Framework ${frameworkCode} deactivated successfully` };
  }

  /**
   * Get active frameworks for a customer
   */
  async getCustomerFrameworks(customerId: string) {
    const customerFrameworks = await this.prisma.customerFramework.findMany({
      where: { customerId },
      include: {
        framework: {
          include: {
            _count: {
              select: { controls: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate compliance scores for each framework
    const result = await Promise.all(
      customerFrameworks.map(async (cf) => {
        const complianceScore = await this.calculateFrameworkCompliance(
          customerId,
          cf.frameworkId,
        );

        return {
          id: cf.id,
          customerId: cf.customerId,
          frameworkId: cf.frameworkId,
          framework: {
            ...cf.framework,
            controlCount: cf.framework._count.controls,
          },
          targetDate: cf.targetDate,
          status: cf.status,
          createdAt: cf.createdAt,
          updatedAt: cf.updatedAt,
          complianceScore,
        };
      }),
    );

    return result;
  }

  /**
   * Calculate compliance score for a framework
   */
  private async calculateFrameworkCompliance(customerId: string, frameworkId: string): Promise<number> {
    // Get all controls for this framework
    const controls = await this.prisma.control.findMany({
      where: { frameworkId },
      select: { id: true },
    });

    if (controls.length === 0) {
      return 0;
    }

    // Get latest compliance check for each control
    const complianceChecks = await this.prisma.complianceCheck.findMany({
      where: {
        customerId,
        controlId: { in: controls.map((c) => c.id) },
      },
      orderBy: { checkedAt: 'desc' },
      distinct: ['controlId'],
    });

    if (complianceChecks.length === 0) {
      return 0;
    }

    const passingChecks = complianceChecks.filter(
      (check) => check.status === CheckStatus.PASS,
    ).length;

    return Math.round((passingChecks / controls.length) * 100);
  }

  /**
   * Get unified compliance dashboard across all active frameworks
   */
  async getUnifiedDashboard(customerId: string) {
    const activeFrameworks = await this.getCustomerFrameworks(customerId);

    // Get overlapping controls (controls that satisfy multiple frameworks)
    const frameworkIds = activeFrameworks.map((f) => f.frameworkId);
    
    const overlappingControls = await this.prisma.frameworkMapping.findMany({
      where: {
        AND: [
          {
            sourceControl: {
              frameworkId: { in: frameworkIds },
            },
          },
          {
            targetControl: {
              frameworkId: { in: frameworkIds },
            },
          },
        ],
        mappingType: 'EQUIVALENT',
      },
      include: {
        sourceControl: {
          include: {
            framework: true,
            complianceChecks: {
              where: { customerId },
              orderBy: { checkedAt: 'desc' },
              take: 1,
            },
          },
        },
        targetControl: {
          include: {
            framework: true,
          },
        },
      },
    });

    const summary = {
      totalFrameworks: activeFrameworks.length,
      frameworks: activeFrameworks,
      overlappingControls: overlappingControls.length,
      overallCompliance: activeFrameworks.length > 0
        ? Math.round(
            activeFrameworks.reduce((sum, f) => sum + (f.complianceScore || 0), 0) /
              activeFrameworks.length,
          )
        : 0,
    };

    return summary;
  }
}

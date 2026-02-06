import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface AIInsight {
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionRequired: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService) {}

  async getInsights(customerId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    const unmappedEvidence = await this.checkUnmappedEvidence(customerId);
    if (unmappedEvidence) insights.push(unmappedEvidence);

    const controlGaps = await this.checkControlGaps(customerId);
    if (controlGaps) insights.push(controlGaps);

    const pendingPolicies = await this.checkPendingPolicies(customerId);
    if (pendingPolicies) insights.push(pendingPolicies);

    const costAlert = await this.checkAICostSpike(customerId);
    if (costAlert) insights.push(costAlert);

    return insights;
  }

  private async checkUnmappedEvidence(customerId: string): Promise<AIInsight | null> {
    const unmappedCount = await this.prisma.evidence.count({
      where: {
        customerId,
        evidenceMappings: { none: {} },
      },
    });

    if (unmappedCount > 0) {
      return {
        type: 'unmapped_evidence',
        severity: unmappedCount > 20 ? 'high' : 'medium',
        title: `${unmappedCount} evidence items need mapping`,
        description: 'AI can automatically map these to relevant controls',
        actionRequired: 'Map with AI',
        metadata: { count: unmappedCount },
      };
    }
    return null;
  }

  private async checkControlGaps(customerId: string): Promise<AIInsight | null> {
    const failingControls = await this.prisma.complianceCheck.count({
      where: { customerId, status: 'FAIL' },
    });

    if (failingControls > 0) {
      return {
        type: 'control_gaps',
        severity: failingControls > 10 ? 'high' : 'medium',
        title: `${failingControls} controls are failing`,
        description: 'These controls need immediate attention',
        actionRequired: 'View Failed Controls',
        metadata: { count: failingControls },
      };
    }
    return null;
  }

  private async checkPendingPolicies(customerId: string): Promise<AIInsight | null> {
    const pendingPolicies = await this.prisma.policy.count({
      where: { customerId, status: 'DRAFT' },
    });

    if (pendingPolicies > 0) {
      return {
        type: 'pending_policies',
        severity: 'low',
        title: `${pendingPolicies} policies pending approval`,
        description: 'Review and approve these policies',
        actionRequired: 'Review Policies',
        metadata: { count: pendingPolicies },
      };
    }
    return null;
  }

  private async checkAICostSpike(customerId: string): Promise<AIInsight | null> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsage = await this.prisma.aIUsageLog.aggregate({
      where: { customerId, createdAt: { gte: sevenDaysAgo } },
      _sum: { estimatedCostUsd: true },
    });

    const totalCost = Number(recentUsage._sum.estimatedCostUsd || 0);

    if (totalCost > 50) {
      return {
        type: 'ai_cost_spike',
        severity: totalCost > 100 ? 'high' : 'medium',
        title: `AI usage cost: $${totalCost.toFixed(2)} this week`,
        description: 'Consider reviewing AI feature usage patterns',
        actionRequired: 'View AI Analytics',
        metadata: { cost: totalCost },
      };
    }
    return null;
  }
}

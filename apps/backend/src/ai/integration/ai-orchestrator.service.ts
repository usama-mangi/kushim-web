import { Injectable, Logger } from '@nestjs/common';
import { EvidenceMappingService } from '../evidence-mapping/evidence-mapping.service';
import { PolicyDraftingService } from '../policy-drafting/policy-drafting.service';
import { CopilotService } from '../copilot/copilot.service';
import { UsageTrackerService } from '../usage-tracker.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface BatchMappingResult {
  successful: number;
  failed: number;
  mappings: any[];
  errors: { evidenceId: string; error: string }[];
  estimatedCostUsd: number;
  totalTokens: number;
  duration: number;
}

export interface AIDashboardData {
  usage: {
    estimatedCostUsd: number;
    totalTokens: number;
    requestCount: number;
    byFeature: Record<string, { cost: number; tokens: number; requests: number }>;
  };
  performance: {
    avgResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
  insights: {
    topControls: Array<{ controlId: string; count: number }>;
    popularPolicyTypes: Array<{ type: string; count: number }>;
    commonQuestions: Array<{ question: string; frequency: number }>;
  };
}

/**
 * Orchestrates all AI features and provides unified analytics
 */
@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly evidenceMappingService: EvidenceMappingService,
    private readonly policyDraftingService: PolicyDraftingService,
    private readonly copilotService: CopilotService,
    private readonly usageTracker: UsageTrackerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Batch map multiple evidence items to controls
   */
  async batchMapEvidence(params: {
    evidenceIds: string[];
    customerId: string;
    userId: string;
    concurrency?: number;
  }): Promise<BatchMappingResult> {
    const { evidenceIds, customerId, userId, concurrency = 5 } = params;
    const startTime = Date.now();

    this.logger.log(`Batch mapping ${evidenceIds.length} evidence items for customer ${customerId}`);

    const results: any[] = [];
    const errors: { evidenceId: string; error: string }[] = [];
    let estimatedCostUsd = 0;
    let totalTokens = 0;

    // Process in batches to avoid overwhelming OpenAI API
    for (let i = 0; i < evidenceIds.length; i += concurrency) {
      const batch = evidenceIds.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(evidenceId =>
          this.evidenceMappingService.mapEvidenceToControl({
            evidenceId,
            customerId,
            userId,
          })
        )
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          estimatedCostUsd += result.value.cost || 0;
          totalTokens += result.value.tokens || 0;
        } else {
          errors.push({
            evidenceId: batch[index],
            error: result.reason?.message || 'Unknown error',
          });
        }
      });
    }

    const duration = Date.now() - startTime;

    this.logger.log(
      `Batch mapping completed: ${results.length} successful, ${errors.length} failed, ` +
      `cost: $${estimatedCostUsd.toFixed(4)}, duration: ${duration}ms`
    );

    return {
      successful: results.length,
      failed: errors.length,
      mappings: results,
      errors,
      estimatedCostUsd,
      totalTokens,
      duration,
    };
  }

  /**
   * Batch generate multiple policies
   */
  async batchGeneratePolicies(params: {
    policyRequests: Array<{
      policyType: string;
      controlIds: string[];
      title?: string;
    }>;
    customerId: string;
    userId: string;
  }): Promise<BatchMappingResult> {
    const { policyRequests, customerId, userId } = params;
    const startTime = Date.now();

    this.logger.log(`Batch generating ${policyRequests.length} policies for customer ${customerId}`);

    const results: any[] = [];
    const errors: { evidenceId: string; error: string }[] = [];
    let estimatedCostUsd = 0;
    let totalTokens = 0;

    // Process policies sequentially to avoid rate limits (policies are expensive)
    for (const [index, request] of policyRequests.entries()) {
      try {
        const policy = await this.policyDraftingService.generatePolicy({
          ...request,
          customerId,
          userId,
        });

        results.push(policy);
        estimatedCostUsd += policy.cost || 0;
        totalTokens += policy.tokens || 0;
      } catch (error) {
        errors.push({
          evidenceId: `policy-${index}`,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;

    return {
      successful: results.length,
      failed: errors.length,
      mappings: results,
      errors,
      estimatedCostUsd,
      totalTokens,
      duration,
    };
  }

  /**
   * Get unified AI dashboard data
   */
  async getDashboardData(customerId: string): Promise<AIDashboardData> {
    const [usage, performance, insights] = await Promise.all([
      this.getUsageMetrics(customerId),
      this.getPerformanceMetrics(customerId),
      this.getInsights(customerId),
    ]);

    return {
      usage,
      performance,
      insights,
    };
  }

  /**
   * Get usage metrics across all AI features
   */
  private async getUsageMetrics(customerId: string) {
    const usageRecords = await this.prisma.aIUsageLog.findMany({
      where: {
        customerId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const estimatedCostUsd = usageRecords.reduce((sum, r) => sum + Number(r.estimatedCostUsd), 0);
    const totalTokens = usageRecords.reduce((sum, r) => sum + r.totalTokens, 0);
    const requestCount = usageRecords.length;

    // Group by operation (feature)
    const byFeature = usageRecords.reduce((acc, record) => {
      const operation = record.operation;
      if (!acc[operation]) {
        acc[operation] = { cost: 0, tokens: 0, requests: 0 };
      }
      acc[operation].cost += Number(record.estimatedCostUsd);
      acc[operation].tokens += record.totalTokens;
      acc[operation].requests += 1;
      return acc;
    }, {} as Record<string, { cost: number; tokens: number; requests: number }>);

    return {
      estimatedCostUsd,
      totalTokens,
      requestCount,
      byFeature,
    };
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(customerId: string) {
    const recentUsage = await this.prisma.aIUsageLog.findMany({
      where: {
        customerId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const responseTimes = recentUsage
      .filter(r => r.metadata && (r.metadata as any).responseTime)
      .map(r => (r.metadata as any).responseTime as number);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const cacheHits = recentUsage.filter(r => r.metadata && (r.metadata as any).cached).length;
    const cacheHitRate = recentUsage.length > 0
      ? cacheHits / recentUsage.length
      : 0;

    const errors = recentUsage.filter(r => r.metadata && (r.metadata as any).error).length;
    const errorRate = recentUsage.length > 0
      ? errors / recentUsage.length
      : 0;

    return {
      avgResponseTime,
      cacheHitRate,
      errorRate,
    };
  }

  /**
   * Get AI insights
   */
  private async getInsights(customerId: string) {
    // Top mapped controls - simplified to use evidenceMapping
    const topControls = await this.prisma.evidenceMapping.groupBy({
      by: ['controlId'],
      where: {
        evidence: { customerId },
      },
      _count: { controlId: true },
      orderBy: { _count: { controlId: 'desc' } },
      take: 10,
    });

    // Popular policy types - simplified for now
    const popularPolicyTypes: any[] = []; // TODO: Add when schema supports groupBy policyType

    // Common Copilot questions (from conversation history)
    const conversations = await this.prisma.copilotConversation.findMany({
      where: { customerId },
      include: {
        messages: {
          where: { role: 'USER' },
          select: { content: true },
        },
      },
      take: 100,
    });

    const questions = conversations.flatMap(c => c.messages.map(m => m.content));
    const questionFrequency = questions.reduce((acc, q) => {
      acc[q] = (acc[q] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonQuestions = Object.entries(questionFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, frequency]) => ({ question, frequency }));

    return {
      topControls: topControls.map(c => ({
        controlId: c.controlId,
        count: c._count.controlId,
      })),
      popularPolicyTypes: popularPolicyTypes,
      commonQuestions,
    };
  }

  /**
   * Allocate costs to specific features/projects
   */
  async allocateCosts(customerId: string, allocation: {
    evidenceMapping: number; // percentage
    policyDrafting: number;
    copilot: number;
  }): Promise<void> {
    if (allocation.evidenceMapping + allocation.policyDrafting + allocation.copilot !== 100) {
      throw new Error('Cost allocation percentages must sum to 100');
    }

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        metadata: {
          costAllocation: allocation,
        },
      },
    });

    this.logger.log(`Updated cost allocation for customer ${customerId}`);
  }

  /**
   * Predict monthly costs based on usage trends
   */
  async predictMonthlyCosts(customerId: string): Promise<{
    estimatedMonthlyCost: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    breakdown: Record<string, number>;
  }> {
    const last7Days = await this.prisma.aIUsageLog.aggregate({
      where: {
        customerId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { cost: true },
    });

    const previous7Days = await this.prisma.aIUsageLog.aggregate({
      where: {
        customerId,
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { cost: true },
    });

    const currentWeeklyCost = last7Days_sum.estimatedCostUsd || 0;
    const previousWeeklyCost = previous7Days_sum.estimatedCostUsd || 0;

    const estimatedMonthlyCost = (currentWeeklyCost / 7) * 30;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (currentWeeklyCost > previousWeeklyCost * 1.1) {
      trend = 'increasing';
    } else if (currentWeeklyCost < previousWeeklyCost * 0.9) {
      trend = 'decreasing';
    }

    // Get breakdown by feature
    const byFeature = await this.prisma.aIUsageLog.groupBy({
      by: ['feature'],
      where: {
        customerId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { estimatedCostUsd: true },
    });

    const previous7Days = await this.prisma.aIUsageLog.aggregate({
      where: {
        customerId,
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { estimatedCostUsd: true },
    });

    const currentWeeklyCost = Number(last7Days._sum.estimatedCostUsd) || 0;
    const previousWeeklyCost = Number(previous7Days._sum.estimatedCostUsd) || 0;

    const estimatedMonthlyCost = (currentWeeklyCost / 7) * 30;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (currentWeeklyCost > previousWeeklyCost * 1.1) {
      trend = 'increasing';
    } else if (currentWeeklyCost < previousWeeklyCost * 0.9) {
      trend = 'decreasing';
    }

    // Get breakdown by operation
    const byFeature = await this.prisma.aIUsageLog.groupBy({
      by: ['operation'],
      where: {
        customerId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { estimatedCostUsd: true },
    });

    const breakdown = byFeature.reduce((acc, f) => {
      acc[f.operation] = (Number(f._sum.estimatedCostUsd) || 0 / 7) * 30; // Monthly projection
      return acc;
    }, {} as Record<string, number>);

    return {
      estimatedMonthlyCost,
      trend,
      breakdown,
    };
  }
}

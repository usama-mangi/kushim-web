import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface UsageStatistics {
  period: string;
  totalRequests: number;
  estimatedCostUsd: number;
  totalTokens: number;
  byFeature: Record<string, FeatureStats>;
  byModel: Record<string, ModelStats>;
  byDay: DayStats[];
}

export interface FeatureStats {
  requests: number;
  cost: number;
  tokens: number;
  avgCostPerRequest: number;
  avgTokensPerRequest: number;
}

export interface ModelStats {
  requests: number;
  cost: number;
  tokens: number;
}

export interface DayStats {
  date: string;
  requests: number;
  cost: number;
  tokens: number;
}

export interface CostBreakdown {
  total: number;
  byFeature: Record<string, number>;
  byModel: Record<string, number>;
  projectedMonthly: number;
  vsLastMonth: {
    absolute: number;
    percentage: number;
  };
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number; // requests per minute
}

export interface ROIMetrics {
  timeSavedHours: number;
  costPerHour: number;
  policiesGenerated: number;
  avgPolicyGenerationTime: number;
  evidenceMapped: number;
  avgMappingTime: number;
  copilotQuestions: number;
  avgQuestionAnswerTime: number;
}

@Injectable()
export class AiAnalyticsService {
  private readonly logger = new Logger(AiAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get usage statistics for a customer
   */
  async getUsageStatistics(
    customerId: string,
    periodDays: number = 30
  ): Promise<UsageStatistics> {
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const usageRecords = await this.prisma.aIUsageLog.findMany({
      where: {
        customerId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalRequests = usageRecords.length;
    const estimatedCostUsd = usageRecords.reduce((sum, r) => sum + Number(r.estimatedCostUsd), 0);
    const totalTokens = usageRecords.reduce((sum, r) => sum + r.promptTokens + r.completionTokens, 0);

    // Group by operation
    const byFeature = this.groupByFeature(usageRecords);

    // Group by model
    const byModel = this.groupByModel(usageRecords);

    // Group by day
    const byDay = this.groupByDay(usageRecords);

    return {
      period: `${periodDays} days`,
      totalRequests,
      estimatedCostUsd,
      totalTokens,
      byFeature,
      byModel,
      byDay,
    };
  }

  /**
   * Get cost breakdown
   */
  async getCostBreakdown(customerId: string): Promise<CostBreakdown> {
    const thisMonth = await this.prisma.aIUsageLog.aggregate({
      where: {
        customerId,
        createdAt: {
          gte: new Date(new Date().setDate(1)), // First day of current month
        },
      },
      _sum: { estimatedCostUsd: true },
    });

    const lastMonth = await this.prisma.aIUsageLog.aggregate({
      where: {
        customerId,
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1, 1)),
          lt: new Date(new Date().setDate(1)),
        },
      },
      _sum: { estimatedCostUsd: true },
    });

    const currentCost = thisMonth._sum.estimatedCostUsd || 0;
    const previousCost = lastMonth._sum.estimatedCostUsd || 0;

    // Get breakdown by operation
    const byFeatureRecords = await this.prisma.aIUsageLog.groupBy({
      by: ['operation'],
      where: {
        customerId,
        createdAt: {
          gte: new Date(new Date().setDate(1)),
        },
      },
      _sum: { estimatedCostUsd: true },
    });

    const byFeature = byFeatureRecords.reduce((acc, r) => {
      acc[r.operation] = Number(r._sum.estimatedCostUsd || 0);
      return acc;
    }, {} as Record<string, number>);

    // Get breakdown by model
    const byModelRecords = await this.prisma.aIUsageLog.groupBy({
      by: ['model'],
      where: {
        customerId,
        createdAt: {
          gte: new Date(new Date().setDate(1)),
        },
      },
      _sum: { estimatedCostUsd: true },
    });

    const byModel = byModelRecords.reduce((acc, r) => {
      acc[r.model] = Number(r._sum.estimatedCostUsd || 0);
      return acc;
    }, {} as Record<string, number>);

    // Project monthly cost based on current usage
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ).getDate();
    const dayOfMonth = new Date().getDate();
    const projectedMonthly = (Number(currentCost) / dayOfMonth) * daysInMonth;

    const vsLastMonth = {
      absolute: Number(currentCost) - Number(previousCost),
      percentage: Number(previousCost) > 0
        ? ((Number(currentCost) - Number(previousCost)) / Number(previousCost)) * 100
        : 0,
    };

    return {
      total: Number(currentCost),
      byFeature,
      byModel,
      projectedMonthly,
      vsLastMonth,
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(customerId: string): Promise<PerformanceMetrics> {
    const last24Hours = await this.prisma.aIUsageLog.findMany({
      where: {
        customerId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const responseTimes = last24Hours
      .filter(r => r.metadata && (r.metadata as any).responseTime)
      .map(r => (r.metadata as any).responseTime as number)
      .sort((a, b) => a - b);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const p50ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

    const cacheHits = last24Hours.filter(r => r.metadata && (r.metadata as any).cached).length;
    const cacheHitRate = last24Hours.length > 0
      ? cacheHits / last24Hours.length
      : 0;

    const errors = last24Hours.filter(r => r.metadata && (r.metadata as any).error).length;
    const errorRate = last24Hours.length > 0
      ? errors / last24Hours.length
      : 0;

    const throughput = last24Hours.length / (24 * 60); // requests per minute

    return {
      avgResponseTime,
      p50ResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      cacheHitRate,
      errorRate,
      throughput,
    };
  }

  /**
   * Calculate ROI metrics
   */
  async getROIMetrics(customerId: string): Promise<ROIMetrics> {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Policies generated - simplified for now
    const policies = 0; // TODO: Add when isAiGenerated field exists in schema

    // Evidence mapped
    const evidenceMapped = await this.prisma.evidenceMapping.count({
      where: {
        evidence: { customerId },
        createdAt: { gte: last30Days },
      },
    });

    // Copilot questions
    const copilotMessages = await this.prisma.copilotMessage.count({
      where: {
        conversation: { customerId },
        role: 'USER', // Use enum value
        createdAt: { gte: last30Days },
      },
    });

    // Estimate time saved
    const avgPolicyGenerationTime = 4; // 4 hours manual vs 2 minutes AI
    const avgMappingTime = 0.5; // 30 minutes manual vs 30 seconds AI
    const avgQuestionAnswerTime = 0.25; // 15 minutes research vs 30 seconds AI

    const timeSavedHours = 
      policies * avgPolicyGenerationTime +
      evidenceMapped * avgMappingTime +
      copilotMessages * avgQuestionAnswerTime;

    // Get total cost
    const estimatedCostUsd = await this.prisma.aIUsageLog.aggregate({
      where: {
        customerId,
        createdAt: { gte: last30Days },
      },
      _sum: { estimatedCostUsd: true },
    });

    const costPerHour = timeSavedHours > 0
      ? Number(estimatedCostUsd._sum.estimatedCostUsd || 0) / timeSavedHours
      : 0;

    return {
      timeSavedHours,
      costPerHour,
      policiesGenerated: policies,
      avgPolicyGenerationTime,
      evidenceMapped,
      avgMappingTime,
      copilotQuestions: copilotMessages,
      avgQuestionAnswerTime,
    };
  }

  private groupByFeature(records: any[]): Record<string, FeatureStats> {
    const grouped = records.reduce((acc, record) => {
      const operation = record.operation;
      if (!acc[operation]) {
        acc[operation] = { requests: 0, cost: 0, tokens: 0 };
      }
      acc[operation].requests += 1;
      acc[operation].cost += Number(record.estimatedCostUsd);
      acc[operation].tokens += record.promptTokens + record.completionTokens;
      return acc;
    }, {} as Record<string, { requests: number; cost: number; tokens: number }>);

    const result: Record<string, FeatureStats> = {};
    for (const [operation, stats] of Object.entries(grouped) as Array<[string, { requests: number; cost: number; tokens: number }]>) {
      result[operation] = {
        requests: stats.requests,
        cost: stats.cost,
        tokens: stats.tokens,
        avgCostPerRequest: stats.cost / stats.requests,
        avgTokensPerRequest: stats.tokens / stats.requests,
      };
    }
    return result;
  }

  private groupByModel(records: any[]): Record<string, ModelStats> {
    const grouped = records.reduce((acc, record) => {
      const model = record.model;
      if (!acc[model]) {
        acc[model] = { requests: 0, cost: 0, tokens: 0 };
      }
      acc[model].requests += 1;
      acc[model].cost += Number(record.estimatedCostUsd);
      acc[model].tokens += record.promptTokens + record.completionTokens;
      return acc;
    }, {} as Record<string, { requests: number; cost: number; tokens: number }>);

    const result: Record<string, ModelStats> = {};
    for (const [model, stats] of Object.entries(grouped) as Array<[string, { requests: number; cost: number; tokens: number }]>) {
      result[model] = {
        requests: stats.requests,
        cost: stats.cost,
        tokens: stats.tokens,
      };
    }
    return result;
  }

  private groupByDay(records: any[]): DayStats[] {
    const grouped = records.reduce((acc, record) => {
      const date = record.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { requests: 0, cost: 0, tokens: 0 };
      }
      acc[date].requests += 1;
      acc[date].cost += Number(record.estimatedCostUsd);
      acc[date].tokens += record.promptTokens + record.completionTokens;
      return acc;
    }, {} as Record<string, { requests: number; cost: number; tokens: number }>);

    const result: DayStats[] = [];
    for (const [date, stats] of Object.entries(grouped) as Array<[string, { requests: number; cost: number; tokens: number }]>) {
      result.push({
        date,
        requests: stats.requests,
        cost: stats.cost,
        tokens: stats.tokens,
      });
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }
}

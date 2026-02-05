import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { OpenAIUsage } from './openai.service';

@Injectable()
export class UsageTrackerService {
  private readonly logger = new Logger(UsageTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logUsage(params: {
    customerId: string;
    operation: string;
    model: string;
    usage: OpenAIUsage;
    promptTemplateId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.aIUsageLog.create({
        data: {
          customerId: params.customerId,
          operation: params.operation,
          model: params.model,
          promptTokens: params.usage.promptTokens,
          completionTokens: params.usage.completionTokens,
          totalTokens: params.usage.totalTokens,
          estimatedCostUsd: params.usage.estimatedCostUsd,
          promptTemplateId: params.promptTemplateId,
          metadata: params.metadata || {},
        },
      });

      this.logger.debug(
        `Logged AI usage: ${params.operation} - ${params.usage.totalTokens} tokens ($${params.usage.estimatedCostUsd.toFixed(4)})`,
      );
    } catch (error) {
      this.logger.error('Failed to log AI usage', error);
    }
  }

  async getUsageStats(params: {
    customerId: string;
    startDate?: Date;
    endDate?: Date;
    operation?: string;
  }): Promise<{
    totalCalls: number;
    totalTokens: number;
    totalCostUsd: number;
    averageTokensPerCall: number;
  }> {
    const where: any = {
      customerId: params.customerId,
    };

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    if (params.operation) {
      where.operation = params.operation;
    }

    const logs = await this.prisma.aIUsageLog.findMany({ where });

    const totalCalls = logs.length;
    const totalTokens = logs.reduce((sum, log) => sum + log.totalTokens, 0);
    const totalCostUsd = logs.reduce(
      (sum, log) => sum + Number(log.estimatedCostUsd),
      0,
    );
    const averageTokensPerCall = totalCalls > 0 ? totalTokens / totalCalls : 0;

    return {
      totalCalls,
      totalTokens,
      totalCostUsd,
      averageTokensPerCall,
    };
  }
}

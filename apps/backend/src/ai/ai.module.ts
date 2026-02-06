import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { PromptService } from './prompt.service';
import { UsageTrackerService } from './usage-tracker.service';
import { EvidenceMappingService } from './evidence-mapping/evidence-mapping.service';
import { EvidenceMappingController } from './evidence-mapping/evidence-mapping.controller';
import { PolicyDraftingModule } from './policy-drafting/policy-drafting.module';
import { CopilotModule } from './copilot/copilot.module';
import { AiOrchestratorService } from './integration/ai-orchestrator.service';
import { AiOrchestratorController } from './integration/ai-orchestrator.controller';
import { AiAnalyticsService } from './analytics/ai-analytics.service';
import { AiAnalyticsController } from './analytics/ai-analytics.controller';
import { InsightsService } from './insights/insights.service';
import { InsightsController } from './insights/insights.controller';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import aiConfig from './config/ai.config';

@Module({
  imports: [
    ConfigModule.forFeature(aiConfig),
    PolicyDraftingModule,
    CopilotModule,
  ],
  providers: [
    PrismaService,
    CacheService,
    OpenAIService,
    PromptService,
    UsageTrackerService,
    EvidenceMappingService,
    AiOrchestratorService,
    AiAnalyticsService,
    InsightsService,
  ],
  controllers: [
    EvidenceMappingController,
    AiOrchestratorController,
    AiAnalyticsController,
    InsightsController,
  ],
  exports: [
    OpenAIService,
    PromptService,
    UsageTrackerService,
    EvidenceMappingService,
    AiOrchestratorService,
    AiAnalyticsService,
    InsightsService,
    PolicyDraftingModule,
    CopilotModule,
  ],
})
export class AIModule {}

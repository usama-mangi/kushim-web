import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { PromptService } from './prompt.service';
import { UsageTrackerService } from './usage-tracker.service';
import { EvidenceMappingService } from './evidence-mapping/evidence-mapping.service';
import { EvidenceMappingController } from './evidence-mapping/evidence-mapping.controller';
import { PolicyDraftingModule } from './policy-drafting/policy-drafting.module';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';

@Module({
  imports: [ConfigModule, PolicyDraftingModule],
  providers: [
    PrismaService,
    CacheService,
    OpenAIService,
    PromptService,
    UsageTrackerService,
    EvidenceMappingService,
  ],
  controllers: [EvidenceMappingController],
  exports: [
    OpenAIService,
    PromptService,
    UsageTrackerService,
    EvidenceMappingService,
    PolicyDraftingModule,
  ],
})
export class AIModule {}

import { Module } from '@nestjs/common';
import { PolicyDraftingController } from './policy-drafting.controller';
import { PolicyDraftingService } from './policy-drafting.service';
import { SharedModule } from '../../shared/shared.module';
import { OpenAIService } from '../openai.service';
import { UsageTrackerService } from '../usage-tracker.service';

@Module({
  imports: [SharedModule],
  controllers: [PolicyDraftingController],
  providers: [PolicyDraftingService, OpenAIService, UsageTrackerService],
  exports: [PolicyDraftingService],
})
export class PolicyDraftingModule {}

import { Module } from '@nestjs/common';
import { CopilotService } from './copilot.service';
import { CopilotController } from './copilot.controller';
import { SharedModule } from '../../shared/shared.module';
import { OpenAIService } from '../openai.service';
import { UsageTrackerService } from '../usage-tracker.service';

@Module({
  imports: [SharedModule],
  controllers: [CopilotController],
  providers: [CopilotService, OpenAIService, UsageTrackerService],
  exports: [CopilotService],
})
export class CopilotModule {}

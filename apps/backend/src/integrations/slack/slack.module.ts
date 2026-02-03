import { Module, forwardRef } from '@nestjs/common';
import { SlackService } from './slack.service';
import { SlackController } from './slack.controller';
import { IntegrationsManagementModule } from '../integrations.module';

@Module({
  imports: [forwardRef(() => IntegrationsManagementModule)],
  providers: [SlackService],
  controllers: [SlackController],
  exports: [SlackService],
})
export class SlackModule {}

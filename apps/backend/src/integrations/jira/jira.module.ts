import { Module, forwardRef } from '@nestjs/common';
import { JiraService } from './jira.service';
import { JiraController } from './jira.controller';
import { IntegrationsManagementModule } from '../integrations.module';

@Module({
  imports: [forwardRef(() => IntegrationsManagementModule)],
  providers: [JiraService],
  controllers: [JiraController],
  exports: [JiraService],
})
export class JiraModule {}

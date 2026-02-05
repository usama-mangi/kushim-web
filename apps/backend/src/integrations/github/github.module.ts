import { Module, forwardRef } from '@nestjs/common';
import { GitHubService } from './github.service';
import { GitHubController } from './github.controller';
import { IntegrationsManagementModule } from '../integrations.module';

import { ComplianceCheckQueueModule } from '../../shared/queue/queues.module';

@Module({
  imports: [
    forwardRef(() => IntegrationsManagementModule),
    ComplianceCheckQueueModule,
  ],
  providers: [GitHubService],
  controllers: [GitHubController],
  exports: [GitHubService],
})
export class GitHubModule {}

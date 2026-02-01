import { Module } from '@nestjs/common';
import { IntegrationReliabilityService } from './integration-reliability.service';
import { IntegrationReliabilityController } from './integration-reliability.controller';
import { AwsModule } from '../../integrations/aws/aws.module';
import { GitHubModule } from '../../integrations/github/github.module';
import { OktaModule } from '../../integrations/okta/okta.module';
import { JiraModule } from '../../integrations/jira/jira.module';
import { SlackModule } from '../../integrations/slack/slack.module';

@Module({
  imports: [AwsModule, GitHubModule, OktaModule, JiraModule, SlackModule],
  providers: [IntegrationReliabilityService],
  controllers: [IntegrationReliabilityController],
  exports: [IntegrationReliabilityService],
})
export class IntegrationReliabilityModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { QueueModule } from './shared/queue/queue.module';
import {
  EvidenceCollectionQueueModule,
  ComplianceCheckQueueModule,
} from './shared/queue/queues.module';
import { EvidenceCollectionProcessor } from './shared/queue/processors/evidence-collection.processor';
import { ComplianceCheckProcessor } from './shared/queue/processors/compliance-check.processor';
import { AwsModule } from './integrations/aws/aws.module';
import { GitHubModule } from './integrations/github/github.module';
import { OktaModule } from './integrations/okta/okta.module';
import { JiraModule } from './integrations/jira/jira.module';
import { SlackModule } from './integrations/slack/slack.module';
import { IntegrationReliabilityModule } from './shared/reliability/integration-reliability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    QueueModule,
    EvidenceCollectionQueueModule,
    ComplianceCheckQueueModule,
    AwsModule,
    GitHubModule,
    OktaModule,
    JiraModule,
    SlackModule,
    IntegrationReliabilityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EvidenceCollectionProcessor,
    ComplianceCheckProcessor,
  ],
})
export class AppModule {}

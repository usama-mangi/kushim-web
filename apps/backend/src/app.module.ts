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
import { AwsModule } from './integrations/aws/aws.module';
import { GitHubModule } from './integrations/github/github.module';
import { OktaModule } from './integrations/okta/okta.module';
import { JiraModule } from './integrations/jira/jira.module';
import { SlackModule } from './integrations/slack/slack.module';
import { IntegrationReliabilityModule } from './shared/reliability/integration-reliability.module';
import { AuthModule } from './auth/auth.module';
import { EvidenceModule } from './evidence/evidence.module';
import { ComplianceModule } from './compliance/compliance.module';
import { IntegrationsManagementModule } from './integrations/integrations.module';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

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
    AuthModule,
    EvidenceModule,
    ComplianceModule,
    IntegrationsManagementModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { CacheModule } from './common/cache/cache.module';
import { AuditModule } from './audit/audit.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute for general API
      },
      {
        name: 'auth',
        ttl: 60000, // 60 seconds
        limit: 5, // 5 requests per minute for auth endpoints
      },
    ]),
    CacheModule,
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
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

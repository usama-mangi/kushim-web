import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueName } from './queue.constants';
import { EvidenceCollectionProcessor } from './processors/evidence-collection.processor';
import { ComplianceCheckProcessor } from './processors/compliance-check.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { AwsModule } from '../../integrations/aws/aws.module';
import { GitHubModule } from '../../integrations/github/github.module';
import { OktaModule } from '../../integrations/okta/okta.module';
import { JiraModule } from '../../integrations/jira/jira.module';
import { SlackModule } from '../../integrations/slack/slack.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500, // Keep last 500 failed jobs
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QueueName.EVIDENCE_COLLECTION },
      { name: QueueName.COMPLIANCE_CHECK },
      { name: QueueName.INTEGRATION_SYNC },
    ),
    PrismaModule,
    AwsModule,
    GitHubModule,
    OktaModule,
    JiraModule,
    SlackModule,
  ],
  providers: [
    EvidenceCollectionProcessor,
    ComplianceCheckProcessor,
  ],
  exports: [
    BullModule,
  ],
})
export class QueueModule {}

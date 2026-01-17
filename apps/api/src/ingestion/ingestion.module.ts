import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { IngestionService } from './ingestion.service';
import { IngestionProcessor } from './ingestion.processor';
import { IngestionController } from './ingestion.controller';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { SyncSchedulerService } from './sync-scheduler.service';
import { CommonModule } from '../common/common.module';
import { AuditModule } from '../audit/audit.module';
import { RecordsModule } from '../records/records.module';

@Module({
  imports: [
    CommonModule,
    AuditModule,
    RecordsModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'ingestion',
    }),
  ],
  providers: [IngestionService, IngestionProcessor, SyncSchedulerService, OAuthService],
  controllers: [IngestionController, OAuthController],
  exports: [IngestionService],
})
export class IngestionModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { IngestionService } from './ingestion.service';
import { IngestionProcessor } from './ingestion.processor';
import { IngestionController } from './ingestion.controller';
import { SyncSchedulerService } from './sync-scheduler.service';
import { CommonModule } from '../common/common.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    CommonModule,
    AuditModule,
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
  providers: [IngestionService, IngestionProcessor, SyncSchedulerService],
  controllers: [IngestionController],
  exports: [IngestionService],
})
export class IngestionModule {}

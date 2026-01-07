import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestionService } from './ingestion.service';
import { IngestionProcessor } from './ingestion.processor';
import { IngestionController } from './ingestion.controller';

@Module({
  imports: [
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
  providers: [IngestionService, IngestionProcessor],
  controllers: [IngestionController],
  exports: [IngestionService],
})
export class IngestionModule {}

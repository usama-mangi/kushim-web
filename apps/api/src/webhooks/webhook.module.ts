import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookProcessor } from './webhook.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { RecordsModule } from '../records/records.module';
import { BullModule } from '@nestjs/bullmq';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    RecordsModule,
    AuditModule,
    BullModule.registerQueue({
      name: 'webhook-events',
    }),
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookProcessor],
  exports: [WebhookService],
})
export class WebhookModule {}

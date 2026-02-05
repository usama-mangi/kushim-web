import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { PrismaModule } from '../shared/prisma/prisma.module';

import { QueueName } from '../shared/queue/queue.constants';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: QueueName.COMPLIANCE_CHECK,
    }),
  ],
  providers: [ComplianceService],
  controllers: [ComplianceController],
  exports: [ComplianceService],
})
export class ComplianceModule {}

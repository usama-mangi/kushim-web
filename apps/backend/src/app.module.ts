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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EvidenceCollectionProcessor,
    ComplianceCheckProcessor,
  ],
})
export class AppModule {}

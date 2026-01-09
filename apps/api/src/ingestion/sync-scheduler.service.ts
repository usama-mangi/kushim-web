import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SyncSchedulerService {
  private readonly logger = new Logger(SyncSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('ingestion') private ingestionQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    this.logger.log('Starting scheduled synchronization job...');
    
    const activeSources = await this.prisma.dataSource.findMany({
      where: { status: 'active' },
    });

    for (const source of activeSources) {
      await this.ingestionQueue.add('sync', { dataSourceId: source.id });
      this.logger.log(`Queued sync for source: ${source.id} (${source.providerName})`);
    }
  }
}

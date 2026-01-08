import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GithubAdapter } from './adapters/github.adapter';
import { BaseAdapter } from './adapters/base.adapter';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private adapters: Map<string, BaseAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {
    this.adapters.set('github', new GithubAdapter());
  }

  async runIngestion(dataSourceId: string) {
    const dataSource = await this.prisma.dataSource.findUnique({
      where: { id: dataSourceId },
      include: { user: true },
    });

    if (!dataSource) {
      throw new Error('Data source not found');
    }

    const adapter = this.adapters.get(dataSource.providerName);
    if (!adapter) {
      throw new Error(`No adapter found for provider ${dataSource.providerName}`);
    }

    this.logger.log(`Starting ingestion for ${dataSource.providerName} (User: ${dataSource.userId})`);

    const rawData = await adapter.fetch(dataSource.credentialsEncrypted);
    
    for (const raw of rawData) {
      const normalized = adapter.normalize(raw);
      
      const record = await this.prisma.unifiedRecord.upsert({
        where: { checksum: normalized.checksum },
        update: {
          payload: normalized.payload,
        },
        create: {
          userId: dataSource.userId,
          sourceId: dataSource.id,
          payload: normalized.payload,
          checksum: normalized.checksum,
        },
      });

      this.notificationsGateway.broadcast('recordUpdated', record);
    }

    this.logger.log(`Ingestion completed for ${dataSource.providerName}`);
  }
}
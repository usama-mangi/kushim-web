import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GithubAdapter } from './adapters/github.adapter';
import { JiraAdapter } from './adapters/jira.adapter';
import { SlackAdapter } from './adapters/slack.adapter';
import { BaseAdapter } from './adapters/base.adapter';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private adapters: Map<string, BaseAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private encryptionService: EncryptionService,
  ) {
    this.adapters.set('github', new GithubAdapter());
    this.adapters.set('jira', new JiraAdapter());
    this.adapters.set('slack', new SlackAdapter());
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

    let credentials = dataSource.credentialsEncrypted;
    
    // Check if it's encrypted (has _encrypted property) and decrypt
    // We handle both legacy (plain JSON) and new (encrypted) for backward compatibility during migration
    if (credentials && typeof credentials === 'object' && !Array.isArray(credentials) && '_encrypted' in credentials) {
      try {
        credentials = await this.encryptionService.decryptObject(credentials);
      } catch (err) {
        this.logger.error(`Failed to decrypt credentials for source ${dataSourceId}`, err);
        throw new Error('Credential decryption failed');
      }
    }

    const rawData = await adapter.fetch(credentials);
    
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
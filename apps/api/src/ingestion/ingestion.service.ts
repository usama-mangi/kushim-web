import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GithubAdapter } from './adapters/github.adapter';
import { JiraAdapter } from './adapters/jira.adapter';
import { SlackAdapter } from './adapters/slack.adapter';
import { BaseAdapter } from './adapters/base.adapter';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private adapters: Map<string, BaseAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private encryptionService: EncryptionService,
    private auditService: AuditService,
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
    
    // Log start
    await this.auditService.log({
      userId: dataSource.userId,
      action: 'SYNC_START',
      resource: `source/${dataSource.providerName}`,
      payload: { sourceId: dataSourceId },
    });

    let credentials = dataSource.credentialsEncrypted;
    
    // Check if it's encrypted (has _encrypted property) and decrypt
    if (credentials && typeof credentials === 'object' && !Array.isArray(credentials) && '_encrypted' in credentials) {
      try {
        credentials = await this.encryptionService.decryptObject(credentials);
      } catch (err) {
        const errorMsg = 'Credential decryption failed';
        this.logger.error(errorMsg, err);
        await this.auditService.log({
          userId: dataSource.userId,
          action: 'SYNC_FAIL',
          resource: `source/${dataSource.providerName}`,
          payload: { error: errorMsg },
        });
        throw new Error(errorMsg);
      }
    }

    try {
      const rawData = await adapter.fetch(credentials);
      let newCount = 0;
      
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
        newCount++;
      }

      this.logger.log(`Ingestion completed for ${dataSource.providerName}. Records: ${newCount}`);
      
      await this.auditService.log({
        userId: dataSource.userId,
        action: 'SYNC_COMPLETE',
        resource: `source/${dataSource.providerName}`,
        payload: { count: newCount },
      });

    } catch (error) {
      this.logger.error(`Ingestion failed for ${dataSource.providerName}`, error);
      
      await this.auditService.log({
        userId: dataSource.userId,
        action: 'SYNC_FAIL',
        resource: `source/${dataSource.providerName}`,
        payload: { error: error.message },
      });
      throw error;
    }
  }
}
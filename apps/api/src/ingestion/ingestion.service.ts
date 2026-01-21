import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GithubAdapter } from './adapters/github.adapter';
import { JiraAdapter } from './adapters/jira.adapter';
import { SlackAdapter } from './adapters/slack.adapter';
import { GoogleAdapter } from './adapters/google.adapter';
import { BaseAdapter } from './adapters/base.adapter';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EncryptionService } from '../common/encryption.service';
import { EmbeddingService } from '../common/embedding.service';
import { AuditService } from '../audit/audit.service';
import { RelationshipService } from '../records/relationship.service';
import { GraphService } from '../records/graph.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private adapters: Map<string, BaseAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private encryptionService: EncryptionService,
    private embeddingService: EmbeddingService,
    private auditService: AuditService,
    private relationshipService: RelationshipService,
    private graphService: GraphService,
  ) {
    this.adapters.set('github', new GithubAdapter());
    this.adapters.set('jira', new JiraAdapter());
    this.adapters.set('slack', new SlackAdapter());
    this.adapters.set('google', new GoogleAdapter());
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
      throw new Error(
        `No adapter found for provider ${dataSource.providerName}`,
      );
    }

    this.logger.log(
      `Starting ingestion for ${dataSource.providerName} (User: ${dataSource.userId})`,
    );

    await this.auditService.log({
      userId: dataSource.userId,
      action: 'SYNC_START',
      resource: `source/${dataSource.providerName}`,
      payload: { sourceId: dataSourceId },
    });

    let credentials = dataSource.credentialsEncrypted;

    if (
      credentials &&
      typeof credentials === 'object' &&
      !Array.isArray(credentials) &&
      '_encrypted' in credentials
    ) {
      try {
        credentials = await this.encryptionService.decryptObject(credentials);
      } catch (err) {
        const errorMsg = 'Credential decryption failed';
        this.logger.error(errorMsg, err);
        throw new Error(errorMsg);
      }
    }

    try {
      const lastSync = dataSource.lastSync
        ? new Date(dataSource.lastSync)
        : undefined;
      const rawData = await adapter.fetch(credentials, lastSync);
      let newCount = 0;

      for (const raw of rawData) {
        const normalized = adapter.normalize(raw);

        // Generate embedding for the record
        let embedding: number[] | null = null;
        try {
          embedding = await this.embeddingService.generateEmbeddingForRecord(
            normalized.title,
            normalized.body,
          );
        } catch (error) {
          this.logger.warn(`Failed to generate embedding for ${normalized.externalId}`, error);
        }

        const record = await this.prisma.unifiedRecord.upsert({
          where: { checksum: normalized.checksum },
          update: {
            externalId: normalized.externalId,
            sourcePlatform: normalized.sourcePlatform,
            artifactType: normalized.artifactType,
            title: normalized.title,
            body: normalized.body,
            url: normalized.url,
            author: normalized.author,
            timestamp: normalized.timestamp,
            participants: normalized.participants,
            metadata: normalized.metadata,
            embedding: embedding ? JSON.parse(JSON.stringify(embedding)) : null,
          },
          create: {
            userId: dataSource.userId,
            sourceId: dataSource.id,
            externalId: normalized.externalId,
            sourcePlatform: normalized.sourcePlatform,
            artifactType: normalized.artifactType,
            title: normalized.title,
            body: normalized.body,
            url: normalized.url,
            author: normalized.author,
            timestamp: normalized.timestamp,
            participants: normalized.participants,
            metadata: normalized.metadata,
            checksum: normalized.checksum,
            embedding: embedding ? JSON.parse(JSON.stringify(embedding)) : null,
          },
        });

        // Sync to Graph DB
        await this.graphService.syncRecord(record);

        // Trigger relationship discovery
        await this.relationshipService.discoverRelationships(record);

        this.notificationsGateway.broadcast('recordUpdated', record);
        newCount++;
      }

      await this.prisma.dataSource.update({
        where: { id: dataSource.id },
        data: { lastSync: new Date() },
      });

      this.logger.log(
        `Ingestion completed for ${dataSource.providerName}. Records: ${newCount}`,
      );

      await this.auditService.log({
        userId: dataSource.userId,
        action: 'SYNC_COMPLETE',
        resource: `source/${dataSource.providerName}`,
        payload: { count: newCount },
      });
    } catch (error) {
      this.logger.error(
        `Ingestion failed for ${dataSource.providerName}`,
        error,
      );

      await this.auditService.log({
        userId: dataSource.userId,
        action: 'SYNC_FAIL',
        resource: `source/${dataSource.providerName}`,
        payload: { error: error.message },
      });
      throw error;
    }
  }

  async getSources(userId: string) {
    return this.prisma.dataSource.findMany({
      where: { userId, status: 'active' },
      select: {
        id: true,
        providerName: true,
        status: true,
        lastSync: true,
        createdAt: true,
      },
    });
  }
}

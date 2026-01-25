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
import { OAuthService } from './oauth.service';
import { TracingService } from '../common/tracing.service';

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
    private oauthService: OAuthService,
    private tracingService: TracingService,
  ) {
    this.adapters.set('github', new GithubAdapter());
    this.adapters.set('jira', new JiraAdapter());
    this.adapters.set('slack', new SlackAdapter());
    this.adapters.set('google', new GoogleAdapter());
  }

  async runIngestion(dataSourceId: string) {
    return await this.tracingService.withSpan(
      'ingestion.run',
      async (span) => {
        span.setAttribute('datasource.id', dataSourceId);

        const dataSource = await this.prisma.dataSource.findUnique({
          where: { id: dataSourceId },
          include: { user: true },
    });

    if (!dataSource) {
      throw new Error('Data source not found');
    }

    span.setAttribute('datasource.platform', dataSource.providerName);
    span.setAttribute('user.id', dataSource.userId);

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
      
      let rawData: any[];
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        try {
          rawData = await adapter.fetch(credentials, lastSync);
          break; // Success, exit retry loop
        } catch (error) {
          // Check if it's a 401 error (token expired)
          const creds = credentials as any;
          const is401 = error.message?.includes('401') || (error as any)?.statusCode === 401;
          
          if (
            is401 &&
            retryCount === 0 && // Only try refresh once
            (creds?.refreshToken || creds?.refresh_token)
          ) {
            const refreshToken = creds.refreshToken || creds.refresh_token;
            
            // Try refreshing token for providers that support it
            if (['jira', 'google', 'github'].includes(dataSource.providerName)) {
              try {
                this.logger.log(`Access token expired for ${dataSource.providerName}, refreshing...`);
                
                const refreshedTokens = await this.oauthService.refreshAccessToken(
                  dataSource.providerName,
                  refreshToken,
                );

                // Update credentials with new access token
                // Handle different credential structures per provider
                if (dataSource.providerName === 'github') {
                  credentials = {
                    ...creds,
                    token: refreshedTokens.token,
                    refresh_token: refreshedTokens.refresh_token || refreshToken,
                    expires_at: refreshedTokens.expires_at,
                  };
                } else if (dataSource.providerName === 'google') {
                  credentials = {
                    ...creds,
                    access_token: refreshedTokens.access_token,
                    refresh_token: refreshedTokens.refresh_token || refreshToken,
                    expires_at: refreshedTokens.expires_at,
                  };
                } else if (dataSource.providerName === 'jira') {
                  credentials = {
                    ...creds,
                    accessToken: refreshedTokens.accessToken,
                    refreshToken: refreshedTokens.refreshToken || refreshToken,
                    expires_at: refreshedTokens.expires_at,
                  };
                }

                // Encrypt and save updated credentials
                const encryptedCredentials = await this.encryptionService.encryptObject(credentials);
                await this.prisma.dataSource.update({
                  where: { id: dataSourceId },
                  data: { credentialsEncrypted: encryptedCredentials },
                });

                this.logger.log(`Token refreshed for ${dataSource.providerName}, retrying fetch...`);
                
                retryCount++;
                continue; // Retry fetch with new token
              } catch (refreshError) {
                this.logger.error(`Token refresh failed for ${dataSource.providerName}`, refreshError);
                
                // Mark data source as requiring re-auth
                await this.prisma.dataSource.update({
                  where: { id: dataSourceId },
                  data: { 
                    status: 'reauth_required',
                    metadata: {
                      error: 'Token refresh failed',
                      message: 'Please reconnect your account',
                      timestamp: new Date().toISOString(),
                    },
                  },
                });

                // Notify user via WebSocket
                this.notificationsGateway.sendToUser(dataSource.userId, 'authRequired', {
                  provider: dataSource.providerName,
                  message: 'Your authentication has expired. Please reconnect your account.',
                });

                throw new Error(`Authentication expired for ${dataSource.providerName}. Please reconnect.`);
              }
            }
          }
          
          // If not a 401 or refresh not supported, implement exponential backoff for other errors
          if (retryCount < maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10s
            this.logger.warn(
              `Fetch failed for ${dataSource.providerName} (attempt ${retryCount + 1}/${maxRetries + 1}). Retrying in ${backoffMs}ms...`,
            );
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            retryCount++;
          } else {
            // Max retries exceeded
            throw error;
          }
        }
      }

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
      },
    );
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

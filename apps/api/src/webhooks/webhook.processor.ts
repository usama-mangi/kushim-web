import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebhookEvent } from './webhook.service';
import { RelationshipService } from '../records/relationship.service';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Processor('webhook-events')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly relationshipService: RelationshipService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  private calculateChecksum(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async createOrUpdateRecord(
    userId: string,
    record: {
      platform: string;
      platformId: string;
      type: string;
      title: string;
      body: string;
      url: string;
      author: string;
      createdAt: Date;
      updatedAt: Date;
      metadata: any;
    },
  ) {
    const checksum = this.calculateChecksum(
      `${record.platform}:${record.platformId}:${record.type}:${record.title}:${record.body}`,
    );

    // Find or create a DataSource for this webhook
    let dataSource = await this.prisma.dataSource.findFirst({
      where: {
        userId,
        providerName: record.platform,
      },
    });

    if (!dataSource) {
      dataSource = await this.prisma.dataSource.create({
        data: {
          userId,
          providerName: record.platform,
          credentialsEncrypted: {
            type: 'webhook',
            createdViaWebhook: true,
            firstWebhookAt: new Date().toISOString(),
          },
          status: 'active',
        },
      });
      this.logger.debug(
        `Created webhook DataSource for platform=${record.platform} userId=${userId}`,
      );
    }

    const created = await this.prisma.unifiedRecord.upsert({
      where: { checksum },
      update: {
        externalId: record.platformId,
        sourcePlatform: record.platform,
        artifactType: record.type,
        title: record.title,
        body: record.body,
        url: record.url,
        author: record.author,
        timestamp: record.createdAt,
        metadata: record.metadata,
      },
      create: {
        userId,
        sourceId: dataSource.id,
        externalId: record.platformId,
        sourcePlatform: record.platform,
        artifactType: record.type,
        title: record.title,
        body: record.body,
        url: record.url,
        author: record.author,
        timestamp: record.createdAt,
        participants: [],
        metadata: record.metadata,
        checksum,
      },
    });

    return created;
  }

  async process(job: Job<WebhookEvent>): Promise<void> {
    const { platform, eventType, payload, userId } = job.data;

    this.logger.debug(
      `Processing ${platform} webhook: ${eventType} for user ${userId}`,
    );

    try {
      switch (platform) {
        case 'github':
          await this.processGithubEvent(eventType, payload, userId);
          break;
        case 'slack':
          await this.processSlackEvent(eventType, payload, userId);
          break;
        case 'jira':
          await this.processJiraEvent(eventType, payload, userId);
          break;
        case 'google':
          await this.processGoogleEvent(eventType, payload, userId);
          break;
        default:
          this.logger.warn(`Unknown platform: ${platform}`);
      }

      this.logger.debug(
        `Successfully processed ${platform} webhook: ${eventType}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process ${platform} webhook: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async processGithubEvent(
    eventType: string,
    payload: any,
    userId: string,
  ): Promise<void> {
    switch (eventType) {
      case 'issues':
      case 'issue_comment':
        await this.handleGithubIssue(payload, userId);
        break;
      case 'pull_request':
      case 'pull_request_review':
      case 'pull_request_review_comment':
        await this.handleGithubPullRequest(payload, userId);
        break;
      case 'push':
        await this.handleGithubPush(payload, userId);
        break;
      case 'commit_comment':
        await this.handleGithubCommitComment(payload, userId);
        break;
      default:
        this.logger.debug(`Ignoring GitHub event: ${eventType}`);
    }
  }

  private async handleGithubIssue(payload: any, userId: string): Promise<void> {
    const issue = payload.issue;
    if (!issue) return;

    const created = await this.createOrUpdateRecord(userId, {
      platform: 'github',
      platformId: String(issue.id),
      type: 'issue',
      title: issue.title,
      body: issue.body || '',
      url: issue.html_url,
      author: issue.user?.login || 'unknown',
      createdAt: new Date(issue.created_at),
      updatedAt: new Date(issue.updated_at),
      metadata: {
        state: issue.state,
        number: issue.number,
        repository: payload.repository?.full_name,
        labels: issue.labels?.map((l: any) => l.name) || [],
      },
    });

    await this.relationshipService.discoverRelationships(created);
  }

  private async handleGithubPullRequest(
    payload: any,
    userId: string,
  ): Promise<void> {
    const pr = payload.pull_request;
    if (!pr) return;

    const created = await this.createOrUpdateRecord(userId, {
      platform: 'github',
      platformId: String(pr.id),
      type: 'pull_request',
      title: pr.title,
      body: pr.body || '',
      url: pr.html_url,
      author: pr.user?.login || 'unknown',
      createdAt: new Date(pr.created_at),
      updatedAt: new Date(pr.updated_at),
      metadata: {
        state: pr.state,
        merged: pr.merged,
        number: pr.number,
        repository: payload.repository?.full_name,
        base: pr.base?.ref,
        head: pr.head?.ref,
      },
    });

    await this.relationshipService.discoverRelationships(created);
  }

  private async handleGithubPush(payload: any, userId: string): Promise<void> {
    if (!payload.commits || payload.commits.length === 0) return;

    for (const commit of payload.commits) {
      const created = await this.createOrUpdateRecord(userId, {
        platform: 'github',
        platformId: commit.id,
        type: 'commit',
        title: commit.message.split('\n')[0],
        body: commit.message,
        url: commit.url,
        author: commit.author?.username || commit.author?.name || 'unknown',
        createdAt: new Date(commit.timestamp),
        updatedAt: new Date(commit.timestamp),
        metadata: {
          repository: payload.repository?.full_name,
          branch: payload.ref?.replace('refs/heads/', ''),
          sha: commit.id,
        },
      });

      await this.relationshipService.discoverRelationships(created);
    }
  }

  private async handleGithubCommitComment(
    payload: any,
    userId: string,
  ): Promise<void> {
    const comment = payload.comment;
    if (!comment) return;

    const created = await this.createOrUpdateRecord(userId, {
      platform: 'github',
      platformId: String(comment.id),
      type: 'comment',
      title: `Comment on ${comment.commit_id?.substring(0, 7)}`,
      body: comment.body || '',
      url: comment.html_url,
      author: comment.user?.login || 'unknown',
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      metadata: {
        commit_id: comment.commit_id,
        repository: payload.repository?.full_name,
      },
    });

    await this.relationshipService.discoverRelationships(created);
  }

  private async processSlackEvent(
    eventType: string,
    payload: any,
    userId: string,
  ): Promise<void> {
    const event = payload.event;
    if (!event) return;

    switch (eventType) {
      case 'message':
        await this.handleSlackMessage(event, userId);
        break;
      case 'reaction_added':
      case 'reaction_removed':
        this.logger.debug('Slack reaction events not yet implemented');
        break;
      default:
        this.logger.debug(`Ignoring Slack event: ${eventType}`);
    }
  }

  private async handleSlackMessage(event: any, userId: string): Promise<void> {
    if (event.subtype && event.subtype !== 'thread_broadcast') {
      return;
    }

    const created = await this.createOrUpdateRecord(userId, {
      platform: 'slack',
      platformId: event.client_msg_id || event.ts,
      type: 'message',
      title: `Message in ${event.channel}`,
      body: event.text || '',
      url: `https://slack.com/app_redirect?channel=${event.channel}&message_ts=${event.ts}`,
      author: event.user || 'unknown',
      createdAt: new Date(parseFloat(event.ts) * 1000),
      updatedAt: new Date(parseFloat(event.ts) * 1000),
      metadata: {
        channel: event.channel,
        thread_ts: event.thread_ts,
      },
    });

    await this.relationshipService.discoverRelationships(created);
  }

  private async processJiraEvent(
    eventType: string,
    payload: any,
    userId: string,
  ): Promise<void> {
    switch (eventType) {
      case 'jira:issue_created':
      case 'jira:issue_updated':
        await this.handleJiraIssue(payload, userId);
        break;
      case 'comment_created':
      case 'comment_updated':
        await this.handleJiraComment(payload, userId);
        break;
      default:
        this.logger.debug(`Ignoring Jira event: ${eventType}`);
    }
  }

  private async handleJiraIssue(payload: any, userId: string): Promise<void> {
    const issue = payload.issue;
    if (!issue) return;

    const created = await this.createOrUpdateRecord(userId, {
      platform: 'jira',
      platformId: issue.id,
      type: 'issue',
      title: issue.fields?.summary || '',
      body: issue.fields?.description || '',
      url: `${payload.issue.self.split('/rest/')[0]}/browse/${issue.key}`,
      author: issue.fields?.creator?.displayName || 'unknown',
      createdAt: new Date(issue.fields?.created),
      updatedAt: new Date(issue.fields?.updated),
      metadata: {
        key: issue.key,
        status: issue.fields?.status?.name,
        priority: issue.fields?.priority?.name,
        assignee: issue.fields?.assignee?.displayName,
      },
    });

    await this.relationshipService.discoverRelationships(created);
  }

  private async handleJiraComment(payload: any, userId: string): Promise<void> {
    const comment = payload.comment;
    if (!comment) return;

    const created = await this.createOrUpdateRecord(userId, {
      platform: 'jira',
      platformId: comment.id,
      type: 'comment',
      title: `Comment on ${payload.issue?.key}`,
      body: comment.body || '',
      url: comment.self,
      author: comment.author?.displayName || 'unknown',
      createdAt: new Date(comment.created),
      updatedAt: new Date(comment.updated),
      metadata: {
        issueKey: payload.issue?.key,
      },
    });

    await this.relationshipService.discoverRelationships(created);
  }

  private async processGoogleEvent(
    eventType: string,
    payload: any,
    userId: string,
  ): Promise<void> {
    switch (eventType) {
      case 'change':
      case 'update':
        this.logger.debug(
          `Google Drive change detected for channel ${payload.channelId}`,
        );
        break;
      default:
        this.logger.debug(`Ignoring Google event: ${eventType}`);
    }
  }
}

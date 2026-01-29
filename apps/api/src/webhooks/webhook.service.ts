import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface WebhookEvent {
  platform: 'github' | 'slack' | 'jira' | 'google';
  eventType: string;
  payload: any;
  userId: string;
  receivedAt: Date;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectQueue('webhook-events') private readonly webhookQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async queueWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      await this.webhookQueue.add('process-webhook', event, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.debug(
        `Queued ${event.platform} webhook event: ${event.eventType}`,
      );

      await this.audit.log({
        userId: event.userId,
        action: 'webhook_received',
        resource: event.platform,
        payload: { eventType: event.eventType },
      });
    } catch (error) {
      this.logger.error(
        `Failed to queue webhook event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  verifyGithubSignature(payload: string, signature: string): boolean {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('GITHUB_WEBHOOK_SECRET not configured');
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest),
    );
  }

  verifySlackSignature(
    timestamp: string,
    signature: string,
    body: string,
  ): boolean {
    const secret = process.env.SLACK_SIGNING_SECRET;
    if (!secret) {
      this.logger.error('SLACK_SIGNING_SECRET not configured');
      return false;
    }

    const time = Math.floor(Date.now() / 1000);
    if (Math.abs(time - parseInt(timestamp)) > 60 * 5) {
      this.logger.warn('Slack webhook timestamp too old');
      return false;
    }

    const sigBasestring = `v0:${timestamp}:${body}`;
    const hmac = crypto.createHmac('sha256', secret);
    const mySignature = 'v0=' + hmac.update(sigBasestring).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(mySignature),
    );
  }

  verifyJiraSignature(payload: string, signature: string): boolean {
    const secret = process.env.JIRA_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('JIRA_WEBHOOK_SECRET not configured');
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  async getUserIdForPlatformResource(
    platform: string,
    resourceId: string,
  ): Promise<string | null> {
    const dataSource = await this.prisma.dataSource.findFirst({
      where: {
        providerName: platform,
      },
      select: { userId: true },
    });

    return dataSource?.userId || null;
  }
}

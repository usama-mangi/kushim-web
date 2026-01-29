import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WebhookService } from './webhook.service';
import { RATE_LIMITS } from '../common/constants';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  /**
   * GitHub webhook endpoint - rate limited to prevent abuse
   * Rate limit: configurable via WEBHOOK_RATE_LIMIT env var (default: 1000 req/min)
   */
  @Post('github')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: RATE_LIMITS.WEBHOOK_RPM, ttl: 60000 } })
  async handleGithubWebhook(
    @Headers('x-github-event') eventType: string,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: any,
  ): Promise<{ status: string }> {
    const rawBody = req.rawBody?.toString('utf-8') || JSON.stringify(payload);

    if (!this.webhookService.verifyGithubSignature(rawBody, signature)) {
      this.logger.warn(`Invalid GitHub webhook signature for ${deliveryId}`);
      throw new UnauthorizedException('Invalid signature');
    }

    let userId: string | null = null;

    if (payload.repository?.id) {
      userId = await this.webhookService.getUserIdForPlatformResource(
        'github',
        String(payload.repository.id),
      );
    }

    if (!userId && payload.installation?.account?.login) {
      userId = await this.webhookService.getUserIdForPlatformResource(
        'github',
        payload.installation.account.login,
      );
    }

    if (!userId) {
      this.logger.warn(
        `No user found for GitHub webhook ${eventType} from ${payload.repository?.full_name || 'unknown'}`,
      );
      return { status: 'ignored' };
    }

    await this.webhookService.queueWebhookEvent({
      platform: 'github',
      eventType,
      payload,
      userId,
      receivedAt: new Date(),
    });

    this.logger.debug(
      `GitHub webhook ${eventType} queued for user ${userId}`,
    );
    return { status: 'accepted' };
  }

  /**
   * Slack webhook endpoint - rate limited to prevent abuse
   * Rate limit: configurable via WEBHOOK_RATE_LIMIT env var (default: 1000 req/min)
   */
  @Post('slack')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: RATE_LIMITS.WEBHOOK_RPM, ttl: 60000 } })
  async handleSlackWebhook(
    @Headers('x-slack-request-timestamp') timestamp: string,
    @Headers('x-slack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: any,
  ): Promise<any> {
    const rawBody = req.rawBody?.toString('utf-8') || JSON.stringify(payload);

    if (payload.type === 'url_verification') {
      return { challenge: payload.challenge };
    }

    if (
      !this.webhookService.verifySlackSignature(timestamp, signature, rawBody)
    ) {
      this.logger.warn('Invalid Slack webhook signature');
      throw new UnauthorizedException('Invalid signature');
    }

    const teamId = payload.team_id || payload.team?.id;
    if (!teamId) {
      this.logger.warn('No team_id in Slack webhook payload');
      return { status: 'ignored' };
    }

    const userId =
      await this.webhookService.getUserIdForPlatformResource(
        'slack',
        teamId,
      );

    if (!userId) {
      this.logger.warn(`No user found for Slack team ${teamId}`);
      return { status: 'ignored' };
    }

    await this.webhookService.queueWebhookEvent({
      platform: 'slack',
      eventType: payload.event?.type || payload.type,
      payload,
      userId,
      receivedAt: new Date(),
    });

    this.logger.debug(
      `Slack webhook ${payload.event?.type || payload.type} queued for user ${userId}`,
    );
    return { status: 'ok' };
  }

  /**
   * Jira webhook endpoint - rate limited to prevent abuse
   * Rate limit: configurable via WEBHOOK_RATE_LIMIT env var (default: 1000 req/min)
   */
  @Post('jira')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: RATE_LIMITS.WEBHOOK_RPM, ttl: 60000 } })
  async handleJiraWebhook(
    @Headers('x-atlassian-webhook-identifier') identifier: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: any,
  ): Promise<{ status: string }> {
    const rawBody = req.rawBody?.toString('utf-8') || JSON.stringify(payload);

    if (identifier && process.env.JIRA_WEBHOOK_SECRET) {
      const signature = req.headers['x-hub-signature'] as string;
      if (
        signature &&
        !this.webhookService.verifyJiraSignature(rawBody, signature)
      ) {
        this.logger.warn('Invalid Jira webhook signature');
        throw new UnauthorizedException('Invalid signature');
      }
    }

    const issueKey = payload.issue?.key;
    if (!issueKey) {
      this.logger.warn('No issue key in Jira webhook payload');
      return { status: 'ignored' };
    }

    const userId =
      await this.webhookService.getUserIdForPlatformResource('jira', issueKey);

    if (!userId) {
      this.logger.warn(`No user found for Jira issue ${issueKey}`);
      return { status: 'ignored' };
    }

    await this.webhookService.queueWebhookEvent({
      platform: 'jira',
      eventType: payload.webhookEvent,
      payload,
      userId,
      receivedAt: new Date(),
    });

    this.logger.debug(
      `Jira webhook ${payload.webhookEvent} queued for user ${userId}`,
    );
    return { status: 'accepted' };
  }

  /**
   * Google Drive webhook endpoint - rate limited to prevent abuse
   * Rate limit: configurable via WEBHOOK_RATE_LIMIT env var (default: 1000 req/min)
   */
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: RATE_LIMITS.WEBHOOK_RPM, ttl: 60000 } })
  async handleGoogleWebhook(
    @Headers('x-goog-channel-id') channelId: string,
    @Headers('x-goog-resource-state') resourceState: string,
    @Headers('x-goog-resource-id') resourceId: string,
    @Body() payload: any,
  ): Promise<{ status: string }> {
    if (resourceState === 'sync') {
      this.logger.debug('Google webhook sync message received');
      return { status: 'ok' };
    }

    if (!channelId) {
      this.logger.warn('No channel ID in Google webhook');
      return { status: 'ignored' };
    }

    const userId =
      await this.webhookService.getUserIdForPlatformResource(
        'google',
        channelId,
      );

    if (!userId) {
      this.logger.warn(`No user found for Google channel ${channelId}`);
      return { status: 'ignored' };
    }

    await this.webhookService.queueWebhookEvent({
      platform: 'google',
      eventType: resourceState,
      payload: { resourceId, channelId, ...payload },
      userId,
      receivedAt: new Date(),
    });

    this.logger.debug(
      `Google webhook ${resourceState} queued for user ${userId}`,
    );
    return { status: 'accepted' };
  }
}

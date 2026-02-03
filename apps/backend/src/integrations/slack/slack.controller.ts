import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SlackService } from './slack.service';
import { IntegrationsService } from '../integrations.service';
import { IntegrationType } from '@prisma/client';

@Controller('integrations/slack')
@UseGuards(AuthGuard('jwt'))
export class SlackController {
  constructor(
    private readonly slackService: SlackService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Get('health')
  async getHealth(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.SLACK);
    const isConnected = await this.slackService.checkConnection(config?.webhookUrl);
    const circuitBreakerStatus = this.slackService.getCircuitBreakerStatus();

    return {
      integration: 'slack',
      status: isConnected && circuitBreakerStatus.state !== 'OPEN' ? 'healthy' : 'unhealthy',
      circuitBreaker: circuitBreakerStatus,
      timestamp: new Date(),
    };
  }

  @Post('alert')
  @HttpCode(HttpStatus.OK)
  async sendAlert(
    @Request() req: any,
    @Body()
    body: {
      title: string;
      message: string;
      severity: 'info' | 'warning' | 'error';
      controlId?: string;
      evidenceId?: string;
    },
  ) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.SLACK);
    return await this.slackService.sendAlert({ ...body, webhookUrl: config?.webhookUrl });
  }

  @Post('summary/daily')
  @HttpCode(HttpStatus.OK)
  async sendDailySummary(
    @Request() req: any,
    @Body()
    body: {
      totalChecks: number;
      passedChecks: number;
      failedChecks: number;
      warningChecks: number;
      complianceRate: number;
    },
  ) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.SLACK);
    return await this.slackService.sendDailySummary({ ...body, webhookUrl: config?.webhookUrl });
  }

  @Post('warning/integration-health')
  @HttpCode(HttpStatus.OK)
  async sendIntegrationHealthWarning(
    @Request() req: any,
    @Body()
    body: {
      integration: string;
      healthScore: number;
      issues: string[];
    },
  ) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.SLACK);
    return await this.slackService.sendIntegrationHealthWarning({ ...body, webhookUrl: config?.webhookUrl });
  }
}

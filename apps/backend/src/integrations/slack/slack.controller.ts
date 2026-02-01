import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SlackService } from './slack.service';

@Controller('integrations/slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Get('health')
  async getHealth() {
    const circuitBreakerStatus = this.slackService.getCircuitBreakerStatus();

    return {
      integration: 'slack',
      circuitBreaker: circuitBreakerStatus,
      timestamp: new Date(),
    };
  }

  @Post('alert')
  @HttpCode(HttpStatus.OK)
  async sendAlert(
    @Body()
    body: {
      title: string;
      message: string;
      severity: 'info' | 'warning' | 'error';
      controlId?: string;
      evidenceId?: string;
    },
  ) {
    return await this.slackService.sendAlert(body);
  }

  @Post('summary/daily')
  @HttpCode(HttpStatus.OK)
  async sendDailySummary(
    @Body()
    body: {
      totalChecks: number;
      passedChecks: number;
      failedChecks: number;
      warningChecks: number;
      complianceRate: number;
    },
  ) {
    return await this.slackService.sendDailySummary(body);
  }

  @Post('warning/integration-health')
  @HttpCode(HttpStatus.OK)
  async sendIntegrationHealthWarning(
    @Body()
    body: {
      integration: string;
      healthScore: number;
      issues: string[];
    },
  ) {
    return await this.slackService.sendIntegrationHealthWarning(body);
  }
}

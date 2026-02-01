import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { IntegrationReliabilityService } from './integration-reliability.service';

@Controller('reliability')
export class IntegrationReliabilityController {
  constructor(private readonly reliabilityService: IntegrationReliabilityService) {}

  @Get('health')
  async getOverallHealth() {
    const metrics = await this.reliabilityService.checkAllIntegrationsHealth();

    return {
      status: 'ok',
      timestamp: new Date(),
      metrics,
    };
  }

  @Post('health/check-and-alert')
  @HttpCode(HttpStatus.OK)
  async checkHealthAndAlert() {
    const metrics = await this.reliabilityService.checkAllIntegrationsHealth();
    await this.reliabilityService.sendHealthAlertsIfNeeded(metrics);

    return {
      status: 'ok',
      timestamp: new Date(),
      metrics,
      alertsSent: metrics.unhealthyIntegrations + metrics.degradedIntegrations,
    };
  }
}

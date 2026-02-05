import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationReliabilityService } from './integration-reliability.service';

@Controller('reliability')
@UseGuards(AuthGuard('jwt'))
export class IntegrationReliabilityController {
  constructor(
    private readonly reliabilityService: IntegrationReliabilityService,
  ) {}

  @Get('health')
  async getOverallHealth(@Request() req: any) {
    const metrics = await this.reliabilityService.checkAllIntegrationsHealth(
      req.user.customerId,
    );

    return {
      status: 'ok',
      timestamp: new Date(),
      metrics,
    };
  }

  @Post('health/check-and-alert')
  @HttpCode(HttpStatus.OK)
  async checkHealthAndAlert(@Request() req: any) {
    const metrics = await this.reliabilityService.checkAllIntegrationsHealth(
      req.user.customerId,
    );
    await this.reliabilityService.sendHealthAlertsIfNeeded(metrics);

    return {
      status: 'ok',
      timestamp: new Date(),
      metrics,
      alertsSent: metrics.unhealthyIntegrations + metrics.degradedIntegrations,
    };
  }
}

import { Controller, Get, Post, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OktaService } from './okta.service';
import { IntegrationsService } from '../integrations.service';
import { IntegrationType } from '@prisma/client';

@Controller('integrations/okta')
@UseGuards(AuthGuard('jwt'))
export class OktaController {
  constructor(
    private readonly oktaService: OktaService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Get('health')
  async getHealth(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.OKTA);
    const healthScore = await this.oktaService.calculateHealthScore(config);
    const circuitBreakerStatus = this.oktaService.getCircuitBreakerStatus();

    return {
      integration: 'okta',
      healthScore,
      circuitBreaker: circuitBreakerStatus,
      timestamp: new Date(),
    };
  }

  @Post('evidence/mfa')
  @HttpCode(HttpStatus.OK)
  async collectMfaEnforcement(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.OKTA);
    return await this.oktaService.collectMfaEnforcementEvidence(config);
  }

  @Post('evidence/user-access')
  @HttpCode(HttpStatus.OK)
  async collectUserAccess(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.OKTA);
    return await this.oktaService.collectUserAccessEvidence(config);
  }

  @Post('evidence/policy-compliance')
  @HttpCode(HttpStatus.OK)
  async collectPolicyCompliance(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.OKTA);
    return await this.oktaService.collectPolicyComplianceEvidence(config);
  }
}

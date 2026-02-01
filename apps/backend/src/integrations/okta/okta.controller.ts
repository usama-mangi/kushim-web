import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { OktaService } from './okta.service';

@Controller('integrations/okta')
export class OktaController {
  constructor(private readonly oktaService: OktaService) {}

  @Get('health')
  async getHealth() {
    const healthScore = await this.oktaService.calculateHealthScore();
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
  async collectMfaEnforcement() {
    return await this.oktaService.collectMfaEnforcementEvidence();
  }

  @Post('evidence/user-access')
  @HttpCode(HttpStatus.OK)
  async collectUserAccess() {
    return await this.oktaService.collectUserAccessEvidence();
  }

  @Post('evidence/policy-compliance')
  @HttpCode(HttpStatus.OK)
  async collectPolicyCompliance() {
    return await this.oktaService.collectPolicyComplianceEvidence();
  }
}

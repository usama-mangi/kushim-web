import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OktaService } from './okta.service';
import { IntegrationsService } from '../integrations.service';
import { IntegrationType } from '@prisma/client';
import {
  HealthScoreDto,
  EvidenceCollectionResponseDto,
} from '../dto/integration-response.dto';
import { ErrorResponseDto } from '../../auth/dto/auth-response.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('integrations/okta')
@ApiBearerAuth('JWT-auth')
@Controller('integrations/okta')
@UseGuards(AuthGuard('jwt'))
export class OktaController {
  constructor(
    private readonly oktaService: OktaService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Get Okta integration health',
    description:
      'Get health score and circuit breaker status for Okta integration',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health status retrieved successfully',
    type: HealthScoreDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Okta integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getHealth(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.OKTA,
    );
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
  @ApiOperation({
    summary: 'Collect MFA enforcement evidence',
    description: 'Collect evidence about MFA enforcement from Okta',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'MFA evidence collected successfully',
    type: EvidenceCollectionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Okta integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async collectMfaEnforcement(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.OKTA,
    );
    return await this.oktaService.collectMfaEnforcementEvidence(config);
  }

  @Post('evidence/user-access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Collect user access evidence',
    description: 'Collect evidence about user access controls from Okta',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User access evidence collected successfully',
    type: EvidenceCollectionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Okta integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async collectUserAccess(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.OKTA,
    );
    return await this.oktaService.collectUserAccessEvidence(config);
  }

  @Post('evidence/policy-compliance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Collect policy compliance evidence',
    description: 'Collect evidence about policy compliance from Okta',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Policy compliance evidence collected successfully',
    type: EvidenceCollectionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Okta integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async collectPolicyCompliance(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.OKTA,
    );
    return await this.oktaService.collectPolicyComplianceEvidence(config);
  }
}

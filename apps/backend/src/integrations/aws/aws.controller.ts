import { Controller, Get, Post, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AwsService } from './aws.service';
import { IntegrationsService } from '../integrations.service';
import { IntegrationType } from '@prisma/client';

@Controller('integrations/aws')
@UseGuards(AuthGuard('jwt'))
export class AwsController {
  constructor(
    private readonly awsService: AwsService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Get('health')
  async getHealth(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.AWS);
    const healthScore = await this.awsService.calculateHealthScore(config);
    const circuitBreakerStatus = this.awsService.getCircuitBreakerStatus();

    return {
      integration: 'aws',
      healthScore,
      circuitBreaker: circuitBreakerStatus,
      timestamp: new Date(),
    };
  }

  @Post('evidence/iam')
  @HttpCode(HttpStatus.OK)
  async collectIamEvidence(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.AWS);
    return await this.awsService.collectIamEvidence(config);
  }

  @Post('evidence/s3')
  @HttpCode(HttpStatus.OK)
  async collectS3Evidence(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.AWS);
    return await this.awsService.collectS3Evidence(config);
  }

  @Post('evidence/cloudtrail')
  @HttpCode(HttpStatus.OK)
  async collectCloudTrailEvidence(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.AWS);
    return await this.awsService.collectCloudTrailEvidence(config);
  }
}

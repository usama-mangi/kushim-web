import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AwsService } from './aws.service';

@Controller('integrations/aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @Get('health')
  async getHealth() {
    const healthScore = await this.awsService.calculateHealthScore();
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
  async collectIamEvidence() {
    return await this.awsService.collectIamEvidence();
  }

  @Post('evidence/s3')
  @HttpCode(HttpStatus.OK)
  async collectS3Evidence() {
    return await this.awsService.collectS3Evidence();
  }

  @Post('evidence/cloudtrail')
  @HttpCode(HttpStatus.OK)
  async collectCloudTrailEvidence() {
    return await this.awsService.collectCloudTrailEvidence();
  }
}

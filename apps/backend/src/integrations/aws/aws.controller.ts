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
import { AwsService } from './aws.service';
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

@ApiTags('integrations/aws')
@ApiBearerAuth('JWT-auth')
@Controller('integrations/aws')
@UseGuards(AuthGuard('jwt'))
export class AwsController {
  constructor(
    private readonly awsService: AwsService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Get AWS integration health',
    description:
      'Get health score and circuit breaker status for AWS integration',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health status retrieved successfully',
    type: HealthScoreDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'AWS integration not configured',
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
      IntegrationType.AWS,
    );
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
  @ApiOperation({
    summary: 'Collect IAM evidence',
    description: 'Collect evidence from AWS IAM for compliance checks',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'IAM evidence collected successfully',
    type: EvidenceCollectionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'AWS integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async collectIamEvidence(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.AWS,
    );
    return await this.awsService.collectIamEvidence(config);
  }

  @Post('evidence/s3')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Collect S3 evidence',
    description: 'Collect evidence from AWS S3 for compliance checks',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'S3 evidence collected successfully',
    type: EvidenceCollectionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'AWS integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async collectS3Evidence(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.AWS,
    );
    return await this.awsService.collectS3Evidence(config);
  }

  @Post('evidence/cloudtrail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Collect CloudTrail evidence',
    description: 'Collect evidence from AWS CloudTrail for compliance checks',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CloudTrail evidence collected successfully',
    type: EvidenceCollectionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'AWS integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async collectCloudTrailEvidence(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.AWS,
    );
    return await this.awsService.collectCloudTrailEvidence(config);
  }
}

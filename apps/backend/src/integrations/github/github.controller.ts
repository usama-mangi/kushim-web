import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GitHubService } from './github.service';
import { IntegrationsService } from '../integrations.service';
import { IntegrationType } from '@prisma/client';

import { InjectQueue } from '@nestjs/bull';
import { type Queue } from 'bull';
import {
  QueueName,
  ComplianceCheckJobType,
} from '../../shared/queue/queue.constants';
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
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('integrations/github')
@ApiBearerAuth('JWT-auth')
@Controller('integrations/github')
@UseGuards(AuthGuard('jwt'))
export class GitHubController {
  constructor(
    private readonly githubService: GitHubService,
    private readonly integrationsService: IntegrationsService,
    @InjectQueue(QueueName.COMPLIANCE_CHECK) private complianceQueue: Queue,
  ) {}

  @Get('repos')
  @ApiOperation({
    summary: 'List GitHub repositories',
    description:
      'Get list of accessible GitHub repositories for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Repositories retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 123456789 },
          name: { type: 'string', example: 'my-repo' },
          full_name: { type: 'string', example: 'user/my-repo' },
          private: { type: 'boolean', example: true },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GitHub integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async listRepos(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.GITHUB,
    );
    return await this.githubService.listUserRepos(config);
  }

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete GitHub setup',
    description:
      'Configure monitored repositories and trigger initial compliance scan',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        repos: {
          type: 'array',
          items: { type: 'string' },
          example: ['user/repo1', 'user/repo2'],
          description: 'Array of repository full names to monitor',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GitHub setup completed and scan initiated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GitHub integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async completeSetup(@Request() req: any, @Body('repos') repos: string[]) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.GITHUB,
    );
    const result = await this.integrationsService.connect(
      req.user.customerId,
      IntegrationType.GITHUB,
      {
        ...config,
        repos,
      },
    );

    // Trigger immediate compliance scan
    await this.complianceQueue.add(ComplianceCheckJobType.SCHEDULE_CHECKS, {
      customerId: req.user.customerId,
    });

    return result;
  }

  @Get('health')
  @ApiOperation({
    summary: 'Get GitHub integration health',
    description:
      'Get health score and circuit breaker status for GitHub integration',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health status retrieved successfully',
    type: HealthScoreDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GitHub integration not configured',
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
      IntegrationType.GITHUB,
    );
    const healthScore = await this.githubService.calculateHealthScore(config);
    const circuitBreakerStatus = this.githubService.getCircuitBreakerStatus();

    return {
      integration: 'github',
      healthScore,
      circuitBreaker: circuitBreakerStatus,
      timestamp: new Date(),
    };
  }

  @Post('evidence/branch-protection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Collect branch protection evidence',
    description: 'Collect evidence about branch protection rules from GitHub',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch protection evidence collected successfully',
    type: EvidenceCollectionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GitHub integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async collectBranchProtection(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.GITHUB,
    );
    return await this.githubService.collectBranchProtectionEvidence(config);
  }

  @Post('evidence/commit-signing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Collect commit signing evidence',
    description:
      'Collect evidence about commit signing configuration from GitHub',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commit signing evidence collected successfully',
    type: EvidenceCollectionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GitHub integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async collectCommitSigning(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.GITHUB,
    );
    return await this.githubService.collectCommitSigningEvidence(config);
  }

  @Post('evidence/security')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Collect security evidence',
    description: 'Collect evidence about security configurations from GitHub',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Security evidence collected successfully',
    type: EvidenceCollectionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GitHub integration not configured',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async collectSecurity(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(
      req.user.customerId,
      IntegrationType.GITHUB,
    );
    return await this.githubService.collectSecurityEvidence(config);
  }
}

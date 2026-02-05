import { Controller, Get, Post, UseGuards, Request, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GitHubService } from './github.service';
import { IntegrationsService } from '../integrations.service';
import { IntegrationType } from '@prisma/client';

import { InjectQueue } from '@nestjs/bull';
import { type Queue } from 'bull';
import { QueueName, ComplianceCheckJobType } from '../../shared/queue/queue.constants';

@Controller('integrations/github')
@UseGuards(AuthGuard('jwt'))
export class GitHubController {
  constructor(
    private readonly githubService: GitHubService,
    private readonly integrationsService: IntegrationsService,
    @InjectQueue(QueueName.COMPLIANCE_CHECK) private complianceQueue: Queue,
  ) {}

  @Get('repos')
  async listRepos(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.GITHUB);
    return await this.githubService.listUserRepos(config);
  }

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  async completeSetup(@Request() req: any, @Body('repos') repos: string[]) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.GITHUB);
    const result = await this.integrationsService.connect(req.user.customerId, IntegrationType.GITHUB, {
      ...config,
      repos,
    });

    // Trigger immediate compliance scan
    await this.complianceQueue.add(ComplianceCheckJobType.SCHEDULE_CHECKS, {
      customerId: req.user.customerId,
    });

    return result;
  }

  @Get('health')
  async getHealth(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.GITHUB);
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
  async collectBranchProtection(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.GITHUB);
    return await this.githubService.collectBranchProtectionEvidence(config);
  }

  @Post('evidence/commit-signing')
  @HttpCode(HttpStatus.OK)
  async collectCommitSigning(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.GITHUB);
    return await this.githubService.collectCommitSigningEvidence(config);
  }

  @Post('evidence/security')
  @HttpCode(HttpStatus.OK)
  async collectSecurity(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.GITHUB);
    return await this.githubService.collectSecurityEvidence(config);
  }
}

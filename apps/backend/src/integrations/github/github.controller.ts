import { Controller, Get, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { GitHubService } from './github.service';

@Controller('integrations/github')
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @Get('health')
  async getHealth(@Query('owner') owner: string, @Query('repo') repo: string) {
    if (!owner || !repo) {
      return {
        error: 'Missing required parameters: owner and repo',
      };
    }

    const healthScore = await this.githubService.calculateHealthScore(owner, repo);
    const circuitBreakerStatus = this.githubService.getCircuitBreakerStatus();

    return {
      integration: 'github',
      repository: `${owner}/${repo}`,
      healthScore,
      circuitBreaker: circuitBreakerStatus,
      timestamp: new Date(),
    };
  }

  @Post('evidence/branch-protection')
  @HttpCode(HttpStatus.OK)
  async collectBranchProtection(@Query('owner') owner: string, @Query('repo') repo: string) {
    return await this.githubService.collectBranchProtectionEvidence(owner, repo);
  }

  @Post('evidence/commit-signing')
  @HttpCode(HttpStatus.OK)
  async collectCommitSigning(@Query('owner') owner: string, @Query('repo') repo: string) {
    return await this.githubService.collectCommitSigningEvidence(owner, repo);
  }

  @Post('evidence/security')
  @HttpCode(HttpStatus.OK)
  async collectSecurity(@Query('owner') owner: string, @Query('repo') repo: string) {
    return await this.githubService.collectSecurityEvidence(owner, repo);
  }
}

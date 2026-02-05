import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import {
  retryWithBackoff,
  CircuitBreaker,
} from '../../common/utils/retry.util';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly circuitBreaker = new CircuitBreaker();
  private defaultOctokit: Octokit;

  constructor(private configService: ConfigService) {
    const token = this.configService.get('GITHUB_TOKEN', '');
    this.defaultOctokit = new Octokit({ auth: token });
  }

  private getClientConfig(config?: any) {
    if (!config) return null;
    return {
      owner: config.owner || config.organization,
      repos: config.repos || (config.repo ? [config.repo] : []),
      token: config.token || config.personalAccessToken,
    };
  }

  private getOctokit(token?: string): Octokit {
    if (!token) return this.defaultOctokit;
    return new Octokit({ auth: token });
  }

  /**
   * List user repositories for selection
   */
  async listUserRepos(config: any): Promise<string[]> {
    try {
      const clientConfig = this.getClientConfig(config);
      const octokit = this.getOctokit(clientConfig?.token);

      this.logger.log(`Fetching repositories for ${clientConfig?.owner}`);

      const response = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      });

      return response.data.map((r) => r.name);
    } catch (error) {
      this.logger.error('Failed to list GitHub repositories', error);
      throw error;
    }
  }

  /**
   * Check connection validity (Health Check)
   */
  async checkConnection(config?: any): Promise<boolean> {
    try {
      const clientConfig = this.getClientConfig(config);
      const octokit = this.getOctokit(clientConfig?.token);
      await octokit.users.getAuthenticated();
      return true;
    } catch (error) {
      this.logger.error('GitHub connection check failed', error);
      return false;
    }
  }

  /**
   * Collect branch protection evidence
   * SOC 2 Control: CC8.1 (Change Management)
   */
  async collectBranchProtectionEvidence(config?: any) {
    const clientConfig = this.getClientConfig(config);
    const owner =
      clientConfig?.owner || this.configService.get('GITHUB_OWNER', '');
    const repos = clientConfig?.repos || [];
    const token = clientConfig?.token;

    this.logger.log(
      `Collecting branch protection evidence for ${owner} across ${repos.length} repos...`,
    );
    const octokit = this.getOctokit(token);
    const allReposResults: {
      repo: string;
      totalMain: number;
      protectedMain: number;
    }[] = [];

    for (const repo of repos) {
      try {
        const branches = await octokit.repos.listBranches({ owner, repo });
        const status: { branchName: string; protected: boolean }[] = [];
        for (const branch of branches.data) {
          try {
            const protection = await octokit.repos.getBranchProtection({
              owner,
              repo,
              branch: branch.name,
            });
            status.push({ branchName: branch.name, protected: true });
          } catch (e) {
            status.push({ branchName: branch.name, protected: false });
          }
        }

        const main = status.filter((b) =>
          ['main', 'master', 'production'].includes(b.branchName),
        );
        const protectedMain = main.filter((b) => b.protected);
        allReposResults.push({
          repo,
          totalMain: main.length,
          protectedMain: protectedMain.length,
        });

        // Small delay between repos to avoid burst rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        allReposResults.push({ repo, totalMain: 0, protectedMain: 0 });
      }
    }

    const totalMainBranches = allReposResults.reduce(
      (sum, r) => sum + r.totalMain,
      0,
    );
    const protectedMainBranches = allReposResults.reduce(
      (sum, r) => sum + r.protectedMain,
      0,
    );
    const complianceRate =
      totalMainBranches > 0 ? protectedMainBranches / totalMainBranches : 1;

    return {
      type: 'BRANCH_PROTECTION',
      timestamp: new Date(),
      data: {
        owner,
        totalRepos: repos.length,
        totalMainBranches,
        protectedMainBranches,
        complianceRate,
      },
      status: complianceRate === 1 ? 'PASS' : 'FAIL',
    };
  }

  /**
   * Collect commit signing evidence
   * SOC 2 Control: CC6.2 (Authentication)
   */
  async collectCommitSigningEvidence(config?: any) {
    const clientConfig = this.getClientConfig(config);
    const owner =
      clientConfig?.owner || this.configService.get('GITHUB_OWNER', '');
    const repos = clientConfig?.repos || [];
    const token = clientConfig?.token;

    this.logger.log(
      `Collecting commit signing evidence for ${owner} across ${repos.length} repos...`,
    );
    const octokit = this.getOctokit(token);
    const allReposResults: { repo: string; total: number; verified: number }[] =
      [];

    for (const repo of repos) {
      try {
        const commits = await octokit.repos.listCommits({
          owner,
          repo,
          per_page: 20,
        });
        const verified = commits.data.filter(
          (c) => c.commit.verification?.verified,
        ).length;
        allReposResults.push({ repo, total: commits.data.length, verified });
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (e) {
        allReposResults.push({ repo, total: 0, verified: 0 });
      }
    }

    const totalCommits = allReposResults.reduce((sum, r) => sum + r.total, 0);
    const signedCommits = allReposResults.reduce(
      (sum, r) => sum + r.verified,
      0,
    );
    const signingRate = totalCommits > 0 ? signedCommits / totalCommits : 0;

    return {
      type: 'COMMIT_SIGNING',
      timestamp: new Date(),
      data: {
        owner,
        totalRepos: repos.length,
        totalCommits,
        signedCommits,
        signingRate,
      },
      status: signingRate >= 0.8 ? 'PASS' : 'WARNING',
    };
  }

  /**
   * Collect repository security evidence
   * SOC 2 Control: CC7.2 (System Monitoring)
   */
  async collectSecurityEvidence(config?: any) {
    const clientConfig = this.getClientConfig(config);
    const owner =
      clientConfig?.owner || this.configService.get('GITHUB_OWNER', '');
    const repos = clientConfig?.repos || [];
    const token = clientConfig?.token;

    this.logger.log(
      `Collecting security evidence for ${owner} across ${repos.length} repos...`,
    );
    const octokit = this.getOctokit(token);
    const allReposResults: { repo: string; score: number }[] = [];

    for (const repo of repos) {
      try {
        const [repository, vulnerabilityAlerts] = await Promise.all([
          octokit.repos.get({ owner, repo }),
          octokit.repos
            .checkVulnerabilityAlerts({ owner, repo })
            .catch(() => ({ status: 404 })),
        ]);

        const securityFeatures = {
          vulnerabilityAlertsEnabled: vulnerabilityAlerts.status === 204,
          hasSecurityPolicy:
            (repository.data as any).security_and_analysis?.secret_scanning
              ?.status === 'enabled',
          privateRepo: repository.data.private,
        };

        allReposResults.push({
          repo,
          score:
            Object.values(securityFeatures).filter(Boolean).length /
            Object.keys(securityFeatures).length,
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        allReposResults.push({ repo, score: 0 });
      }
    }

    const securityScore =
      allReposResults.length > 0
        ? allReposResults.reduce((sum, r) => sum + r.score, 0) /
          allReposResults.length
        : 0;

    return {
      type: 'REPOSITORY_SECURITY',
      timestamp: new Date(),
      data: {
        owner,
        totalRepos: repos.length,
        securityScore,
      },
      status: securityScore >= 0.75 ? 'PASS' : 'WARNING',
    };
  }

  /**
   * Calculate overall health score for GitHub integration
   */
  async calculateHealthScore(config?: any): Promise<number> {
    try {
      const [branchProtection, commitSigning, security] = await Promise.all([
        this.collectBranchProtectionEvidence(config),
        this.collectCommitSigningEvidence(config),
        this.collectSecurityEvidence(config),
      ]);

      const scores = [
        branchProtection.data.complianceRate,
        commitSigning.data.signingRate,
        security.data.securityScore,
      ];

      const healthScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;

      this.logger.log(
        `GitHub health score calculated across all repos: ${(healthScore * 100).toFixed(2)}%`,
      );

      return healthScore;
    } catch (error) {
      this.logger.error('Failed to calculate GitHub health score:', error);
      return 0;
    }
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.getState(),
      failureCount: this.circuitBreaker.getFailureCount(),
    };
  }
}

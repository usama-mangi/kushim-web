import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { retryWithBackoff, CircuitBreaker } from '../../common/utils/retry.util';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly circuitBreaker = new CircuitBreaker();
  private defaultOctokit: Octokit;

  constructor(private configService: ConfigService) {
    const token = this.configService.get('GITHUB_TOKEN', '');
    this.defaultOctokit = new Octokit({ auth: token });
  }

  private getOctokit(token?: string): Octokit {
    if (!token) return this.defaultOctokit;
    return new Octokit({ auth: token });
  }

  /**
   * Check connection validity (Health Check)
   */
  async checkConnection(token?: string): Promise<boolean> {
    try {
      const octokit = this.getOctokit(token);
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
  async collectBranchProtectionEvidence(owner: string, repo: string, token?: string) {
    this.logger.log(`Collecting branch protection evidence for ${owner}/${repo}...`);
    const octokit = this.getOctokit(token);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const branches = await octokit.repos.listBranches({
          owner,
          repo,
        });

        const branchProtectionStatus = await Promise.all(
          branches.data.map(async (branch) => {
            try {
              const protection = await octokit.repos.getBranchProtection({
                owner,
                repo,
                branch: branch.name,
              });

              return {
                branchName: branch.name,
                protected: true,
                requiresReviews: protection.data.required_pull_request_reviews !== null,
                requiredReviewers: protection.data.required_pull_request_reviews
                  ?.required_approving_review_count || 0,
                requiresSignedCommits: protection.data.required_signatures?.enabled || false,
                enforceAdmins: protection.data.enforce_admins?.enabled || false,
              };
            } catch (error) {
              // Branch not protected
              return {
                branchName: branch.name,
                protected: false,
                requiresReviews: false,
                requiredReviewers: 0,
                requiresSignedCommits: false,
                enforceAdmins: false,
              };
            }
          }),
        );

        const mainBranches = branchProtectionStatus.filter((b) =>
          ['main', 'master', 'production'].includes(b.branchName),
        );
        const protectedMainBranches = mainBranches.filter((b) => b.protected);

        const complianceRate =
          mainBranches.length > 0
            ? protectedMainBranches.length / mainBranches.length
            : 1;

        this.logger.log(
          `Branch protection evidence collected: ${protectedMainBranches.length}/${mainBranches.length} main branches protected`,
        );

        return {
          type: 'BRANCH_PROTECTION',
          timestamp: new Date(),
          data: {
            repository: `${owner}/${repo}`,
            totalBranches: branches.data.length,
            mainBranches: mainBranches.length,
            protectedMainBranches: protectedMainBranches.length,
            complianceRate,
            branches: branchProtectionStatus,
          },
          status: complianceRate === 1 ? 'PASS' : 'FAIL',
        };
      });
    });
  }

  /**
   * Collect commit signing evidence
   * SOC 2 Control: CC6.2 (Authentication)
   */
  async collectCommitSigningEvidence(owner: string, repo: string, token?: string) {
    this.logger.log(`Collecting commit signing evidence for ${owner}/${repo}...`);
    const octokit = this.getOctokit(token);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const commits = await octokit.repos.listCommits({
          owner,
          repo,
          per_page: 100,
        });

        const commitSigningStatus = commits.data.map((commit) => ({
          sha: commit.sha,
          author: commit.commit.author?.name,
          message: commit.commit.message.split('\n')[0],
          verified: commit.commit.verification?.verified || false,
          reason: commit.commit.verification?.reason,
          date: commit.commit.author?.date,
        }));

        const totalCommits = commitSigningStatus.length;
        const signedCommits = commitSigningStatus.filter((c) => c.verified).length;
        const signingRate = totalCommits > 0 ? signedCommits / totalCommits : 0;

        this.logger.log(
          `Commit signing evidence collected: ${signedCommits}/${totalCommits} commits signed`,
        );

        return {
          type: 'COMMIT_SIGNING',
          timestamp: new Date(),
          data: {
            repository: `${owner}/${repo}`,
            totalCommits,
            signedCommits,
            unsignedCommits: totalCommits - signedCommits,
            signingRate,
            recentCommits: commitSigningStatus.slice(0, 20),
          },
          status: signingRate >= 0.8 ? 'PASS' : 'WARNING', // 80% threshold
        };
      });
    });
  }

  /**
   * Collect repository security evidence
   * SOC 2 Control: CC7.2 (System Monitoring)
   */
  async collectSecurityEvidence(owner: string, repo: string, token?: string) {
    this.logger.log(`Collecting security evidence for ${owner}/${repo}...`);
    const octokit = this.getOctokit(token);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const [repository, vulnerabilityAlerts] = await Promise.all([
          octokit.repos.get({ owner, repo }),
          octokit.repos.checkVulnerabilityAlerts({ owner, repo }).catch(() => ({
            status: 204,
          })),
        ]);

        const hasVulnerabilityAlerts = vulnerabilityAlerts.status === 204;

        const securityFeatures = {
          vulnerabilityAlertsEnabled: hasVulnerabilityAlerts,
          hasSecurityPolicy: repository.data.security_and_analysis?.secret_scanning?.status === 'enabled',
          dependabotEnabled: repository.data.security_and_analysis?.dependabot_security_updates?.status === 'enabled',
          privateRepo: repository.data.private,
        };

        const enabledFeatures = Object.values(securityFeatures).filter(Boolean).length;
        const totalFeatures = Object.keys(securityFeatures).length;
        const securityScore = enabledFeatures / totalFeatures;

        this.logger.log(
          `Security evidence collected: ${enabledFeatures}/${totalFeatures} features enabled`,
        );

        return {
          type: 'REPOSITORY_SECURITY',
          timestamp: new Date(),
          data: {
            repository: `${owner}/${repo}`,
            ...securityFeatures,
            securityScore,
          },
          status: securityScore >= 0.75 ? 'PASS' : 'WARNING',
        };
      });
    });
  }

  /**
   * Calculate overall health score for GitHub integration
   */
  async calculateHealthScore(owner: string, repo: string, token?: string): Promise<number> {
    try {
      const [branchProtection, commitSigning, security] = await Promise.all([
        this.collectBranchProtectionEvidence(owner, repo, token),
        this.collectCommitSigningEvidence(owner, repo, token),
        this.collectSecurityEvidence(owner, repo, token),
      ]);

      const scores = [
        branchProtection.data.complianceRate,
        commitSigning.data.signingRate,
        security.data.securityScore,
      ];

      const healthScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      this.logger.log(`GitHub health score calculated: ${(healthScore * 100).toFixed(2)}%`);

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

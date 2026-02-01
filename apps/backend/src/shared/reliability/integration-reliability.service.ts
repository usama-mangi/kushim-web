import { Injectable, Logger } from '@nestjs/common';
import { AwsService } from '../../integrations/aws/aws.service';
import { GitHubService } from '../../integrations/github/github.service';
import { OktaService } from '../../integrations/okta/okta.service';
import { JiraService } from '../../integrations/jira/jira.service';
import { SlackService } from '../../integrations/slack/slack.service';

export interface IntegrationHealth {
  integration: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  healthScore?: number;
  circuitBreakerState: string;
  failureCount: number;
  lastChecked: Date;
  details?: any;
}

export interface IntegrationReliabilityMetrics {
  totalIntegrations: number;
  healthyIntegrations: number;
  degradedIntegrations: number;
  unhealthyIntegrations: number;
  overallHealthScore: number;
  integrations: IntegrationHealth[];
}

@Injectable()
export class IntegrationReliabilityService {
  private readonly logger = new Logger(IntegrationReliabilityService.name);

  constructor(
    private awsService: AwsService,
    private githubService: GitHubService,
    private oktaService: OktaService,
    private jiraService: JiraService,
    private slackService: SlackService,
  ) {}

  /**
   * Check health of all integrations
   */
  async checkAllIntegrationsHealth(): Promise<IntegrationReliabilityMetrics> {
    this.logger.log('Checking health of all integrations...');

    const integrationChecks = await Promise.allSettled([
      this.checkAwsHealth(),
      this.checkGitHubHealth(),
      this.checkOktaHealth(),
      this.checkJiraHealth(),
      this.checkSlackHealth(),
    ]);

    const integrations: IntegrationHealth[] = integrationChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const integrationNames = ['aws', 'github', 'okta', 'jira', 'slack'];
        return {
          integration: integrationNames[index],
          status: 'unhealthy' as const,
          healthScore: 0,
          circuitBreakerState: 'OPEN',
          failureCount: 999,
          lastChecked: new Date(),
          details: { error: result.reason?.message || 'Unknown error' },
        };
      }
    });

    const healthyIntegrations = integrations.filter((i) => i.status === 'healthy').length;
    const degradedIntegrations = integrations.filter((i) => i.status === 'degraded').length;
    const unhealthyIntegrations = integrations.filter((i) => i.status === 'unhealthy').length;

    const overallHealthScore =
      integrations.reduce((sum, i) => sum + (i.healthScore || 0), 0) / integrations.length;

    this.logger.log(
      `Integration health check complete: ${healthyIntegrations} healthy, ${degradedIntegrations} degraded, ${unhealthyIntegrations} unhealthy`,
    );

    return {
      totalIntegrations: integrations.length,
      healthyIntegrations,
      degradedIntegrations,
      unhealthyIntegrations,
      overallHealthScore,
      integrations,
    };
  }

  /**
   * Check AWS integration health
   */
  private async checkAwsHealth(): Promise<IntegrationHealth> {
    try {
      const healthScore = await this.awsService.calculateHealthScore();
      const circuitBreaker = this.awsService.getCircuitBreakerStatus();

      return {
        integration: 'aws',
        status: this.determineStatus(healthScore, circuitBreaker.failureCount),
        healthScore,
        circuitBreakerState: circuitBreaker.state,
        failureCount: circuitBreaker.failureCount,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to check AWS health:', error);
      throw error;
    }
  }

  /**
   * Check GitHub integration health
   */
  private async checkGitHubHealth(): Promise<IntegrationHealth> {
    try {
      // For GitHub, we need owner/repo - using a placeholder for health check
      // In production, this would check configured repositories
      const circuitBreaker = this.githubService.getCircuitBreakerStatus();

      return {
        integration: 'github',
        status: circuitBreaker.state === 'OPEN' ? 'unhealthy' : 'healthy',
        healthScore: circuitBreaker.state === 'OPEN' ? 0 : 1,
        circuitBreakerState: circuitBreaker.state,
        failureCount: circuitBreaker.failureCount,
        lastChecked: new Date(),
        details: { note: 'Health check requires specific repository configuration' },
      };
    } catch (error) {
      this.logger.error('Failed to check GitHub health:', error);
      throw error;
    }
  }

  /**
   * Check Okta integration health
   */
  private async checkOktaHealth(): Promise<IntegrationHealth> {
    try {
      const healthScore = await this.oktaService.calculateHealthScore();
      const circuitBreaker = this.oktaService.getCircuitBreakerStatus();

      return {
        integration: 'okta',
        status: this.determineStatus(healthScore, circuitBreaker.failureCount),
        healthScore,
        circuitBreakerState: circuitBreaker.state,
        failureCount: circuitBreaker.failureCount,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to check Okta health:', error);
      throw error;
    }
  }

  /**
   * Check Jira integration health
   */
  private async checkJiraHealth(): Promise<IntegrationHealth> {
    try {
      const circuitBreaker = this.jiraService.getCircuitBreakerStatus();

      return {
        integration: 'jira',
        status: circuitBreaker.state === 'OPEN' ? 'unhealthy' : 'healthy',
        healthScore: circuitBreaker.state === 'OPEN' ? 0 : 1,
        circuitBreakerState: circuitBreaker.state,
        failureCount: circuitBreaker.failureCount,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to check Jira health:', error);
      throw error;
    }
  }

  /**
   * Check Slack integration health
   */
  private async checkSlackHealth(): Promise<IntegrationHealth> {
    try {
      const circuitBreaker = this.slackService.getCircuitBreakerStatus();

      return {
        integration: 'slack',
        status: circuitBreaker.state === 'OPEN' ? 'unhealthy' : 'healthy',
        healthScore: circuitBreaker.state === 'OPEN' ? 0 : 1,
        circuitBreakerState: circuitBreaker.state,
        failureCount: circuitBreaker.failureCount,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to check Slack health:', error);
      throw error;
    }
  }

  /**
   * Determine integration status based on health score and failure count
   */
  private determineStatus(
    healthScore: number,
    failureCount: number,
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (failureCount >= 5) {
      return 'unhealthy';
    }
    if (healthScore >= 0.8) {
      return 'healthy';
    }
    if (healthScore >= 0.5) {
      return 'degraded';
    }
    return 'unhealthy';
  }

  /**
   * Send health alerts to Slack if any integration is unhealthy
   */
  async sendHealthAlertsIfNeeded(metrics: IntegrationReliabilityMetrics): Promise<void> {
    const unhealthyIntegrations = metrics.integrations.filter(
      (i) => i.status === 'unhealthy' || i.status === 'degraded',
    );

    if (unhealthyIntegrations.length === 0) {
      return;
    }

    for (const integration of unhealthyIntegrations) {
      try {
        await this.slackService.sendIntegrationHealthWarning({
          integration: integration.integration,
          healthScore: integration.healthScore || 0,
          issues: [
            `Status: ${integration.status}`,
            `Circuit Breaker: ${integration.circuitBreakerState}`,
            `Failure Count: ${integration.failureCount}`,
            ...(integration.details ? [JSON.stringify(integration.details)] : []),
          ],
        });

        this.logger.log(`Sent health alert for ${integration.integration}`);
      } catch (error) {
        this.logger.error(`Failed to send health alert for ${integration.integration}:`, error);
      }
    }
  }

  /**
   * Get integration by name
   */
  getIntegrationService(name: string): any {
    const services: Record<string, any> = {
      aws: this.awsService,
      github: this.githubService,
      okta: this.oktaService,
      jira: this.jiraService,
      slack: this.slackService,
    };

    return services[name.toLowerCase()];
  }
}

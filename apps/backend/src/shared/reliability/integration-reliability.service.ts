import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AwsService } from '../../integrations/aws/aws.service';
import { GitHubService } from '../../integrations/github/github.service';
import { OktaService } from '../../integrations/okta/okta.service';
import { JiraService } from '../../integrations/jira/jira.service';
import { SlackService } from '../../integrations/slack/slack.service';
import { IntegrationType } from '@prisma/client';
import { decrypt } from '../utils/encryption.util';

export interface IntegrationHealth {
  integration: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  healthScore?: number;
  circuitBreaker: {
    state: string;
    failureCount: number;
  };
  lastChecked: Date;
  details?: any;
}

export interface IntegrationReliabilityMetrics {
  totalIntegrations: number;
  healthyIntegrations: number;
  degradedIntegrations: number;
  unhealthyIntegrations: number;
  averageHealthScore: number;
  integrations: Record<string, IntegrationHealth>;
}

@Injectable()
export class IntegrationReliabilityService {
  private readonly logger = new Logger(IntegrationReliabilityService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private awsService: AwsService,
    private githubService: GitHubService,
    private oktaService: OktaService,
    private jiraService: JiraService,
    private slackService: SlackService,
  ) {}

  /**
   * Check health of all integrations
   */
  async checkAllIntegrationsHealth(customerId: string): Promise<IntegrationReliabilityMetrics> {
    this.logger.log(`Checking health of all integrations for customer ${customerId}...`);

    const integrationChecks = await Promise.allSettled([
      this.checkAwsHealth(customerId),
      this.checkGitHubHealth(customerId),
      this.checkOktaHealth(customerId),
      this.checkJiraHealth(customerId),
      this.checkSlackHealth(customerId),
    ]);

    const integrationList: IntegrationHealth[] = integrationChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const integrationNames = ['aws', 'github', 'okta', 'jira', 'slack'];
        return {
          integration: integrationNames[index],
          status: 'unhealthy' as const,
          healthScore: 0,
          circuitBreaker: {
            state: 'OPEN',
            failureCount: 999,
          },
          lastChecked: new Date(),
          details: { error: result.reason?.message || 'Unknown error' },
        };
      }
    });

    const healthyIntegrations = integrationList.filter((i) => i.status === 'healthy').length;
    const degradedIntegrations = integrationList.filter((i) => i.status === 'degraded').length;
    const unhealthyIntegrations = integrationList.filter((i) => i.status === 'unhealthy').length;

    const averageHealthScore =
      integrationList.reduce((sum, i) => sum + (i.healthScore || 0), 0) / integrationList.length;

    // Convert list to object map
    const integrationsMap: Record<string, IntegrationHealth> = {};
    integrationList.forEach((i) => {
      integrationsMap[i.integration] = i;
    });

    this.logger.log(
      `Integration health check complete: ${healthyIntegrations} healthy, ${degradedIntegrations} degraded, ${unhealthyIntegrations} unhealthy`,
    );

    return {
      totalIntegrations: integrationList.length,
      healthyIntegrations,
      degradedIntegrations,
      unhealthyIntegrations,
      averageHealthScore,
      integrations: integrationsMap,
    };
  }

  /**
   * Decrypt sensitive fields in integration config
   */
  private decryptConfig(config: any): any {
    if (!config) return config;
    const decrypted = { ...config };
    const sensitiveKeys = [
      'personalAccessToken',
      'token',
      'secretAccessKey',
      'apiToken',
      'webhookUrl',
      'secret',
    ];

    for (const key of sensitiveKeys) {
      if (decrypted[key] && typeof decrypted[key] === 'string' && decrypted[key].includes(':')) {
        try {
          decrypted[key] = decrypt(decrypted[key]);
        } catch (error) {
          this.logger.error(`Failed to decrypt field ${key}:`, error.message);
        }
      }
    }
    return decrypted;
  }

  /**
   * Check AWS integration health
   */
  private async checkAwsHealth(customerId: string): Promise<IntegrationHealth> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { customerId, type: IntegrationType.AWS }
      });

      if (!integration) {
        return {
          integration: 'aws',
          status: 'unhealthy',
          healthScore: 0,
          circuitBreaker: { state: 'CLOSED', failureCount: 0 },
          lastChecked: new Date(),
          details: { note: 'No integration configured' }
        };
      }

      const config = this.decryptConfig(integration.config);
      const healthScore = await this.awsService.calculateHealthScore(config);
      const circuitBreaker = this.awsService.getCircuitBreakerStatus();

      return {
        integration: 'aws',
        status: this.determineStatus(healthScore, circuitBreaker.failureCount),
        healthScore,
        circuitBreaker: {
            state: circuitBreaker.state,
            failureCount: circuitBreaker.failureCount
        },
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
  private async checkGitHubHealth(customerId: string): Promise<IntegrationHealth> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { customerId, type: IntegrationType.GITHUB }
      });

      if (!integration) {
        return {
          integration: 'github',
          status: 'unhealthy',
          healthScore: 0,
          circuitBreaker: { state: 'CLOSED', failureCount: 0 },
          lastChecked: new Date(),
          details: { note: 'No integration configured' }
        };
      }

      const config = this.decryptConfig(integration.config);
      const circuitBreaker = this.githubService.getCircuitBreakerStatus();
      
      const healthScore = await this.githubService.calculateHealthScore(config);
      const status = this.determineStatus(healthScore, circuitBreaker.failureCount);

      return {
        integration: 'github',
        status,
        healthScore,
        circuitBreaker: {
            state: circuitBreaker.state,
            failureCount: circuitBreaker.failureCount
        },
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to check GitHub health:', error);
      throw error;
    }
  }

  /**
   * Check Okta integration health
   */
  private async checkOktaHealth(customerId: string): Promise<IntegrationHealth> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { customerId, type: IntegrationType.OKTA }
      });

      if (!integration) {
        return {
          integration: 'okta',
          status: 'unhealthy',
          healthScore: 0,
          circuitBreaker: { state: 'CLOSED', failureCount: 0 },
          lastChecked: new Date(),
          details: { note: 'No integration configured' }
        };
      }

      const config = this.decryptConfig(integration.config);
      const healthScore = await this.oktaService.calculateHealthScore(config);
      const circuitBreaker = this.oktaService.getCircuitBreakerStatus();

      return {
        integration: 'okta',
        status: this.determineStatus(healthScore, circuitBreaker.failureCount),
        healthScore,
        circuitBreaker: {
            state: circuitBreaker.state,
            failureCount: circuitBreaker.failureCount
        },
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
  private async checkJiraHealth(customerId: string): Promise<IntegrationHealth> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { customerId, type: IntegrationType.JIRA }
      });

      if (!integration) {
        return {
          integration: 'jira',
          status: 'unhealthy',
          healthScore: 0,
          circuitBreaker: { state: 'CLOSED', failureCount: 0 },
          lastChecked: new Date(),
          details: { note: 'No integration configured' }
        };
      }

      const config = this.decryptConfig(integration.config);
      const circuitBreaker = this.jiraService.getCircuitBreakerStatus();
      const isConnected = await this.jiraService.checkConnection(config);
      
      const status = isConnected && circuitBreaker.state !== 'OPEN' ? 'healthy' : 'unhealthy';

      return {
        integration: 'jira',
        status,
        healthScore: status === 'healthy' ? 1 : 0,
        circuitBreaker: {
            state: circuitBreaker.state,
            failureCount: circuitBreaker.failureCount
        },
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
  private async checkSlackHealth(customerId: string): Promise<IntegrationHealth> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: { customerId, type: IntegrationType.SLACK }
      });

      if (!integration) {
        return {
          integration: 'slack',
          status: 'unhealthy',
          healthScore: 0,
          circuitBreaker: { state: 'CLOSED', failureCount: 0 },
          lastChecked: new Date(),
          details: { note: 'No integration configured' }
        };
      }

      const config = this.decryptConfig(integration.config);
      const circuitBreaker = this.slackService.getCircuitBreakerStatus();
      const isConnected = await this.slackService.checkConnection(config.webhookUrl);

      const status = isConnected && circuitBreaker.state !== 'OPEN' ? 'healthy' : 'unhealthy';

      return {
        integration: 'slack',
        status,
        healthScore: status === 'healthy' ? 1 : 0,
        circuitBreaker: {
            state: circuitBreaker.state,
            failureCount: circuitBreaker.failureCount
        },
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
    // metrics.integrations is now a Record, need to convert to array for filtering
    const integrationList = Object.values(metrics.integrations);
    const unhealthyIntegrations = integrationList.filter(
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
            `Circuit Breaker: ${integration.circuitBreaker.state}`,
            `Failure Count: ${integration.circuitBreaker.failureCount}`,
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

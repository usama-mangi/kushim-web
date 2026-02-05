import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  retryWithBackoff,
  CircuitBreaker,
} from '../../common/utils/retry.util';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly circuitBreaker = new CircuitBreaker();
  private defaultWebhookUrl: string;

  constructor(private configService: ConfigService) {
    this.defaultWebhookUrl = this.configService.get('SLACK_WEBHOOK_URL', '');
  }

  private getWebhookUrl(webhookUrl?: string): string {
    return webhookUrl || this.defaultWebhookUrl;
  }

  /**
   * Check connection validity (by sending a test message if desired, or just simple check)
   * Note: Incoming Webhooks don't have a simple "ping" endpoint, but we can assume if the URL is set it's "connected" until we fail to send.
   * However, let's just return true if URL is present.
   */
  async checkConnection(webhookUrl?: string): Promise<boolean> {
    const url = this.getWebhookUrl(webhookUrl);
    return !!url;
  }

  /**
   * Send alert notification to Slack
   * SOC 2 Control: CC7.3 (Incident Response)
   */
  async sendAlert(data: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    controlId?: string;
    evidenceId?: string;
    webhookUrl?: string;
  }) {
    this.logger.log(`Sending Slack alert: ${data.title}...`);
    const url = this.getWebhookUrl(data.webhookUrl);

    if (!url) {
      this.logger.warn('No Slack Webhook URL configured, skipping alert.');
      return { status: 'SKIPPED' };
    }

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const color = {
          info: '#36a64f',
          warning: '#ff9900',
          error: '#ff0000',
        }[data.severity];

        const payload = {
          attachments: [
            {
              color,
              title: data.title,
              text: data.message,
              fields: [
                ...(data.controlId
                  ? [
                      {
                        title: 'Control ID',
                        value: data.controlId,
                        short: true,
                      },
                    ]
                  : []),
                ...(data.evidenceId
                  ? [
                      {
                        title: 'Evidence ID',
                        value: data.evidenceId,
                        short: true,
                      },
                    ]
                  : []),
                {
                  title: 'Severity',
                  value: data.severity.toUpperCase(),
                  short: true,
                },
                {
                  title: 'Timestamp',
                  value: new Date().toISOString(),
                  short: true,
                },
              ],
              footer: 'Kushim Compliance Platform',
              footer_icon:
                'https://platform.slack-edge.com/img/default_application_icon.png',
            },
          ],
        };

        await axios.post(url, payload);

        this.logger.log(`Slack alert sent: ${data.title}`);

        return {
          type: 'SLACK_ALERT_SENT',
          timestamp: new Date(),
          data: {
            title: data.title,
            severity: data.severity,
          },
          status: 'SUCCESS',
        };
      });
    });
  }

  /**
   * Send daily compliance summary to Slack
   */
  async sendDailySummary(data: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    complianceRate: number;
    webhookUrl?: string;
  }) {
    this.logger.log('Sending daily compliance summary to Slack...');

    const emoji =
      data.complianceRate >= 0.9 ? ':white_check_mark:' : ':warning:';

    return await this.sendAlert({
      title: `${emoji} Daily Compliance Summary`,
      message: `Compliance Rate: ${(data.complianceRate * 100).toFixed(1)}%\n\nTotal Checks: ${data.totalChecks}\nPassed: ${data.passedChecks}\nFailed: ${data.failedChecks}\nWarnings: ${data.warningChecks}`,
      severity: data.complianceRate >= 0.9 ? 'info' : 'warning',
      webhookUrl: data.webhookUrl,
    });
  }

  /**
   * Send integration health warning to Slack
   */
  async sendIntegrationHealthWarning(data: {
    integration: string;
    healthScore: number;
    issues: string[];
    webhookUrl?: string;
  }) {
    this.logger.log(
      `Sending integration health warning for ${data.integration}...`,
    );

    return await this.sendAlert({
      title: `:warning: ${data.integration} Integration Health Warning`,
      message: `Health Score: ${(data.healthScore * 100).toFixed(1)}%\n\nIssues:\n${data.issues.map((i) => `• ${i}`).join('\n')}`,
      severity: 'warning',
      webhookUrl: data.webhookUrl,
    });
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

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CustomLoggerService } from '../logger/logger.service';

export interface AlertPayload {
  title: string;
  message: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  context?: Record<string, any>;
}

export interface SlackAttachment {
  color: string;
  title: string;
  text: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  ts?: number;
}

@Injectable()
export class AlertsService {
  private slackWebhookUrl: string;
  private alertThresholds = {
    errorRate: 5, // 5% error rate threshold
    responseTime: 500, // 500ms response time threshold
  };

  constructor(private readonly logger: CustomLoggerService) {
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || '';
  }

  async sendAlert(payload: AlertPayload): Promise<void> {
    try {
      // Send to Slack
      if (this.slackWebhookUrl) {
        await this.sendSlackAlert(payload);
      }

      // Send email for critical alerts
      if (payload.severity === 'critical') {
        await this.sendEmailAlert(payload);
      }

      // Log the alert
      this.logger.warn(`[ALERT] ${payload.title}: ${payload.message}`, payload.context);
    } catch (error) {
      this.logger.error('Failed to send alert', error.message, {
        alert: payload,
      });
    }
  }

  private async sendSlackAlert(payload: AlertPayload): Promise<void> {
    const color = this.getSeverityColor(payload.severity);
    const emoji = this.getSeverityEmoji(payload.severity);

    const attachment: SlackAttachment = {
      color,
      title: `${emoji} ${payload.title}`,
      text: payload.message,
      footer: 'Kushim Monitoring',
      ts: Math.floor(Date.now() / 1000),
    };

    // Add context fields if provided
    if (payload.context) {
      attachment.fields = Object.entries(payload.context).map(([key, value]) => ({
        title: key,
        value: String(value),
        short: true,
      }));
    }

    await axios.post(this.slackWebhookUrl, {
      username: 'Kushim Alerts',
      icon_emoji: ':rotating_light:',
      attachments: [attachment],
    });
  }

  private async sendEmailAlert(payload: AlertPayload): Promise<void> {
    // Implement email sending logic here
    // This would integrate with the email service
    this.logger.log('Email alert would be sent', { payload });
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      critical: '#FF0000', // Red
      error: '#FF6600', // Orange
      warning: '#FFCC00', // Yellow
      info: '#0099FF', // Blue
    };
    return colors[severity] || colors.info;
  }

  private getSeverityEmoji(severity: string): string {
    const emojis = {
      critical: '🚨',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return emojis[severity] || emojis.info;
  }

  // Predefined alert methods
  async alertHighErrorRate(errorRate: number, context?: Record<string, any>): Promise<void> {
    if (errorRate > this.alertThresholds.errorRate) {
      await this.sendAlert({
        title: 'High Error Rate Detected',
        message: `Error rate is ${errorRate.toFixed(2)}% (threshold: ${this.alertThresholds.errorRate}%)`,
        severity: errorRate > 10 ? 'critical' : 'error',
        context: {
          ...context,
          errorRate: `${errorRate.toFixed(2)}%`,
          threshold: `${this.alertThresholds.errorRate}%`,
        },
      });
    }
  }

  async alertSlowResponse(avgResponseTime: number, endpoint: string): Promise<void> {
    if (avgResponseTime > this.alertThresholds.responseTime) {
      await this.sendAlert({
        title: 'Slow Response Time Detected',
        message: `Average response time is ${avgResponseTime}ms for ${endpoint}`,
        severity: avgResponseTime > 1000 ? 'error' : 'warning',
        context: {
          endpoint,
          avgResponseTime: `${avgResponseTime}ms`,
          threshold: `${this.alertThresholds.responseTime}ms`,
        },
      });
    }
  }

  async alertDatabaseConnectionFailure(error: string): Promise<void> {
    await this.sendAlert({
      title: 'Database Connection Failure',
      message: 'Unable to connect to the database',
      severity: 'critical',
      context: {
        error,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async alertRedisConnectionFailure(error: string): Promise<void> {
    await this.sendAlert({
      title: 'Redis Connection Failure',
      message: 'Unable to connect to Redis',
      severity: 'critical',
      context: {
        error,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async alertIntegrationFailure(integration: string, error: string): Promise<void> {
    await this.sendAlert({
      title: `${integration} Integration Failure`,
      message: `Failed to connect to ${integration}`,
      severity: 'error',
      context: {
        integration,
        error,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async alertSecurityEvent(event: string, context?: Record<string, any>): Promise<void> {
    await this.sendAlert({
      title: 'Security Event',
      message: event,
      severity: 'critical',
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async alertComplianceCheckFailure(
    controlId: string,
    reason: string,
    context?: Record<string, any>,
  ): Promise<void> {
    await this.sendAlert({
      title: 'Compliance Check Failed',
      message: `Control ${controlId} failed: ${reason}`,
      severity: 'warning',
      context: {
        ...context,
        controlId,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

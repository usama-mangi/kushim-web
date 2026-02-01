import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';
import { retryWithBackoff, CircuitBreaker } from '../../common/utils/retry.util';

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
  };
}

@Injectable()
export class JiraService {
  private readonly logger = new Logger(JiraService.name);
  private readonly circuitBreaker = new CircuitBreaker();
  private jiraClient: AxiosInstance;
  private jiraDomain: string;

  constructor(private configService: ConfigService) {
    this.jiraDomain = this.configService.get('JIRA_DOMAIN', '');
    const email = this.configService.get('JIRA_EMAIL', '');
    const apiToken = this.configService.get('JIRA_API_TOKEN', '');

    this.jiraClient = axios.create({
      baseURL: `https://${this.jiraDomain}/rest/api/3`,
      auth: {
        username: email,
        password: apiToken,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a Jira ticket for a failed compliance control
   * This is the SECRET WEAPON - automatic remediation tracking!
   * SOC 2 Control: CC7.3 (Issue Remediation)
   */
  async createRemediationTicket(data: {
    controlId: string;
    controlTitle: string;
    failureReason: string;
    evidenceId: string;
    projectKey: string;
  }) {
    this.logger.log(`Creating Jira remediation ticket for control ${data.controlId}...`);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const response = await this.jiraClient.post('/issue', {
          fields: {
            project: {
              key: data.projectKey,
            },
            summary: `[Compliance] ${data.controlTitle} - Failed`,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: `Compliance control ${data.controlId} has failed and requires remediation.`,
                      marks: [{ type: 'strong' }],
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: `Failure Reason: ${data.failureReason}`,
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: `Evidence ID: ${data.evidenceId}`,
                    },
                  ],
                },
              ],
            },
            issuetype: {
              name: 'Task',
            },
            labels: ['compliance', 'automated', data.controlId],
            priority: {
              name: 'High',
            },
          },
        });

        const issue: JiraIssue = response.data;

        this.logger.log(`Created Jira ticket ${issue.key} for control ${data.controlId}`);

        return {
          type: 'JIRA_TICKET_CREATED',
          timestamp: new Date(),
          data: {
            issueKey: issue.key,
            issueId: issue.id,
            controlId: data.controlId,
            url: `https://${this.jiraDomain}/browse/${issue.key}`,
          },
          status: 'SUCCESS',
        };
      });
    });
  }

  /**
   * Update an existing Jira ticket status
   */
  async updateTicketStatus(issueKey: string, status: string) {
    this.logger.log(`Updating Jira ticket ${issueKey} status to ${status}...`);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        // Get available transitions
        const transitionsResponse = await this.jiraClient.get(
          `/issue/${issueKey}/transitions`,
        );

        const transition = transitionsResponse.data.transitions.find(
          (t: any) => t.name.toLowerCase() === status.toLowerCase(),
        );

        if (!transition) {
          throw new Error(`Transition to status "${status}" not found`);
        }

        await this.jiraClient.post(`/issue/${issueKey}/transitions`, {
          transition: {
            id: transition.id,
          },
        });

        this.logger.log(`Updated Jira ticket ${issueKey} to status ${status}`);

        return {
          type: 'JIRA_TICKET_UPDATED',
          timestamp: new Date(),
          data: {
            issueKey,
            newStatus: status,
          },
          status: 'SUCCESS',
        };
      });
    });
  }

  /**
   * Sync ticket status from Jira
   */
  async syncTicketStatus(issueKey: string) {
    this.logger.log(`Syncing Jira ticket ${issueKey} status...`);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const response = await this.jiraClient.get(`/issue/${issueKey}`);
        const issue: JiraIssue = response.data;

        this.logger.log(`Synced Jira ticket ${issueKey}: ${issue.fields.status.name}`);

        return {
          type: 'JIRA_TICKET_SYNCED',
          timestamp: new Date(),
          data: {
            issueKey: issue.key,
            issueId: issue.id,
            status: issue.fields.status.name,
            summary: issue.fields.summary,
            assignee: issue.fields.assignee?.displayName,
          },
          status: 'SUCCESS',
        };
      });
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

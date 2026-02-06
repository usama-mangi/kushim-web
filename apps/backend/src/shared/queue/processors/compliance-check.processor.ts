import { Processor, Process } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import {
  QueueName,
  ComplianceCheckJobType,
  EvidenceCollectionJobType,
} from '../queue.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { JiraService } from '../../../integrations/jira/jira.service';
import { SlackService } from '../../../integrations/slack/slack.service';
import { CheckStatus, Frequency, IntegrationType } from '@prisma/client';
import { decrypt } from '../../utils/encryption.util';

interface ComplianceCheckJobData {
  customerId: string;
  controlId: string;
  evidenceId?: string;
}

@Processor(QueueName.COMPLIANCE_CHECK)
export class ComplianceCheckProcessor {
  private readonly logger = new Logger(ComplianceCheckProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jiraService: JiraService,
    private readonly slackService: SlackService,
    @InjectQueue(QueueName.COMPLIANCE_CHECK) private complianceQueue: Queue,
    @InjectQueue(QueueName.EVIDENCE_COLLECTION) private evidenceQueue: Queue,
  ) {}

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
      if (
        decrypted[key] &&
        typeof decrypted[key] === 'string' &&
        decrypted[key].includes(':')
      ) {
        try {
          decrypted[key] = decrypt(decrypted[key]);
        } catch (error) {
          this.logger.error(`Failed to decrypt field ${key}:`, error.message);
        }
      }
    }
    return decrypted;
  }

  @Process(ComplianceCheckJobType.RUN_CHECK)
  async handleRunCheck(job: Job<ComplianceCheckJobData>) {
    const { customerId, controlId, evidenceId } = job.data;
    this.logger.log(
      `[Compliance Check] Running for control ${controlId} (job ${job.id})`,
    );

    try {
      // 1. Fetch control details
      const control = await this.prisma.control.findUnique({
        where: { id: controlId },
      });

      if (!control) {
        throw new Error(`Control ${controlId} not found`);
      }

      this.logger.log(
        `[Compliance Check] Control: ${control.controlId} - ${control.title}`,
      );

      // 2. Fetch evidence (specific ID or latest)
      let evidence;
      if (evidenceId) {
        this.logger.debug(`[Compliance Check] Using specific evidence: ${evidenceId}`);
        evidence = await this.prisma.evidence.findUnique({
          where: { id: evidenceId },
          include: { integration: true },
        });
      } else {
        this.logger.debug(`[Compliance Check] Finding latest evidence for control`);
        evidence = await this.prisma.evidence.findFirst({
          where: { customerId, controlId: control.id },
          orderBy: { collectedAt: 'desc' },
          include: { integration: true },
        });
      }

      if (!evidence) {
        // Trigger evidence collection if missing
        this.logger.warn(
          `[Compliance Check] No evidence found for control ${controlId}, triggering collection`,
        );

        // Find suitable integration for this control
        const targetType = control.integrationType || IntegrationType.AWS;

        const integration = await this.prisma.integration.findFirst({
          where: { customerId, status: 'ACTIVE', type: targetType },
        });

        if (integration) {
          const jobType = this.getJobTypeFromIntegration(integration.type);
          if (jobType) {
            await this.evidenceQueue.add(jobType, {
              customerId,
              integrationId: integration.id,
              controlId: control.id,
              type: jobType,
            });
            this.logger.log(
              `Triggered ${jobType} for control ${control.controlId}`,
            );
          } else {
            this.logger.warn(
              `No job type mapping for integration type ${integration.type}`,
            );
          }
        } else {
          this.logger.warn(
            `No active ${targetType} integration found for customer ${customerId} to collect evidence for ${control.controlId}`,
          );
        }

        return { success: false, message: 'Evidence collection triggered' };
      }

      this.logger.log(
        `[Compliance Check] Found evidence ${evidence.id} collected at ${evidence.collectedAt}`,
      );

      // 3. Evaluate Evidence
      // The collectors return data with a 'status' field (PASS/FAIL/WARNING)
      const evidenceData = evidence.data;
      
      if (!evidenceData.status) {
        this.logger.error(
          `[Compliance Check] Evidence ${evidence.id} missing status field. Data:`,
          evidenceData,
        );
      }
      
      const status: CheckStatus =
        evidenceData.status === 'PASS'
          ? CheckStatus.PASS
          : evidenceData.status === 'FAIL'
            ? CheckStatus.FAIL
            : CheckStatus.WARNING;

      this.logger.log(
        `[Compliance Check] Evidence status: ${evidenceData.status} → ${status}`,
      );

      const errorMessage =
        status !== CheckStatus.PASS
          ? `Compliance check ${status.toLowerCase()} based on evidence collected at ${evidence.collectedAt}`
          : null;

      // 4. Create ComplianceCheck Record
      const nextCheckAt = this.calculateNextCheck(control.frequency);

      this.logger.debug(
        `[Compliance Check] Creating ComplianceCheck record with status ${status}`,
      );

      const complianceCheck = await this.prisma.complianceCheck.create({
        data: {
          customerId,
          controlId: control.id,
          evidenceId: evidence.id,
          status,
          errorMessage,
          checkedAt: new Date(),
          nextCheckAt,
        },
      });

      this.logger.log(
        `[Compliance Check] ✅ Created ComplianceCheck ${complianceCheck.id} with status ${status}`,
      );

      // 5. Handle Failure Remediation
      if (status === CheckStatus.FAIL) {
        this.logger.log(
          `[Compliance Check] Triggering remediation for failed control`,
        );
        await this.handleRemediation(
          customerId,
          control,
          complianceCheck.id,
          evidence,
          evidenceData,
        );
      }

      this.logger.log(
        `[Compliance Check] ✅ Completed job ${job.id}. Status: ${status}, CheckId: ${complianceCheck.id}`,
      );
      return {
        success: true,
        jobId: job.id,
        status,
        checkId: complianceCheck.id,
      };
    } catch (error) {
      this.logger.error(
        `[Compliance Check] ❌ Failed for job ${job.id}:`,
        error.message,
      );
      this.logger.error(error.stack);
      throw error;
    }
  }

  @Process(ComplianceCheckJobType.SCHEDULE_CHECKS)
  async handleScheduleChecks(job: Job<{ customerId: string }>) {
    const { customerId } = job.data;
    this.logger.log(`Scheduling compliance checks for customer ${customerId}`);

    try {
      // Get customer's active frameworks
      const customerFrameworks = await this.prisma.customerFramework.findMany({
        where: { customerId },
        select: { frameworkId: true },
      });

      if (customerFrameworks.length === 0) {
        this.logger.warn(`Customer ${customerId} has no active frameworks`);
        return { success: false, message: 'No active frameworks found' };
      }

      const frameworkIds = customerFrameworks.map(cf => cf.frameworkId);

      // Get customer's active integrations
      const activeIntegrations = await this.prisma.integration.findMany({
        where: { customerId, status: 'ACTIVE' },
        select: { type: true },
      });

      const activeIntegrationTypes = new Set(activeIntegrations.map(i => i.type));
      this.logger.log(`Customer has active integrations: ${Array.from(activeIntegrationTypes).join(', ')}`);

      // Fetch controls for customer's frameworks
      const controls = await this.prisma.control.findMany({
        where: {
          frameworkId: { in: frameworkIds },
        },
      });

      this.logger.log(`Found ${controls.length} controls for customer ${customerId}`);

      let scheduledCount = 0;
      let skippedCount = 0;
      
      for (const control of controls) {
        // Skip controls that require integrations the customer doesn't have
        if (control.integrationType && !activeIntegrationTypes.has(control.integrationType)) {
          skippedCount++;
          this.logger.debug(`Skipping control ${control.controlId} - requires ${control.integrationType} integration`);
          continue;
        }

        // Check if we need to run a check (e.g., based on last check)
        const lastCheck = await this.prisma.complianceCheck.findFirst({
          where: { customerId, controlId: control.id },
          orderBy: { checkedAt: 'desc' },
        });

        const now = new Date();
        if (
          !lastCheck ||
          (lastCheck.nextCheckAt && lastCheck.nextCheckAt <= now)
        ) {
          await this.complianceQueue.add(ComplianceCheckJobType.RUN_CHECK, {
            customerId,
            controlId: control.id,
          });
          scheduledCount++;
          this.logger.debug(`Scheduled check for control ${control.controlId}`);
        }
      }

      this.logger.log(`Scheduled ${scheduledCount} compliance checks for customer ${customerId} (skipped ${skippedCount} due to missing integrations)`);
      return { success: true, jobId: job.id, scheduledCount, skippedCount };
    } catch (error) {
      this.logger.error(`Failed to schedule checks for job ${job.id}:`, error);
      throw error;
    }
  }

  private calculateNextCheck(frequency: Frequency): Date {
    const now = new Date();
    switch (frequency) {
      case Frequency.DAILY:
        return new Date(now.setDate(now.getDate() + 1));
      case Frequency.WEEKLY:
        return new Date(now.setDate(now.getDate() + 7));
      case Frequency.MONTHLY:
        return new Date(now.setMonth(now.getMonth() + 1));
      case Frequency.QUARTERLY:
        return new Date(now.setMonth(now.getMonth() + 3));
      case Frequency.ANNUAL:
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        return new Date(now.setDate(now.getDate() + 1));
    }
  }

  private async handleRemediation(
    customerId: string,
    control: any,
    checkId: string,
    evidence: any,
    evidenceData: any,
  ) {
    // A. Slack Alert
    // Get integration to find webhook if available for this customer
    const slackIntegration = await this.prisma.integration.findFirst({
      where: { customerId, type: IntegrationType.SLACK, status: 'ACTIVE' },
    });
    const slackConfig = slackIntegration
      ? this.decryptConfig(slackIntegration.config)
      : null;

    await this.slackService.sendAlert({
      title: `:rotating_light: Compliance Control Failed: ${control.title}`,
      message: `Control ${control.controlId} failed validation.\nReason: ${evidenceData.status}\nIntegration: ${evidence.integration.type}`,
      severity: 'error',
      controlId: control.controlId,
      evidenceId: evidence.id,
      webhookUrl: slackConfig?.webhookUrl,
    });

    // B. Jira Ticket (The Secret Weapon)
    // Check if an active Jira integration exists for this customer
    const jiraIntegration = await this.prisma.integration.findFirst({
      where: { customerId, type: IntegrationType.JIRA, status: 'ACTIVE' },
    });

    if (jiraIntegration) {
      const config = this.decryptConfig(jiraIntegration.config);

      // Check if we already have an open task for this failure to avoid duplicates?
      // For simplicity, create a new one for now (or could check JiraTasks table)

      try {
        const ticketResult = await this.jiraService.createRemediationTicket({
          controlId: control.controlId,
          controlTitle: control.title,
          failureReason: `Evidence validation failed. See dashbaord for details.`,
          evidenceId: evidence.id,
          projectKey: config.projectKey || 'SCRUM', // Default or from config
          config: {
            domain: config.domain,
            email: config.email,
            apiToken: config.apiToken,
          },
        });

        if (ticketResult.status === 'SUCCESS') {
          await this.prisma.jiraTask.create({
            data: {
              customerId,
              complianceCheckId: checkId,
              jiraIssueKey: ticketResult.data.issueKey,
              jiraIssueId: ticketResult.data.issueId,
              status: 'OPEN',
            },
          });
        }
      } catch (e) {
        this.logger.error(`Failed to create Jira remediation ticket`, e);
      }
    }
  }

  private getJobTypeFromIntegration(
    type: IntegrationType,
  ): EvidenceCollectionJobType | null {
    switch (type) {
      case IntegrationType.AWS:
        return EvidenceCollectionJobType.COLLECT_AWS;
      case IntegrationType.GITHUB:
        return EvidenceCollectionJobType.COLLECT_GITHUB;
      case IntegrationType.OKTA:
        return EvidenceCollectionJobType.COLLECT_OKTA;
      // JIRA and SLACK don't have collection jobs yet, or they use different queues
      default:
        return null;
    }
  }
}

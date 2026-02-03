import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { QueueName, EvidenceCollectionJobType } from '../queue.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { AwsService } from '../../../integrations/aws/aws.service';
import { GitHubService } from '../../../integrations/github/github.service';
import { OktaService } from '../../../integrations/okta/okta.service';
import * as crypto from 'crypto';
import { decrypt } from '../../utils/encryption.util';

interface EvidenceCollectionJobData {
  customerId: string;
  integrationId: string;
  controlId: string;
  type: EvidenceCollectionJobType;
}

@Processor(QueueName.EVIDENCE_COLLECTION)
export class EvidenceCollectionProcessor {
  private readonly logger = new Logger(EvidenceCollectionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AwsService,
    private readonly githubService: GitHubService,
    private readonly oktaService: OktaService,
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

  @Process(EvidenceCollectionJobType.COLLECT_AWS)
  async handleAwsCollection(job: Job<EvidenceCollectionJobData>) {
    const { customerId, integrationId, controlId } = job.data;
    this.logger.log(`Processing AWS evidence collection for customer ${customerId}, control ${controlId}`);
    
    try {
      const integration = await this.prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error(`Integration ${integrationId} not found`);
      }

      if (integration.customerId !== customerId) {
        throw new Error(`Integration ${integrationId} does not belong to customer ${customerId}`);
      }

      const control = await this.prisma.control.findUnique({
        where: { id: controlId },
      });

      if (!control) {
        throw new Error(`Control ${controlId} not found`);
      }

      let evidenceData: any;
      const credentials = this.decryptConfig(integration.config);

      switch (control.controlId) {
        case 'CC6.1':
        case 'CC6.1.1':
        case 'CC6.1.2':
        case 'CC6.1.5':
          if (control.title.includes('AWS')) {
             evidenceData = await this.awsService.collectIamEvidence(credentials);
          } else {
             evidenceData = await this.awsService.collectIamEvidence(credentials);
          }
          break;
        case 'CC6.7':
        case 'CC6.7.1':
        case 'CC6.7.2':
        case 'CC6.7.3':
          evidenceData = await this.awsService.collectS3Evidence(credentials);
          break;
        case 'CC7.2':
        case 'CC7.2.3':
        case 'CC7.2.4':
          evidenceData = await this.awsService.collectCloudTrailEvidence(credentials);
          break;
        default:
          this.logger.warn(`Unknown mapping for control ${control.controlId} in AWS, defaulting to IAM`);
          evidenceData = await this.awsService.collectIamEvidence(credentials);
      }

      const savedEvidence = await this.storeEvidence(
        customerId,
        controlId,
        integrationId,
        evidenceData,
        String(job.id)
      );

      this.logger.log(`Evidence collected and secured for control ${controlId}. Hash: ${savedEvidence.hash.substring(0, 8)}...`);
      return { success: true, evidenceId: savedEvidence.id };

    } catch (error) {
      this.logger.error(`Failed AWS evidence collection for job ${job.id}:`, error);
      throw error;
    }
  }

  @Process(EvidenceCollectionJobType.COLLECT_GITHUB)
  async handleGitHubCollection(job: Job<EvidenceCollectionJobData>) {
    const { customerId, integrationId, controlId } = job.data;
    this.logger.log(`Processing GitHub evidence collection for customer ${customerId}`);
    
    try {
      const integration = await this.prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || integration.customerId !== customerId) {
        throw new Error(`Integration ${integrationId} invalid`);
      }

      const control = await this.prisma.control.findUnique({
        where: { id: controlId },
      });

      if (!control) {
        throw new Error(`Control ${controlId} not found`);
      }

      let evidenceData: any;
      const config = this.decryptConfig(integration.config);

      if (control.controlId === 'CC7.2') {
          evidenceData = await this.githubService.collectBranchProtectionEvidence(config);
      } else {
          evidenceData = await this.githubService.collectBranchProtectionEvidence(config);
      }

      const savedEvidence = await this.storeEvidence(
        customerId,
        controlId,
        integrationId,
        evidenceData,
        String(job.id)
      );

      this.logger.log(`GitHub evidence collected: ${savedEvidence.id}`);
      return { success: true, jobId: job.id, evidenceId: savedEvidence.id };
    } catch (error) {
      this.logger.error(`Failed GitHub evidence collection for job ${job.id}:`, error);
      throw error;
    }
  }

  @Process(EvidenceCollectionJobType.COLLECT_OKTA)
  async handleOktaCollection(job: Job<EvidenceCollectionJobData>) {
    const { customerId, integrationId, controlId } = job.data;
    this.logger.log(`Processing Okta evidence collection for customer ${customerId}, control ${controlId}`);
    
    try {
      const integration = await this.prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || integration.customerId !== customerId) {
        throw new Error(`Integration ${integrationId} invalid`);
      }

      const control = await this.prisma.control.findUnique({
        where: { id: controlId },
      });

      if (!control) {
        throw new Error(`Control ${controlId} not found`);
      }

      const config = this.decryptConfig(integration.config);
      let evidenceData: any;

      switch (control.controlId) {
        case 'CC6.1':
        case 'CC6.1.3':
          evidenceData = await this.oktaService.collectMfaEnforcementEvidence(config);
          break;
        case 'CC6.2':
        case 'CC6.2.1':
        case 'CC6.2.2':
          evidenceData = await this.oktaService.collectUserAccessEvidence(config);
          break;
        case 'CC6.1.4':
          evidenceData = await this.oktaService.collectPolicyComplianceEvidence(config);
          break;
        default:
          this.logger.warn(`Unknown Okta mapping for ${control.controlId}, defaulting to User Access`);
          evidenceData = await this.oktaService.collectUserAccessEvidence(config);
      }

      const savedEvidence = await this.storeEvidence(
        customerId,
        controlId,
        integrationId,
        evidenceData,
        String(job.id)
      );

      this.logger.log(`Okta evidence collected: ${savedEvidence.id}`);
      return { success: true, jobId: job.id, evidenceId: savedEvidence.id };
    } catch (error) {
      this.logger.error(`Failed Okta evidence collection for job ${job.id}:`, error);
      throw error;
    }
  }

  private async storeEvidence(
    customerId: string,
    controlId: string,
    integrationId: string,
    originalData: any,
    jobId: string,
  ) {
    const now = new Date();
    const contentString = JSON.stringify(originalData);
    const contentBuffer = Buffer.from(contentString);
    const sizeInBytes = contentBuffer.length;
    const MAX_DB_SIZE = 100 * 1024;

    let storedData = originalData;
    let s3Key: string | null = null;

    if (sizeInBytes > MAX_DB_SIZE) {
      const timestamp = now.getTime();
      const key = `evidence/${customerId}/${controlId}/${timestamp}-${jobId}.json`;
      const uploadResult = await this.awsService.uploadEvidenceToS3(key, contentBuffer);
      
      if (uploadResult) {
        s3Key = key;
        storedData = {
          offloaded: true,
          reference: 's3',
          bucket: uploadResult.bucket,
          key: uploadResult.key,
          size: sizeInBytes,
          originalContentHash: crypto.createHash('sha256').update(contentBuffer).digest('hex'),
          summary: 'Evidence data offloaded to S3 due to size limit'
        };
      }
    }

    const contentToHash = JSON.stringify({
      customerId,
      controlId,
      data: storedData,
      timestamp: now.toISOString(),
    });
    const hash = crypto.createHash('sha256').update(contentToHash).digest('hex');

    const previousEvidence = await this.prisma.evidence.findFirst({
      where: { customerId, controlId },
      orderBy: { collectedAt: 'desc' },
    });

    const savedEvidence = await this.prisma.evidence.create({
      data: {
        customerId,
        controlId,
        integrationId,
        data: storedData,
        s3Key,
        hash,
        previousHash: previousEvidence?.hash || null,
        collectedAt: now,
      },
    });

    return savedEvidence;
  }
}

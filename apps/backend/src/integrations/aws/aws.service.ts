import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAMClient,
  ListUsersCommand,
  ListMFADevicesCommand,
} from '@aws-sdk/client-iam';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketEncryptionCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudTrailClient,
  LookupEventsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  retryWithBackoff,
  CircuitBreaker,
} from '../../common/utils/retry.util';

@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);
  private readonly circuitBreaker = new CircuitBreaker();
  private defaultIamClient: IAMClient;
  private defaultS3Client: S3Client;
  private defaultCloudTrailClient: CloudTrailClient;

  constructor(private configService: ConfigService) {
    const region = this.configService.get('AWS_REGION', 'us-east-1');
    const credentials = {
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', ''),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', ''),
    };

    this.defaultIamClient = new IAMClient({ region, credentials });
    this.defaultS3Client = new S3Client({ region, credentials });
    this.defaultCloudTrailClient = new CloudTrailClient({
      region,
      credentials,
    });
  }

  private getIamClient(credentials?: any): IAMClient {
    if (!credentials) return this.defaultIamClient;
    return new IAMClient({
      region: this.configService.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
  }

  private getS3Client(credentials?: any): S3Client {
    if (!credentials) return this.defaultS3Client;
    return new S3Client({
      region: this.configService.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
  }

  private getCloudTrailClient(credentials?: any): CloudTrailClient {
    if (!credentials) return this.defaultCloudTrailClient;
    return new CloudTrailClient({
      region: this.configService.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
  }

  private getClientConfig(config?: any) {
    if (!config) return null;
    return {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region:
        config.region || this.configService.get('AWS_REGION', 'us-east-1'),
    };
  }

  /**
   * Collect IAM evidence - Check MFA enforcement
   * SOC 2 Control: CC6.1 (Logical Access Controls)
   */
  async collectIamEvidence(config?: any) {
    this.logger.log('Collecting IAM evidence...');
    const credentials = this.getClientConfig(config);
    const client = this.getIamClient(credentials);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const users = await client.send(new ListUsersCommand({}));

        const userMfaStatus = await Promise.all(
          (users.Users || []).map(async (user) => {
            const mfaDevices = await client.send(
              new ListMFADevicesCommand({ UserName: user.UserName }),
            );

            return {
              userName: user.UserName,
              userId: user.UserId,
              hasMfa: (mfaDevices.MFADevices || []).length > 0,
              mfaDeviceCount: (mfaDevices.MFADevices || []).length,
              createdAt: user.CreateDate,
            };
          }),
        );

        const totalUsers = userMfaStatus.length;
        const usersWithMfa = userMfaStatus.filter((u) => u.hasMfa).length;
        const mfaComplianceRate =
          totalUsers > 0 ? usersWithMfa / totalUsers : 0;

        this.logger.log(
          `IAM evidence collected: ${usersWithMfa}/${totalUsers} users have MFA`,
        );

        return {
          type: 'IAM_MFA_ENFORCEMENT',
          timestamp: new Date(),
          data: {
            totalUsers,
            usersWithMfa,
            usersWithoutMfa: totalUsers - usersWithMfa,
            mfaComplianceRate,
            users: userMfaStatus,
          },
          status: mfaComplianceRate >= 0.9 ? 'PASS' : 'FAIL', // 90% threshold
        };
      });
    });
  }

  /**
   * Collect S3 evidence - Check bucket encryption
   * SOC 2 Control: CC6.7 (Encryption)
   */
  async collectS3Evidence(config?: any) {
    this.logger.log('Collecting S3 evidence...');
    const credentials = this.getClientConfig(config);
    const client = this.getS3Client(credentials);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const buckets = await client.send(new ListBucketsCommand({}));

        const bucketEncryptionStatus = await Promise.all(
          (buckets.Buckets || []).map(async (bucket) => {
            try {
              // Use the scoped client for each bucket check
              const encryption = await client.send(
                new GetBucketEncryptionCommand({ Bucket: bucket.Name }),
              );

              return {
                bucketName: bucket.Name,
                createdAt: bucket.CreationDate,
                encrypted: true,
                encryptionType:
                  encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
                    ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm,
              };
            } catch (error) {
              // NoSuchBucketEncryption error means bucket is not encrypted
              return {
                bucketName: bucket.Name,
                createdAt: bucket.CreationDate,
                encrypted: false,
                encryptionType: null,
              };
            }
          }),
        );

        const totalBuckets = bucketEncryptionStatus.length;
        const encryptedBuckets = bucketEncryptionStatus.filter(
          (b) => b.encrypted,
        ).length;
        const encryptionComplianceRate =
          totalBuckets > 0 ? encryptedBuckets / totalBuckets : 1;

        this.logger.log(
          `S3 evidence collected: ${encryptedBuckets}/${totalBuckets} buckets encrypted`,
        );

        return {
          type: 'S3_ENCRYPTION',
          timestamp: new Date(),
          data: {
            totalBuckets,
            encryptedBuckets,
            unencryptedBuckets: totalBuckets - encryptedBuckets,
            encryptionComplianceRate,
            buckets: bucketEncryptionStatus,
          },
          status: encryptionComplianceRate === 1 ? 'PASS' : 'FAIL', // 100% required
        };
      });
    });
  }

  /**
   * Upload evidence file to S3 storage
   * Used for large evidence payloads or files that shouldn't be stored in DB
   */
  async uploadEvidenceToS3(
    key: string,
    data: string | Buffer,
    contentType: string = 'application/json',
  ) {
    this.logger.log(`Uploading evidence to S3: ${key}`);
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');

    if (!bucketName) {
      this.logger.warn('AWS_S3_BUCKET_NAME not configured, skipping S3 upload');
      return null;
    }

    try {
      await this.defaultS3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: data,
          ContentType: contentType,
          ServerSideEncryption: 'AES256',
        }),
      );

      return {
        bucket: bucketName,
        key: key,
        url: `https://${bucketName}.s3.amazonaws.com/${key}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload evidence to S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Collect CloudTrail evidence - Check audit logging
   * SOC 2 Control: CC7.2 (System Monitoring)
   */
  async collectCloudTrailEvidence(config?: any) {
    this.logger.log('Collecting CloudTrail evidence...');
    const credentials = this.getClientConfig(config);
    const client = this.getCloudTrailClient(credentials);

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

        const events = await client.send(
          new LookupEventsCommand({
            StartTime: startTime,
            EndTime: endTime,
            MaxResults: 50,
          }),
        );

        const eventCount = (events.Events || []).length;
        const hasRecentActivity = eventCount > 0;

        this.logger.log(
          `CloudTrail evidence collected: ${eventCount} events in last 24h`,
        );

        return {
          type: 'CLOUDTRAIL_LOGGING',
          timestamp: new Date(),
          data: {
            eventCount,
            hasRecentActivity,
            timeRange: {
              start: startTime,
              end: endTime,
            },
            sampleEvents: (events.Events || []).slice(0, 10).map((e) => ({
              eventName: e.EventName,
              eventTime: e.EventTime,
              username: e.Username,
              eventSource: e.EventSource,
            })),
          },
          status: hasRecentActivity ? 'PASS' : 'WARNING',
        };
      });
    });
  }

  /**
   * Calculate overall health score for AWS integration
   */
  async calculateHealthScore(config?: any): Promise<number> {
    try {
      const [iamEvidence, s3Evidence, cloudTrailEvidence] = await Promise.all([
        this.collectIamEvidence(config),
        this.collectS3Evidence(config),
        this.collectCloudTrailEvidence(config),
      ]);

      const scores = [
        iamEvidence.data.mfaComplianceRate,
        s3Evidence.data.encryptionComplianceRate,
        cloudTrailEvidence.status === 'PASS' ? 1 : 0.5,
      ];

      const healthScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;

      this.logger.log(
        `AWS health score calculated: ${(healthScore * 100).toFixed(2)}%`,
      );

      return healthScore;
    } catch (error) {
      this.logger.error('Failed to calculate AWS health score:', error);
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

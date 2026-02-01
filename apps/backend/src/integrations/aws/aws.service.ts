import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAMClient,
  ListUsersCommand,
  GetUserCommand,
  ListMFADevicesCommand,
} from '@aws-sdk/client-iam';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CloudTrailClient,
  LookupEventsCommand,
} from '@aws-sdk/client-cloudtrail';
import { retryWithBackoff, CircuitBreaker } from '../../common/utils/retry.util';

@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);
  private readonly circuitBreaker = new CircuitBreaker();
  private iamClient: IAMClient;
  private s3Client: S3Client;
  private cloudTrailClient: CloudTrailClient;

  constructor(private configService: ConfigService) {
    const region = this.configService.get('AWS_REGION', 'us-east-1');
    const credentials = {
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', ''),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', ''),
    };

    this.iamClient = new IAMClient({ region, credentials });
    this.s3Client = new S3Client({ region, credentials });
    this.cloudTrailClient = new CloudTrailClient({ region, credentials });
  }

  /**
   * Collect IAM evidence - Check MFA enforcement
   * SOC 2 Control: CC6.1 (Logical Access Controls)
   */
  async collectIamEvidence() {
    this.logger.log('Collecting IAM evidence...');

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const users = await this.iamClient.send(new ListUsersCommand({}));
        
        const userMfaStatus = await Promise.all(
          (users.Users || []).map(async (user) => {
            const mfaDevices = await this.iamClient.send(
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
        const mfaComplianceRate = totalUsers > 0 ? usersWithMfa / totalUsers : 0;

        this.logger.log(`IAM evidence collected: ${usersWithMfa}/${totalUsers} users have MFA`);

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
  async collectS3Evidence() {
    this.logger.log('Collecting S3 evidence...');

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const buckets = await this.s3Client.send(new ListBucketsCommand({}));

        const bucketEncryptionStatus = await Promise.all(
          (buckets.Buckets || []).map(async (bucket) => {
            try {
              const encryption = await this.s3Client.send(
                new GetBucketEncryptionCommand({ Bucket: bucket.Name }),
              );

              return {
                bucketName: bucket.Name,
                createdAt: bucket.CreationDate,
                encrypted: true,
                encryptionType: encryption.ServerSideEncryptionConfiguration
                  ?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm,
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
        const encryptedBuckets = bucketEncryptionStatus.filter((b) => b.encrypted).length;
        const encryptionComplianceRate = totalBuckets > 0 ? encryptedBuckets / totalBuckets : 1;

        this.logger.log(`S3 evidence collected: ${encryptedBuckets}/${totalBuckets} buckets encrypted`);

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
   * Collect CloudTrail evidence - Check audit logging
   * SOC 2 Control: CC7.2 (System Monitoring)
   */
  async collectCloudTrailEvidence() {
    this.logger.log('Collecting CloudTrail evidence...');

    return await this.circuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

        const events = await this.cloudTrailClient.send(
          new LookupEventsCommand({
            StartTime: startTime,
            EndTime: endTime,
            MaxResults: 50,
          }),
        );

        const eventCount = (events.Events || []).length;
        const hasRecentActivity = eventCount > 0;

        this.logger.log(`CloudTrail evidence collected: ${eventCount} events in last 24h`);

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
  async calculateHealthScore(): Promise<number> {
    try {
      const [iamEvidence, s3Evidence, cloudTrailEvidence] = await Promise.all([
        this.collectIamEvidence(),
        this.collectS3Evidence(),
        this.collectCloudTrailEvidence(),
      ]);

      const scores = [
        iamEvidence.data.mfaComplianceRate,
        s3Evidence.data.encryptionComplianceRate,
        cloudTrailEvidence.status === 'PASS' ? 1 : 0.5,
      ];

      const healthScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      this.logger.log(`AWS health score calculated: ${(healthScore * 100).toFixed(2)}%`);

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

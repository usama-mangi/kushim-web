import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AwsService } from './aws.service';
import {
  IAMClient,
  ListUsersCommand,
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

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'AWS_REGION') return 'us-east-1';
    if (key === 'AWS_ACCESS_KEY_ID') return 'test-key';
    if (key === 'AWS_SECRET_ACCESS_KEY') return 'test-secret';
    return null;
  }),
};

// Since we don't have aws-sdk-client-mock installed, we'll use jest.mock
jest.mock('@aws-sdk/client-iam');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-cloudtrail');

describe('AwsService', () => {
  let service: AwsService;

  let mockIamSend: jest.Mock;
  let mockS3Send: jest.Mock;
  let mockCloudTrailSend: jest.Mock;

  beforeEach(async () => {
    mockIamSend = jest.fn();
    (IAMClient as any).mockImplementation(() => ({
      send: mockIamSend,
    }));

    mockS3Send = jest.fn();
    (S3Client as any).mockImplementation(() => ({
      send: mockS3Send,
    }));

    mockCloudTrailSend = jest.fn();
    (CloudTrailClient as any).mockImplementation(() => ({
      send: mockCloudTrailSend,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AwsService>(AwsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('collectIamEvidence', () => {
    it('should return PASS when all users have MFA', async () => {
      // Mock ListUsers
      mockIamSend.mockImplementationOnce(async (command) => {
        if (command instanceof ListUsersCommand) {
          return {
            Users: [
              { UserName: 'user1', UserId: 'u1', CreateDate: new Date() },
            ],
          };
        }
        if (command instanceof ListMFADevicesCommand) {
          return {
            MFADevices: [{ SerialNumber: 'arn:aws:iam::123:mfa/user1' }],
          };
        }
        return {};
      });
      // Second call for MFA happens inside Promise.all map, we can handle it with the implementation above or explicit calls
      // The implementation above handles it by checking command type

      // Actually, since ListMFADevicesCommand is called inside the map, we need to ensure the mock returns properly for multiple calls
      mockIamSend.mockImplementation(async (command) => {
        if (command instanceof ListUsersCommand) {
          return {
            Users: [
              { UserName: 'user1', UserId: 'u1', CreateDate: new Date() },
            ],
          };
        }
        if (command instanceof ListMFADevicesCommand) {
          return {
            MFADevices: [{ SerialNumber: 'arn:aws:iam::123:mfa/user1' }],
          };
        }
      });

      const result = await service.collectIamEvidence();

      expect(result.status).toBe('PASS');
      expect(result.data.mfaComplianceRate).toBe(1);
      expect(result.data.totalUsers).toBe(1);
    });

    it('should return FAIL when users lack MFA', async () => {
      mockIamSend.mockImplementation(async (command) => {
        if (command instanceof ListUsersCommand) {
          return {
            Users: [
              { UserName: 'user1', UserId: 'u1', CreateDate: new Date() },
              { UserName: 'user2', UserId: 'u2', CreateDate: new Date() },
            ],
          };
        }
        if (command instanceof ListMFADevicesCommand) {
          // Getting the username from the command input would be nice, but checking args is complex in this mock structure
          // Let's assume user1 has MFA, user2 doesn't.
          // However, the command instance doesn't easily expose the input in this simple mock
          // We can inspect mock calls if needed, but for simple return based on call order it's tricky since it's Promise.all

          // A better approach for the mock:
          if (command.input.UserName === 'user1') {
            return { MFADevices: [{ SerialNumber: 'mfa1' }] };
          }
          return { MFADevices: [] };
        }
      });

      const result = await service.collectIamEvidence();

      expect(result.status).toBe('FAIL');
      expect(result.data.mfaComplianceRate).toBe(0.5);
      expect(result.data.usersWithMfa).toBe(1);
    });
  });

  describe('collectS3Evidence', () => {
    it('should return PASS when all buckets are encrypted', async () => {
      mockS3Send.mockImplementation(async (command) => {
        if (command instanceof ListBucketsCommand) {
          return {
            Buckets: [{ Name: 'bucket1', CreationDate: new Date() }],
          };
        }
        if (command instanceof GetBucketEncryptionCommand) {
          return {
            ServerSideEncryptionConfiguration: {
              Rules: [
                {
                  ApplyServerSideEncryptionByDefault: {
                    SSEAlgorithm: 'AES256',
                  },
                },
              ],
            },
          };
        }
      });

      const result = await service.collectS3Evidence();

      expect(result.status).toBe('PASS');
      expect(result.data.encryptionComplianceRate).toBe(1);
    });

    it('should return FAIL when a bucket is unencrypted', async () => {
      mockS3Send.mockImplementation(async (command) => {
        if (command instanceof ListBucketsCommand) {
          return {
            Buckets: [{ Name: 'bucket1', CreationDate: new Date() }],
          };
        }
        if (command instanceof GetBucketEncryptionCommand) {
          throw new Error('ServerSideEncryptionConfigurationNotFoundError');
        }
      });

      const result = await service.collectS3Evidence();

      expect(result.status).toBe('FAIL');
      expect(result.data.encryptionComplianceRate).toBe(0);
    });
  });

  describe('collectCloudTrailEvidence', () => {
    it('should return PASS when events are found', async () => {
      mockCloudTrailSend.mockImplementation(async (command) => {
        if (command instanceof LookupEventsCommand) {
          return {
            Events: [
              {
                EventName: 'ConsoleLogin',
                EventTime: new Date(),
                Username: 'user1',
              },
            ],
          };
        }
      });

      const result = await service.collectCloudTrailEvidence();

      expect(result.status).toBe('PASS');
      expect(result.data.hasRecentActivity).toBe(true);
    });

    it('should return WARNING when no events are found', async () => {
      mockCloudTrailSend.mockImplementation(async (command) => {
        return { Events: [] };
      });

      const result = await service.collectCloudTrailEvidence();

      expect(result.status).toBe('WARNING');
      expect(result.data.hasRecentActivity).toBe(false);
    });
  });
});

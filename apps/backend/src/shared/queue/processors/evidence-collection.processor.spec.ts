import { Test, TestingModule } from '@nestjs/testing';
import { EvidenceCollectionProcessor } from './evidence-collection.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { AwsService } from '../../../integrations/aws/aws.service';
import { GitHubService } from '../../../integrations/github/github.service';
import { OktaService } from '../../../integrations/okta/okta.service';
import { EvidenceCollectionJobType } from '../queue.constants';
import { Job } from 'bull';

// Mock Octokit to prevent ESM import errors during JEST execution
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      listBranches: jest.fn(),
      getBranchProtection: jest.fn(),
      listCommits: jest.fn(),
    },
    users: {
      getAuthenticated: jest.fn(),
    },
  })),
}));

describe('EvidenceCollectionProcessor', () => {
  let processor: EvidenceCollectionProcessor;
  let prisma: PrismaService;
  let awsService: AwsService;
  let githubService: GitHubService;
  let oktaService: OktaService;

  const mockPrismaService = {
    integration: {
      findUnique: jest.fn(),
    },
    control: {
      findUnique: jest.fn(),
    },
    evidence: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockAwsService = {
    collectIamEvidence: jest.fn(),
    collectS3Evidence: jest.fn(),
    collectCloudTrailEvidence: jest.fn(),
    uploadEvidenceToS3: jest.fn(),
  };

  const mockGitHubService = {
    collectBranchProtectionEvidence: jest.fn(),
  };

  const mockOktaService = {
    collectMfaEnforcementEvidence: jest.fn(),
    collectUserAccessEvidence: jest.fn(),
    collectPolicyComplianceEvidence: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceCollectionProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AwsService, useValue: mockAwsService },
        { provide: GitHubService, useValue: mockGitHubService },
        { provide: OktaService, useValue: mockOktaService },
      ],
    }).compile();

    processor = module.get<EvidenceCollectionProcessor>(
      EvidenceCollectionProcessor,
    );
    prisma = module.get<PrismaService>(PrismaService);
    awsService = module.get<AwsService>(AwsService);
    githubService = module.get<GitHubService>(GitHubService);
    oktaService = module.get<OktaService>(OktaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleAwsCollection', () => {
    const mockJob = {
      id: '1',
      data: {
        customerId: 'cust1',
        integrationId: 'int1',
        controlId: 'ctrl1',
        type: EvidenceCollectionJobType.COLLECT_AWS,
      },
    } as Job;

    it('should collect and store AWS IAM evidence', async () => {
      mockPrismaService.integration.findUnique.mockResolvedValue({
        id: 'int1',
        customerId: 'cust1',
        config: { accessKeyId: 'key' },
      });
      mockPrismaService.control.findUnique.mockResolvedValue({
        id: 'ctrl1',
        controlId: 'CC6.1',
        title: 'MFA',
      });
      mockAwsService.collectIamEvidence.mockResolvedValue({
        status: 'PASS',
        data: {},
      });
      mockPrismaService.evidence.findFirst.mockResolvedValue(null);
      mockPrismaService.evidence.create.mockResolvedValue({
        id: 'ev1',
        hash: 'abc',
      });

      const result = await processor.handleAwsCollection(mockJob);

      expect(result.success).toBe(true);
      expect(awsService.collectIamEvidence).toHaveBeenCalled();
      expect(prisma.evidence.create).toHaveBeenCalled();
    });

    it('should throw error if integration not found', async () => {
      mockPrismaService.integration.findUnique.mockResolvedValue(null);
      await expect(processor.handleAwsCollection(mockJob)).rejects.toThrow(
        'Integration int1 not found',
      );
    });
  });

  describe('handleGitHubCollection', () => {
    const mockJob = {
      id: '2',
      data: {
        customerId: 'cust1',
        integrationId: 'int2',
        controlId: 'ctrl2',
        type: EvidenceCollectionJobType.COLLECT_GITHUB,
      },
    } as Job;

    it('should collect and store GitHub evidence', async () => {
      mockPrismaService.integration.findUnique.mockResolvedValue({
        id: 'int2',
        customerId: 'cust1',
        config: { owner: 'owner', repo: 'repo', token: 'token' },
      });
      mockPrismaService.control.findUnique.mockResolvedValue({
        id: 'ctrl2',
        controlId: 'CC7.2',
      });
      mockGitHubService.collectBranchProtectionEvidence.mockResolvedValue({
        status: 'PASS',
        data: {},
      });
      mockPrismaService.evidence.create.mockResolvedValue({
        id: 'ev2',
        hash: 'def',
      });

      const result = await processor.handleGitHubCollection(mockJob);

      expect(result.success).toBe(true);
      expect(githubService.collectBranchProtectionEvidence).toHaveBeenCalled();
    });
  });

  describe('handleOktaCollection', () => {
    const mockJob = {
      id: '3',
      data: {
        customerId: 'cust1',
        integrationId: 'int3',
        controlId: 'ctrl3',
        type: EvidenceCollectionJobType.COLLECT_OKTA,
      },
    } as Job;

    it('should collect and store Okta evidence', async () => {
      mockPrismaService.integration.findUnique.mockResolvedValue({
        id: 'int3',
        customerId: 'cust1',
        config: { orgUrl: 'url', token: 'token' },
      });
      mockPrismaService.control.findUnique.mockResolvedValue({
        id: 'ctrl3',
        controlId: 'CC6.1.3',
      });
      mockOktaService.collectMfaEnforcementEvidence.mockResolvedValue({
        status: 'PASS',
        data: {},
      });
      mockPrismaService.evidence.create.mockResolvedValue({
        id: 'ev3',
        hash: 'ghi',
      });

      const result = await processor.handleOktaCollection(mockJob);

      expect(result.success).toBe(true);
      expect(oktaService.collectMfaEnforcementEvidence).toHaveBeenCalled();
    });
  });
});

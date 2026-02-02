import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceCheckProcessor } from './compliance-check.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { JiraService } from '../../../integrations/jira/jira.service';
import { SlackService } from '../../../integrations/slack/slack.service';
import { QueueName, ComplianceCheckJobType, EvidenceCollectionJobType } from '../queue.constants';
import { Job } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { CheckStatus, IntegrationType } from '@prisma/client';

describe('ComplianceCheckProcessor', () => {
  let processor: ComplianceCheckProcessor;
  let prisma: PrismaService;
  let jiraService: JiraService;
  let slackService: SlackService;
  let complianceQueue: any;
  let evidenceQueue: any;

  const mockPrismaService = {
    control: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    evidence: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    complianceCheck: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    integration: {
      findFirst: jest.fn(),
    },
    jiraTask: {
      create: jest.fn(),
    },
  };

  const mockJiraService = {
    createRemediationTicket: jest.fn(),
  };

  const mockSlackService = {
    sendAlert: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceCheckProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JiraService, useValue: mockJiraService },
        { provide: SlackService, useValue: mockSlackService },
        { provide: getQueueToken(QueueName.COMPLIANCE_CHECK), useValue: mockQueue },
        { provide: getQueueToken(QueueName.EVIDENCE_COLLECTION), useValue: mockQueue },
      ],
    }).compile();

    processor = module.get<ComplianceCheckProcessor>(ComplianceCheckProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    jiraService = module.get<JiraService>(JiraService);
    slackService = module.get<SlackService>(SlackService);
    complianceQueue = module.get(getQueueToken(QueueName.COMPLIANCE_CHECK));
    evidenceQueue = module.get(getQueueToken(QueueName.EVIDENCE_COLLECTION));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleRunCheck', () => {
    const mockJob = {
      id: '1',
      data: {
        customerId: 'cust1',
        controlId: 'ctrl1',
      },
    } as Job;

    it('should complete check successfully when evidence is PASS', async () => {
      mockPrismaService.control.findUnique.mockResolvedValue({ id: 'ctrl1', frequency: 'DAILY' });
      mockPrismaService.evidence.findFirst.mockResolvedValue({
        id: 'ev1',
        data: { status: 'PASS' },
        collectedAt: new Date(),
        integration: { type: 'AWS' },
      });
      mockPrismaService.complianceCheck.create.mockResolvedValue({ id: 'cc1', status: CheckStatus.PASS });

      const result = await processor.handleRunCheck(mockJob);

      expect(result.success).toBe(true);
      expect(result.status).toBe(CheckStatus.PASS);
      expect(prisma.complianceCheck.create).toHaveBeenCalled();
    });

    it('should trigger remediation when evidence is FAIL', async () => {
      mockPrismaService.control.findUnique.mockResolvedValue({ id: 'ctrl1', title: 'Test Control', controlId: 'CC1', frequency: 'DAILY' });
      mockPrismaService.evidence.findFirst.mockResolvedValue({
        id: 'ev1',
        data: { status: 'FAIL' },
        collectedAt: new Date(),
        integration: { type: 'AWS' },
      });
      mockPrismaService.complianceCheck.create.mockResolvedValue({ id: 'cc1', status: CheckStatus.FAIL });
      mockPrismaService.integration.findFirst.mockResolvedValue({ type: IntegrationType.JIRA, config: { projectKey: 'PROJ' }, status: 'ACTIVE' });
      mockJiraService.createRemediationTicket.mockResolvedValue({ status: 'SUCCESS', data: { issueKey: 'ISSUE-1', issueId: 'id1' } });

      const result = await processor.handleRunCheck(mockJob);

      expect(result.status).toBe(CheckStatus.FAIL);
      expect(slackService.sendAlert).toHaveBeenCalled();
      expect(jiraService.createRemediationTicket).toHaveBeenCalled();
      expect(prisma.jiraTask.create).toHaveBeenCalled();
    });

    it('should trigger evidence collection if missing', async () => {
      mockPrismaService.control.findUnique.mockResolvedValue({ id: 'ctrl1', integrationType: IntegrationType.AWS });
      mockPrismaService.evidence.findFirst.mockResolvedValue(null);
      mockPrismaService.integration.findFirst.mockResolvedValue({ id: 'int1', type: IntegrationType.AWS });

      const result = await processor.handleRunCheck(mockJob);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Evidence collection triggered');
      expect(mockQueue.add).toHaveBeenCalledWith(EvidenceCollectionJobType.COLLECT_AWS, expect.objectContaining({ type: EvidenceCollectionJobType.COLLECT_AWS }));
    });

    it('should trigger GitHub collection if control is GITHUB', async () => {
      mockPrismaService.control.findUnique.mockResolvedValue({ id: 'ctrl2', integrationType: IntegrationType.GITHUB });
      mockPrismaService.evidence.findFirst.mockResolvedValue(null);
      mockPrismaService.integration.findFirst.mockResolvedValue({ id: 'int2', type: IntegrationType.GITHUB });

      const result = await processor.handleRunCheck(mockJob);

      expect(result.success).toBe(false);
      expect(mockQueue.add).toHaveBeenCalledWith(EvidenceCollectionJobType.COLLECT_GITHUB, expect.objectContaining({ type: EvidenceCollectionJobType.COLLECT_GITHUB }));
    });
  });

  describe('handleScheduleChecks', () => {
    const mockJob = {
      id: '2',
      data: { customerId: 'cust1' },
    } as Job;

    it('should schedule checks for controls that need it', async () => {
      mockPrismaService.control.findMany.mockResolvedValue([{ id: 'ctrl1', controlId: 'C1' }]);
      mockPrismaService.complianceCheck.findFirst.mockResolvedValue(null); // Never checked

      const result = await processor.handleScheduleChecks(mockJob);

      expect(result.success).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(ComplianceCheckJobType.RUN_CHECK, expect.any(Object));
    });
  });
});

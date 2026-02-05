import { Test, TestingModule } from '@nestjs/testing';
import { PolicyDraftingService } from '../policy-drafting.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { OpenAIService } from '../../openai.service';
import { UsageTrackerService } from '../../usage-tracker.service';
import { PolicyStatus } from '@prisma/client';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('PolicyDraftingService', () => {
  let service: PolicyDraftingService;
  let prisma: PrismaService;
  let openai: OpenAIService;
  let usageTracker: UsageTrackerService;

  const mockPrismaService = {
    policyTemplate: {
      findUnique: jest.fn(),
    },
    policy: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    policyVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
  };

  const mockOpenAIService = {
    generateChatCompletion: jest.fn(),
  };

  const mockUsageTrackerService = {
    logUsage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyDraftingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OpenAIService, useValue: mockOpenAIService },
        { provide: UsageTrackerService, useValue: mockUsageTrackerService },
      ],
    }).compile();

    service = module.get<PolicyDraftingService>(PolicyDraftingService);
    prisma = module.get<PrismaService>(PrismaService);
    openai = module.get<OpenAIService>(OpenAIService);
    usageTracker = module.get<UsageTrackerService>(UsageTrackerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePolicy', () => {
    const customerId = 'customer-123';
    const userId = 'user-123';
    const templateId = 'template-123';
    const dto = {
      templateId,
      customizationData: {
        companyName: 'Acme Inc',
        industry: 'FinTech',
        companySize: '50-100',
      },
    };

    const mockTemplate = {
      id: templateId,
      name: 'Information Security Policy',
      templateContent: '# {{companyName}} Security Policy',
      isActive: true,
      policyTemplateControls: [
        {
          control: {
            controlId: 'CC1.1',
            title: 'Control Objective 1',
          },
        },
      ],
    };

    const mockCompletion = {
      content: '# Acme Inc Information Security Policy\n\nThis is the generated policy content.',
      usage: {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
        estimatedCostUsd: 0.045,
      },
    };

    it('should generate a policy successfully', async () => {
      mockPrismaService.policyTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockOpenAIService.generateChatCompletion.mockResolvedValue(mockCompletion);
      mockPrismaService.policy.create.mockResolvedValue({
        id: 'policy-123',
        customerId,
        templateId,
        title: 'Acme Inc Information Security Policy',
        content: mockCompletion.content,
        version: 1,
        status: PolicyStatus.DRAFT,
        createdBy: userId,
      });
      mockPrismaService.policyVersion.create.mockResolvedValue({});

      const result = await service.generatePolicy(customerId, userId, dto);

      expect(result).toBeDefined();
      expect(result.title).toBe('Acme Inc Information Security Policy');
      expect(mockOpenAIService.generateChatCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        expect.objectContaining({
          model: 'gpt-4',
          temperature: 0.3,
        }),
      );
      expect(mockUsageTrackerService.logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId,
          operation: 'policy_generation',
        }),
      );
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.policyTemplate.findUnique.mockResolvedValue(null);

      await expect(service.generatePolicy(customerId, userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if template is inactive', async () => {
      mockPrismaService.policyTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        isActive: false,
      });

      await expect(service.generatePolicy(customerId, userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reviewPolicy', () => {
    const policyId = 'policy-123';
    const customerId = 'customer-123';

    const mockPolicy = {
      id: policyId,
      customerId,
      content: '# Security Policy\n\nThis is test content.',
      template: {
        name: 'Information Security Policy',
        policyTemplateControls: [
          {
            control: {
              controlId: 'CC1.1',
              title: 'Control Objective 1',
            },
          },
        ],
      },
    };

    const mockReviewResult = {
      score: 85,
      completeness: 'The policy is comprehensive',
      gaps: ['Missing incident timeline'],
      suggestions: ['Add more examples'],
      consistencyIssues: [],
    };

    it('should review policy and return AI analysis', async () => {
      mockPrismaService.policy.findFirst.mockResolvedValue(mockPolicy);
      mockOpenAIService.generateChatCompletion.mockResolvedValue({
        content: JSON.stringify(mockReviewResult),
        usage: {
          promptTokens: 2000,
          completionTokens: 300,
          totalTokens: 2300,
          estimatedCostUsd: 0.069,
        },
      });

      const result = await service.reviewPolicy(policyId, customerId);

      expect(result).toEqual(mockReviewResult);
      expect(result.score).toBe(85);
      expect(result.gaps).toHaveLength(1);
      expect(mockUsageTrackerService.logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId,
          operation: 'policy_review',
        }),
      );
    });

    it('should throw NotFoundException if policy not found', async () => {
      mockPrismaService.policy.findFirst.mockResolvedValue(null);

      await expect(service.reviewPolicy(policyId, customerId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approvePolicy', () => {
    const policyId = 'policy-123';
    const customerId = 'customer-123';
    const userId = 'user-123';

    const mockPolicy = {
      id: policyId,
      customerId,
      status: PolicyStatus.IN_REVIEW,
    };

    it('should approve policy for admin users', async () => {
      mockPrismaService.policy.findFirst.mockResolvedValue(mockPolicy);
      mockPrismaService.policy.update.mockResolvedValue({
        ...mockPolicy,
        status: PolicyStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
      });

      const result = await service.approvePolicy(policyId, customerId, userId, 'ADMIN');

      expect(result.status).toBe(PolicyStatus.APPROVED);
      expect(result.approvedBy).toBe(userId);
    });

    it('should throw ForbiddenException for non-admin users', async () => {
      await expect(
        service.approvePolicy(policyId, customerId, userId, 'USER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if policy not in review', async () => {
      mockPrismaService.policy.findFirst.mockResolvedValue({
        ...mockPolicy,
        status: PolicyStatus.DRAFT,
      });

      await expect(
        service.approvePolicy(policyId, customerId, userId, 'ADMIN'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('customizePolicy', () => {
    const policyId = 'policy-123';
    const customerId = 'customer-123';
    const userId = 'user-123';

    const mockPolicy = {
      id: policyId,
      customerId,
      title: 'Original Title',
      content: 'Original content',
      version: 1,
      status: PolicyStatus.DRAFT,
    };

    it('should update policy and create version', async () => {
      const updateDto = {
        title: 'Updated Title',
        content: 'Updated content',
        changes: 'Updated based on feedback',
      };

      mockPrismaService.policy.findFirst.mockResolvedValue(mockPolicy);
      mockPrismaService.policy.update.mockResolvedValue({
        ...mockPolicy,
        ...updateDto,
        version: 2,
      });
      mockPrismaService.policyVersion.create.mockResolvedValue({});

      const result = await service.customizePolicy(policyId, customerId, userId, updateDto);

      expect(result.title).toBe('Updated Title');
      expect(result.version).toBe(2);
      expect(mockPrismaService.policyVersion.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when modifying approved policy', async () => {
      mockPrismaService.policy.findFirst.mockResolvedValue({
        ...mockPolicy,
        status: PolicyStatus.APPROVED,
      });

      await expect(
        service.customizePolicy(policyId, customerId, userId, { title: 'New Title' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('suggestImprovements', () => {
    const policyId = 'policy-123';
    const customerId = 'customer-123';

    const mockPolicy = {
      id: policyId,
      customerId,
      content: '# Security Policy\n\nContent here.',
    };

    it('should return improvement suggestions', async () => {
      mockPrismaService.policy.findFirst.mockResolvedValue(mockPolicy);
      mockOpenAIService.generateChatCompletion.mockResolvedValue({
        content: '1. Add more specific examples\n2. Include incident timelines\n3. Define roles clearly',
        usage: {
          promptTokens: 500,
          completionTokens: 100,
          totalTokens: 600,
          estimatedCostUsd: 0.0015,
        },
      });

      const result = await service.suggestImprovements(policyId, customerId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(mockUsageTrackerService.logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId,
          operation: 'policy_suggestions',
        }),
      );
    });
  });

  describe('submitForReview', () => {
    const policyId = 'policy-123';
    const customerId = 'customer-123';
    const userId = 'user-123';

    it('should submit draft policy for review', async () => {
      mockPrismaService.policy.findFirst.mockResolvedValue({
        id: policyId,
        customerId,
        status: PolicyStatus.DRAFT,
      });
      mockPrismaService.policy.update.mockResolvedValue({
        id: policyId,
        status: PolicyStatus.IN_REVIEW,
        reviewedBy: userId,
      });

      const result = await service.submitForReview(policyId, customerId, userId);

      expect(result.status).toBe(PolicyStatus.IN_REVIEW);
    });

    it('should throw BadRequestException if not draft', async () => {
      mockPrismaService.policy.findFirst.mockResolvedValue({
        id: policyId,
        customerId,
        status: PolicyStatus.APPROVED,
      });

      await expect(service.submitForReview(policyId, customerId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CopilotService } from '../copilot.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { OpenAIService } from '../../openai.service';
import { UsageTrackerService } from '../../usage-tracker.service';
import { NotFoundException } from '@nestjs/common';

describe('CopilotService', () => {
  let service: CopilotService;
  let prisma: PrismaService;
  let openai: OpenAIService;
  let usageTracker: UsageTrackerService;

  const mockCustomerId = 'customer-123';
  const mockUserId = 'user-123';
  const mockConversationId = 'conv-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CopilotService,
        {
          provide: PrismaService,
          useValue: {
            copilotConversation: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            copilotMessage: {
              create: jest.fn(),
            },
            complianceCheck: {
              findMany: jest.fn(),
              groupBy: jest.fn(),
              count: jest.fn(),
            },
            integration: {
              findMany: jest.fn(),
            },
            policy: {
              findMany: jest.fn(),
            },
            control: {
              findMany: jest.fn(),
            },
            evidence: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: OpenAIService,
          useValue: {
            generateChatCompletion: jest.fn(),
          },
        },
        {
          provide: UsageTrackerService,
          useValue: {
            logUsage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CopilotService>(CopilotService);
    prisma = module.get<PrismaService>(PrismaService);
    openai = module.get<OpenAIService>(OpenAIService);
    usageTracker = module.get<UsageTrackerService>(UsageTrackerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createConversation', () => {
    it('should create a new conversation with title', async () => {
      const mockConversation = {
        id: mockConversationId,
        customerId: mockCustomerId,
        userId: mockUserId,
        title: 'Test Conversation',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };

      jest.spyOn(prisma.copilotConversation, 'create').mockResolvedValue(mockConversation);

      const result = await service.createConversation(
        mockCustomerId,
        mockUserId,
        'Test Conversation',
      );

      expect(result.id).toBe(mockConversationId);
      expect(result.title).toBe('Test Conversation');
      expect(prisma.copilotConversation.create).toHaveBeenCalledWith({
        data: {
          customerId: mockCustomerId,
          userId: mockUserId,
          title: 'Test Conversation',
          status: 'ACTIVE',
        },
      });
    });

    it('should create conversation with default title if not provided', async () => {
      const mockConversation = {
        id: mockConversationId,
        customerId: mockCustomerId,
        userId: mockUserId,
        title: 'New Conversation',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null,
      };

      jest.spyOn(prisma.copilotConversation, 'create').mockResolvedValue(mockConversation);

      const result = await service.createConversation(mockCustomerId, mockUserId);

      expect(result.title).toBe('New Conversation');
    });
  });

  describe('chat', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      jest.spyOn(prisma.copilotConversation, 'findUnique').mockResolvedValue(null);

      await expect(
        service.chat(mockConversationId, 'Hello', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create user and assistant messages', async () => {
      const mockConversation = {
        id: mockConversationId,
        customerId: mockCustomerId,
        userId: mockUserId,
        title: 'Test',
        status: 'ACTIVE',
        messages: [],
      };

      const mockUserMessage = {
        id: 'msg-1',
        conversationId: mockConversationId,
        role: 'USER',
        content: 'What is CC1.2?',
        createdAt: new Date(),
      };

      const mockAssistantMessage = {
        id: 'msg-2',
        conversationId: mockConversationId,
        role: 'ASSISTANT',
        content: 'CC1.2 is about...',
        metadata: {},
        tokens: 100,
        cost: 0.002,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.copilotConversation, 'findUnique').mockResolvedValue(mockConversation);
      jest.spyOn(prisma.copilotMessage, 'create')
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      jest.spyOn(prisma.copilotConversation, 'update').mockResolvedValue(mockConversation);
      jest.spyOn(prisma.control, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.evidence, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.policy, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.integration, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.complianceCheck, 'groupBy').mockResolvedValue([]);
      jest.spyOn(openai, 'generateChatCompletion').mockResolvedValue({
        content: 'CC1.2 is about...',
        usage: {
          promptTokens: 50,
          completionTokens: 50,
          totalTokens: 100,
          estimatedCostUsd: 0.002,
        },
      });

      const result = await service.chat(mockConversationId, 'What is CC1.2?', mockUserId);

      expect(result.message.role).toBe('ASSISTANT');
      expect(result.message.content).toBe('CC1.2 is about...');
      expect(prisma.copilotMessage.create).toHaveBeenCalledTimes(2);
      expect(usageTracker.logUsage).toHaveBeenCalled();
    });

    it('should use GPT-4 for complex queries', async () => {
      const mockConversation = {
        id: mockConversationId,
        customerId: mockCustomerId,
        userId: mockUserId,
        title: 'Test',
        status: 'ACTIVE',
        messages: [],
      };

      jest.spyOn(prisma.copilotConversation, 'findUnique').mockResolvedValue(mockConversation);
      jest.spyOn(prisma.copilotMessage, 'create').mockResolvedValue({} as any);
      jest.spyOn(prisma.copilotConversation, 'update').mockResolvedValue(mockConversation);
      jest.spyOn(prisma.control, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.evidence, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.policy, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.integration, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.complianceCheck, 'groupBy').mockResolvedValue([]);
      jest.spyOn(openai, 'generateChatCompletion').mockResolvedValue({
        content: 'Analysis...',
        usage: {
          promptTokens: 100,
          completionTokens: 100,
          totalTokens: 200,
          estimatedCostUsd: 0.006,
        },
      });

      await service.chat(
        mockConversationId,
        'Analyze my compliance strategy and recommend improvements',
        mockUserId,
      );

      expect(openai.generateChatCompletion).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ model: 'gpt-4-turbo-preview' }),
      );
    });

    it('should retrieve relevant controls from query', async () => {
      const mockConversation = {
        id: mockConversationId,
        customerId: mockCustomerId,
        userId: mockUserId,
        title: 'Test',
        status: 'ACTIVE',
        messages: [],
      };

      const mockControl = {
        id: 'ctrl-1',
        controlId: 'CC1.2',
        title: 'Control Environment',
        description: 'Test description',
      };

      jest.spyOn(prisma.copilotConversation, 'findUnique').mockResolvedValue(mockConversation);
      jest.spyOn(prisma.copilotMessage, 'create').mockResolvedValue({} as any);
      jest.spyOn(prisma.copilotConversation, 'update').mockResolvedValue(mockConversation);
      jest.spyOn(prisma.control, 'findMany').mockResolvedValue([mockControl]);
      jest.spyOn(prisma.evidence, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.policy, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.integration, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.complianceCheck, 'groupBy').mockResolvedValue([]);
      jest.spyOn(openai, 'generateChatCompletion').mockResolvedValue({
        content: 'Response',
        usage: {
          promptTokens: 50,
          completionTokens: 50,
          totalTokens: 100,
          estimatedCostUsd: 0.002,
        },
      });

      await service.chat(mockConversationId, 'Tell me about CC1.2', mockUserId);

      expect(prisma.control.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ controlId: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });
  });

  describe('getConversation', () => {
    it('should return conversation with messages', async () => {
      const mockConversation = {
        id: mockConversationId,
        customerId: mockCustomerId,
        userId: mockUserId,
        title: 'Test',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
        messages: [
          {
            id: 'msg-1',
            conversationId: mockConversationId,
            role: 'USER',
            content: 'Hello',
            metadata: null,
            tokens: null,
            cost: null,
            createdAt: new Date(),
          },
        ],
        _count: { messages: 1 },
      };

      jest.spyOn(prisma.copilotConversation, 'findUnique').mockResolvedValue(mockConversation);

      const result = await service.getConversation(mockConversationId);

      expect(result.id).toBe(mockConversationId);
      expect(result.messages).toHaveLength(1);
      expect(result.messageCount).toBe(1);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      jest.spyOn(prisma.copilotConversation, 'findUnique').mockResolvedValue(null);

      await expect(service.getConversation(mockConversationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listConversations', () => {
    it('should return list of active conversations', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          customerId: mockCustomerId,
          userId: mockUserId,
          title: 'Conversation 1',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessageAt: new Date(),
          _count: { messages: 5 },
        },
      ];

      jest.spyOn(prisma.copilotConversation, 'findMany').mockResolvedValue(mockConversations);

      const result = await service.listConversations(mockCustomerId, mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].messageCount).toBe(5);
      expect(prisma.copilotConversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            customerId: mockCustomerId,
            userId: mockUserId,
            status: 'ACTIVE',
          },
        }),
      );
    });
  });

  describe('archiveConversation', () => {
    it('should archive conversation', async () => {
      jest.spyOn(prisma.copilotConversation, 'update').mockResolvedValue({} as any);

      await service.archiveConversation(mockConversationId);

      expect(prisma.copilotConversation.update).toHaveBeenCalledWith({
        where: { id: mockConversationId },
        data: { status: 'ARCHIVED' },
      });
    });
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions based on compliance status', async () => {
      const mockFailedChecks = [
        {
          id: 'check-1',
          status: 'FAIL',
          control: { id: 'ctrl-1', controlId: 'CC1.2', title: 'Test' },
        },
      ];

      jest.spyOn(prisma.complianceCheck, 'findMany').mockResolvedValue(mockFailedChecks);
      jest.spyOn(prisma.integration, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.policy, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.evidence, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.complianceCheck, 'count')
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(85);

      const result = await service.generateSuggestions(mockCustomerId);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].type).toBe('CONTROL');
      expect(result.healthScore).toBeCloseTo(0.85);
    });

    it('should suggest stale integrations', async () => {
      const mockStaleIntegrations = [
        {
          id: 'int-1',
          type: 'AWS',
          status: 'ACTIVE',
          lastSyncAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ];

      jest.spyOn(prisma.complianceCheck, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.integration, 'findMany').mockResolvedValue(mockStaleIntegrations);
      jest.spyOn(prisma.policy, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.evidence, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.complianceCheck, 'count')
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(100);

      const result = await service.generateSuggestions(mockCustomerId);

      const integrationSuggestion = result.suggestions.find((s) => s.type === 'INTEGRATION');
      expect(integrationSuggestion).toBeDefined();
      expect(integrationSuggestion?.priority).toBe('MEDIUM');
    });

    it('should suggest policy reviews', async () => {
      const mockOldPolicies = [
        {
          id: 'policy-1',
          status: 'APPROVED',
          updatedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        },
      ];

      jest.spyOn(prisma.complianceCheck, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.integration, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.policy, 'findMany').mockResolvedValue(mockOldPolicies);
      jest.spyOn(prisma.evidence, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.complianceCheck, 'count')
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(100);

      const result = await service.generateSuggestions(mockCustomerId);

      const policySuggestion = result.suggestions.find((s) => s.type === 'POLICY');
      expect(policySuggestion).toBeDefined();
    });
  });
});

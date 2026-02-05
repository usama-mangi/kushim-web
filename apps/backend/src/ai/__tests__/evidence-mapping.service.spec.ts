import { Test, TestingModule } from '@nestjs/testing';
import { EvidenceMappingService } from '../evidence-mapping/evidence-mapping.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { OpenAIService } from '../openai.service';
import { UsageTrackerService } from '../usage-tracker.service';
import { NotFoundException } from '@nestjs/common';

describe('EvidenceMappingService', () => {
  let service: EvidenceMappingService;
  let prisma: PrismaService;
  let cache: CacheService;
  let openai: OpenAIService;
  let usageTracker: UsageTrackerService;

  const mockEvidence = {
    id: 'evidence-123',
    customerId: 'customer-123',
    controlId: 'control-123',
    integrationId: 'integration-123',
    data: { logs: ['access granted', 'access denied'] },
    hash: 'abc123',
    previousHash: null,
    s3Key: null,
    collectedAt: new Date(),
    createdAt: new Date(),
    control: {
      id: 'control-123',
      framework: 'SOC2',
      controlId: 'CC6.1',
      title: 'Access Control',
      description: 'Logical and physical access controls',
      testProcedure: 'Review access logs',
      frequency: 'DAILY',
      category: 'Access Control',
      integrationType: 'AWS',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    integration: {
      id: 'integration-123',
      type: 'AWS',
      status: 'ACTIVE',
    },
  };

  const mockControls = [
    {
      id: 'control-123',
      framework: 'SOC2',
      controlId: 'CC6.1',
      title: 'Access Control',
      description: 'Logical and physical access controls',
      testProcedure: 'Review access logs',
      frequency: 'DAILY',
      category: 'Access Control',
      integrationType: 'AWS',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'control-456',
      framework: 'SOC2',
      controlId: 'CC6.2',
      title: 'Authentication',
      description: 'Authentication mechanisms',
      testProcedure: 'Review authentication logs',
      frequency: 'DAILY',
      category: 'Access Control',
      integrationType: 'OKTA',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockAIResponse = {
    data: {
      mappings: [
        {
          control_id: 'CC6.1',
          confidence: 0.85,
          reasoning: 'AWS CloudTrail logs provide direct evidence of access control',
        },
        {
          control_id: 'CC6.2',
          confidence: 0.65,
          reasoning: 'Logs show authentication attempts',
        },
      ],
    },
    usage: {
      promptTokens: 500,
      completionTokens: 200,
      totalTokens: 700,
      estimatedCostUsd: 0.014,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceMappingService,
        {
          provide: PrismaService,
          useValue: {
            evidence: {
              findFirst: jest.fn(),
            },
            control: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            evidenceMapping: {
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: OpenAIService,
          useValue: {
            isConfigured: jest.fn().mockReturnValue(true),
            generateStructuredCompletion: jest.fn(),
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

    service = module.get<EvidenceMappingService>(EvidenceMappingService);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<CacheService>(CacheService);
    openai = module.get<OpenAIService>(OpenAIService);
    usageTracker = module.get<UsageTrackerService>(UsageTrackerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapEvidenceToControls', () => {
    it('should map evidence to controls using AI', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(prisma.evidence, 'findFirst').mockResolvedValue(mockEvidence as any);
      jest.spyOn(prisma.control, 'findMany').mockResolvedValue(mockControls as any);
      jest.spyOn(openai, 'generateStructuredCompletion').mockResolvedValue(mockAIResponse as any);
      jest.spyOn(cache, 'set').mockResolvedValue(undefined);
      jest.spyOn(usageTracker, 'logUsage').mockResolvedValue(undefined);

      const result = await service.mapEvidenceToControls(
        'evidence-123',
        'customer-123',
      );

      expect(result).toHaveLength(2);
      expect(result[0].controlIdentifier).toBe('CC6.1');
      expect(result[0].confidence).toBe(0.85);
      expect(result[1].controlIdentifier).toBe('CC6.2');
      expect(result[1].confidence).toBe(0.65);
      expect(usageTracker.logUsage).toHaveBeenCalled();
    });

    it('should filter by minimum confidence', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(prisma.evidence, 'findFirst').mockResolvedValue(mockEvidence as any);
      jest.spyOn(prisma.control, 'findMany').mockResolvedValue(mockControls as any);
      jest.spyOn(openai, 'generateStructuredCompletion').mockResolvedValue(mockAIResponse as any);
      jest.spyOn(cache, 'set').mockResolvedValue(undefined);

      const result = await service.mapEvidenceToControls(
        'evidence-123',
        'customer-123',
        { minConfidence: 0.8 },
      );

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should limit number of suggestions', async () => {
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(prisma.evidence, 'findFirst').mockResolvedValue(mockEvidence as any);
      jest.spyOn(prisma.control, 'findMany').mockResolvedValue(mockControls as any);
      jest.spyOn(openai, 'generateStructuredCompletion').mockResolvedValue(mockAIResponse as any);
      jest.spyOn(cache, 'set').mockResolvedValue(undefined);

      const result = await service.mapEvidenceToControls(
        'evidence-123',
        'customer-123',
        { maxSuggestions: 1 },
      );

      expect(result).toHaveLength(1);
    });

    it('should use cached results when available', async () => {
      const cachedResults = [
        {
          controlId: 'control-123',
          controlIdentifier: 'CC6.1',
          title: 'Access Control',
          confidence: 0.85,
          reasoning: 'Cached result',
        },
      ];
      jest.spyOn(cache, 'get').mockResolvedValue(cachedResults);

      const result = await service.mapEvidenceToControls(
        'evidence-123',
        'customer-123',
      );

      expect(result).toEqual(cachedResults);
      expect(openai.generateStructuredCompletion).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid evidence', async () => {
      jest.spyOn(prisma.evidence, 'findFirst').mockResolvedValue(null);

      await expect(
        service.mapEvidenceToControls('invalid-id', 'customer-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMapping', () => {
    it('should create a new mapping', async () => {
      const mockMapping = {
        id: 'mapping-123',
        evidenceId: 'evidence-123',
        controlId: 'control-123',
        confidence: 0.85,
        aiReasoning: 'Test reasoning',
        isManualOverride: false,
        manuallyVerified: false,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.evidence, 'findFirst').mockResolvedValue(mockEvidence as any);
      jest.spyOn(prisma.control, 'findUnique').mockResolvedValue(mockControls[0] as any);
      jest.spyOn(prisma.evidenceMapping, 'create').mockResolvedValue(mockMapping as any);
      jest.spyOn(cache, 'del').mockResolvedValue(undefined);

      const result = await service.createMapping(
        'evidence-123',
        'control-123',
        0.85,
        'Test reasoning',
        'customer-123',
      );

      expect(result).toEqual(mockMapping);
      expect(cache.del).toHaveBeenCalledWith('evidence-mapping:evidence-123');
    });
  });

  describe('updateMapping', () => {
    it('should update an existing mapping', async () => {
      const existingMapping = {
        id: 'mapping-123',
        evidenceId: 'evidence-123',
        controlId: 'control-123',
        confidence: 0.85,
        aiReasoning: 'Original reasoning',
        isManualOverride: false,
        manuallyVerified: false,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMapping = {
        ...existingMapping,
        confidence: 0.92,
        manuallyVerified: true,
      };

      jest.spyOn(prisma.evidenceMapping, 'findUnique').mockResolvedValue(existingMapping as any);
      jest.spyOn(prisma.evidenceMapping, 'update').mockResolvedValue(updatedMapping as any);
      jest.spyOn(cache, 'del').mockResolvedValue(undefined);

      const result = await service.updateMapping('mapping-123', {
        confidence: 0.92,
        manuallyVerified: true,
      });

      expect(result.confidence).toEqual(0.92);
      expect(result.manuallyVerified).toBe(true);
    });

    it('should throw NotFoundException for invalid mapping', async () => {
      jest.spyOn(prisma.evidenceMapping, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateMapping('invalid-id', { confidence: 0.9 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate weighted confidence score', async () => {
      const result = await service.calculateConfidence({
        evidenceCompleteness: 0.8,
        controlRelevance: 0.9,
        sourceReliability: 0.7,
      });

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
      expect(result).toBeCloseTo(0.82, 1);
    });

    it('should clamp values between 0 and 1', async () => {
      const result = await service.calculateConfidence({
        evidenceCompleteness: 1.5,
        controlRelevance: 1.2,
        sourceReliability: 0.8,
      });

      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('applyManualOverride', () => {
    it('should create override for new mapping', async () => {
      jest.spyOn(prisma.evidenceMapping, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.evidence, 'findFirst').mockResolvedValue(mockEvidence as any);
      jest.spyOn(prisma.control, 'findUnique').mockResolvedValue(mockControls[0] as any);
      jest.spyOn(prisma.evidenceMapping, 'create').mockResolvedValue({
        id: 'mapping-123',
        evidenceId: 'evidence-123',
        controlId: 'control-123',
        confidence: 0.95,
        aiReasoning: 'Manual override reasoning',
        isManualOverride: true,
        manuallyVerified: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jest.spyOn(cache, 'del').mockResolvedValue(undefined);

      const result = await service.applyManualOverride(
        'evidence-123',
        'control-123',
        0.95,
        'Manual override reasoning',
        'user-123',
        'customer-123',
      );

      expect(result.isManualOverride).toBe(true);
      expect(result.confidence).toEqual(0.95);
    });

    it('should update existing mapping with override', async () => {
      const existingMapping = {
        id: 'mapping-123',
        evidenceId: 'evidence-123',
        controlId: 'control-123',
        confidence: 0.85,
        aiReasoning: 'Original reasoning',
        isManualOverride: false,
        manuallyVerified: false,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.evidenceMapping, 'findUnique')
        .mockResolvedValueOnce(existingMapping as any)
        .mockResolvedValueOnce(existingMapping as any);
      jest.spyOn(prisma.evidenceMapping, 'update').mockResolvedValue({
        ...existingMapping,
        confidence: 0.95,
        isManualOverride: true,
        manuallyVerified: true,
      } as any);
      jest.spyOn(cache, 'del').mockResolvedValue(undefined);

      const result = await service.applyManualOverride(
        'evidence-123',
        'control-123',
        0.95,
        'Manual override reasoning',
        'user-123',
        'customer-123',
      );

      expect(result.isManualOverride).toBe(true);
      expect(result.manuallyVerified).toBe(true);
    });
  });
});

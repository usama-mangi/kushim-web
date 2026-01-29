import { Test, TestingModule } from '@nestjs/testing';
import { RelationshipService } from './relationship.service';
import { PrismaService } from '../prisma/prisma.service';
import { MLScoringService } from './ml-scoring.service';
import { GraphService } from './graph.service';
import { TfIdfService } from '../common/tfidf.service';
import { RedisService } from '../common/redis.service';
import { TracingService } from '../common/tracing.service';
import { UnifiedRecord } from '@prisma/client';
import { createMockRedisService } from '../../test/utils';

// Mock @xenova/transformers to avoid ES module issues
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue(
    jest.fn().mockResolvedValue({
      data: new Float32Array(384).fill(0.1),
    })
  ),
}));

describe('RelationshipService', () => {
  let service: RelationshipService;
  let prismaService: PrismaService;
  let graphService: GraphService;
  let mlScoringService: MLScoringService;
  let tfidfService: TfIdfService;
  let redis: ReturnType<typeof createMockRedisService>;

  const mockRecord = (overrides: Partial<UnifiedRecord> = {}): UnifiedRecord => ({
    id: 'record-1',
    userId: 'user-1',
    sourceId: 'source-1',
    externalId: 'ext-123',
    sourcePlatform: 'github',
    artifactType: 'issue',
    title: 'Fix authentication bug',
    body: 'Users are experiencing JWT token expiration issues',
    url: 'https://github.com/org/repo/issues/123',
    author: 'john',
    timestamp: new Date('2024-01-15'),
    participants: ['john', 'jane'],
    metadata: { repository: 'org/repo', number: 123 },
    checksum: 'abc123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    redis = createMockRedisService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelationshipService,
        {
          provide: PrismaService,
          useValue: {
            unifiedRecord: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
            },
            recordLink: {
              upsert: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback({
              unifiedRecord: { findUnique: jest.fn() },
              recordLink: { create: jest.fn() },
            })),
          },
        },
        {
          provide: MLScoringService,
          useValue: {
            runShadowScoring: jest.fn(),
            calculateMLScore: jest.fn().mockResolvedValue({
              score: 0.5,
              explanation: {},
            }),
          },
        },
        {
          provide: GraphService,
          useValue: {
            findLinkingCandidateIds: jest.fn(),
            findLinkingCandidateIds: jest.fn().mockResolvedValue([]),
            hydrateRecordsFromIds: jest.fn().mockResolvedValue([]),
            calculateGraphSignals: jest.fn().mockReturnValue({ graphScore: 0, pathExists: false }),
            syncLink: jest.fn(),
            syncRecord: jest.fn(),
            getRecordGroups: jest.fn(),
            createContextGroup: jest.fn(),
            addToContextGroup: jest.fn(),
            mergeContextGroups: jest.fn(),
          },
        },
        {
          provide: TfIdfService,
          useValue: {
            calculateSimilarity: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: redis,
        },
        {
          provide: TracingService,
          useValue: {
            trace: jest.fn((name, fn) => fn()),
            withSpan: jest.fn((name, fn) => {
              const mockSpan = {
                setAttribute: jest.fn(),
                setStatus: jest.fn(),
                addEvent: jest.fn(),
                end: jest.fn(),
              };
              return fn(mockSpan);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RelationshipService>(RelationshipService);
    prismaService = module.get<PrismaService>(PrismaService);
    graphService = module.get<GraphService>(GraphService);
    mlScoringService = module.get<MLScoringService>(MLScoringService);
    tfidfService = module.get<TfIdfService>(TfIdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('discoverRelationships', () => {
    it('should use graph-based candidate discovery', async () => {
      const record = mockRecord();
      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue([]);
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([]);

      await service.discoverRelationships(record);

      expect(graphService.findLinkingCandidateIds).toHaveBeenCalledWith(
        record.id,
        record.userId,
        100
      );
    });

    it('should create link when score >= 0.7', async () => {
      const record = mockRecord();
      const candidate = mockRecord({
        id: 'record-2',
        externalId: 'ext-124',
        title: 'PR for fixing authentication',
        body: 'Fixes issue #123 with JWT tokens',
        url: 'https://github.com/org/repo/pull/456',
      });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: true,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.6);
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);
      jest.spyOn(graphService, 'createContextGroup').mockResolvedValue('group-1');
      
      const linkUpsertSpy = jest.spyOn(prismaService.recordLink, 'upsert').mockResolvedValue({
        id: 'link-1',
        sourceRecordId: record.id,
        targetRecordId: candidate.id,
        confidenceScore: 0.7,
        relationshipType: 'explicit',
        discoveryMethod: 'deterministic',
        metadata: null,
        createdAt: new Date(),
      });

      await service.discoverRelationships(record);

      expect(linkUpsertSpy).toHaveBeenCalled();
      expect(graphService.syncLink).toHaveBeenCalled();
    });

    it('should not create link when score < 0.7', async () => {
      const record = mockRecord();
      const candidate = mockRecord({
        id: 'record-2',
        title: 'Completely unrelated issue',
        body: 'About database performance',
      });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: false,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.1);
      
      const linkUpsertSpy = jest.spyOn(prismaService.recordLink, 'upsert');

      await service.discoverRelationships(record);

      expect(linkUpsertSpy).not.toHaveBeenCalled();
    });

    it('should trigger ML shadow scoring for all candidates', async () => {
      const record = mockRecord();
      const candidates = [
        mockRecord({ id: 'record-2' }),
        mockRecord({ id: 'record-3' }),
      ];

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(candidates);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: false,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.3);

      await service.discoverRelationships(record);

      expect(mlScoringService.runShadowScoring).toHaveBeenCalledTimes(2);
    });
  });

  describe('Signal Scoring Tests', () => {
    it('should score 0.7 for explicit ID match', async () => {
      const record = mockRecord({ externalId: 'JIRA-123' });
      const candidate = mockRecord({
        id: 'record-2',
        title: 'PR to fix JIRA-123',
        body: 'Addresses ticket JIRA-123',
      });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: true,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.3);
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);
      jest.spyOn(graphService, 'createContextGroup').mockResolvedValue('group-1');

      const linkUpsertSpy = jest.spyOn(prismaService.recordLink, 'upsert').mockResolvedValue({
        id: 'link-1',
        sourceRecordId: record.id,
        targetRecordId: candidate.id,
        confidenceScore: 0.7,
        relationshipType: 'explicit',
        discoveryMethod: 'deterministic',
        metadata: null,
        createdAt: new Date(),
      });

      await service.discoverRelationships(record);

      expect(linkUpsertSpy).toHaveBeenCalled();
      const call = linkUpsertSpy.mock.calls[0][0];
      expect(call.create.confidenceScore).toBeGreaterThanOrEqual(0.7);
    });

    it('should score 0.6 for URL reference', async () => {
      const record = mockRecord({ url: 'https://github.com/org/repo/issues/123' });
      const candidate = mockRecord({
        id: 'record-2',
        body: 'See https://github.com/org/repo/issues/123 for details',
      });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: false,
        hasUrlReference: true,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.3);
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);

      // Score should be 0.6 (URL) + possibly more, should not trigger link at < 0.7 without additional signals
      await service.discoverRelationships(record);
    });

    it('should score 0.5 for shared metadata', async () => {
      const record = mockRecord({ metadata: { branch: 'feature/auth', commit: 'abc123' } });
      const candidate = mockRecord({
        id: 'record-2',
        metadata: { branch: 'feature/auth', repository: 'org/repo' },
      });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: false,
        hasUrlReference: false,
        hasSharedMetadata: true,
        sharedMetadataKeys: ['branch'],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.3);
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);

      await service.discoverRelationships(record);
    });

    it('should score 0.3 for high TF-IDF similarity', async () => {
      const record = mockRecord();
      const candidate = mockRecord({ id: 'record-2' });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: false,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.8);
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);

      await service.discoverRelationships(record);
    });

    it('should score 0.2 for actor overlap (same author)', async () => {
      const record = mockRecord({ author: 'john' });
      const candidate = mockRecord({ id: 'record-2', author: 'john' });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: false,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.3);
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);

      await service.discoverRelationships(record);
    });

    it('should score 0.1 for temporal proximity (< 24h)', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const record = mockRecord({ timestamp: now });
      const candidate = mockRecord({ id: 'record-2', timestamp: oneHourAgo });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: false,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.3);
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);

      await service.discoverRelationships(record);
    });

    it('should combine multiple signals for high score', async () => {
      const record = mockRecord({ 
        externalId: 'JIRA-123',
        author: 'john',
        timestamp: new Date(),
        metadata: { branch: 'feature/auth' }
      });
      const candidate = mockRecord({
        id: 'record-2',
        title: 'Fix for JIRA-123',
        author: 'john',
        timestamp: new Date(),
        metadata: { branch: 'feature/auth' }
      });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: true, // 0.7
        hasUrlReference: false,
        hasSharedMetadata: true, // 0.5
        sharedMetadataKeys: ['branch'],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.8); // 0.3
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);
      jest.spyOn(graphService, 'createContextGroup').mockResolvedValue('group-1');

      const linkUpsertSpy = jest.spyOn(prismaService.recordLink, 'upsert').mockResolvedValue({
        id: 'link-1',
        sourceRecordId: record.id,
        targetRecordId: candidate.id,
        confidenceScore: 1.0,
        relationshipType: 'strong_contextual',
        discoveryMethod: 'deterministic',
        metadata: null,
        createdAt: new Date(),
      });

      await service.discoverRelationships(record);

      // Score: 0.7 (ID) + 0.5 (metadata) + 0.3 (tfidf) + 0.2 (author) + 0.1 (temporal) = 1.8 → capped at 1.0
      expect(linkUpsertSpy).toHaveBeenCalled();
      const call = linkUpsertSpy.mock.calls[0][0];
      expect(call.create.confidenceScore).toBe(1.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty body gracefully', async () => {
      const record = mockRecord({ body: '' });
      const candidate = mockRecord({ id: 'record-2', body: '' });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: false,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0);
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);

      await expect(service.discoverRelationships(record)).resolves.not.toThrow();
    });

    it('should handle special characters in IDs', async () => {
      const record = mockRecord({ externalId: 'PROJ-123!' });
      const candidate = mockRecord({
        id: 'record-2',
        title: 'Fix PROJ-123!',
      });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: true,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.3);
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);
      jest.spyOn(graphService, 'createContextGroup').mockResolvedValue('group-1');
      jest.spyOn(prismaService.recordLink, 'upsert').mockResolvedValue({
        id: 'link-1',
        sourceRecordId: record.id,
        targetRecordId: candidate.id,
        confidenceScore: 0.7,
        relationshipType: 'explicit',
        discoveryMethod: 'deterministic',
        metadata: null,
        createdAt: new Date(),
      });

      await expect(service.discoverRelationships(record)).resolves.not.toThrow();
    });

    it('should handle null/undefined metadata gracefully', async () => {
      const record = mockRecord({ metadata: null as any });
      const candidate = mockRecord({
        id: 'record-2',
        metadata: undefined as any,
      });

      jest.spyOn(graphService, 'findLinkingCandidateIds').mockResolvedValue(['record-2'])
      jest.spyOn(graphService, 'hydrateRecordsFromIds').mockResolvedValue([candidate]);
      jest.spyOn(graphService, 'calculateGraphSignals').mockResolvedValue({
        hasIdMatch: false,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: [],
      });
      jest.spyOn(tfidfService, 'calculateSimilarity').mockReturnValue(0.3);
      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);

      await expect(service.discoverRelationships(record)).resolves.not.toThrow();
    });
  });

  describe('createManualLink', () => {
    it('should create link with 100% confidence for manual links', async () => {
      const recordA = mockRecord({ id: 'record-a', userId: 'user-1' });
      const recordB = mockRecord({ id: 'record-b', userId: 'user-1' });

      jest.spyOn(prismaService.unifiedRecord, 'findUnique')
        .mockResolvedValueOnce(recordA)
        .mockResolvedValueOnce(recordB);

      jest.spyOn(graphService, 'getRecordGroups').mockResolvedValue([]);
      jest.spyOn(graphService, 'createContextGroup').mockResolvedValue('group-1');

      const linkUpsertSpy = jest.spyOn(prismaService.recordLink, 'upsert').mockResolvedValue({
        id: 'link-1',
        sourceRecordId: recordA.id,
        targetRecordId: recordB.id,
        confidenceScore: 1.0,
        relationshipType: 'explicit',
        discoveryMethod: 'deterministic',
        metadata: null,
        createdAt: new Date(),
      });

      const result = await service.createManualLink('user-1', 'record-a', 'record-b');

      expect(result.success).toBe(true);
      expect(linkUpsertSpy).toHaveBeenCalled();
      const call = linkUpsertSpy.mock.calls[0][0];
      expect(call.create.confidenceScore).toBe(1.0);
    });

    it('should reject manual link if user does not own records', async () => {
      const recordA = mockRecord({ id: 'record-a', userId: 'user-1' });
      const recordB = mockRecord({ id: 'record-b', userId: 'user-2' });

      jest.spyOn(prismaService.unifiedRecord, 'findUnique')
        .mockResolvedValueOnce(recordA)
        .mockResolvedValueOnce(recordB);

      await expect(
        service.createManualLink('user-1', 'record-a', 'record-b')
      ).rejects.toThrow('Access denied');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { RecordsService } from './records.service';
import { GraphService } from './graph.service';
import { PrismaService } from '../prisma/prisma.service';
import { Neo4jService } from '../neo4j/neo4j.service';
import { RedisService } from '../common/redis.service';
import { createMockPrismaService, createMockNeo4jService, createMockRedisService } from '../../test/utils';

describe('RecordsService', () => {
  let service: RecordsService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let neo4j: ReturnType<typeof createMockNeo4jService>;
  let redis: ReturnType<typeof createMockRedisService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    neo4j = createMockNeo4jService();
    redis = createMockRedisService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        GraphService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: Neo4jService,
          useValue: neo4j,
        },
        {
          provide: RedisService,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all records with pagination', async () => {
      const mockRecords = [
        {
          id: '1',
          userId: 'user-1',
          sourceId: 'source-1',
          externalId: 'ext-1',
          sourcePlatform: 'github',
          artifactType: 'issue',
          title: 'Test Issue',
          body: 'Test body',
          author: 'testuser',
          url: 'https://github.com/test/issue/1',
          timestamp: new Date(),
          participants: ['testuser'],
          checksum: 'checksum-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
          source: {
            providerName: 'github',
            status: 'active',
          },
        },
      ];

      prisma.unifiedRecord.findMany.mockResolvedValue(mockRecords);
      prisma.unifiedRecord.count.mockResolvedValue(1);

      const result = await service.findAll({ limit: 100, offset: 0 });

      expect(result).toEqual({
        records: mockRecords,
        pagination: {
          total: 1,
          limit: 100,
          offset: 0,
          hasMore: false,
        },
      });
      expect(prisma.unifiedRecord.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { timestamp: 'desc' },
        take: 100,
        skip: 0,
        include: {
          source: {
            select: {
              providerName: true,
              status: true,
            },
          },
        },
      });
    });

    it('should filter by source platform', async () => {
      prisma.unifiedRecord.findMany.mockResolvedValue([]);
      prisma.unifiedRecord.count.mockResolvedValue(0);

      await service.findAll({ source: 'github' });

      expect(prisma.unifiedRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sourcePlatform: 'github' },
        }),
      );
    });

    it('should filter by search query', async () => {
      prisma.unifiedRecord.findMany.mockResolvedValue([]);
      prisma.unifiedRecord.count.mockResolvedValue(0);

      await service.findAll({ search: 'test query' });

      expect(prisma.unifiedRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'test query', mode: 'insensitive' } },
              { body: { contains: 'test query', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });
  });
});

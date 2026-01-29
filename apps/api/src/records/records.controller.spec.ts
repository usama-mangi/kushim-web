import { Test, TestingModule } from '@nestjs/testing';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { GraphService } from './graph.service';
import { PrismaService } from '../prisma/prisma.service';
import { Neo4jService } from '../neo4j/neo4j.service';
import { RedisService } from '../common/redis.service';
import { createMockPrismaService, createMockNeo4jService, createMockRedisService } from '../../test/utils';

describe('RecordsController', () => {
  let controller: RecordsController;
  let recordsService: RecordsService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let neo4j: ReturnType<typeof createMockNeo4jService>;
  let redis: ReturnType<typeof createMockRedisService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    neo4j = createMockNeo4jService();
    redis = createMockRedisService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordsController],
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

    controller = module.get<RecordsController>(RecordsController);
    recordsService = module.get<RecordsService>(RecordsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have recordsService injected', () => {
    expect(recordsService).toBeDefined();
  });
});

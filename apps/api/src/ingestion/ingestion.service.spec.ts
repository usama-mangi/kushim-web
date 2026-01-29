// Mock ES modules before imports
jest.mock('octokit', () => ({
  Octokit: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('jira.js', () => ({
  Version3Client: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('googleapis', () => ({
  google: {},
}));
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue(
    jest.fn().mockResolvedValue({
      data: new Float32Array(384).fill(0.1),
    })
  ),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EncryptionService } from '../common/encryption.service';
import { EmbeddingService } from '../common/embedding.service';
import { AuditService } from '../audit/audit.service';
import { RelationshipService } from '../records/relationship.service';
import { GraphService } from '../records/graph.service';
import { OAuthService } from './oauth.service';
import { TracingService } from '../common/tracing.service';

// Mock the adapters to avoid ES module loading issues
jest.mock('./adapters/github.adapter');
jest.mock('./adapters/slack.adapter');
jest.mock('./adapters/jira.adapter');
jest.mock('./adapters/google.adapter');

describe('IngestionService', () => {
  let service: IngestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: PrismaService,
          useValue: {
            dataSource: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            unifiedRecord: {
              upsert: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback({})),
          },
        },
        {
          provide: NotificationsGateway,
          useValue: {
            emitToUser: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            decrypt: jest.fn((encrypted) => encrypted),
          },
        },
        {
          provide: EmbeddingService,
          useValue: {
            generateEmbedding: jest.fn().mockResolvedValue(new Float32Array(384).fill(0.1)),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: RelationshipService,
          useValue: {
            discoverRelationships: jest.fn(),
          },
        },
        {
          provide: GraphService,
          useValue: {
            syncRecord: jest.fn(),
          },
        },
        {
          provide: OAuthService,
          useValue: {
            getAccessToken: jest.fn(),
          },
        },
        {
          provide: TracingService,
          useValue: {
            trace: jest.fn((name, fn) => fn()),
            withSpan: jest.fn((name, fn) => {
              const mockSpan = {
                setAttribute: jest.fn(),
                setStatus: jest.fn(),
                end: jest.fn(),
              };
              return fn(mockSpan);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

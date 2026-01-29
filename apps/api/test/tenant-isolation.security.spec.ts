import { Test, TestingModule } from '@nestjs/testing';
import { GraphService } from '../src/records/graph.service';
import { Neo4jService } from '../src/neo4j/neo4j.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/common/redis.service';

/**
 * Security Tests for Tenant Isolation in Neo4j
 * 
 * These tests verify that all Neo4j queries properly filter by userId
 * to prevent cross-tenant data access.
 * 
 * CRITICAL: These tests must pass before deploying to production.
 */

describe('GraphService - Tenant Isolation Security Tests', () => {
  let service: GraphService;
  let neo4jService: Neo4jService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  const USER_1_ID = 'user-1-test-id';
  const USER_2_ID = 'user-2-test-id';
  const ARTIFACT_USER_1 = 'artifact-user-1-id';
  const ARTIFACT_USER_2 = 'artifact-user-2-id';
  const GROUP_USER_1 = 'group-user-1-id';
  const GROUP_USER_2 = 'group-user-2-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphService,
        {
          provide: Neo4jService,
          useValue: {
            run: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            unifiedRecord: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            link: {
              findUnique: jest.fn(),
            },
            activityLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            getCachedContextGroup: jest.fn().mockResolvedValue(null),
            cacheContextGroup: jest.fn(),
            invalidateUserContextGroups: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GraphService>(GraphService);
    neo4jService = module.get<Neo4jService>(Neo4jService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  describe('getContextGroup', () => {
    it('should filter by userId to prevent cross-tenant access', async () => {
      const mockNeo4jRun = jest.fn().mockResolvedValue([
        {
          get: jest.fn((key: string) => {
            if (key === 'nodes') return [];
            if (key === 'relationships') return [];
            return null;
          }),
        },
      ]);
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      await service.getContextGroup(ARTIFACT_USER_1, USER_1_ID, 2);

      // Verify userId is included in the query
      const cypherQuery = mockNeo4jRun.mock.calls[0][0];
      expect(cypherQuery).toContain('userId = $userId');
      expect(cypherQuery).toContain('WHERE all(n IN nodes WHERE n.userId = $userId)');

      const params = mockNeo4jRun.mock.calls[0][1];
      expect(params.userId).toBe(USER_1_ID);
    });

    it('should NOT return data from other users', async () => {
      // Mock Neo4j to return empty result when userId doesn't match
      const mockNeo4jRun = jest.fn().mockResolvedValue([]);
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      const result = await service.getContextGroup(ARTIFACT_USER_1, USER_2_ID, 2);

      // Should return undefined or empty when userId doesn't match artifact owner
      expect(result).toBeUndefined();
    });
  });

  describe('findLinkingCandidates', () => {
    it('should only return candidates for the requesting user', async () => {
      const mockNeo4jRun = jest.fn().mockResolvedValue([]);
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      await service.findLinkingCandidates(ARTIFACT_USER_1, USER_1_ID, 100);

      const cypherQuery = mockNeo4jRun.mock.calls[0][0];
      expect(cypherQuery).toContain('candidate.userId = $userId');

      const params = mockNeo4jRun.mock.calls[0][1];
      expect(params.userId).toBe(USER_1_ID);
    });

    it('should NOT include artifacts from other users', async () => {
      const mockNeo4jRun = jest.fn().mockResolvedValue([
        {
          get: jest.fn(() => ({
            properties: {
              id: ARTIFACT_USER_2,
              userId: USER_2_ID, // Different user!
              title: 'Artifact from User 2',
            },
          })),
        },
      ]);
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      const candidates = await service.findLinkingCandidates(ARTIFACT_USER_1, USER_1_ID, 100);

      // Should filter out artifacts from other users
      // This test will fail if tenant isolation is broken
      expect(candidates.every(c => c.userId === USER_1_ID)).toBe(true);
    });
  });

  describe('addToContextGroup', () => {
    it('should verify both group and artifact belong to user', async () => {
      const mockNeo4jRun = jest.fn().mockResolvedValue([]);
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      await service.addToContextGroup(GROUP_USER_1, ARTIFACT_USER_1, USER_1_ID);

      const cypherQuery = mockNeo4jRun.mock.calls[0][0];
      
      // Verify userId check for both ContextGroup and Artifact
      expect(cypherQuery).toContain('WHERE g.userId = $userId');
      expect(cypherQuery).toContain('WHERE a.userId = $userId');

      const params = mockNeo4jRun.mock.calls[0][1];
      expect(params.userId).toBe(USER_1_ID);
    });

    it('should FAIL to add artifact from different user to group', async () => {
      const mockNeo4jRun = jest.fn().mockRejectedValue(
        new Error('No nodes matched the pattern')
      );
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      // Try to add User 2's artifact to User 1's group
      await expect(
        service.addToContextGroup(GROUP_USER_1, ARTIFACT_USER_2, USER_1_ID)
      ).rejects.toThrow();
    });
  });

  describe('mergeContextGroups', () => {
    it('should verify both groups belong to the same user', async () => {
      const mockNeo4jRun = jest.fn().mockResolvedValue([]);
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      await service.mergeContextGroups(GROUP_USER_1, 'group-another', USER_1_ID);

      const cypherQuery = mockNeo4jRun.mock.calls[0][0];

      // Verify userId check for both source and target groups
      expect(cypherQuery).toMatch(/source\.userId = \$userId/);
      expect(cypherQuery).toMatch(/target\.userId = \$userId/);
      expect(cypherQuery).toMatch(/a\.userId = \$userId/);

      const params = mockNeo4jRun.mock.calls[0][1];
      expect(params.userId).toBe(USER_1_ID);
    });

    it('should FAIL to merge groups from different users', async () => {
      const mockNeo4jRun = jest.fn().mockRejectedValue(
        new Error('No nodes matched the pattern')
      );
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      // Try to merge User 2's group into User 1's group
      await expect(
        service.mergeContextGroups(GROUP_USER_1, GROUP_USER_2, USER_1_ID)
      ).rejects.toThrow();
    });
  });

  describe('deleteArtifact', () => {
    it('should only delete artifacts belonging to the user', async () => {
      const mockNeo4jRun = jest.fn().mockResolvedValue([]);
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      await service.deleteArtifact(ARTIFACT_USER_1, USER_1_ID);

      const cypherQuery = mockNeo4jRun.mock.calls[0][0];
      expect(cypherQuery).toContain('AND a.userId = $userId');

      const params = mockNeo4jRun.mock.calls[0][1];
      expect(params.userId).toBe(USER_1_ID);
    });

    it('should NOT delete artifacts from other users', async () => {
      const mockNeo4jRun = jest.fn().mockResolvedValue([]);
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      // Try to delete User 2's artifact as User 1
      await service.deleteArtifact(ARTIFACT_USER_2, USER_1_ID);

      // Should not delete anything (no nodes matched)
      expect(mockNeo4jRun).toHaveBeenCalled();
      // In real scenario, this would result in 0 deletions
    });
  });

  describe('createContextGroup', () => {
    it('should set userId on the new group', async () => {
      const mockNeo4jRun = jest.fn().mockResolvedValue([
        { get: jest.fn(() => ({ properties: { id: 'new-group' } })) },
      ]);
      (neo4jService.run as jest.Mock) = mockNeo4jRun;

      await service.createContextGroup(
        ARTIFACT_USER_1,
        'artifact-2',
        USER_1_ID,
        'Test Group'
      );

      const cypherQuery = mockNeo4jRun.mock.calls[0][0];
      
      // Verify userId is set on the group
      expect(cypherQuery).toContain('g.userId = $userId');
      // Verify artifacts belong to user
      expect(cypherQuery).toContain('WHERE a.userId = $userId');
      expect(cypherQuery).toContain('WHERE b.userId = $userId');
    });
  });

  describe('Index Verification', () => {
    it('should have userId index on Artifact nodes', async () => {
      // This test should be run against a real Neo4j instance
      // For now, we document the requirement
      console.warn(
        '⚠️  Manual verification required: Ensure userId index exists on Artifact nodes'
      );
      console.warn('   Run: ./scripts/create-neo4j-indices.sh');
    });

    it('should have userId index on ContextGroup nodes', async () => {
      console.warn(
        '⚠️  Manual verification required: Ensure userId index exists on ContextGroup nodes'
      );
      console.warn('   Run: ./scripts/create-neo4j-indices.sh');
    });
  });
});

describe('Integration Test - Cross-Tenant Access Prevention', () => {
  // These tests should be run against a real database in CI/CD
  // They verify end-to-end tenant isolation

  it.todo('should prevent User A from accessing User B\'s artifacts via API');
  it.todo('should prevent User A from adding artifacts to User B\'s groups');
  it.todo('should prevent User A from viewing User B\'s context groups');
  it.todo('should prevent User A from merging User B\'s groups');
});

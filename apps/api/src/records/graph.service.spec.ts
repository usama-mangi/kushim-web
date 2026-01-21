import { Test, TestingModule } from '@nestjs/testing';
import { GraphService } from './graph.service';
import { Neo4jService } from '../neo4j/neo4j.service';

describe('GraphService - Context Groups', () => {
  let service: GraphService;
  let neo4jService: Neo4jService;

  const mockNeo4jRun = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphService,
        {
          provide: Neo4jService,
          useValue: {
            run: mockNeo4jRun,
          },
        },
      ],
    }).compile();

    service = module.get<GraphService>(GraphService);
    neo4jService = module.get<Neo4jService>(Neo4jService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createContextGroup', () => {
    it('should create context group with metadata', async () => {
      const mockGroupId = 'group-123';
      mockNeo4jRun
        .mockResolvedValueOnce([]) // createContextGroup query
        .mockResolvedValueOnce([  // updateGroupMetadata - get artifacts
          {
            get: (key: string) => {
              if (key === 'title') return 'Fix authentication bug';
              if (key === 'body') return 'Users experiencing JWT token issues';
              if (key === 'metadata') return '{}';
              return null;
            },
          },
        ])
        .mockResolvedValueOnce([  // calculateCoherenceScore
          { get: (key: string) => 1.0 },
        ])
        .mockResolvedValueOnce([]); // updateGroupMetadata - update query

      const result = await service.createContextGroup('record-1', 'record-2', 'Auth Context');

      expect(result).toBeDefined();
      expect(mockNeo4jRun).toHaveBeenCalledTimes(4);
      
      // Verify context group creation
      const createCall = mockNeo4jRun.mock.calls[0];
      expect(createCall[0]).toContain('MERGE (g:ContextGroup');
      expect(createCall[0]).toContain('coherenceScore');
      expect(createCall[0]).toContain('topics');
    });
  });

  describe('extractTopics', () => {
    it('should extract meaningful topics from text', () => {
      const text = 'Fix authentication bug with JWT tokens in the login system';
      const topics = (service as any).extractTopics(text, 3);
      
      expect(topics).toBeInstanceOf(Array);
      expect(topics.length).toBeLessThanOrEqual(3);
      expect(topics.length).toBeGreaterThan(0);
      
      // Should not contain stopwords
      expect(topics).not.toContain('with');
      expect(topics).not.toContain('that');
    });

    it('should handle empty text', () => {
      const topics = (service as any).extractTopics('', 5);
      expect(topics).toEqual([]);
    });

    it('should filter short words', () => {
      const text = 'a ab abc authentication';
      const topics = (service as any).extractTopics(text, 5);
      
      // Only 'authentication' should be included (length > 3)
      expect(topics).toContain('authentication');
      expect(topics).not.toContain('a');
      expect(topics).not.toContain('ab');
      expect(topics).not.toContain('abc');
    });
  });

  describe('calculateCoherenceScore', () => {
    it('should return 1.0 for highly connected groups', async () => {
      mockNeo4jRun.mockResolvedValue([
        { get: (key: string) => 1.0 },
      ]);

      const score = await service.calculateCoherenceScore('group-1');
      
      expect(score).toBe(1.0);
      expect(mockNeo4jRun).toHaveBeenCalled();
    });

    it('should return lower score for weakly connected groups', async () => {
      mockNeo4jRun.mockResolvedValue([
        { get: (key: string) => 0.3 },
      ]);

      const score = await service.calculateCoherenceScore('group-1');
      
      expect(score).toBe(0.3);
      expect(score).toBeLessThan(0.5);
    });

    it('should handle groups with no links gracefully', async () => {
      mockNeo4jRun.mockResolvedValue([]);

      const score = await service.calculateCoherenceScore('group-1');
      
      expect(score).toBe(1.0); // Default for empty groups
    });
  });

  describe('checkAndSplitGroup', () => {
    it('should not split groups with high coherence', async () => {
      // Mock high coherence score
      mockNeo4jRun.mockResolvedValue([
        { get: (key: string) => 0.8 },
      ]);

      const result = await service.checkAndSplitGroup('group-1');
      
      expect(result).toEqual([]);
      expect(mockNeo4jRun).toHaveBeenCalledTimes(1); // Only coherence check
    });

    it('should not split small groups even with low coherence', async () => {
      mockNeo4jRun
        .mockResolvedValueOnce([{ get: (key: string) => 0.2 }]) // Low coherence
        .mockResolvedValueOnce([{ get: (key: string) => 3 }]);   // Small size

      const result = await service.checkAndSplitGroup('group-1');
      
      expect(result).toEqual([]);
    });

    it('should attempt split for large groups with low coherence', async () => {
      mockNeo4jRun
        .mockResolvedValueOnce([{ get: (key: string) => 0.2 }])  // Low coherence
        .mockResolvedValueOnce([{ get: (key: string) => 10 }])   // Large size
        .mockResolvedValueOnce([]);  // splitGroupByCommunities query

      const result = await service.checkAndSplitGroup('group-1');
      
      expect(mockNeo4jRun).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateGroupMetadata', () => {
    it('should update topics and coherence score', async () => {
      mockNeo4jRun
        .mockResolvedValueOnce([  // Get artifacts
          {
            get: (key: string) => {
              if (key === 'title') return 'Authentication issue';
              if (key === 'body') return 'JWT token expiration problem';
              return '{}';
            },
          },
          {
            get: (key: string) => {
              if (key === 'title') return 'Login bug';
              if (key === 'body') return 'Authentication failing for users';
              return '{}';
            },
          },
        ])
        .mockResolvedValueOnce([{ get: (key: string) => 0.85 }])  // Coherence score
        .mockResolvedValueOnce([]); // Update query

      await service.updateGroupMetadata('group-1');
      
      expect(mockNeo4jRun).toHaveBeenCalledTimes(3);
      
      const updateCall = mockNeo4jRun.mock.calls[2];
      expect(updateCall[0]).toContain('SET g.topics');
      expect(updateCall[0]).toContain('g.coherenceScore');
      expect(updateCall[1].topics).toBeInstanceOf(Array);
      expect(updateCall[1].topics.length).toBeGreaterThan(0);
    });

    it('should handle groups with no artifacts', async () => {
      mockNeo4jRun.mockResolvedValueOnce([]); // No artifacts

      await service.updateGroupMetadata('group-1');
      
      // Should only call once to get artifacts, then return early
      expect(mockNeo4jRun).toHaveBeenCalledTimes(1);
    });
  });

  describe('addToContextGroup', () => {
    it('should add artifact and update metadata', async () => {
      mockNeo4jRun
        .mockResolvedValueOnce([])   // Add to group
        .mockResolvedValueOnce([     // updateGroupMetadata - get artifacts
          { get: (key: string) => key === 'title' ? 'Test' : 'Body' },
        ])
        .mockResolvedValueOnce([{ get: (key: string) => 0.9 }])  // Coherence
        .mockResolvedValueOnce([])   // Update metadata
        .mockResolvedValueOnce([{ get: (key: string) => 0.9 }]); // checkAndSplitGroup

      await service.addToContextGroup('group-1', 'record-1');
      
      expect(mockNeo4jRun).toHaveBeenCalled();
      
      const addCall = mockNeo4jRun.mock.calls[0];
      expect(addCall[0]).toContain('MERGE (a)-[:BELONGS_TO');
    });
  });

  describe('mergeContextGroups', () => {
    it('should merge groups and update metadata', async () => {
      mockNeo4jRun
        .mockResolvedValueOnce([])   // Merge query
        .mockResolvedValueOnce([     // updateGroupMetadata
          { get: (key: string) => key === 'title' ? 'Test' : 'Body' },
        ])
        .mockResolvedValueOnce([{ get: (key: string) => 0.85 }])  // Coherence
        .mockResolvedValueOnce([])   // Update metadata
        .mockResolvedValueOnce([{ get: (key: string) => 0.85 }]); // checkAndSplitGroup

      await service.mergeContextGroups('target-group', 'source-group');
      
      expect(mockNeo4jRun).toHaveBeenCalled();
      
      const mergeCall = mockNeo4jRun.mock.calls[0];
      expect(mergeCall[0]).toContain('DETACH DELETE source');
    });
  });

  describe('clusterArtifacts', () => {
    it('should cluster connected artifacts', () => {
      const connectivityData = [
        {
          get: (key: string) => {
            if (key === 'artifactId') return 'art-1';
            if (key === 'connected') return [
              { properties: { id: 'art-2' } },
              { properties: { id: 'art-3' } },
            ];
            return null;
          },
        },
        {
          get: (key: string) => {
            if (key === 'artifactId') return 'art-4';
            if (key === 'connected') return [];
            return null;
          },
        },
      ];

      const clusters = (service as any).clusterArtifacts(connectivityData);
      
      expect(clusters).toBeInstanceOf(Array);
      expect(clusters.length).toBeGreaterThan(0);
      
      // First cluster should contain connected artifacts
      const firstCluster = clusters[0];
      expect(firstCluster).toContain('art-1');
    });

    it('should handle empty connectivity data', () => {
      const clusters = (service as any).clusterArtifacts([]);
      expect(clusters).toEqual([]);
    });
  });

  describe('getContextGroups', () => {
    it('should return groups with metadata', async () => {
      mockNeo4jRun.mockResolvedValue([
        {
          get: (key: string) => {
            if (key === 'g') {
              return {
                properties: {
                  id: 'group-1',
                  name: 'Auth Context',
                  coherenceScore: 0.85,
                  topics: ['authentication', 'login', 'jwt'],
                  status: 'active',
                  createdAt: '2024-01-15',
                  updatedAt: '2024-01-20',
                },
              };
            }
            if (key === 'members') {
              return [
                {
                  rel: { properties: { weight: 1.0 } },
                  node: {
                    properties: {
                      id: 'rec-1',
                      title: 'Test',
                      platform: 'github',
                      type: 'issue',
                    },
                  },
                },
              ];
            }
            return null;
          },
        },
      ]);

      const groups = await service.getContextGroups('user-1');
      
      expect(groups).toBeInstanceOf(Array);
      expect(groups.length).toBe(1);
      expect(groups[0]).toHaveProperty('coherenceScore');
      expect(groups[0]).toHaveProperty('topics');
      expect(groups[0]).toHaveProperty('memberCount');
      expect(groups[0].topics).toEqual(['authentication', 'login', 'jwt']);
      expect(groups[0].coherenceScore).toBe(0.85);
    });
  });

  describe('deleteContextGroup', () => {
    it('should delete a context group', async () => {
      mockNeo4jRun.mockResolvedValueOnce([]);

      await service.deleteContextGroup('group-1');

      const deleteCall = mockNeo4jRun.mock.calls[0];
      expect(deleteCall[0]).toContain('DETACH DELETE');
      expect(deleteCall[1].groupId).toBe('group-1');
    });
  });

  describe('renameContextGroup', () => {
    it('should rename a context group', async () => {
      mockNeo4jRun.mockResolvedValueOnce([{ get: () => ({}) }]);

      await service.renameContextGroup('group-1', 'New Name');

      const renameCall = mockNeo4jRun.mock.calls[0];
      expect(renameCall[0]).toContain('SET g.name');
      expect(renameCall[1].groupId).toBe('group-1');
      expect(renameCall[1].newName).toBe('New Name');
    });
  });

  describe('removeFromContextGroup', () => {
    it('should remove artifact from group and update metadata', async () => {
      mockNeo4jRun
        .mockResolvedValueOnce([])  // remove relationship
        .mockResolvedValueOnce([{ get: (key: string) => key === 'title' ? 'test' : 'body' }])  // updateGroupMetadata - get artifacts
        .mockResolvedValueOnce([{ get: (key: string) => 0.8 }])  // calculateCoherenceScore
        .mockResolvedValueOnce([])  // updateGroupMetadata - update query
        .mockResolvedValueOnce([]);  // delete empty group

      await service.removeFromContextGroup('group-1', 'artifact-1');

      const removeCall = mockNeo4jRun.mock.calls[0];
      expect(removeCall[0]).toContain('DELETE r');
      expect(removeCall[1].groupId).toBe('group-1');
      expect(removeCall[1].recordId).toBe('artifact-1');
    });
  });
});

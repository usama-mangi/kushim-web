import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';

// Mock @xenova/transformers
const mockPipeline = jest.fn().mockReturnValue({
  data: new Float32Array(384).fill(0.1),
});

jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue(mockPipeline),
}));

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbeddingService],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);

    // Wait for model initialization
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate embedding for text', async () => {
    const text = 'This is a test sentence for embedding generation.';
    const embedding = await service.generateEmbedding(text);

    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(384); // all-MiniLM-L6-v2 produces 384-dim vectors
    expect(typeof embedding[0]).toBe('number');
  });

  it('should generate embeddings for record', async () => {
    const title = 'Fix authentication bug';
    const body = 'Users are unable to log in due to token expiration issue.';
    const embedding = await service.generateEmbeddingForRecord(title, body);

    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(384);
  });

  it('should calculate cosine similarity', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [1, 0, 0];
    const vec3 = [0, 1, 0];

    const similarity1 = service.cosineSimilarity(vec1, vec2);
    const similarity2 = service.cosineSimilarity(vec1, vec3);

    expect(similarity1).toBeCloseTo(1.0, 2); // Identical vectors
    expect(similarity2).toBeCloseTo(0.0, 2); // Orthogonal vectors
  });

  it('should handle zero vectors in cosine similarity', () => {
    const vec1 = [0, 0, 0];
    const vec2 = [1, 2, 3];

    const similarity = service.cosineSimilarity(vec1, vec2);

    expect(similarity).toBe(0);
  });

  it('should throw error for mismatched vector lengths', () => {
    const vec1 = [1, 2, 3];
    const vec2 = [1, 2];

    expect(() => service.cosineSimilarity(vec1, vec2)).toThrow();
  });
});

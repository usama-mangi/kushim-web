import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(async () => {
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

  it('should truncate very long text', async () => {
    const longText = 'a'.repeat(10000); // Very long text
    const embedding = await service.generateEmbedding(longText);

    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(384);
  });

  it('should produce similar embeddings for similar text', async () => {
    const text1 = 'The cat sat on the mat.';
    const text2 = 'A cat is sitting on a mat.';
    const text3 = 'The dog ran in the park.';

    const emb1 = await service.generateEmbedding(text1);
    const emb2 = await service.generateEmbedding(text2);
    const emb3 = await service.generateEmbedding(text3);

    const sim12 = service.cosineSimilarity(emb1, emb2);
    const sim13 = service.cosineSimilarity(emb1, emb3);

    expect(sim12).toBeGreaterThan(sim13); // Similar sentences should be more similar
    expect(sim12).toBeGreaterThan(0.7); // High similarity expected
  });
}, 60000); // 60 second timeout for model loading

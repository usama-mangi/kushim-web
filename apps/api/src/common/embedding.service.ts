import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { pipeline } from '@xenova/transformers';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private embeddingPipeline: any = null; // Use 'any' for Xenova pipeline type
  private readonly MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'; // 384-dim sentence embeddings
  private isInitialized = false;

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;

    try {
      this.logger.log('Initializing embedding model...');
      this.embeddingPipeline = await pipeline(
        'feature-extraction',
        this.MODEL_NAME,
      );
      this.isInitialized = true;
      this.logger.log('Embedding model initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize embedding model', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.embeddingPipeline) {
      throw new Error('Embedding pipeline not initialized');
    }

    try {
      // Truncate very long text (transformers have token limits)
      const truncatedText = text.slice(0, 5000);

      const output = await this.embeddingPipeline(truncatedText, {
        pooling: 'mean',
        normalize: true,
      });

      // Extract the embedding array from the tensor
      const embedding: number[] = Array.from(output.data as ArrayLike<number>);

      return embedding;
    } catch (error) {
      this.logger.error('Failed to generate embedding', error);
      throw error;
    }
  }

  async generateEmbeddingForRecord(
    title: string,
    body: string,
  ): Promise<number[]> {
    const combinedText = `${title}\n\n${body}`;
    return this.generateEmbedding(combinedText);
  }

  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async batchGenerateEmbeddings(
    texts: string[],
  ): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }
}

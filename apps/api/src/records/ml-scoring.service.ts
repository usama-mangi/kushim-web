import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnifiedRecord } from '@prisma/client';
import { EmbeddingService } from '../common/embedding.service';

@Injectable()
export class MLScoringService {
  private readonly logger = new Logger(MLScoringService.name);

  // ML Specs Phase 2: Hybrid scoring weights
  private readonly ALPHA = 0.6; // Deterministic score weight
  private readonly BETA = 0.3; // Semantic similarity weight
  private readonly GAMMA = 0.1; // Structural features weight

  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
  ) {}

  async runShadowScoring(
    a: UnifiedRecord,
    b: UnifiedRecord,
    deterministicScore: number,
  ): Promise<void> {
    try {
      const semanticScore = await this.calculateSemanticSimilarity(a, b);
      const structuralScore = this.calculateStructuralFeatures(a, b);

      const mlScore =
        this.ALPHA * deterministicScore +
        this.BETA * semanticScore +
        this.GAMMA * structuralScore;

      this.logger.log(
        `ML Shadow Score for ${a.externalId} <-> ${b.externalId}: ${mlScore.toFixed(4)} ` +
          `(Det: ${deterministicScore.toFixed(2)}, Sem: ${semanticScore.toFixed(2)}, Struct: ${structuralScore.toFixed(2)})`,
      );

      await this.persistShadowLink(
        a.id,
        b.id,
        deterministicScore,
        semanticScore,
        structuralScore,
        mlScore,
      );
    } catch (error) {
      this.logger.error('Shadow scoring failed', error);
    }
  }

  private async calculateSemanticSimilarity(
    a: UnifiedRecord,
    b: UnifiedRecord,
  ): Promise<number> {
    try {
      const embeddingA = this.parseEmbedding(a.embedding);
      const embeddingB = this.parseEmbedding(b.embedding);

      if (!embeddingA || !embeddingB) {
        this.logger.debug(
          `Missing embeddings for ${a.externalId} or ${b.externalId}, using fallback`,
        );
        return this.fallbackSemanticSimilarity(a, b);
      }

      const similarity = this.embeddingService.cosineSimilarity(
        embeddingA,
        embeddingB,
      );

      return Math.max(0, Math.min(1, similarity));
    } catch (error) {
      this.logger.error('Semantic similarity calculation failed', error);
      return this.fallbackSemanticSimilarity(a, b);
    }
  }

  private parseEmbedding(embedding: any): number[] | null {
    if (!embedding) return null;

    // Handle JSON stored embedding
    if (typeof embedding === 'string') {
      try {
        return JSON.parse(embedding);
      } catch {
        return null;
      }
    }

    // Already an array
    if (Array.isArray(embedding)) {
      return embedding;
    }

    return null;
  }

  private fallbackSemanticSimilarity(
    a: UnifiedRecord,
    b: UnifiedRecord,
  ): number {
    const wordsA = new Set(a.body.toLowerCase().split(/\W+/));
    const wordsB = new Set(b.body.toLowerCase().split(/\W+/));

    const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateStructuralFeatures(
    a: UnifiedRecord,
    b: UnifiedRecord,
  ): number {
    let score = 0;

    // Platform pair scoring (ML Specs: contextual platform relationships)
    const platformPairScore = this.getPlatformPairScore(
      a.sourcePlatform,
      b.sourcePlatform,
    );
    score += platformPairScore * 0.4;

    // Artifact type compatibility
    const typeScore = this.getTypeCompatibilityScore(
      a.artifactType,
      b.artifactType,
    );
    score += typeScore * 0.3;

    // Temporal decay (ML Specs: exponential decay)
    const timeDelta = Math.abs(a.timestamp.getTime() - b.timestamp.getTime());
    const daysApart = timeDelta / (24 * 60 * 60 * 1000);
    const temporalScore = Math.exp(-daysApart / 7); // Decay over 7 days
    score += temporalScore * 0.3;

    return Math.max(0, Math.min(1, score));
  }

  private getPlatformPairScore(platformA: string, platformB: string): number {
    if (platformA === platformB) return 0.6;

    const highAffinityPairs = [
      ['slack', 'github'],
      ['jira', 'github'],
      ['jira', 'slack'],
      ['google', 'slack'],
    ];

    for (const [p1, p2] of highAffinityPairs) {
      if (
        (platformA === p1 && platformB === p2) ||
        (platformA === p2 && platformB === p1)
      ) {
        if (p1 === 'jira' && p2 === 'github') return 0.9;
        if (p1 === 'slack' && p2 === 'github') return 0.8;
        return 0.75;
      }
    }

    return 0.5;
  }

  private getTypeCompatibilityScore(typeA: string, typeB: string): number {
    if (typeA === typeB) return 0.7;

    const compatiblePairs = [
      ['issue', 'pull_request'],
      ['message', 'thread'],
      ['email', 'document'],
      ['commit', 'pull_request'],
    ];

    for (const [t1, t2] of compatiblePairs) {
      if (
        (typeA === t1 && typeB === t2) ||
        (typeA === t2 && typeB === t1)
      ) {
        return 0.8;
      }
    }

    return 0.5;
  }

  private async persistShadowLink(
    sourceRecordId: string,
    targetRecordId: string,
    deterministicScore: number,
    semanticScore: number,
    structuralScore: number,
    mlScore: number,
  ): Promise<void> {
    try {
      await this.prisma.shadowLink.upsert({
        where: {
          sourceRecordId_targetRecordId: {
            sourceRecordId,
            targetRecordId,
          },
        },
        update: {
          deterministicScore,
          semanticScore,
          structuralScore,
          mlScore,
        },
        create: {
          sourceRecordId,
          targetRecordId,
          deterministicScore,
          semanticScore,
          structuralScore,
          mlScore,
        },
      });
    } catch (error) {
      this.logger.error('Failed to persist shadow link', error);
    }
  }

  async getShadowLinkStats() {
    const count = await this.prisma.shadowLink.count();
    const avgScores = await this.prisma.shadowLink.aggregate({
      _avg: {
        deterministicScore: true,
        semanticScore: true,
        structuralScore: true,
        mlScore: true,
      },
    });

    return {
      totalShadowLinks: count,
      averageScores: avgScores._avg,
    };
  }
}



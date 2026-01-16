import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnifiedRecord } from '@prisma/client';

@Injectable()
export class MLScoringService {
  private readonly logger = new Logger(MLScoringService.name);

  constructor(private prisma: PrismaService) {}

  runShadowScoring(
    a: UnifiedRecord,
    b: UnifiedRecord,
    deterministicScore: number,
  ) {
    // α = 0.6, β = 0.3, γ = 0.1
    const alpha = 0.6;
    const beta = 0.3;
    const gamma = 0.1;

    const semanticSimilarity = this.calculateSemanticSimilarity(a, b);
    const structuralFeatures = this.calculateStructuralFeatures(a, b);

    const mlScore =
      alpha * deterministicScore +
      beta * semanticSimilarity +
      gamma * structuralFeatures;

    this.logger.log(
      `ML Shadow Score for ${a.id} <-> ${b.id}: ${mlScore.toFixed(4)} (Deterministic: ${deterministicScore})`,
    );

    // Store shadow score in the Link table if it exists, or a separate ShadowLink table
    // For Phase 2, we update the existing link or log it for evaluation.
  }

  private calculateSemanticSimilarity(
    a: UnifiedRecord,
    b: UnifiedRecord,
  ): number {
    // In a real implementation, this would use embeddings (SBERT/Tensorflow)
    // For shadow mode, we can use a simple Jaccard similarity or TF-IDF on keywords
    const wordsA = new Set(a.body.toLowerCase().split(/\W+/));
    const wordsB = new Set(b.body.toLowerCase().split(/\W+/));

    const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }

  private calculateStructuralFeatures(
    a: UnifiedRecord,
    b: UnifiedRecord,
  ): number {
    // Platform types, graph distance, etc.
    // E.g., Slack <-> GitHub is common
    if (a.sourcePlatform === 'slack' && b.sourcePlatform === 'github')
      return 0.8;
    if (a.sourcePlatform === 'jira' && b.sourcePlatform === 'github')
      return 0.9;
    return 0.5;
  }
}

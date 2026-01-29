import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnifiedRecord, Prisma } from '@prisma/client';
import { MLScoringService } from './ml-scoring.service';
import { GraphService } from './graph.service';
import { TfIdfService } from '../common/tfidf.service';
import { RedisService } from '../common/redis.service';
import { TracingService } from '../common/tracing.service';
import { LinkExplanation } from '../types';
import { ML_CONFIG, PAGINATION } from '../common/constants';

@Injectable()
export class RelationshipService {
  private readonly logger = new Logger(RelationshipService.name);

  // ML Specs Phase 3: Production thresholds (can be overridden via env vars)
  private readonly DETERMINISTIC_THRESHOLD = ML_CONFIG.DETERMINISTIC_THRESHOLD;
  private readonly ML_THRESHOLD = ML_CONFIG.THRESHOLD;
  private readonly ML_SHADOW_MODE = ML_CONFIG.SHADOW_MODE;
  private readonly ML_ENABLED = ML_CONFIG.ENABLED;

  constructor(
    private prisma: PrismaService,
    private mlScoringService: MLScoringService,
    private graphService: GraphService,
    private tfidfService: TfIdfService,
    private redisService: RedisService,
    private tracingService: TracingService,
  ) {
    // Log ML configuration
    if (this.ML_SHADOW_MODE) {
      this.logger.log('ML Shadow Mode: ENABLED - ML predictions will be logged but not actioned');
    } else if (this.ML_ENABLED) {
      this.logger.log('ML Production Mode: ENABLED - ML predictions will create links');
    } else {
      this.logger.log('ML: DISABLED - Only deterministic linking active');
    }
  }

  async discoverRelationships(newRecord: UnifiedRecord) {
    return await this.tracingService.withSpan(
      'relationship.discovery',
      async (span) => {
        span.setAttribute('record.id', newRecord.id);
        span.setAttribute('record.platform', newRecord.sourcePlatform);
        span.setAttribute('record.type', newRecord.artifactType);
        span.setAttribute('user.id', newRecord.userId);

        // Acquire distributed lock to prevent duplicate link creation across instances
        const lockResource = `relationship_discovery:${newRecord.id}`;
    
        return await this.redisService.withLock(
          lockResource,
      async () => {
        // Wrap in transaction to prevent race conditions
        return await this.prisma.$transaction(async (tx) => {
          // Hybrid fetch: Use Neo4j for fast graph-based candidate discovery (IDs only),
          // then hydrate with full records from PostgreSQL (includes embeddings)
          const candidateIds = await this.graphService.findLinkingCandidateIds(
            newRecord.id,
            newRecord.userId,
            PAGINATION.MAX_LINKING_CANDIDATES
          );

          const candidates = await this.graphService.hydrateRecordsFromIds(candidateIds);
          
          span.addEvent('relationship.discovery.candidates_found', {
            'candidates.count': candidates.length,
          });

      for (const candidate of candidates) {
        const deterministicScore = await this.calculateLinkScoreOptimized(newRecord, candidate);

        // Calculate ML score (hybrid: deterministic + semantic + structural)
        const mlScoreResult = await this.mlScoringService.calculateMLScore(
          newRecord,
          candidate,
          deterministicScore,
        );

        // Hybrid decision logic (ML Specs Phase 3)
        let shouldCreateLink = false;
        let finalScore = deterministicScore;
        let discoveryMethod = 'deterministic';
        let explanation = {};

        if (deterministicScore >= this.DETERMINISTIC_THRESHOLD) {
          // Deterministic link (existing behavior)
          shouldCreateLink = true;
          finalScore = deterministicScore;
          discoveryMethod = 'deterministic';
          explanation = {
            deterministicScore,
            mlScore: mlScoreResult.mlScore,
            method: 'deterministic',
            reason: 'Deterministic signals exceeded threshold',
          };
        } else if (
          this.ML_ENABLED &&
          !this.ML_SHADOW_MODE &&
          mlScoreResult.mlScore >= this.ML_THRESHOLD
        ) {
          // ML-assisted link (production mode only)
          shouldCreateLink = true;
          finalScore = mlScoreResult.mlScore;
          discoveryMethod = 'ml_assisted';
          explanation = {
            deterministicScore,
            mlScore: mlScoreResult.mlScore,
            semanticScore: mlScoreResult.semanticScore,
            structuralScore: mlScoreResult.structuralScore,
            method: 'ml_assisted',
            reason: 'ML scoring exceeded threshold',
          };
          this.logger.log(
            `ML-assisted link: ${newRecord.externalId} <-> ${candidate.externalId} ` +
            `(ML: ${mlScoreResult.mlScore.toFixed(2)}, Det: ${deterministicScore.toFixed(2)})`,
          );
        } else if (
          this.ML_ENABLED &&
          this.ML_SHADOW_MODE &&
          mlScoreResult.mlScore >= this.ML_THRESHOLD
        ) {
          // Shadow mode: Log what would have been linked
          shouldCreateLink = false;
          explanation = {
            deterministicScore,
            mlScore: mlScoreResult.mlScore,
            semanticScore: mlScoreResult.semanticScore,
            structuralScore: mlScoreResult.structuralScore,
            method: 'ml_shadow',
            reason: 'ML threshold met but shadow mode active (link NOT created)',
          };
          this.logger.warn(
            `[SHADOW] ML would link: ${newRecord.externalId} <-> ${candidate.externalId} ` +
            `(ML: ${mlScoreResult.mlScore.toFixed(2)}, Det: ${deterministicScore.toFixed(2)}) ` +
            `[Link NOT created - Shadow Mode]`,
          );
        } else {
          // No link created, but log shadow score for analysis
          explanation = {
            deterministicScore,
            mlScore: mlScoreResult.mlScore,
            semanticScore: mlScoreResult.semanticScore,
            structuralScore: mlScoreResult.structuralScore,
            method: 'rejected',
            reason: 'Below both thresholds',
          };
        }

        // Always persist shadow link for evaluation
        await this.mlScoringService.persistShadowLink(
          newRecord.id,
          candidate.id,
          deterministicScore,
          mlScoreResult.semanticScore,
          mlScoreResult.structuralScore,
          mlScoreResult.mlScore,
        );

        if (shouldCreateLink) {
          // Check for existing link before creating (idempotency)
          const [sourceId, targetId] =
            newRecord.timestamp < candidate.timestamp 
              ? [newRecord.id, candidate.id] 
              : [candidate.id, newRecord.id];

          const existingLink = await tx.link.findUnique({
            where: {
              sourceRecordId_targetRecordId: {
                sourceRecordId: sourceId,
                targetRecordId: targetId,
              },
            },
          });

          // Only create/update if necessary
          if (!existingLink || existingLink.confidenceScore < finalScore) {
            await this.createLinkWithTransaction(
              tx,
              newRecord,
              candidate,
              finalScore,
              discoveryMethod,
              explanation,
            );
            await this.updateContextGroups(newRecord, candidate);
          }
        }
      }
    }, {
      isolationLevel: 'Serializable', // Prevent race conditions
      maxWait: 5000, // Maximum wait time in ms
      timeout: 30000, // Maximum transaction time in ms
    });
      },
      15000, // Lock TTL: 15 seconds (longer than transaction timeout)
    );
      },
    );
  }

  private async calculateLinkScoreOptimized(a: UnifiedRecord, b: UnifiedRecord): Promise<number> {
    let score = 0;

    // Use graph-based signal calculation for better performance
    const signals = await this.graphService.calculateGraphSignals(a.id, b.id);

    // Explicit ID Match (0.7)
    if (signals.hasIdMatch) score += 0.7;

    // URL Reference (0.6)
    if (signals.hasUrlReference) score += 0.6;

    // Shared Metadata (0.5)
    if (signals.hasSharedMetadata) score += 0.5;

    // TF-IDF Keyword Overlap (0.3)
    const tfidfScore = this.calculateTfIdfScore(a, b);
    if (tfidfScore > 0.5) score += 0.3;

    // Actor Overlap (0.2)
    if (
      a.author === b.author ||
      a.participants.some((p) => b.participants.includes(p))
    ) {
      score += 0.2;
    }

    // Temporal Proximity (0.1)
    const timeDelta = Math.abs(a.timestamp.getTime() - b.timestamp.getTime());
    if (timeDelta < 24 * 60 * 60 * 1000) score += 0.1;

    return Math.min(score, 1.0);
  }

  private calculateLinkScore(a: UnifiedRecord, b: UnifiedRecord): number {
    let score = 0;

    // Explicit ID Match (0.7)
    if (this.hasIdMatch(a, b)) score += 0.7;

    // URL Reference (0.6)
    if (this.hasUrlReference(a, b)) score += 0.6;

    // Shared Metadata (0.5)
    if (this.hasSharedMetadata(a, b, ['branch', 'commit', 'ref', 'ticketId']))
      score += 0.5;

    // TF-IDF Keyword Overlap (0.3)
    const tfidfScore = this.calculateTfIdfScore(a, b);
    if (tfidfScore > 0.5) score += 0.3;

    // Actor Overlap (0.2)
    if (
      a.author === b.author ||
      a.participants.some((p) => b.participants.includes(p))
    ) {
      score += 0.2;
    }

    // Temporal Proximity (0.1)
    const timeDelta = Math.abs(a.timestamp.getTime() - b.timestamp.getTime());
    if (timeDelta < 24 * 60 * 60 * 1000) score += 0.1;

    return Math.min(score, 1.0);
  }

  private calculateTfIdfScore(a: UnifiedRecord, b: UnifiedRecord): number {
    const textA = `${a.title} ${a.body}`;
    const textB = `${b.title} ${b.body}`;
    return this.tfidfService.calculateSimilarity(textA, textB);
  }

  private hasIdMatch(a: UnifiedRecord, b: UnifiedRecord): boolean {
    const bId = b.externalId;
    if (bId.length < 3) return false; // Avoid matching short IDs
    const idRegex = new RegExp(`\b${bId}\b`, 'i');
    if (idRegex.test(a.title) || idRegex.test(a.body)) return true;

    const aId = a.externalId;
    if (aId.length < 3) return false;
    const idRegexRev = new RegExp(`\b${aId}\b`, 'i');
    if (idRegexRev.test(b.title) || idRegexRev.test(b.body)) return true;

    return false;
  }

  private hasUrlReference(a: UnifiedRecord, b: UnifiedRecord): boolean {
    if (b.url && (a.body.includes(b.url) || a.title.includes(b.url)))
      return true;
    if (a.url && (b.body.includes(a.url) || b.title.includes(a.url)))
      return true;
    return false;
  }

  private hasSharedMetadata(
    a: UnifiedRecord,
    b: UnifiedRecord,
    keys: string[],
  ): boolean {
    const metaA = a.metadata as any;
    const metaB = b.metadata as any;
    for (const key of keys) {
      if (metaA[key] && metaA[key] === metaB[key]) return true;
    }
    return false;
  }

  async createManualLink(userId: string, recordAId: string, recordBId: string) {
    const a = await this.prisma.unifiedRecord.findUnique({ where: { id: recordAId } });
    const b = await this.prisma.unifiedRecord.findUnique({ where: { id: recordBId } });

    if (!a || !b) throw new Error('Records not found');
    if (a.userId !== userId || b.userId !== userId) throw new Error('Access denied');

    await this.createLink(a, b, 1.0); // Manual link = 100% confidence
    await this.updateContextGroups(a, b);
    return { success: true };
  }

  private async createLink(
    a: UnifiedRecord,
    b: UnifiedRecord,
    score: number,
    discoveryMethod: string = 'deterministic',
    explanation: LinkExplanation,
  ) {
    return await this.createLinkWithTransaction(
      this.prisma,
      a,
      b,
      score,
      discoveryMethod,
      explanation,
    );
  }

  private async createLinkWithTransaction(
    tx: Prisma.TransactionClient,
    a: UnifiedRecord,
    b: UnifiedRecord,
    score: number,
    discoveryMethod: string = 'deterministic',
    explanation: LinkExplanation,
  ) {
    const [sourceId, targetId] =
      a.timestamp < b.timestamp ? [a.id, b.id] : [b.id, a.id];

    const link = await tx.link.upsert({
      where: {
        sourceRecordId_targetRecordId: {
          sourceRecordId: sourceId,
          targetRecordId: targetId,
        },
      },
      update: {
        confidenceScore: score,
        discoveryMethod,
        metadata: explanation,
      },
      create: {
        sourceRecordId: sourceId,
        targetRecordId: targetId,
        confidenceScore: score,
        relationshipType: score >= 0.85 ? 'strong_contextual' : 'weak_contextual',
        discoveryMethod,
        metadata: explanation,
      },
    });

    await this.graphService.syncLink(link);
    return link;
  }

  private async updateContextGroups(a: UnifiedRecord, b: UnifiedRecord) {
    const aGroups = await this.graphService.getRecordGroups(a.id);
    const bGroups = await this.graphService.getRecordGroups(b.id);

    // Both records should have the same userId (verified by earlier tenant checks)
    const userId = a.userId;

    if (aGroups.length === 0 && bGroups.length === 0) {
      // New Cluster
      const title = `Context: ${a.title.substring(0, 30)}...`;
      const groupId = await this.graphService.createContextGroup(a.id, b.id, userId, title);
      this.logger.log(`Created new graph context group ${groupId}`);
    } else if (aGroups.length > 0 && bGroups.length === 0) {
      // Add B to A's groups
      for (const groupId of aGroups) {
        await this.graphService.addToContextGroup(groupId, b.id, userId);
      }
    } else if (aGroups.length === 0 && bGroups.length > 0) {
      // Add A to B's groups
      for (const groupId of bGroups) {
        await this.graphService.addToContextGroup(groupId, a.id, userId);
      }
    } else {
      // Merge if different
      // Naive merge: Merge B's groups into A's groups? 
      // Or if they intersect, do nothing.
      // SADD says: "Create, update, merge, split".
      // For Phase 1, let's merge everything into the first group of A.
      const targetGroup = aGroups[0];
      for (const sourceGroup of bGroups) {
        if (sourceGroup !== targetGroup) {
            await this.graphService.mergeContextGroups(targetGroup, sourceGroup, userId);
            this.logger.log(`Merged group ${sourceGroup} into ${targetGroup}`);
        }
      }
    }
  }
}

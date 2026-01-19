import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnifiedRecord } from '@prisma/client';
import { MLScoringService } from './ml-scoring.service';
import { GraphService } from './graph.service';
import { TfIdfService } from '../common/tfidf.service';

@Injectable()
export class RelationshipService {
  private readonly logger = new Logger(RelationshipService.name);

  constructor(
    private prisma: PrismaService,
    private mlScoringService: MLScoringService,
    private graphService: GraphService,
    private tfidfService: TfIdfService,
  ) {}

  async discoverRelationships(newRecord: UnifiedRecord) {
    // Use graph-based candidate discovery for better performance
    const candidates = await this.graphService.findLinkingCandidates(
      newRecord.id,
      newRecord.userId,
      100
    );

    for (const candidate of candidates) {
      const score = await this.calculateLinkScoreOptimized(newRecord, candidate);

      // Trigger shadow ML scoring regardless of deterministic threshold
      this.mlScoringService.runShadowScoring(newRecord, candidate, score);

      if (score >= 0.7) {
        await this.createLink(newRecord, candidate, score);
        await this.updateContextGroups(newRecord, candidate);
      }
    }
  }

  private async calculateLinkScoreOptimized(a: UnifiedRecord, b: any): Promise<number> {
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

  private async createLink(a: UnifiedRecord, b: UnifiedRecord, score: number) {
    const [sourceId, targetId] =
      a.timestamp < b.timestamp ? [a.id, b.id] : [b.id, a.id];

    const link = await this.prisma.link.upsert({
      where: {
        sourceRecordId_targetRecordId: {
          sourceRecordId: sourceId,
          targetRecordId: targetId,
        },
      },
      update: {
        confidenceScore: score,
      },
      create: {
        sourceRecordId: sourceId,
        targetRecordId: targetId,
        confidenceScore: score,
        relationshipType: score >= 0.85 ? 'strong_contextual' : 'explicit',
        discoveryMethod: 'deterministic',
      },
    });

    await this.graphService.syncLink(link);
  }

  private async updateContextGroups(a: UnifiedRecord, b: UnifiedRecord) {
    const aGroups = await this.graphService.getRecordGroups(a.id);
    const bGroups = await this.graphService.getRecordGroups(b.id);

    if (aGroups.length === 0 && bGroups.length === 0) {
      // New Cluster
      const title = `Context: ${a.title.substring(0, 30)}...`;
      const groupId = await this.graphService.createContextGroup(a.id, b.id, title);
      this.logger.log(`Created new graph context group ${groupId}`);
    } else if (aGroups.length > 0 && bGroups.length === 0) {
      // Add B to A's groups
      for (const groupId of aGroups) {
        await this.graphService.addToContextGroup(groupId, b.id);
      }
    } else if (aGroups.length === 0 && bGroups.length > 0) {
      // Add A to B's groups
      for (const groupId of bGroups) {
        await this.graphService.addToContextGroup(groupId, a.id);
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
            await this.graphService.mergeContextGroups(targetGroup, sourceGroup);
            this.logger.log(`Merged group ${sourceGroup} into ${targetGroup}`);
        }
      }
    }
  }
}

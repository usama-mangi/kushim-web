import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnifiedRecord } from '@prisma/client';
import { MLScoringService } from './ml-scoring.service';

@Injectable()
export class RelationshipService {
  private readonly logger = new Logger(RelationshipService.name);

  constructor(
    private prisma: PrismaService,
    private mlScoringService: MLScoringService,
  ) {}

  async discoverRelationships(newRecord: UnifiedRecord) {
    // 1. Fetch potential candidates for linking (same user, recent)
    const candidates = await this.prisma.unifiedRecord.findMany({
      where: {
        userId: newRecord.userId,
        id: { not: newRecord.id },
        timestamp: {
          gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    for (const candidate of candidates) {
      const score = this.calculateLinkScore(newRecord, candidate);

      // Trigger shadow ML scoring regardless of deterministic threshold
      this.mlScoringService.runShadowScoring(newRecord, candidate, score);

      if (score >= 0.7) {
        await this.createLink(newRecord, candidate, score);
        await this.updateContextGroups(newRecord, candidate);
      }
    }
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

  private async createLink(a: UnifiedRecord, b: UnifiedRecord, score: number) {
    const [sourceId, targetId] =
      a.timestamp < b.timestamp ? [a.id, b.id] : [b.id, a.id];

    await this.prisma.link.upsert({
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
  }

  private async updateContextGroups(a: UnifiedRecord, b: UnifiedRecord) {
    const aGroups = await this.prisma.contextGroupMember.findMany({
      where: { recordId: a.id },
    });
    const bGroups = await this.prisma.contextGroupMember.findMany({
      where: { recordId: b.id },
    });

    if (aGroups.length === 0 && bGroups.length === 0) {
      const newGroup = await this.prisma.contextGroup.create({
        data: {
          userId: a.userId,
          name: `Context: ${a.title.substring(0, 30)}...`,
          members: {
            create: [{ recordId: a.id }, { recordId: b.id }],
          },
        },
      });
      this.logger.log(
        `Created new context group ${newGroup.id} for records ${a.id}, ${b.id}`,
      );
    } else if (aGroups.length > 0 && bGroups.length === 0) {
      for (const group of aGroups) {
        await this.prisma.contextGroupMember.upsert({
          where: {
            contextGroupId_recordId: {
              contextGroupId: group.contextGroupId,
              recordId: b.id,
            },
          },
          update: {},
          create: { contextGroupId: group.contextGroupId, recordId: b.id },
        });
      }
    } else if (aGroups.length === 0 && bGroups.length > 0) {
      for (const group of bGroups) {
        await this.prisma.contextGroupMember.upsert({
          where: {
            contextGroupId_recordId: {
              contextGroupId: group.contextGroupId,
              recordId: a.id,
            },
          },
          update: {},
          create: { contextGroupId: group.contextGroupId, recordId: a.id },
        });
      }
    } else {
      if (aGroups[0].contextGroupId !== bGroups[0].contextGroupId) {
        const targetGroupId = aGroups[0].contextGroupId;
        const sourceGroupId = bGroups[0].contextGroupId;

        const sourceMembers = await this.prisma.contextGroupMember.findMany({
          where: { contextGroupId: sourceGroupId },
        });

        for (const member of sourceMembers) {
          await this.prisma.contextGroupMember.upsert({
            where: {
              contextGroupId_recordId: {
                contextGroupId: targetGroupId,
                recordId: member.recordId,
              },
            },
            update: { weight: Math.max(member.weight, 1.0) },
            create: {
              contextGroupId: targetGroupId,
              recordId: member.recordId,
              weight: member.weight,
            },
          });
        }

        await this.prisma.contextGroup.delete({ where: { id: sourceGroupId } });
        this.logger.log(
          `Merged context group ${sourceGroupId} into ${targetGroupId}`,
        );
      }
    }
  }
}

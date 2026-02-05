import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvidence(customerId: string, id: string) {
    const evidence = await this.prisma.evidence.findFirst({
      where: { id, customerId },
      include: {
        control: true,
        integration: true,
      },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    return evidence;
  }

  async getEvidenceByControl(customerId: string, controlId: string) {
    return this.prisma.evidence.findMany({
      where: { customerId, controlId },
      orderBy: { collectedAt: 'desc' },
      take: 10,
      include: {
        integration: true,
      },
    });
  }

  async verifyEvidence(customerId: string, id: string) {
    const evidence = await this.getEvidence(customerId, id);

    // Reconstruct hash payload
    // Note: detailed verification requires ensuring the timestamp matches exactly.
    // We assume the stored evidence has the collectedAt timestamp that was used for hashing.

    const contentToHash = JSON.stringify({
      customerId: evidence.customerId,
      controlId: evidence.controlId,
      data: evidence.data,
      timestamp: evidence.collectedAt.toISOString(),
    });

    const calculatedHash = crypto
      .createHash('sha256')
      .update(contentToHash)
      .digest('hex');

    return {
      verified: calculatedHash === evidence.hash,
      storedHash: evidence.hash,
      calculatedHash,
      timestamp: evidence.collectedAt,
    };
  }
}

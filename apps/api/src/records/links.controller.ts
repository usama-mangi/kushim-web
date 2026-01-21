import { Controller, Get, Param, UseGuards, Post, Body, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('links')
@UseGuards(JwtAuthGuard)
export class LinksController {
  constructor(private prisma: PrismaService) {}

  @Get(':id/explanation')
  async getLinkExplanation(@Param('id') id: string) {
    const link = await this.prisma.link.findUnique({
      where: { id },
      include: {
        sourceRecord: {
          select: {
            id: true,
            externalId: true,
            title: true,
            sourcePlatform: true,
            artifactType: true,
          },
        },
        targetRecord: {
          select: {
            id: true,
            externalId: true,
            title: true,
            sourcePlatform: true,
            artifactType: true,
          },
        },
      },
    });

    if (!link) {
      return { error: 'Link not found' };
    }

    return {
      id: link.id,
      source: link.sourceRecord,
      target: link.targetRecord,
      confidenceScore: link.confidenceScore,
      relationshipType: link.relationshipType,
      discoveryMethod: link.discoveryMethod,
      explanation: link.metadata || {},
      createdAt: link.createdAt,
    };
  }

  @Get('between/:sourceId/:targetId')
  async getLinkBetween(
    @Param('sourceId') sourceId: string,
    @Param('targetId') targetId: string,
  ) {
    const link = await this.prisma.link.findFirst({
      where: {
        OR: [
          { sourceRecordId: sourceId, targetRecordId: targetId },
          { sourceRecordId: targetId, targetRecordId: sourceId },
        ],
      },
      include: {
        sourceRecord: {
          select: {
            id: true,
            externalId: true,
            title: true,
            sourcePlatform: true,
            artifactType: true,
          },
        },
        targetRecord: {
          select: {
            id: true,
            externalId: true,
            title: true,
            sourcePlatform: true,
            artifactType: true,
          },
        },
      },
    });

    if (!link) {
      return null;
    }

    return {
      id: link.id,
      source: link.sourceRecord,
      target: link.targetRecord,
      confidenceScore: link.confidenceScore,
      relationshipType: link.relationshipType,
      discoveryMethod: link.discoveryMethod,
      explanation: link.metadata || {},
      createdAt: link.createdAt,
    };
  }

  @Post(':id/feedback')
  async submitFeedback(
    @Param('id') id: string,
    @Body() body: { feedback: 'positive' | 'negative'; comment?: string },
  ) {
    const link = await this.prisma.link.findUnique({ where: { id } });

    if (!link) {
      return { error: 'Link not found' };
    }

    const updatedMetadata = {
      ...(link.metadata as object),
      feedback: {
        type: body.feedback,
        comment: body.comment,
        timestamp: new Date().toISOString(),
      },
    };

    await this.prisma.link.update({
      where: { id },
      data: { metadata: updatedMetadata },
    });

    return { success: true };
  }

  @Get('stats/ml')
  async getMLStats() {
    const totalLinks = await this.prisma.link.count();
    const mlLinks = await this.prisma.link.count({
      where: { discoveryMethod: 'ml_assisted' },
    });
    const deterministicLinks = await this.prisma.link.count({
      where: { discoveryMethod: 'deterministic' },
    });

    const positiveFeedback = await this.prisma.link.count({
      where: {
        metadata: {
          path: ['feedback', 'type'],
          equals: 'positive',
        },
      },
    });

    const negativeFeedback = await this.prisma.link.count({
      where: {
        metadata: {
          path: ['feedback', 'type'],
          equals: 'negative',
        },
      },
    });

    return {
      total: totalLinks,
      mlAssisted: mlLinks,
      deterministic: deterministicLinks,
      feedback: {
        positive: positiveFeedback,
        negative: negativeFeedback,
      },
    };
  }
}

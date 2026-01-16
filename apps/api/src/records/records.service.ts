import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    params: { search?: string; source?: string; type?: string } = {},
  ) {
    const { search, source, type } = params;
    const where: Prisma.UnifiedRecordWhereInput = {};

    if (source) {
      where.sourcePlatform = source;
    }

    if (type) {
      where.artifactType = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.unifiedRecord.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        source: {
          select: {
            providerName: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.unifiedRecord.findUnique({
      where: { id },
    });
  }

  async findContextGroups(userId: string) {
    return this.prisma.contextGroup.findMany({
      where: { userId, status: 'active' },
      include: {
        members: {
          include: {
            record: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

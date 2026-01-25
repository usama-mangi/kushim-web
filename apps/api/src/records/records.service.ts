import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GraphService } from './graph.service';

@Injectable()
export class RecordsService {
  constructor(
    private prisma: PrismaService,
    private graphService: GraphService,
  ) {}

  async findAll(
    params: { 
      search?: string; 
      source?: string; 
      type?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const { search, source, type, limit = 100, offset = 0 } = params;
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

    // Batch query with pagination
    const [records, total] = await Promise.all([
      this.prisma.unifiedRecord.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: Math.min(limit, 100), // Cap at 100 for performance
        skip: offset,
        include: {
          source: {
            select: {
              providerName: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.unifiedRecord.count({ where }),
    ]);

    return {
      records,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + records.length < total,
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.unifiedRecord.findUnique({
      where: { id },
    });
  }

  async findContextGroups(userId: string, options?: { limit?: number; offset?: number }) {
    return this.graphService.getContextGroups(userId, options);
  }
}

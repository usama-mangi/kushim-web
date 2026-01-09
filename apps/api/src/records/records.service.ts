import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { search?: string; source?: string } = {}) {
    const { search, source } = params;
    const where: Prisma.UnifiedRecordWhereInput = {};

    if (source) {
      where.source = {
        providerName: source,
      };
    }

    if (search) {
      where.payload = {
        path: ['title'],
        string_contains: search,
      };
      // Note: JSONB filtering can be complex.
      // For simplicity/compatibility, we might rely on client-side search for small datasets
      // or specific JSON path logic if supported by Prisma/DB version.
      // A more robust way for JSONB search:
      // where.AND = [
      //   { payload: { path: ['title'], string_contains: search } }
      // ]
    }

    // Since Prisma's JSON filtering support varies, let's implement a basic
    // "contains" check if the payload was just text, but it's an object.
    // Ideally we use Raw query for performant JSON text search or
    // strict path filtering if we know the structure.
    // For 'Kushim Standard', we know 'title' exists.
    
    return this.prisma.unifiedRecord.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        source: {
          select: {
            providerName: true,
          },
        },
      },
    });
  }
}
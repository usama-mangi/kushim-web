import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.unifiedRecord.findMany({
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
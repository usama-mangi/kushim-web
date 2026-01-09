import { Controller, Post, Param, UseGuards, Get, Patch, Body } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ingestion')
export class IngestionController {
  constructor(
    @InjectQueue('ingestion') private ingestionQueue: Queue,
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @Post('trigger/:dataSourceId')
  async triggerIngestion(@Param('dataSourceId') dataSourceId: string) {
    await this.ingestionQueue.add('sync', { dataSourceId });
    return { message: 'Ingestion job queued', dataSourceId };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sources')
  async getSources() {
    return this.prisma.dataSource.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        providerName: true,
        status: true,
        createdAt: true,
        // Do not return credentials
      },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('sources/:id')
  async updateSourceCredentials(
    @Param('id') id: string,
    @Body() credentials: any,
  ) {
    return this.prisma.dataSource.update({
      where: { id },
      data: {
        credentialsEncrypted: credentials,
      },
    });
  }
}

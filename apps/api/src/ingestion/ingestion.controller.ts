import {
  Controller,
  Post,
  Param,
  UseGuards,
  Get,
  Patch,
  Delete,
  Body,
  Request,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { IngestionService } from './ingestion.service';
import { GraphService } from '../records/graph.service';

@Controller('ingestion')
export class IngestionController {
  constructor(
    @InjectQueue('ingestion') private ingestionQueue: Queue,
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private ingestionService: IngestionService,
    private graphService: GraphService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Delete('sources/:id')
  async deleteSource(@Request() req: any, @Param('id') id: string) {
    // Ensure the source belongs to the user
    const count = await this.prisma.dataSource.count({
      where: { id, userId: req.user.userId },
    });
    
    if (count === 0) {
      throw new Error('Source not found or access denied');
    }

    // Get all record IDs for this source (for Neo4j cleanup)
    const records = await this.prisma.unifiedRecord.findMany({
      where: { sourceId: id },
      select: { id: true, externalId: true },
    });

    const recordIds = records.map(r => r.id);

    // Step 1: Delete all Links (both source and target) from Postgres
    if (recordIds.length > 0) {
      await this.prisma.link.deleteMany({
        where: {
          OR: [
            { sourceRecordId: { in: recordIds } },
            { targetRecordId: { in: recordIds } },
          ],
        },
      });
    }

    // Step 2: Delete all UnifiedRecords from Postgres
    await this.prisma.unifiedRecord.deleteMany({
      where: { sourceId: id },
    });

    // Step 3: Clean up Neo4j graph (delete artifacts and their relationships)
    if (records.length > 0) {
      try {
        for (const record of records) {
          // Delete artifact node and all its relationships in Neo4j
          await this.graphService.deleteArtifact(record.externalId);
        }
      } catch (error) {
        // Log but don't fail the deletion if Neo4j cleanup fails
        console.error('Neo4j cleanup failed:', error);
      }
    }

    // Step 4: Delete the DataSource
    return this.prisma.dataSource.delete({
      where: { id },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @Post('trigger/:dataSourceId')
  async triggerIngestion(@Param('dataSourceId') dataSourceId: string) {
    await this.ingestionQueue.add('sync', { dataSourceId });
    return { message: 'Ingestion job queued', dataSourceId };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sources')
  async getSources(@Request() req: any) {
    return this.ingestionService.getSources(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sources')
  async createSource(
    @Request() req: any,
    @Body() body: { providerName: string; credentials: any },
  ) {
    const encryptedCredentials = await this.encryptionService.encryptObject(
      body.credentials,
    );
    return this.prisma.dataSource.create({
      data: {
        userId: req.user.userId,
        providerName: body.providerName,
        credentialsEncrypted: encryptedCredentials,
        status: 'active',
      },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @Patch('sources/:id')
  async updateSourceCredentials(
    @Param('id') id: string,
    @Body() credentials: any,
  ) {
    const encryptedCredentials =
      await this.encryptionService.encryptObject(credentials);
    return this.prisma.dataSource.update({
      where: { id },
      data: {
        credentialsEncrypted: encryptedCredentials,
      },
    });
  }
}

import {
  Controller,
  Post,
  Param,
  UseGuards,
  Get,
  Patch,
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

@Controller('ingestion')
export class IngestionController {
  constructor(
    @InjectQueue('ingestion') private ingestionQueue: Queue,
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private ingestionService: IngestionService,
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

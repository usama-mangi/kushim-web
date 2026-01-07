import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('ingestion')
export class IngestionController {
  constructor(@InjectQueue('ingestion') private ingestionQueue: Queue) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @Post('trigger/:dataSourceId')
  async triggerIngestion(@Param('dataSourceId') dataSourceId: string) {
    await this.ingestionQueue.add('sync', { dataSourceId });
    return { message: 'Ingestion job queued', dataSourceId };
  }
}

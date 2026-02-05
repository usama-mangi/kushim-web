import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  QueueName,
  ComplianceCheckJobType,
} from '../shared/queue/queue.constants';
import { AuthGuard } from '@nestjs/passport';
import { ComplianceService } from './compliance.service';
import { CacheService } from '../common/cache/cache.service';
import { RateLimit } from '../common/guards/rate-limit.guard';

@Controller('compliance')
@UseGuards(AuthGuard('jwt'))
@RateLimit({ points: 100, duration: 60 })
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly cacheService: CacheService,
    @InjectQueue(QueueName.COMPLIANCE_CHECK) private complianceQueue: Queue,
  ) {}

  @Get('controls')
  async getAllControls(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.complianceService.getAllControls(
      req.user.customerId,
      page,
      Math.min(limit, 100),
    );
  }

  @Get('controls/:id')
  async getControlDetails(@Param('id') id: string, @Request() req: any) {
    return this.complianceService.getControlDetails(req.user.customerId, id);
  }

  @Get('alerts')
  async getRecentAlerts(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.complianceService.getRecentAlerts(
      req.user.customerId,
      page,
      Math.min(limit, 50),
    );
  }

  @Get('trends')
  async getTrends(
    @Request() req: any,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    return this.complianceService.getTrends(
      req.user.customerId,
      Math.min(days, 90),
    );
  }

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ points: 10, duration: 60 })
  async runComplianceScan(@Request() req: any) {
    await this.complianceQueue.add(ComplianceCheckJobType.SCHEDULE_CHECKS, {
      customerId: req.user.customerId,
    });

    // Invalidate cache for this customer
    await this.complianceService.invalidateCache(req.user.customerId);

    return { success: true, message: 'Compliance scan initiated' };
  }
}

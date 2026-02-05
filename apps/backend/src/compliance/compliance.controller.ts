import { Controller, Get, Post, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QueueName, ComplianceCheckJobType } from '../shared/queue/queue.constants';
import { AuthGuard } from '@nestjs/passport';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
@UseGuards(AuthGuard('jwt'))
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    @InjectQueue(QueueName.COMPLIANCE_CHECK) private complianceQueue: Queue,
  ) {}

  @Get('controls')
  async getAllControls(@Request() req: any) {
    return this.complianceService.getAllControls(req.user.customerId);
  }

  @Get('controls/:id')
  async getControlDetails(@Param('id') id: string, @Request() req: any) {
    return this.complianceService.getControlDetails(req.user.customerId, id);
  }

  @Get('alerts')
  async getRecentAlerts(@Request() req: any) {
    return this.complianceService.getRecentAlerts(req.user.customerId);
  }

  @Get('trends')
  async getTrends(@Request() req: any) {
    return this.complianceService.getTrends(req.user.customerId);
  }

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async runComplianceScan(@Request() req: any) {
    await this.complianceQueue.add(ComplianceCheckJobType.SCHEDULE_CHECKS, {
      customerId: req.user.customerId,
    });
    return { success: true, message: 'Compliance scan initiated' };
  }
}

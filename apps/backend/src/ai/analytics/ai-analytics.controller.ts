import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AiAnalyticsService } from './ai-analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('ai/analytics')
@UseGuards(JwtAuthGuard)
export class AiAnalyticsController {
  constructor(private readonly analyticsService: AiAnalyticsService) {}

  @Get('usage')
  async getUsageStatistics(
    @Query('days') days: string,
    @Request() req: any,
  ) {
    const periodDays = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getUsageStatistics(req.user.customerId, periodDays);
  }

  @Get('costs')
  async getCostBreakdown(@Request() req: any) {
    return this.analyticsService.getCostBreakdown(req.user.customerId);
  }

  @Get('performance')
  async getPerformanceMetrics(@Request() req: any) {
    return this.analyticsService.getPerformanceMetrics(req.user.customerId);
  }

  @Get('roi')
  async getROIMetrics(@Request() req: any) {
    return this.analyticsService.getROIMetrics(req.user.customerId);
  }
}

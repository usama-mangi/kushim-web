import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InsightsService } from './insights.service';

@ApiTags('AI Insights')
@Controller('ai/insights')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @ApiOperation({ summary: 'Get AI-powered insights for dashboard' })
  async getInsights(@Request() req: any) {
    const customerId = req.user?.customerId;
    if (!customerId) {
      return [];
    }
    return this.insightsService.getInsights(customerId);
  }
}

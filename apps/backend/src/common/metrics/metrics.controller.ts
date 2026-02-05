import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Returns metrics in Prometheus format' })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  @Get('json')
  @ApiOperation({ summary: 'Get metrics in JSON format' })
  @ApiResponse({ status: 200, description: 'Returns metrics as JSON' })
  async getMetricsJSON() {
    return this.metricsService.getMetricsJSON();
  }
}

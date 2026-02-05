import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'API health check',
    description: 'Check if the API is running and responsive',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Kushim API is running' },
        timestamp: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Basic health check',
    description: 'Returns basic service health status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
  })
  async healthCheck() {
    return this.appService.healthCheck();
  }

  @Get('health/db')
  @ApiOperation({
    summary: 'Database health check',
    description: 'Checks database connectivity',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Database is healthy',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Database is unavailable',
  })
  async healthCheckDb() {
    return this.appService.healthCheckDb();
  }

  @Get('health/redis')
  @ApiOperation({
    summary: 'Redis health check',
    description: 'Checks Redis connectivity',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Redis is healthy',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Redis is unavailable',
  })
  async healthCheckRedis() {
    return this.appService.healthCheckRedis();
  }

  @Get('health/ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Comprehensive readiness check for all dependencies',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is ready',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Service is not ready',
  })
  async readinessCheck() {
    return this.appService.readinessCheck();
  }
}

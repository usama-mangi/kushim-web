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
}

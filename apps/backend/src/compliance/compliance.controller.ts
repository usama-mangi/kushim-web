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
import {
  ComplianceControlsResponseDto,
  ComplianceControlDetailDto,
  ComplianceAlertsResponseDto,
  ComplianceTrendsResponseDto,
  ComplianceScanResponseDto,
} from './dto/compliance-response.dto';
import { ErrorResponseDto } from '../auth/dto/auth-response.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('compliance')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({
    summary: 'List all compliance controls',
    description:
      'Get paginated list of all compliance controls for the organization',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 50, max: 100)',
    example: 50,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Controls retrieved successfully',
    type: ComplianceControlsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getAllControls(
    @Request() req: any,
    @Query('frameworkId') frameworkId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ) {
    return this.complianceService.getAllControls(
      req.user.customerId,
      frameworkId,
      page,
      Math.min(limit, 100),
    );
  }

  @Get('controls/:id')
  @ApiOperation({
    summary: 'Get control details',
    description: 'Get detailed information about a specific compliance control',
  })
  @ApiParam({
    name: 'id',
    description: 'Control ID',
    example: 'CC1.1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Control details retrieved successfully',
    type: ComplianceControlDetailDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Control not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getControlDetails(@Param('id') id: string, @Request() req: any) {
    return this.complianceService.getControlDetails(req.user.customerId, id);
  }

  @Get('alerts')
  @ApiOperation({
    summary: 'Get recent compliance alerts',
    description: 'Get paginated list of recent compliance alerts',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 50)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alerts retrieved successfully',
    type: ComplianceAlertsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
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
  @ApiOperation({
    summary: 'Get compliance trends',
    description: 'Get compliance score trends over specified number of days',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to include (default: 7, max: 90)',
    example: 7,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trends retrieved successfully',
    type: ComplianceTrendsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
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
  @ApiOperation({
    summary: 'Trigger compliance scan',
    description:
      'Initiate a new compliance scan for all configured integrations',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Scan initiated successfully',
    type: ComplianceScanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded (10 requests per minute)',
    type: ErrorResponseDto,
  })
  async runComplianceScan(@Request() req: any) {
    await this.complianceQueue.add(ComplianceCheckJobType.SCHEDULE_CHECKS, {
      customerId: req.user.customerId,
    });

    // Invalidate cache for this customer
    await this.complianceService.invalidateCache(req.user.customerId);

    return { success: true, message: 'Compliance scan initiated' };
  }
}

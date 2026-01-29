import { Controller, Get, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RecordsService } from './records.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types';

@ApiTags('records')
@ApiBearerAuth('JWT-auth')
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @ApiOperation({ summary: 'Get all records with optional filtering and pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search query for title/body' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by platform (github, slack, jira, google)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by artifact type (issue, pr, message, etc.)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return (default: 20, max: 100)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip for pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of records' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('source') source?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.recordsService.findAll({
      search,
      source,
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(limit, 10) : undefined,
    });
  }

  @ApiOperation({ summary: 'Get context groups for the authenticated user' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of groups to return (default: 50)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of groups to skip for pagination' })
  @ApiResponse({ status: 200, description: 'Returns list of context groups' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @UseGuards(JwtAuthGuard)
  @Get('context-groups')
  findContextGroups(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.recordsService.findContextGroups(req.user.userId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(limit, 10) : undefined,
    });
  }
}

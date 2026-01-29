import { Controller, Get, UseGuards, Query, Request } from '@nestjs/common';
import { RecordsService } from './records.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

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
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('context-groups')
  findContextGroups(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.recordsService.findContextGroups(req.user.userId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}

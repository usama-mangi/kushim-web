import { Controller, Get, UseGuards } from '@nestjs/common';
import { RecordsService } from './records.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.recordsService.findAll();
  }
}
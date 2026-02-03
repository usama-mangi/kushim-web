import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
@UseGuards(AuthGuard('jwt'))
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

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
}

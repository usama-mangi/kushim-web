import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
@UseGuards(AuthGuard('jwt'))
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('controls')
  async getAllControls(@Request() req: any) {
    // In MVP, we use user.id as customerId for demo purposes
    // Better would be to have a customerId on the user object
    return this.complianceService.getAllControls(req.user.id);
  }

  @Get('controls/:id')
  async getControlDetails(@Param('id') id: string, @Request() req: any) {
    return this.complianceService.getControlDetails(req.user.id, id);
  }

  @Get('alerts')
  async getRecentAlerts(@Request() req: any) {
    return this.complianceService.getRecentAlerts(req.user.id);
  }
}

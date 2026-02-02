import { Controller, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';
import { IntegrationType } from '@prisma/client';

@Controller('integrations')
@UseGuards(AuthGuard('jwt'))
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async listIntegrations(@Request() req: any) {
    return this.integrationsService.listIntegrations(req.user.id);
  }

  @Delete('type/:type')
  async deleteIntegrationByType(@Param('type') type: string, @Request() req: any) {
    return this.integrationsService.deleteIntegrationByType(req.user.id, type);
  }

  @Delete(':id')
  async deleteIntegration(@Param('id') id: string, @Request() req: any) {
    return this.integrationsService.deleteIntegration(req.user.id, id);
  }
}

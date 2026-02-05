import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';
import { IntegrationType } from '@prisma/client';

@Controller('integrations')
@UseGuards(AuthGuard('jwt'))
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async listIntegrations(@Request() req: any) {
    return this.integrationsService.listIntegrations(req.user.customerId);
  }

  @Post(':type/connect')
  async connectIntegration(
    @Param('type') type: string,
    @Body() config: any,
    @Request() req: any,
  ) {
    return this.integrationsService.connect(
      req.user.customerId,
      type.toUpperCase() as IntegrationType,
      config,
    );
  }

  @Delete('type/:type')
  async deleteIntegrationByType(
    @Param('type') type: string,
    @Request() req: any,
  ) {
    return this.integrationsService.deleteIntegrationByType(
      req.user.customerId,
      type,
    );
  }

  @Delete(':id')
  async deleteIntegration(@Param('id') id: string, @Request() req: any) {
    return this.integrationsService.deleteIntegration(req.user.customerId, id);
  }
}

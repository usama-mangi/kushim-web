import { Controller, Post, Body, Get, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JiraService } from './jira.service';
import { IntegrationsService } from '../integrations.service';
import { IntegrationType } from '@prisma/client';

@Controller('integrations/jira')
@UseGuards(AuthGuard('jwt'))
export class JiraController {
  constructor(
    private readonly jiraService: JiraService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Get('health')
  async getHealth(@Request() req: any) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.JIRA);
    const isConnected = await this.jiraService.checkConnection(config);
    const circuitBreakerStatus = this.jiraService.getCircuitBreakerStatus();

    return {
      integration: 'jira',
      status: isConnected && circuitBreakerStatus.state !== 'OPEN' ? 'healthy' : 'unhealthy',
      circuitBreaker: circuitBreakerStatus,
      timestamp: new Date(),
    };
  }

  @Post('ticket/create')
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @Request() req: any,
    @Body()
    body: {
      controlId: string;
      controlTitle: string;
      failureReason: string;
      evidenceId: string;
      projectKey: string;
    },
  ) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.JIRA);
    return await this.jiraService.createRemediationTicket({ ...body, config });
  }

  @Post('ticket/:issueKey/status')
  @HttpCode(HttpStatus.OK)
  async updateTicketStatus(
    @Request() req: any,
    @Param('issueKey') issueKey: string,
    @Body() body: { status: string },
  ) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.JIRA);
    return await this.jiraService.updateTicketStatus(issueKey, body.status, config);
  }

  @Get('ticket/:issueKey/sync')
  async syncTicket(@Request() req: any, @Param('issueKey') issueKey: string) {
    const config = await this.integrationsService.getDecryptedConfig(req.user.customerId, IntegrationType.JIRA);
    return await this.jiraService.syncTicketStatus(issueKey, config);
  }
}

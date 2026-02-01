import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { JiraService } from './jira.service';

@Controller('integrations/jira')
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @Get('health')
  async getHealth() {
    const circuitBreakerStatus = this.jiraService.getCircuitBreakerStatus();

    return {
      integration: 'jira',
      circuitBreaker: circuitBreakerStatus,
      timestamp: new Date(),
    };
  }

  @Post('ticket/create')
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @Body()
    body: {
      controlId: string;
      controlTitle: string;
      failureReason: string;
      evidenceId: string;
      projectKey: string;
    },
  ) {
    return await this.jiraService.createRemediationTicket(body);
  }

  @Post('ticket/:issueKey/status')
  @HttpCode(HttpStatus.OK)
  async updateTicketStatus(
    @Param('issueKey') issueKey: string,
    @Body() body: { status: string },
  ) {
    return await this.jiraService.updateTicketStatus(issueKey, body.status);
  }

  @Get('ticket/:issueKey/sync')
  async syncTicket(@Param('issueKey') issueKey: string) {
    return await this.jiraService.syncTicketStatus(issueKey);
  }
}

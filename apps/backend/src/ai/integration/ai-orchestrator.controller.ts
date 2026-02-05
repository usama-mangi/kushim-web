import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('ai/orchestrator')
@UseGuards(JwtAuthGuard)
export class AiOrchestratorController {
  constructor(private readonly orchestrator: AiOrchestratorService) {}

  @Post('batch/map-evidence')
  async batchMapEvidence(
    @Body() body: { evidenceIds: string[]; concurrency?: number },
    @Request() req: any,
  ) {
    return this.orchestrator.batchMapEvidence({
      evidenceIds: body.evidenceIds,
      customerId: req.user.customerId,
      userId: req.user.userId,
      concurrency: body.concurrency,
    });
  }

  @Post('batch/generate-policies')
  async batchGeneratePolicies(
    @Body() body: {
      policyRequests: Array<{
        policyType: string;
        controlIds: string[];
        title?: string;
      }>;
    },
    @Request() req: any,
  ) {
    return this.orchestrator.batchGeneratePolicies({
      policyRequests: body.policyRequests,
      customerId: req.user.customerId,
      userId: req.user.userId,
    });
  }

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    return this.orchestrator.getDashboardData(req.user.customerId);
  }

  @Get('predict-costs')
  async predictCosts(@Request() req: any) {
    return this.orchestrator.predictMonthlyCosts(req.user.customerId);
  }

  @Post('allocate-costs')
  async allocateCosts(
    @Body() allocation: {
      evidenceMapping: number;
      policyDrafting: number;
      copilot: number;
    },
    @Request() req: any,
  ) {
    return this.orchestrator.allocateCosts(req.user.customerId, allocation);
  }
}

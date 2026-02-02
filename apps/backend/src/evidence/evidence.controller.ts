import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EvidenceService } from './evidence.service';

@Controller('evidence')
@UseGuards(AuthGuard('jwt'))
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Get('control/:controlId')
  async getEvidenceByControl(
    @Param('controlId') controlId: string,
    @Request() req: any,
  ) {
    // Assuming user.id maps to customerId in this MVP or we look up customer
    // Simplification: use user.id as customerId for now
    return this.evidenceService.getEvidenceByControl(req.user.id, controlId);
  }

  @Get(':id')
  async getEvidence(@Param('id') id: string) {
    return this.evidenceService.getEvidence(id);
  }

  @Get(':id/verify')
  async verifyEvidence(@Param('id') id: string) {
    return this.evidenceService.verifyEvidence(id);
  }
}

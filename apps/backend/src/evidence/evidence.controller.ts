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
    return this.evidenceService.getEvidenceByControl(
      req.user.customerId,
      controlId,
    );
  }

  @Get(':id')
  async getEvidence(@Param('id') id: string, @Request() req: any) {
    return this.evidenceService.getEvidence(req.user.customerId, id);
  }

  @Get(':id/verify')
  async verifyEvidence(@Param('id') id: string, @Request() req: any) {
    return this.evidenceService.verifyEvidence(req.user.customerId, id);
  }
}

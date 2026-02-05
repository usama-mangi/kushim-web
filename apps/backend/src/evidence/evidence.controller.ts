import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EvidenceService } from './evidence.service';
import {
  EvidenceDto,
  EvidenceListResponseDto,
  VerifyEvidenceResponseDto,
} from './dto/evidence-response.dto';
import { ErrorResponseDto } from '../auth/dto/auth-response.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('evidence')
@ApiBearerAuth('JWT-auth')
@Controller('evidence')
@UseGuards(AuthGuard('jwt'))
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Get('control/:controlId')
  @ApiOperation({
    summary: 'Get evidence by control',
    description: 'Get all evidence records for a specific compliance control',
  })
  @ApiParam({
    name: 'controlId',
    description: 'Compliance control ID',
    example: 'CC6.1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evidence retrieved successfully',
    type: EvidenceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Control not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
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
  @ApiOperation({
    summary: 'Get evidence by ID',
    description: 'Get a specific evidence record by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Evidence ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evidence retrieved successfully',
    type: EvidenceDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evidence not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getEvidence(@Param('id') id: string, @Request() req: any) {
    return this.evidenceService.getEvidence(req.user.customerId, id);
  }

  @Get(':id/verify')
  @ApiOperation({
    summary: 'Verify evidence integrity',
    description: 'Verify the integrity of an evidence record using its hash',
  })
  @ApiParam({
    name: 'id',
    description: 'Evidence ID to verify',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evidence verification completed',
    type: VerifyEvidenceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Evidence not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async verifyEvidence(@Param('id') id: string, @Request() req: any) {
    return this.evidenceService.verifyEvidence(req.user.customerId, id);
  }
}

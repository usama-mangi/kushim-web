import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EvidenceMappingService } from './evidence-mapping.service';
import { CreateMappingDto } from './dto/create-mapping.dto';
import { UpdateMappingDto } from './dto/update-mapping.dto';
import {
  MappingResponseDto,
  ControlSuggestion,
} from './dto/mapping-response.dto';

@ApiTags('Evidence Mapping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('evidence')
export class EvidenceMappingController {
  constructor(
    private readonly evidenceMappingService: EvidenceMappingService,
  ) {}

  @Post(':id/auto-map')
  @ApiOperation({
    summary: 'Auto-map evidence to controls using AI',
    description:
      'Uses GPT-4 to analyze evidence and suggest relevant SOC 2 controls',
  })
  @ApiParam({
    name: 'id',
    description: 'Evidence ID',
    example: 'ev123e45-6789-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'minConfidence',
    required: false,
    description: 'Minimum confidence threshold (0-1)',
    example: 0.5,
  })
  @ApiQuery({
    name: 'maxSuggestions',
    required: false,
    description: 'Maximum number of suggestions',
    example: 5,
  })
  @ApiQuery({
    name: 'useGPT4',
    required: false,
    description: 'Use GPT-4 instead of GPT-3.5-turbo',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Control suggestions returned',
    type: [ControlSuggestion],
  })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async autoMapEvidence(
    @Param('id') evidenceId: string,
    @Query('minConfidence') minConfidence?: number,
    @Query('maxSuggestions') maxSuggestions?: number,
    @Query('useGPT4') useGPT4?: string,
    @Request() req?: any,
  ): Promise<ControlSuggestion[]> {
    const customerId = req.user.customerId;

    return this.evidenceMappingService.mapEvidenceToControls(
      evidenceId,
      customerId,
      {
        minConfidence: minConfidence ? Number(minConfidence) : undefined,
        maxSuggestions: maxSuggestions ? Number(maxSuggestions) : undefined,
        useGPT4: useGPT4 === 'true',
      },
    );
  }

  @Get(':id/mappings')
  @ApiOperation({
    summary: 'Get all mappings for an evidence item',
    description: 'Returns all control mappings for the specified evidence',
  })
  @ApiParam({
    name: 'id',
    description: 'Evidence ID',
    example: 'ev123e45-6789-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Mappings returned',
    type: [MappingResponseDto],
  })
  async getMappings(
    @Param('id') evidenceId: string,
    @Request() req: any,
  ): Promise<any[]> {
    const customerId = req.user.customerId;
    const mappings =
      await this.evidenceMappingService.getMappingsForEvidence(
        evidenceId,
        customerId,
      );

    return mappings.map((m) => ({
      id: m.id,
      evidenceId: m.evidenceId,
      controlId: m.controlId,
      control: {
        id: m.control.id,
        controlId: m.control.controlId,
        title: m.control.title,
        description: m.control.description,
        framework: m.control.framework,
      },
      confidence: Number(m.confidence),
      aiReasoning: m.aiReasoning,
      isManualOverride: m.isManualOverride,
      manuallyVerified: m.manuallyVerified,
      createdBy: m.createdBy,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  @Post(':id/mappings')
  @ApiOperation({
    summary: 'Create a new evidence mapping',
    description: 'Manually create a mapping between evidence and control',
  })
  @ApiParam({
    name: 'id',
    description: 'Evidence ID',
    example: 'ev123e45-6789-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Mapping created',
    type: MappingResponseDto,
  })
  async createMapping(
    @Param('id') evidenceId: string,
    @Body() dto: CreateMappingDto,
    @Request() req: any,
  ): Promise<any> {
    const customerId = req.user.customerId;

    const mapping = await this.evidenceMappingService.createMapping(
      evidenceId,
      dto.controlId,
      dto.confidence,
      dto.aiReasoning,
      customerId,
      {
        isManualOverride: dto.isManualOverride,
        createdBy: dto.createdBy || req.user.userId,
      },
    );

    return {
      id: mapping.id,
      evidenceId: mapping.evidenceId,
      controlId: mapping.controlId,
      confidence: Number(mapping.confidence),
      aiReasoning: mapping.aiReasoning,
      isManualOverride: mapping.isManualOverride,
      manuallyVerified: mapping.manuallyVerified,
      createdBy: mapping.createdBy,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
    };
  }

  @Put('mappings/:id')
  @ApiOperation({
    summary: 'Update an evidence mapping',
    description: 'Update confidence, reasoning, or verification status',
  })
  @ApiParam({
    name: 'id',
    description: 'Mapping ID',
    example: 'map123e45-6789-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Mapping updated',
    type: MappingResponseDto,
  })
  async updateMapping(
    @Param('id') mappingId: string,
    @Body() dto: UpdateMappingDto,
  ): Promise<any> {
    const mapping = await this.evidenceMappingService.updateMapping(
      mappingId,
      dto,
    );

    return {
      id: mapping.id,
      evidenceId: mapping.evidenceId,
      controlId: mapping.controlId,
      confidence: Number(mapping.confidence),
      aiReasoning: mapping.aiReasoning,
      isManualOverride: mapping.isManualOverride,
      manuallyVerified: mapping.manuallyVerified,
      createdBy: mapping.createdBy,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
    };
  }

  @Delete('mappings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an evidence mapping',
    description: 'Permanently delete a mapping',
  })
  @ApiParam({
    name: 'id',
    description: 'Mapping ID',
    example: 'map123e45-6789-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 204, description: 'Mapping deleted' })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async deleteMapping(@Param('id') mappingId: string): Promise<void> {
    await this.evidenceMappingService.deleteMapping(mappingId);
  }

  @Post(':id/mappings/override')
  @ApiOperation({
    summary: 'Apply manual override to mapping',
    description: 'Override AI mapping with manual correction',
  })
  @ApiParam({
    name: 'id',
    description: 'Evidence ID',
    example: 'ev123e45-6789-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Override applied',
    type: MappingResponseDto,
  })
  async applyOverride(
    @Param('id') evidenceId: string,
    @Body() dto: CreateMappingDto,
    @Request() req: any,
  ): Promise<any> {
    const customerId = req.user.customerId;
    const userId = req.user.userId;

    const mapping = await this.evidenceMappingService.applyManualOverride(
      evidenceId,
      dto.controlId,
      dto.confidence,
      dto.aiReasoning,
      userId,
      customerId,
    );

    return {
      id: mapping.id,
      evidenceId: mapping.evidenceId,
      controlId: mapping.controlId,
      confidence: Number(mapping.confidence),
      aiReasoning: mapping.aiReasoning,
      isManualOverride: mapping.isManualOverride,
      manuallyVerified: mapping.manuallyVerified,
      createdBy: mapping.createdBy,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
    };
  }
}

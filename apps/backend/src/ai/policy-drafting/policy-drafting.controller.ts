import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PolicyDraftingService } from './policy-drafting.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  GeneratePolicyDto,
  UpdatePolicyDto,
  PolicyResponseDto,
  TemplateResponseDto,
  ExportFormat,
  ReviewResultDto,
} from './dto';

@ApiTags('Policy Drafting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('policies')
export class PolicyDraftingController {
  constructor(
    private policyDraftingService: PolicyDraftingService,
    private prisma: PrismaService,
  ) {}

  @Get('templates')
  @ApiOperation({ summary: 'List available policy templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved', type: [TemplateResponseDto] })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'framework', required: false, description: 'Filter by framework' })
  async listTemplates(
    @Query('category') category?: string,
    @Query('framework') framework?: string,
  ): Promise<TemplateResponseDto[]> {
    const templates = await this.prisma.policyTemplate.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
        ...(framework && { framework: framework as any }),
      },
      include: {
        policyTemplateControls: {
          include: {
            control: {
              select: {
                controlId: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { category: 'asc' },
    });

    return templates.map(template => ({
      ...template,
      controls: template.policyTemplateControls.map(ptc => ({
        controlId: ptc.control.controlId,
        title: ptc.control.title,
      })),
    }));
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get policy template details' })
  @ApiResponse({ status: 200, description: 'Template found', type: TemplateResponseDto })
  async getTemplate(@Param('id') id: string): Promise<TemplateResponseDto> {
    const template = await this.prisma.policyTemplate.findUnique({
      where: { id },
      include: {
        policyTemplateControls: {
          include: {
            control: {
              select: {
                controlId: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return {
      ...template,
      controls: template.policyTemplateControls.map(ptc => ({
        controlId: ptc.control.controlId,
        title: ptc.control.title,
      })),
    };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate new policy from template' })
  @ApiResponse({ status: 201, description: 'Policy generated', type: PolicyResponseDto })
  async generatePolicy(
    @Req() req: any,
    @Body() dto: GeneratePolicyDto,
  ): Promise<PolicyResponseDto> {
    return this.policyDraftingService.generatePolicy(
      req.user.customerId,
      req.user.userId,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List customer policies' })
  @ApiResponse({ status: 200, description: 'Policies retrieved', type: [PolicyResponseDto] })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'templateId', required: false, description: 'Filter by template' })
  async listPolicies(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('templateId') templateId?: string,
  ): Promise<PolicyResponseDto[]> {
    return this.prisma.policy.findMany({
      where: {
        customerId: req.user.customerId,
        ...(status && { status: status as any }),
        ...(templateId && { templateId }),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get policy details' })
  @ApiResponse({ status: 200, description: 'Policy found', type: PolicyResponseDto })
  async getPolicy(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<PolicyResponseDto> {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id,
        customerId: req.user.customerId,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    if (!policy) {
      throw new Error('Policy not found');
    }

    return policy;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update policy' })
  @ApiResponse({ status: 200, description: 'Policy updated', type: PolicyResponseDto })
  async updatePolicy(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDto,
  ): Promise<PolicyResponseDto> {
    return this.policyDraftingService.customizePolicy(
      id,
      req.user.customerId,
      req.user.userId,
      dto,
    );
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Submit policy for review' })
  @ApiResponse({ status: 200, description: 'Policy submitted', type: PolicyResponseDto })
  async submitForReview(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<PolicyResponseDto> {
    return this.policyDraftingService.submitForReview(
      id,
      req.user.customerId,
      req.user.userId,
    );
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve policy (Admin only)' })
  @ApiResponse({ status: 200, description: 'Policy approved', type: PolicyResponseDto })
  async approvePolicy(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<PolicyResponseDto> {
    return this.policyDraftingService.approvePolicy(
      id,
      req.user.customerId,
      req.user.userId,
      req.user.role,
    );
  }

  @Post(':id/ai-review')
  @ApiOperation({ summary: 'Get AI-powered policy review' })
  @ApiResponse({ status: 200, description: 'Review completed', type: ReviewResultDto })
  async reviewPolicy(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<ReviewResultDto> {
    return this.policyDraftingService.reviewPolicy(id, req.user.customerId);
  }

  @Post(':id/suggestions')
  @ApiOperation({ summary: 'Get AI improvement suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions generated', type: [String] })
  @ApiQuery({ name: 'section', required: false, description: 'Specific section to analyze' })
  async getSuggestions(
    @Req() req: any,
    @Param('id') id: string,
    @Query('section') section?: string,
  ): Promise<string[]> {
    return this.policyDraftingService.suggestImprovements(
      id,
      req.user.customerId,
      section,
    );
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export policy to PDF/DOCX' })
  @ApiQuery({
    name: 'format',
    enum: ExportFormat,
    required: false,
    description: 'Export format (default: pdf)',
  })
  async exportPolicy(
    @Req() req: any,
    @Param('id') id: string,
    @Query('format') format: ExportFormat = ExportFormat.PDF,
    @Res() res: any,
  ) {
    const policy = await this.prisma.policy.findFirst({
      where: { id, customerId: req.user.customerId },
    });

    if (!policy) {
      throw new Error('Policy not found');
    }

    const buffer = await this.policyDraftingService.exportPolicy(
      id,
      req.user.customerId,
      format,
    );

    const filename = `${policy.title.replace(/[^a-z0-9]/gi, '_')}_v${policy.version}.${format}`;

    const contentType = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      markdown: 'text/markdown',
    }[format];

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get policy version history' })
  async getVersions(@Req() req: any, @Param('id') id: string) {
    return this.policyDraftingService.getPolicyVersions(id, req.user.customerId);
  }

  @Post(':id/versions/:version/revert')
  @ApiOperation({ summary: 'Revert to specific version' })
  @ApiResponse({ status: 200, description: 'Policy reverted', type: PolicyResponseDto })
  async revertToVersion(
    @Req() req: any,
    @Param('id') id: string,
    @Param('version') version: string,
  ): Promise<PolicyResponseDto> {
    return this.policyDraftingService.revertToVersion(
      id,
      req.user.customerId,
      req.user.userId,
      parseInt(version, 10),
    );
  }
}

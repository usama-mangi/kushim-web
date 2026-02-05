import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FrameworksService } from './frameworks.service';
import {
  FrameworkResponseDto,
  ControlResponseDto,
  ControlMappingResponseDto,
  ActivateFrameworkDto,
  CustomerFrameworkResponseDto,
} from './dto';

@ApiTags('frameworks')
@Controller('frameworks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FrameworksController {
  constructor(private readonly frameworksService: FrameworksService) {}

  @Get()
  @ApiOperation({ summary: 'List all available frameworks' })
  @ApiResponse({ status: 200, description: 'List of frameworks', type: [FrameworkResponseDto] })
  async listFrameworks() {
    return this.frameworksService.listFrameworks();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get framework details' })
  @ApiResponse({ status: 200, description: 'Framework details', type: FrameworkResponseDto })
  @ApiResponse({ status: 404, description: 'Framework not found' })
  async getFramework(@Param('code') code: string) {
    return this.frameworksService.getFramework(code);
  }

  @Get(':code/controls')
  @ApiOperation({ summary: 'Get controls for a framework' })
  @ApiResponse({ status: 200, description: 'List of controls', type: [ControlResponseDto] })
  @ApiResponse({ status: 404, description: 'Framework not found' })
  async getControls(
    @Param('code') code: string,
    @Query('section') section?: string,
  ) {
    return this.frameworksService.getControls(code, section);
  }

  @Get('controls/:id/mappings')
  @ApiOperation({ summary: 'Get cross-framework mappings for a control' })
  @ApiResponse({ status: 200, description: 'Control mappings', type: [ControlMappingResponseDto] })
  @ApiResponse({ status: 404, description: 'Control not found' })
  async getControlMappings(@Param('id') id: string) {
    return this.frameworksService.getControlMappings(id);
  }

  @Post('customers/:customerId/frameworks')
  @ApiOperation({ summary: 'Activate a framework for a customer' })
  @ApiResponse({ status: 201, description: 'Framework activated', type: CustomerFrameworkResponseDto })
  @ApiResponse({ status: 400, description: 'Framework already activated or invalid' })
  @ApiResponse({ status: 404, description: 'Framework not found' })
  async activateFramework(
    @Param('customerId') customerId: string,
    @Body() dto: ActivateFrameworkDto,
    @Request() req,
  ) {
    // Verify customer ID matches authenticated user's customer
    if (req.user.customerId !== customerId) {
      throw new Error('Unauthorized');
    }

    return this.frameworksService.activateFramework(
      customerId,
      dto.frameworkCode,
      dto.targetDate ? new Date(dto.targetDate) : undefined,
    );
  }

  @Delete('customers/:customerId/frameworks/:code')
  @ApiOperation({ summary: 'Deactivate a framework for a customer' })
  @ApiResponse({ status: 200, description: 'Framework deactivated' })
  @ApiResponse({ status: 404, description: 'Framework not found or not activated' })
  async deactivateFramework(
    @Param('customerId') customerId: string,
    @Param('code') code: string,
    @Request() req,
  ) {
    if (req.user.customerId !== customerId) {
      throw new Error('Unauthorized');
    }

    return this.frameworksService.deactivateFramework(customerId, code);
  }

  @Get('customers/:customerId/frameworks')
  @ApiOperation({ summary: 'Get active frameworks for a customer' })
  @ApiResponse({ status: 200, description: 'Active frameworks', type: [CustomerFrameworkResponseDto] })
  async getCustomerFrameworks(
    @Param('customerId') customerId: string,
    @Request() req,
  ) {
    if (req.user.customerId !== customerId) {
      throw new Error('Unauthorized');
    }

    return this.frameworksService.getCustomerFrameworks(customerId);
  }

  @Get('customers/:customerId/dashboard')
  @ApiOperation({ summary: 'Get unified compliance dashboard across all frameworks' })
  @ApiResponse({ status: 200, description: 'Unified dashboard' })
  async getUnifiedDashboard(
    @Param('customerId') customerId: string,
    @Request() req,
  ) {
    if (req.user.customerId !== customerId) {
      throw new Error('Unauthorized');
    }

    return this.frameworksService.getUnifiedDashboard(customerId);
  }
}

import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';
import { IntegrationType } from '@prisma/client';
import {
  IntegrationListResponseDto,
  ConnectIntegrationResponseDto,
  DeleteIntegrationResponseDto,
} from './dto/integration-response.dto';
import { ErrorResponseDto } from '../auth/dto/auth-response.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('integrations')
@ApiBearerAuth('JWT-auth')
@Controller('integrations')
@UseGuards(AuthGuard('jwt'))
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all integrations',
    description: 'Get list of all configured integrations for the organization',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Integrations retrieved successfully',
    type: IntegrationListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async listIntegrations(@Request() req: any) {
    return this.integrationsService.listIntegrations(req.user.customerId);
  }

  @Post(':type/connect')
  @ApiOperation({
    summary: 'Connect an integration',
    description:
      'Connect a new integration or update existing integration configuration',
  })
  @ApiParam({
    name: 'type',
    description: 'Integration type',
    example: 'aws',
    enum: ['aws', 'github', 'okta', 'jira', 'slack'],
  })
  @ApiBody({
    description: 'Integration configuration (varies by type)',
    schema: {
      type: 'object',
      properties: {
        config: {
          type: 'object',
          description: 'Integration-specific configuration',
          example: {
            accessKeyId: 'AKIA...',
            secretAccessKey: 'secret...',
            region: 'us-east-1',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Integration connected successfully',
    type: ConnectIntegrationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid configuration',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
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
  @ApiOperation({
    summary: 'Delete integration by type',
    description: 'Delete an integration by its type',
  })
  @ApiParam({
    name: 'type',
    description: 'Integration type to delete',
    example: 'aws',
    enum: ['aws', 'github', 'okta', 'jira', 'slack'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Integration deleted successfully',
    type: DeleteIntegrationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Integration not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
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
  @ApiOperation({
    summary: 'Delete integration by ID',
    description: 'Delete a specific integration by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Integration ID to delete',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Integration deleted successfully',
    type: DeleteIntegrationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Integration not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async deleteIntegration(@Param('id') id: string, @Request() req: any) {
    return this.integrationsService.deleteIntegration(req.user.customerId, id);
  }
}

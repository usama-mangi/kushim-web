import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CopilotService } from './copilot.service';
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationResponseDto,
  MessageResponseDto,
  SuggestionResponseDto,
} from './dto';

@ApiTags('Compliance Copilot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('copilot')
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new conversation',
    description: 'Start a new conversation with the Compliance Copilot',
  })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
    type: ConversationResponseDto,
  })
  async createConversation(
    @Request() req,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.copilotService.createConversation(
      req.user.customerId,
      req.user.userId,
      dto.title,
    );
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'List user conversations',
    description: 'Get all active conversations for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
    type: [ConversationResponseDto],
  })
  async listConversations(@Request() req): Promise<ConversationResponseDto[]> {
    return this.copilotService.listConversations(
      req.user.customerId,
      req.user.userId,
    );
  }

  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Get conversation details',
    description: 'Retrieve a specific conversation with full message history',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(@Param('id') id: string): Promise<ConversationResponseDto> {
    return this.copilotService.getConversation(id);
  }

  @Post('conversations/:id/messages')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 messages per minute
  @ApiOperation({
    summary: 'Send a message',
    description: 'Send a message in a conversation and get AI response',
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent and response received',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async sendMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const result = await this.copilotService.chat(id, dto.message, req.user.userId);
    return result.message;
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Archive conversation',
    description: 'Archive a conversation (soft delete)',
  })
  @ApiResponse({ status: 204, description: 'Conversation archived successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async archiveConversation(@Param('id') id: string): Promise<void> {
    await this.copilotService.archiveConversation(id);
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Get smart suggestions',
    description: 'Get AI-powered proactive suggestions for compliance improvements',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestions generated successfully',
    type: SuggestionResponseDto,
  })
  async getSuggestions(@Request() req): Promise<SuggestionResponseDto> {
    return this.copilotService.generateSuggestions(req.user.customerId);
  }
}

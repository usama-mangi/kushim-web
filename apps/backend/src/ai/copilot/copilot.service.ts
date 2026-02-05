import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OpenAIService } from '../openai.service';
import { UsageTrackerService } from '../usage-tracker.service';
import {
  ConversationResponseDto,
  MessageResponseDto,
  SuggestionDto,
  SuggestionPriority,
  SuggestionResponseDto,
  SuggestionType,
} from './dto';

interface ContextData {
  controls: any[];
  evidence: any[];
  policies: any[];
  integrations: any[];
  complianceStats: any;
}

interface ChatResponse {
  message: MessageResponseDto;
  conversationId: string;
}

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);
  private readonly MAX_HISTORY_MESSAGES = 10;
  private readonly DEFAULT_MODEL = 'gpt-3.5-turbo';
  private readonly COMPLEX_MODEL = 'gpt-4-turbo-preview';

  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAIService,
    private readonly usageTracker: UsageTrackerService,
  ) {}

  async createConversation(
    customerId: string,
    userId: string,
    title?: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.copilotConversation.create({
      data: {
        customerId,
        userId,
        title: title || 'New Conversation',
        status: 'ACTIVE',
      },
    });

    return this.mapConversationToDto(conversation, 0);
  }

  async chat(
    conversationId: string,
    message: string,
    userId: string,
  ): Promise<ChatResponse> {
    const conversation = await this.prisma.copilotConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: this.MAX_HISTORY_MESSAGES,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Create user message
    const userMessage = await this.prisma.copilotMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content: message,
      },
    });

    try {
      // Retrieve relevant context using RAG
      const context = await this.retrieveContext(
        conversation.customerId,
        message,
      );

      // Determine if question is complex (needs GPT-4)
      const isComplex = this.isComplexQuery(message);
      const model = isComplex ? this.COMPLEX_MODEL : this.DEFAULT_MODEL;

      // Build messages array with system prompt and history
      const messages = this.buildMessages(conversation, message, context);

      // Call OpenAI
      const { content, usage } = await this.openai.generateChatCompletion(
        messages,
        { model, maxTokens: 2000, temperature: 0.7 },
      );

      // Extract metadata from context
      const metadata = this.extractMetadata(context);

      // Create assistant message
      const assistantMessage = await this.prisma.copilotMessage.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content,
          metadata,
          tokens: usage.totalTokens,
          cost: usage.estimatedCostUsd,
        },
      });

      // Update conversation last message time
      await this.prisma.copilotConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      // Track usage
      await this.usageTracker.logUsage({
        customerId: conversation.customerId,
        operation: 'copilot_chat',
        model,
        usage,
        metadata: { conversationId, messageLength: message.length },
      });

      return {
        message: this.mapMessageToDto(assistantMessage),
        conversationId,
      };
    } catch (error) {
      this.logger.error('Error in chat', { error, conversationId });
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.copilotConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return {
      ...this.mapConversationToDto(conversation, conversation._count.messages),
      messages: conversation.messages.map((msg) => this.mapMessageToDto(msg)),
    };
  }

  async listConversations(
    customerId: string,
    userId: string,
  ): Promise<ConversationResponseDto[]> {
    const conversations = await this.prisma.copilotConversation.findMany({
      where: {
        customerId,
        userId,
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    });

    return conversations.map((conv) =>
      this.mapConversationToDto(conv, conv._count.messages),
    );
  }

  async archiveConversation(conversationId: string): Promise<void> {
    await this.prisma.copilotConversation.update({
      where: { id: conversationId },
      data: { status: 'ARCHIVED' },
    });
  }

  async generateSuggestions(
    customerId: string,
  ): Promise<SuggestionResponseDto> {
    const suggestions: SuggestionDto[] = [];

    // Get failed controls
    const failedControls = await this.prisma.complianceCheck.findMany({
      where: {
        customerId,
        status: 'FAIL',
        checkedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: { control: true },
      take: 10,
    });

    if (failedControls.length > 0) {
      suggestions.push({
        title: `${failedControls.length} controls need attention`,
        description: `Failed controls: ${failedControls.map((c) => c.control.controlId).join(', ')}`,
        type: SuggestionType.CONTROL,
        priority: SuggestionPriority.HIGH,
        action: 'Review failed controls and gather missing evidence',
        metadata: { controlIds: failedControls.map((c) => c.control.id) },
      });
    }

    // Check stale integrations
    const staleIntegrations = await this.prisma.integration.findMany({
      where: {
        customerId,
        status: 'ACTIVE',
        lastSyncAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // More than 1 day old
        },
      },
      take: 10,
    });

    if (staleIntegrations.length > 0) {
      suggestions.push({
        title: `${staleIntegrations.length} integrations have stale data`,
        description: `Integrations: ${staleIntegrations.map((i) => i.type).join(', ')}`,
        type: SuggestionType.INTEGRATION,
        priority: SuggestionPriority.MEDIUM,
        action: 'Trigger a manual sync to refresh integration data',
        metadata: { integrationIds: staleIntegrations.map((i) => i.id) },
      });
    }

    // Check policies needing review
    const oldPolicies = await this.prisma.policy.findMany({
      where: {
        customerId,
        status: 'APPROVED',
        updatedAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // More than 90 days old
        },
      },
      take: 5,
    });

    if (oldPolicies.length > 0) {
      suggestions.push({
        title: 'Policy review is overdue',
        description: `${oldPolicies.length} policies haven't been reviewed in 90+ days`,
        type: SuggestionType.POLICY,
        priority: SuggestionPriority.MEDIUM,
        action: 'Schedule a policy review session',
        metadata: { policyIds: oldPolicies.map((p) => p.id) },
      });
    }

    // Check recent successful evidence collection
    const recentEvidence = await this.prisma.evidence.findMany({
      where: {
        customerId,
        collectedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (recentEvidence.length > 0) {
      suggestions.push({
        title: `${recentEvidence.length} new evidence collected`,
        description: 'Evidence collection succeeded for multiple controls',
        type: SuggestionType.EVIDENCE,
        priority: SuggestionPriority.LOW,
        action: 'Review newly collected evidence',
        metadata: { count: recentEvidence.length },
      });
    }

    // Calculate health score
    const totalChecks = await this.prisma.complianceCheck.count({
      where: { customerId },
    });
    const passedChecks = await this.prisma.complianceCheck.count({
      where: { customerId, status: 'PASS' },
    });
    const healthScore = totalChecks > 0 ? passedChecks / totalChecks : 0;

    return {
      suggestions,
      healthScore,
      generatedAt: new Date(),
    };
  }

  private async retrieveContext(
    customerId: string,
    query: string,
  ): Promise<ContextData> {
    const queryLower = query.toLowerCase();

    // Extract potential control IDs (e.g., CC1.2, A1.2)
    const controlIdPattern = /\b([A-Z]{1,3}\d+\.?\d*)\b/gi;
    const mentionedControlIds = query.match(controlIdPattern) || [];

    // Retrieve relevant controls
    const controls = await this.prisma.control.findMany({
      where: {
        OR: [
          { controlId: { in: mentionedControlIds } },
          { title: { contains: queryLower, mode: 'insensitive' } },
          { description: { contains: queryLower, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    // Retrieve recent evidence if query mentions "evidence"
    const evidence =
      queryLower.includes('evidence') || queryLower.includes('proof')
        ? await this.prisma.evidence.findMany({
            where: { customerId },
            orderBy: { collectedAt: 'desc' },
            take: 5,
            include: { control: true, integration: true },
          })
        : [];

    // Retrieve policies if query mentions "policy" or "policies"
    const policies =
      queryLower.includes('policy') || queryLower.includes('policies')
        ? await this.prisma.policy.findMany({
            where: { customerId },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            include: { template: true },
          })
        : [];

    // Retrieve integration status if query mentions integrations
    const integrations =
      queryLower.includes('integration') ||
      queryLower.includes('aws') ||
      queryLower.includes('github') ||
      queryLower.includes('okta') ||
      queryLower.includes('jira') ||
      queryLower.includes('slack')
        ? await this.prisma.integration.findMany({
            where: { customerId },
            orderBy: { lastSyncAt: 'desc' },
            take: 5,
          })
        : [];

    // Get compliance stats
    const complianceStats = await this.getComplianceStats(customerId);

    return {
      controls,
      evidence,
      policies,
      integrations,
      complianceStats,
    };
  }

  private async getComplianceStats(customerId: string) {
    const checks = await this.prisma.complianceCheck.groupBy({
      by: ['status'],
      where: { customerId },
      _count: true,
    });

    const stats = {
      total: 0,
      pass: 0,
      fail: 0,
      warning: 0,
      pending: 0,
    };

    checks.forEach((check) => {
      stats.total += check._count;
      stats[check.status.toLowerCase()] = check._count;
    });

    return stats;
  }

  private buildMessages(
    conversation: any,
    userMessage: string,
    context: ContextData,
  ): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [];

    // System prompt
    const systemPrompt = this.buildSystemPrompt(context);
    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Conversation history (last N messages, reversed to chronological)
    const history = [...conversation.messages].reverse();
    for (const msg of history) {
      messages.push({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Current user message with context
    const userMessageWithContext = this.buildUserMessage(userMessage, context);
    messages.push({
      role: 'user',
      content: userMessageWithContext,
    });

    return messages;
  }

  private buildSystemPrompt(context: ContextData): string {
    return `You are a Compliance Copilot, an expert SOC 2 compliance consultant helping users understand and manage their compliance status.

ROLE & CAPABILITIES:
- Explain SOC 2 controls in plain English
- Analyze compliance evidence and status
- Provide actionable recommendations for improving compliance
- Answer questions about policies, integrations, and compliance workflows
- Guide users through compliance processes

TONE & STYLE:
- Professional but approachable
- Clear and concise explanations
- Always provide actionable next steps
- Use examples when helpful
- Admit when you don't have enough information

CURRENT CUSTOMER CONTEXT:
Compliance Statistics:
- Total Checks: ${context.complianceStats.total}
- Passing: ${context.complianceStats.pass}
- Failed: ${context.complianceStats.fail}
- Warnings: ${context.complianceStats.warning}
- Pending: ${context.complianceStats.pending}

Active Integrations: ${context.integrations.length}
Policies: ${context.policies.length}

GUIDELINES:
1. Always base answers on the provided context when available
2. If asked about specific controls, reference the control data provided
3. Provide specific control IDs (e.g., CC1.2) when discussing controls
4. Suggest concrete actions the user can take
5. If information is missing, suggest what data would be helpful to collect
6. Never make up compliance requirements - only reference official SOC 2 standards

Remember: Your goal is to make SOC 2 compliance understandable and achievable.`;
  }

  private buildUserMessage(message: string, context: ContextData): string {
    let contextStr = message;

    if (context.controls.length > 0) {
      contextStr += '\n\nRELEVANT CONTROLS:\n';
      context.controls.forEach((ctrl) => {
        contextStr += `- ${ctrl.controlId}: ${ctrl.title}\n  ${ctrl.description.substring(0, 200)}...\n`;
      });
    }

    if (context.evidence.length > 0) {
      contextStr += '\n\nRECENT EVIDENCE:\n';
      context.evidence.forEach((ev) => {
        contextStr += `- Control ${ev.control.controlId}: Collected ${ev.collectedAt.toISOString()}\n`;
      });
    }

    if (context.policies.length > 0) {
      contextStr += '\n\nRELATED POLICIES:\n';
      context.policies.forEach((pol) => {
        contextStr += `- ${pol.title} (${pol.status})\n`;
      });
    }

    if (context.integrations.length > 0) {
      contextStr += '\n\nINTEGRATION STATUS:\n';
      context.integrations.forEach((int) => {
        contextStr += `- ${int.type}: ${int.status} (Last sync: ${int.lastSyncAt?.toISOString() || 'Never'})\n`;
      });
    }

    return contextStr;
  }

  private isComplexQuery(message: string): boolean {
    const complexKeywords = [
      'analyze',
      'compare',
      'recommend',
      'strategy',
      'roadmap',
      'audit',
      'assessment',
      'framework',
    ];
    const messageLower = message.toLowerCase();
    return (
      complexKeywords.some((kw) => messageLower.includes(kw)) ||
      message.length > 500
    );
  }

  private extractMetadata(context: ContextData): any {
    return {
      controls: context.controls.map((c) => c.controlId),
      policies: context.policies.map((p) => p.id),
      evidence: context.evidence.map((e) => e.id),
      sources: [
        ...context.controls.map((c) => ({
          type: 'control',
          id: c.id,
          title: c.controlId,
        })),
        ...context.integrations.map((i) => ({
          type: 'integration',
          id: i.id,
          title: i.type,
        })),
      ],
    };
  }

  private mapConversationToDto(
    conversation: any,
    messageCount: number,
  ): ConversationResponseDto {
    return {
      id: conversation.id,
      customerId: conversation.customerId,
      userId: conversation.userId,
      title: conversation.title,
      status: conversation.status,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      messageCount,
    };
  }

  private mapMessageToDto(message: any): MessageResponseDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      metadata: message.metadata || null,
      tokens: message.tokens,
      cost: message.cost ? Number(message.cost) : null,
      createdAt: message.createdAt,
    };
  }
}

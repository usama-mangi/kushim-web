import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface OpenAIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxTokens: number;

  private readonly PRICING = {
    'gpt-4-turbo-preview': { prompt: 0.01 / 1000, completion: 0.03 / 1000 },
    'gpt-4': { prompt: 0.03 / 1000, completion: 0.06 / 1000 },
    'gpt-3.5-turbo': { prompt: 0.0005 / 1000, completion: 0.0015 / 1000 },
  };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured - AI features disabled');
    }

    this.client = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });

    this.model = this.configService.get<string>(
      'OPENAI_MODEL',
      'gpt-4-turbo-preview',
    );
    this.maxTokens = this.configService.get<number>('OPENAI_MAX_TOKENS', 2000);
  }

  async generateChatCompletion(
    messages: ChatCompletionMessageParam[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      responseFormat?: { type: 'json_object' };
    },
  ): Promise<{ content: string; usage: OpenAIUsage }> {
    try {
      const model = options?.model || this.model;
      const maxTokens = options?.maxTokens || this.maxTokens;

      this.logger.debug(`Calling OpenAI with model: ${model}`);

      const completion = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: options?.temperature ?? 0.7,
        response_format: options?.responseFormat,
      });

      const usage = completion.usage;
      if (!usage) {
        throw new Error('No usage data returned from OpenAI');
      }
      const content = completion.choices[0]?.message?.content || '';

      const estimatedCost = this.calculateCost(
        model,
        usage.prompt_tokens,
        usage.completion_tokens,
      );

      return {
        content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          estimatedCostUsd: estimatedCost,
        },
      };
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async generateStructuredCompletion<T>(
    messages: ChatCompletionMessageParam[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<{ data: T; usage: OpenAIUsage }> {
    const result = await this.generateChatCompletion(messages, {
      ...options,
      responseFormat: { type: 'json_object' },
    });

    try {
      const data = JSON.parse(result.content) as T;
      return {
        data,
        usage: result.usage,
      };
    } catch (error) {
      this.logger.error('Failed to parse JSON response', {
        content: result.content,
        error,
      });
      throw new Error('Failed to parse structured response from OpenAI');
    }
  }

  private calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    const pricing = this.PRICING[model] || this.PRICING['gpt-4-turbo-preview'];
    return (
      promptTokens * pricing.prompt + completionTokens * pricing.completion
    );
  }

  isConfigured(): boolean {
    return !!this.configService.get<string>('OPENAI_API_KEY');
  }
}

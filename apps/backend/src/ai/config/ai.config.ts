import { registerAs } from '@nestjs/config';

export interface AiConfig {
  enabled: boolean;
  costLimitPerCustomer: number;
  defaultModel: string;
  premiumModel: string;
  models: {
    gpt4Turbo: ModelConfig;
    gpt35Turbo: ModelConfig;
    gpt4: ModelConfig;
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  features: {
    evidenceMapping: FeatureConfig;
    policyDrafting: FeatureConfig;
    copilot: FeatureConfig;
  };
  cache: {
    enabled: boolean;
    ttl: {
      controlDescriptions: number; // 7 days
      policyTemplates: number; // 24 hours
      copilotResponses: number; // 1 hour
    };
  };
  retry: {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
}

export interface ModelConfig {
  name: string;
  contextWindow: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  maxOutputTokens: number;
  enabled: boolean;
}

export interface FeatureConfig {
  enabled: boolean;
  defaultModel: string;
  fallbackModel: string;
  maxConcurrentRequests: number;
  timeoutMs: number;
}

export default registerAs('ai', (): AiConfig => ({
  enabled: process.env.AI_ENABLED !== 'false',
  costLimitPerCustomer: parseFloat(process.env.AI_COST_LIMIT_PER_CUSTOMER || '100'),
  defaultModel: process.env.AI_MODEL_DEFAULT || 'gpt-3.5-turbo',
  premiumModel: process.env.AI_MODEL_PREMIUM || 'gpt-4-turbo-preview',

  models: {
    gpt4Turbo: {
      name: 'gpt-4-turbo-preview',
      contextWindow: 128000,
      costPer1kInputTokens: 0.01,
      costPer1kOutputTokens: 0.03,
      maxOutputTokens: 4096,
      enabled: true,
    },
    gpt35Turbo: {
      name: 'gpt-3.5-turbo',
      contextWindow: 16385,
      costPer1kInputTokens: 0.0005,
      costPer1kOutputTokens: 0.0015,
      maxOutputTokens: 4096,
      enabled: true,
    },
    gpt4: {
      name: 'gpt-4',
      contextWindow: 8192,
      costPer1kInputTokens: 0.03,
      costPer1kOutputTokens: 0.06,
      maxOutputTokens: 4096,
      enabled: false, // More expensive, use gpt-4-turbo instead
    },
  },

  rateLimit: {
    requestsPerMinute: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '60', 10),
    requestsPerHour: parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || '1000', 10),
    requestsPerDay: parseInt(process.env.AI_RATE_LIMIT_PER_DAY || '10000', 10),
  },

  features: {
    evidenceMapping: {
      enabled: process.env.AI_EVIDENCE_MAPPING_ENABLED !== 'false',
      defaultModel: 'gpt-3.5-turbo', // Fast and cheap for mapping
      fallbackModel: 'gpt-3.5-turbo',
      maxConcurrentRequests: 10,
      timeoutMs: 30000,
    },
    policyDrafting: {
      enabled: process.env.AI_POLICY_DRAFTING_ENABLED !== 'false',
      defaultModel: 'gpt-4-turbo-preview', // Higher quality for policies
      fallbackModel: 'gpt-3.5-turbo',
      maxConcurrentRequests: 3, // Expensive, limit concurrency
      timeoutMs: 120000, // 2 minutes for policy generation
    },
    copilot: {
      enabled: process.env.AI_COPILOT_ENABLED !== 'false',
      defaultModel: 'gpt-3.5-turbo', // Fast responses
      fallbackModel: 'gpt-3.5-turbo',
      maxConcurrentRequests: 20,
      timeoutMs: 30000,
    },
  },

  cache: {
    enabled: process.env.AI_CACHE_ENABLED !== 'false',
    ttl: {
      controlDescriptions: 7 * 24 * 60 * 60, // 7 days (rarely change)
      policyTemplates: 24 * 60 * 60, // 24 hours
      copilotResponses: 60 * 60, // 1 hour
    },
  },

  retry: {
    maxAttempts: parseInt(process.env.AI_RETRY_MAX_ATTEMPTS || '3', 10),
    backoffMs: parseInt(process.env.AI_RETRY_BACKOFF_MS || '1000', 10),
    backoffMultiplier: parseFloat(process.env.AI_RETRY_BACKOFF_MULTIPLIER || '2'),
  },
}));

export interface EvidenceMapping {
  id: string;
  evidenceId: string;
  controlId: string;
  confidence: number;
  reasoning: string;
  isManuallyReviewed: boolean;
  createdAt: Date;
}

export interface Policy {
  id: string;
  title: string;
  policyType: string;
  content: string;
  version: number;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED';
  isAiGenerated: boolean;
  soc2Alignment: number;
  controlsCovered: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyReview {
  overallScore: number;
  completeness: number;
  clarity: number;
  soc2Alignment: number;
  suggestions: PolicySuggestion[];
  strengths: string[];
  weaknesses: string[];
}

export interface PolicySuggestion {
  section: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: Date;
}

export interface Citation {
  evidenceId: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
  controlId?: string;
}

export interface CopilotConversation {
  id: string;
  title?: string;
  messages: CopilotMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIInsight {
  type: 'control_gap' | 'unmapped_evidence' | 'policy_outdated' | 'cost_spike';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  actionRequired: string;
  metadata?: Record<string, any>;
}

export interface AIUsageStats {
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  byFeature: Record<string, {
    cost: number;
    tokens: number;
    requests: number;
  }>;
}

export interface BatchMappingResult {
  successful: number;
  failed: number;
  totalCost: number;
  duration: number;
  errors: Array<{
    evidenceId: string;
    error: string;
  }>;
}

# Phase 2 Preparation: AI-Powered Automation

**Project:** Kushim Compliance Automation Platform  
**Phase:** 2 - AI/ML Features  
**Duration:** 4 weeks (Weeks 5-8)  
**Status:** Planning  
**Last Updated:** February 6, 2026

---

## Table of Contents

1. [Phase 2 Overview](#phase-2-overview)
2. [AI/ML Dependencies](#aiml-dependencies)
3. [Database Schema Changes](#database-schema-changes)
4. [New Modules to Create](#new-modules-to-create)
5. [Integration Requirements](#integration-requirements)
6. [Cost Estimation](#cost-estimation)
7. [Development Roadmap](#development-roadmap)
8. [Testing Strategy](#testing-strategy)
9. [Risk Mitigation](#risk-mitigation)

---

## Phase 2 Overview

### Goals

Transform Kushim from a monitoring platform into an **AI-powered compliance automation system** that:
- 🤖 **Automatically maps evidence** to compliance controls using RAG
- 📝 **Drafts compliance policies** from templates and context
- 💬 **Answers natural language queries** about compliance status
- 🧠 **Suggests control improvements** based on industry best practices
- ⚡ **Automates repetitive compliance tasks** with intelligent agents

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Evidence mapping accuracy | >90% | Manual validation of 100 samples |
| Policy draft quality | >85% usable | Auditor feedback score |
| Query response accuracy | >95% | Human evaluation |
| Time savings | 60% reduction | Time to complete compliance tasks |
| User satisfaction | >4.5/5 | Post-task surveys |
| AI response time | <3s (p95) | Latency monitoring |
| Cost per request | <$0.10 | OpenAI API usage tracking |

### Competitive Differentiators

| Feature | Kushim (Phase 2) | Vanta | Drata | Secureframe |
|---------|------------------|-------|-------|-------------|
| AI Evidence Mapping | ✅ RAG-based | ❌ Manual | ❌ Manual | ⚠️ Limited |
| AI Policy Drafting | ✅ Full | ❌ Templates | ❌ Templates | ❌ Templates |
| Natural Language Queries | ✅ Full | ❌ No | ❌ No | ❌ No |
| Compliance Copilot | ✅ Full | ❌ No | ❌ No | ❌ No |
| Auto-remediation | ✅ Smart | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic |

---

## AI/ML Dependencies

### 1. OpenAI SDK

**Purpose:** GPT-4 for text generation, embeddings for RAG

**Installation:**
```bash
cd apps/backend
npm install openai@^4.28.0
npm install @types/node@^20.0.0
```

**Configuration:**
```typescript
// apps/backend/src/config/openai.config.ts
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
  model: {
    chat: 'gpt-4-turbo-preview',      // Text generation
    embedding: 'text-embedding-3-small', // Embeddings
  },
  temperature: {
    evidence: 0.1,   // Deterministic for evidence mapping
    policy: 0.3,     // Slightly creative for policies
    chat: 0.7,       // More creative for conversations
  },
  maxTokens: {
    evidence: 1000,
    policy: 2000,
    chat: 1500,
  },
};
```

**Environment Variables:**
```bash
# .env
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG_ID=org-...
OPENAI_MODEL_CHAT=gpt-4-turbo-preview
OPENAI_MODEL_EMBEDDING=text-embedding-3-small
```

### 2. LangChain

**Purpose:** LLM orchestration, chains, agents, RAG

**Installation:**
```bash
npm install langchain@^0.1.25
npm install @langchain/openai@^0.0.19
npm install @langchain/community@^0.0.34
```

**Use Cases:**
- RAG pipelines for evidence mapping
- Chain-of-thought reasoning for compliance questions
- Agent framework for autonomous tasks
- Prompt templates and versioning
- Memory management for conversations

### 3. Vector Database (Pinecone)

**Purpose:** Store embeddings for semantic search

**Installation:**
```bash
npm install @pinecone-database/pinecone@^2.0.1
```

**Alternative (ChromaDB - Self-hosted):**
```bash
npm install chromadb@^1.7.3
```

**Configuration:**
```typescript
// apps/backend/src/config/vector.config.ts
export const vectorConfig = {
  provider: 'pinecone', // or 'chroma'
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    indexName: 'kushim-compliance',
    dimension: 1536, // text-embedding-3-small
  },
  chroma: {
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT || '8000'),
  },
};
```

**Why Pinecone vs ChromaDB:**
- **Pinecone:** Managed, scalable, better for production
- **ChromaDB:** Self-hosted, lower cost, better for development
- **Recommendation:** Start with ChromaDB (dev), migrate to Pinecone (prod)

### 4. Additional AI Libraries

**Embeddings Helpers:**
```bash
npm install pdf-parse@^1.1.1           # Parse PDF evidence
npm install mammoth@^1.6.0             # Parse DOCX policies
npm install tiktoken@^1.0.10           # Token counting
```

**Prompt Engineering:**
```bash
npm install @anthropic-ai/sdk@^0.17.1  # Claude fallback (optional)
npm install ai@^3.0.0                  # Vercel AI SDK (streaming)
```

**LLMOps:**
```bash
npm install langsmith@^0.1.1           # LangChain observability
npm install helicone                   # OpenAI monitoring (optional)
```

### 5. Development Dependencies

**Testing:**
```bash
npm install @testing-library/react@^14.0.0  # Frontend AI component tests
npm install msw@^2.0.0                      # Mock AI API responses
```

**Type Definitions:**
```typescript
// apps/backend/src/types/ai.types.ts
export interface EmbeddingVector {
  id: string;
  values: number[];
  metadata: Record<string, any>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

export interface RAGResult {
  answer: string;
  sources: EvidenceSource[];
  confidence: number;
}
```

---

## Database Schema Changes

### New Tables

#### 1. `AIConversation`
**Purpose:** Store chat history for compliance copilot

```prisma
model AIConversation {
  id          String   @id @default(uuid())
  customerId  String
  userId      String
  title       String?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages    AIMessage[]
  
  @@index([customerId, userId])
  @@index([createdAt])
}
```

#### 2. `AIMessage`
**Purpose:** Individual messages in conversations

```prisma
model AIMessage {
  id             String   @id @default(uuid())
  conversationId String
  role           String   // 'user' | 'assistant' | 'system'
  content        String   @db.Text
  metadata       Json?    // tokens used, model, temperature, etc.
  createdAt      DateTime @default(now())
  
  conversation   AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@index([conversationId, createdAt])
}
```

#### 3. `EvidenceEmbedding`
**Purpose:** Store vector embeddings for evidence

```prisma
model EvidenceEmbedding {
  id          String   @id @default(uuid())
  evidenceId  String   @unique
  vectorId    String   // Pinecone/Chroma vector ID
  modelName   String   // 'text-embedding-3-small'
  dimension   Int      // 1536
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  evidence    Evidence @relation(fields: [evidenceId], references: [id], onDelete: Cascade)
  
  @@index([vectorId])
}
```

#### 4. `Policy`
**Purpose:** Store generated compliance policies

```prisma
model Policy {
  id          String   @id @default(uuid())
  customerId  String
  controlId   String?
  title       String
  content     String   @db.Text
  version     Int      @default(1)
  status      String   // 'draft' | 'review' | 'approved' | 'archived'
  generatedBy String?  // 'ai' | 'manual'
  aiPrompt    String?  @db.Text
  aiMetadata  Json?    // model, temperature, tokens, etc.
  approvedBy  String?
  approvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  control     Control? @relation(fields: [controlId], references: [id])
  approver    User?    @relation(fields: [approvedBy], references: [id])
  versions    PolicyVersion[]
  
  @@index([customerId, status])
  @@index([controlId])
}
```

#### 5. `PolicyVersion`
**Purpose:** Track policy revision history

```prisma
model PolicyVersion {
  id          String   @id @default(uuid())
  policyId    String
  version     Int
  content     String   @db.Text
  changes     String?  @db.Text
  createdBy   String
  createdAt   DateTime @default(now())
  
  policy      Policy   @relation(fields: [policyId], references: [id], onDelete: Cascade)
  creator     User     @relation(fields: [createdBy], references: [id])
  
  @@unique([policyId, version])
  @@index([policyId])
}
```

#### 6. `AITask`
**Purpose:** Track autonomous AI agent tasks

```prisma
model AITask {
  id          String   @id @default(uuid())
  customerId  String
  type        String   // 'evidence_mapping' | 'policy_draft' | 'auto_remediation'
  status      String   // 'pending' | 'running' | 'completed' | 'failed'
  input       Json     // Task parameters
  output      Json?    // Task results
  error       String?  @db.Text
  aiMetadata  Json?    // model, tokens, cost, etc.
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())
  
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  @@index([customerId, status])
  @@index([type, status])
}
```

#### 7. `PromptTemplate`
**Purpose:** Version-controlled prompt templates

```prisma
model PromptTemplate {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  template    String   @db.Text
  variables   Json     // List of required variables
  model       String   // 'gpt-4-turbo-preview'
  temperature Float    @default(0.7)
  maxTokens   Int      @default(1000)
  version     Int      @default(1)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([name, isActive])
}
```

#### 8. `AIUsageMetrics`
**Purpose:** Track AI API usage and costs

```prisma
model AIUsageMetrics {
  id          String   @id @default(uuid())
  customerId  String
  date        DateTime @db.Date
  model       String
  operation   String   // 'chat' | 'embedding' | 'completion'
  requests    Int      @default(0)
  tokens      Int      @default(0)
  cost        Decimal  @db.Decimal(10, 4) @default(0)
  createdAt   DateTime @default(now())
  
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  @@unique([customerId, date, model, operation])
  @@index([customerId, date])
}
```

### Schema Updates to Existing Tables

#### Update `Evidence` table
**Add AI-related fields:**

```prisma
model Evidence {
  // ... existing fields ...
  
  // AI enhancements
  summary         String?  @db.Text       // AI-generated summary
  aiMappedControls Json?                   // AI-suggested control mappings
  embeddingId     String?                  // Link to EvidenceEmbedding
  
  embedding       EvidenceEmbedding?
}
```

#### Update `Control` table
**Add policy link:**

```prisma
model Control {
  // ... existing fields ...
  
  policies        Policy[]
}
```

#### Update `ComplianceCheck` table
**Add AI suggestions:**

```prisma
model ComplianceCheck {
  // ... existing fields ...
  
  aiSuggestions   Json?  // AI-generated remediation suggestions
  aiConfidence    Float? // Confidence score for AI recommendations
}
```

### Migration Script

```bash
# Create migration
cd apps/backend
npx prisma migrate dev --name add_ai_features

# Generate Prisma client
npx prisma generate
```

**Migration SQL Preview:**
```sql
-- Create new tables
CREATE TABLE "AIConversation" (...);
CREATE TABLE "AIMessage" (...);
CREATE TABLE "EvidenceEmbedding" (...);
CREATE TABLE "Policy" (...);
CREATE TABLE "PolicyVersion" (...);
CREATE TABLE "AITask" (...);
CREATE TABLE "PromptTemplate" (...);
CREATE TABLE "AIUsageMetrics" (...);

-- Add columns to existing tables
ALTER TABLE "Evidence" ADD COLUMN "summary" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "aiMappedControls" JSONB;
ALTER TABLE "Evidence" ADD COLUMN "embeddingId" TEXT;

ALTER TABLE "ComplianceCheck" ADD COLUMN "aiSuggestions" JSONB;
ALTER TABLE "ComplianceCheck" ADD COLUMN "aiConfidence" DOUBLE PRECISION;

-- Create indexes
CREATE INDEX "idx_ai_conversation_customer" ON "AIConversation"("customerId", "userId");
CREATE INDEX "idx_evidence_embedding_vector" ON "EvidenceEmbedding"("vectorId");
CREATE INDEX "idx_policy_customer_status" ON "Policy"("customerId", "status");
```

---

## New Modules to Create

### 1. Evidence Mapping AI Module

**Location:** `apps/backend/src/ai/evidence-mapping/`

**Purpose:** Automatically map collected evidence to compliance controls using RAG

**Files:**
```
evidence-mapping/
├── evidence-mapping.module.ts
├── evidence-mapping.service.ts
├── evidence-mapping.controller.ts
├── embeddings.service.ts
├── vector.service.ts
└── dto/
    ├── map-evidence.dto.ts
    └── mapping-result.dto.ts
```

**Key Features:**
- Generate embeddings for evidence content
- Semantic search against control descriptions
- Confidence scoring for mappings
- Batch processing for multiple evidence items
- Incremental learning from manual corrections

**API Endpoints:**
```typescript
POST   /api/ai/evidence/map          // Map single evidence
POST   /api/ai/evidence/batch-map    // Map multiple evidence items
GET    /api/ai/evidence/:id/suggestions // Get AI mapping suggestions
PUT    /api/ai/evidence/:id/accept-mapping // Accept AI suggestion
```

**Example Implementation:**
```typescript
@Injectable()
export class EvidenceMappingService {
  constructor(
    private openai: OpenAIService,
    private vectorStore: VectorService,
    private prisma: PrismaService,
  ) {}

  async mapEvidenceToControls(evidenceId: string): Promise<MappingResult> {
    // 1. Get evidence content
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
      include: { integration: true },
    });

    // 2. Generate embedding
    const embedding = await this.openai.createEmbedding(evidence.content);

    // 3. Semantic search in vector store
    const similarControls = await this.vectorStore.search(embedding, {
      topK: 5,
      threshold: 0.75,
    });

    // 4. Use LLM to validate and rank
    const rankedMappings = await this.llmValidateMappings(
      evidence,
      similarControls,
    );

    // 5. Store embeddings and suggestions
    await this.storeMapping(evidenceId, embedding, rankedMappings);

    return rankedMappings;
  }

  private async llmValidateMappings(
    evidence: Evidence,
    controls: Control[],
  ): Promise<ControlMapping[]> {
    const prompt = this.buildValidationPrompt(evidence, controls);
    const response = await this.openai.chat([
      { role: 'system', content: EVIDENCE_MAPPING_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    return this.parseControlMappings(response);
  }
}
```

### 2. Policy Drafting AI Module

**Location:** `apps/backend/src/ai/policy-drafting/`

**Purpose:** Generate compliance policy documents from templates and context

**Files:**
```
policy-drafting/
├── policy-drafting.module.ts
├── policy-drafting.service.ts
├── policy-drafting.controller.ts
├── templates.service.ts
└── dto/
    ├── draft-policy.dto.ts
    ├── policy-input.dto.ts
    └── policy-output.dto.ts
```

**Key Features:**
- Template-based policy generation
- Company context incorporation
- Industry best practices integration
- Multi-section policy assembly
- Version control and diff tracking

**API Endpoints:**
```typescript
POST   /api/ai/policy/draft          // Draft new policy
POST   /api/ai/policy/refine         // Refine existing policy
GET    /api/ai/policy/templates      // List available templates
POST   /api/ai/policy/:id/version    // Create new version
GET    /api/ai/policy/:id/diff       // Compare versions
```

**Example Implementation:**
```typescript
@Injectable()
export class PolicyDraftingService {
  async draftPolicy(input: PolicyInput): Promise<Policy> {
    // 1. Get policy template
    const template = await this.getTemplate(input.type);

    // 2. Gather company context
    const context = await this.gatherContext(input.customerId);

    // 3. Generate policy sections
    const sections = await this.generateSections(template, context, input);

    // 4. Assemble final policy
    const policyContent = this.assembleSections(sections);

    // 5. Save as draft
    return this.savePolicyDraft({
      customerId: input.customerId,
      controlId: input.controlId,
      title: input.title,
      content: policyContent,
      status: 'draft',
      generatedBy: 'ai',
      aiMetadata: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        tokens: sections.reduce((sum, s) => sum + s.tokens, 0),
      },
    });
  }

  private async generateSections(
    template: PolicyTemplate,
    context: CompanyContext,
    input: PolicyInput,
  ): Promise<PolicySection[]> {
    const sections = [];
    
    for (const section of template.sections) {
      const prompt = this.buildSectionPrompt(section, context, input);
      const content = await this.openai.chat([
        { role: 'system', content: POLICY_DRAFTING_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ]);
      
      sections.push({
        title: section.title,
        content: content.text,
        tokens: content.usage.total_tokens,
      });
    }

    return sections;
  }
}
```

### 3. Compliance Copilot Module

**Location:** `apps/backend/src/ai/copilot/`

**Purpose:** Natural language Q&A about compliance status

**Files:**
```
copilot/
├── copilot.module.ts
├── copilot.service.ts
├── copilot.controller.ts
├── conversation.service.ts
├── rag.service.ts
└── dto/
    ├── chat.dto.ts
    └── conversation.dto.ts
```

**Key Features:**
- Natural language query processing
- RAG over compliance data (controls, evidence, checks)
- Conversational context maintenance
- Source attribution for answers
- Multi-turn conversations

**API Endpoints:**
```typescript
POST   /api/ai/copilot/chat           // Send message
GET    /api/ai/copilot/conversations  // List conversations
GET    /api/ai/copilot/:id            // Get conversation
DELETE /api/ai/copilot/:id            // Delete conversation
POST   /api/ai/copilot/:id/regenerate // Regenerate response
```

**Example Implementation:**
```typescript
@Injectable()
export class CopilotService {
  async chat(
    conversationId: string,
    message: string,
    customerId: string,
  ): Promise<ChatResponse> {
    // 1. Load conversation history
    const history = await this.loadHistory(conversationId);

    // 2. Retrieve relevant context using RAG
    const context = await this.ragService.retrieve(message, customerId);

    // 3. Build prompt with context and history
    const messages = this.buildChatPrompt(history, message, context);

    // 4. Get LLM response
    const response = await this.openai.chat(messages, {
      temperature: 0.7,
      maxTokens: 1500,
    });

    // 5. Save message and response
    await this.saveMessages(conversationId, [
      { role: 'user', content: message },
      { role: 'assistant', content: response.text, metadata: response.usage },
    ]);

    return {
      answer: response.text,
      sources: context.sources,
      conversationId,
      metadata: response.usage,
    };
  }

  private buildChatPrompt(
    history: AIMessage[],
    query: string,
    context: RAGContext,
  ): ChatMessage[] {
    return [
      { role: 'system', content: COPILOT_SYSTEM_PROMPT },
      ...this.formatHistory(history),
      {
        role: 'user',
        content: `Context:\n${context.text}\n\nQuestion: ${query}`,
      },
    ];
  }
}
```

### 4. Smart Suggestions Module

**Location:** `apps/backend/src/ai/suggestions/`

**Purpose:** Proactive compliance improvement recommendations

**Files:**
```
suggestions/
├── suggestions.module.ts
├── suggestions.service.ts
├── suggestions.controller.ts
└── dto/
    └── suggestion.dto.ts
```

**Key Features:**
- Analyze compliance check failures
- Suggest remediation steps
- Recommend control improvements
- Identify evidence gaps
- Prioritize by risk/impact

**API Endpoints:**
```typescript
GET    /api/ai/suggestions              // Get all suggestions
GET    /api/ai/suggestions/control/:id  // Suggestions for control
POST   /api/ai/suggestions/generate     // Generate new suggestions
PUT    /api/ai/suggestions/:id/dismiss  // Dismiss suggestion
PUT    /api/ai/suggestions/:id/apply    // Apply suggestion
```

**Example Implementation:**
```typescript
@Injectable()
export class SuggestionsService {
  async generateSuggestions(
    customerId: string,
    controlId?: string,
  ): Promise<Suggestion[]> {
    // 1. Get failed compliance checks
    const failedChecks = await this.getFailedChecks(customerId, controlId);

    // 2. Analyze failure patterns
    const patterns = await this.analyzePatterns(failedChecks);

    // 3. Generate remediation suggestions
    const suggestions = [];
    for (const pattern of patterns) {
      const suggestion = await this.generateRemediation(pattern);
      suggestions.push(suggestion);
    }

    // 4. Prioritize by impact
    return this.prioritizeSuggestions(suggestions);
  }

  private async generateRemediation(
    pattern: FailurePattern,
  ): Promise<Suggestion> {
    const prompt = this.buildRemediationPrompt(pattern);
    const response = await this.openai.chat([
      { role: 'system', content: REMEDIATION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    return {
      controlId: pattern.controlId,
      type: 'remediation',
      title: this.extractTitle(response.text),
      description: response.text,
      priority: this.calculatePriority(pattern),
      estimatedImpact: pattern.affectedChecks.length,
    };
  }
}
```

### 5. AI Observability Module

**Location:** `apps/backend/src/ai/observability/`

**Purpose:** Monitor AI performance, costs, and quality

**Files:**
```
observability/
├── observability.module.ts
├── observability.service.ts
├── observability.controller.ts
└── dto/
    └── metrics.dto.ts
```

**Key Features:**
- Track API usage and costs
- Monitor response quality
- Detect prompt injection attempts
- A/B test prompt variations
- Cost optimization recommendations

**API Endpoints:**
```typescript
GET    /api/ai/metrics              // Overall AI metrics
GET    /api/ai/metrics/usage        // Usage by customer/model
GET    /api/ai/metrics/costs        // Cost breakdown
GET    /api/ai/metrics/quality      // Quality scores
POST   /api/ai/metrics/feedback     // Submit feedback
```

---

## Integration Requirements

### 1. Vector Database Setup

**Option A: Pinecone (Recommended for Production)**

```bash
# Sign up: https://www.pinecone.io/
# Create index:
# - Name: kushim-compliance
# - Dimension: 1536 (text-embedding-3-small)
# - Metric: cosine
# - Environment: us-west1-gcp

# Environment variables
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=kushim-compliance
```

**Option B: ChromaDB (Development)**

```bash
# Run ChromaDB in Docker
docker run -d \
  -p 8000:8000 \
  -v chroma-data:/chroma/chroma \
  --name chroma \
  chromadb/chroma:latest

# Environment variables
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

### 2. OpenAI API Setup

```bash
# Sign up: https://platform.openai.com/
# Create API key
# Set up billing

# Environment variables
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG_ID=org-...

# Optional: Set up usage limits
# - Daily budget: $50
# - Monthly budget: $1000
# - Alert threshold: 80%
```

### 3. LangSmith (LLMOps - Optional)

```bash
# Sign up: https://smith.langchain.com/
# Create project: kushim-ai

# Environment variables
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=kushim-ai
```

### 4. Helicone (OpenAI Monitoring - Optional)

```bash
# Sign up: https://www.helicone.ai/
# Create project

# Environment variables
HELICONE_API_KEY=...
OPENAI_BASE_URL=https://oai.hconeai.com/v1
```

### 5. Additional Services

**Anthropic Claude (Fallback LLM):**
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**Cohere (Alternative Embeddings):**
```bash
COHERE_API_KEY=...
```

---

## Cost Estimation

### OpenAI Pricing (as of Feb 2026)

| Model | Input Cost | Output Cost | Use Case |
|-------|-----------|-------------|----------|
| GPT-4 Turbo | $10/1M tokens | $30/1M tokens | Policy drafting, copilot |
| GPT-3.5 Turbo | $0.50/1M tokens | $1.50/1M tokens | Simple tasks, fallback |
| text-embedding-3-small | $0.02/1M tokens | - | Evidence embeddings |
| text-embedding-3-large | $0.13/1M tokens | - | High-accuracy embeddings |

### Monthly Cost Projections

**Assumptions:**
- 100 customers
- Each customer:
  - 1000 evidence items/month
  - 50 policy drafts/month
  - 500 copilot queries/month
  - 100 AI suggestions/month

**Evidence Mapping:**
```
Evidence: 100 customers × 1000 items × 500 tokens = 50M tokens
Embedding cost: 50M × $0.02/1M = $1.00
LLM validation: 50M × $10/1M = $500
Total: ~$500/month
```

**Policy Drafting:**
```
Policies: 100 customers × 50 drafts × 2000 tokens = 10M tokens
Input cost: 10M × $10/1M = $100
Output cost: 10M × $30/1M = $300
Total: ~$400/month
```

**Compliance Copilot:**
```
Queries: 100 customers × 500 queries × 1500 tokens = 75M tokens
Input cost: 75M × $10/1M = $750
Output cost: 75M × $30/1M = $2,250
Total: ~$3,000/month
```

**AI Suggestions:**
```
Suggestions: 100 customers × 100 suggestions × 1000 tokens = 10M tokens
Input cost: 10M × $10/1M = $100
Output cost: 10M × $30/1M = $300
Total: ~$400/month
```

**Total Monthly Cost:**
```
Evidence Mapping:     $500
Policy Drafting:      $400
Compliance Copilot:   $3,000
AI Suggestions:       $400
Buffer (20%):         $860
────────────────────────
TOTAL:                ~$5,160/month (~$62K/year)
```

**Per-Customer Cost:** $51.60/month  
**Revenue Target:** $200-500/customer/month (to maintain 80% margin)

### Cost Optimization Strategies

1. **Use GPT-3.5 Turbo for Simple Tasks**
   - Evidence mapping validation
   - Simple copilot queries
   - Savings: ~60% on those operations

2. **Implement Aggressive Caching**
   - Cache common copilot answers (30-day TTL)
   - Cache policy templates
   - Savings: ~30% on copilot costs

3. **Batch Processing**
   - Batch evidence embeddings
   - Batch AI suggestions generation
   - Savings: ~20% on API overhead

4. **User Tier Limits**
   - Free tier: 10 copilot queries/month
   - Pro tier: 100 queries/month
   - Enterprise: Unlimited
   - Savings: Controlled growth

5. **Prompt Optimization**
   - Reduce prompt token count by 30%
   - Use function calling instead of verbose prompts
   - Savings: ~30% on input costs

**Optimized Monthly Cost:** ~$2,500-3,000 (50% reduction)

---

## Development Roadmap

### Week 5: Evidence Mapping AI

**Days 1-2: Setup**
- [ ] Install AI dependencies (OpenAI, LangChain)
- [ ] Set up vector database (ChromaDB for dev)
- [ ] Create database migrations
- [ ] Configure environment variables

**Days 3-5: Evidence Embedding**
- [ ] Implement embedding generation service
- [ ] Create vector storage service
- [ ] Build batch embedding processor
- [ ] Test with sample evidence data

**Days 6-7: Evidence Mapping**
- [ ] Implement semantic search
- [ ] Build LLM validation logic
- [ ] Create mapping API endpoints
- [ ] Write unit tests

### Week 6: Policy Drafting AI

**Days 1-2: Policy Templates**
- [ ] Design policy template schema
- [ ] Create base policy templates (10+ types)
- [ ] Implement template service
- [ ] Build template API

**Days 3-5: Policy Generation**
- [ ] Implement policy drafting service
- [ ] Build section generation logic
- [ ] Create policy assembly engine
- [ ] Test with sample policies

**Days 6-7: Policy Management**
- [ ] Implement version control
- [ ] Create diff/comparison logic
- [ ] Build policy approval workflow
- [ ] Write unit tests

### Week 7: Compliance Copilot

**Days 1-2: RAG Infrastructure**
- [ ] Design RAG pipeline
- [ ] Implement context retrieval
- [ ] Build document chunking logic
- [ ] Test semantic search accuracy

**Days 3-5: Conversation Engine**
- [ ] Implement conversation service
- [ ] Build message history management
- [ ] Create chat API endpoints
- [ ] Test multi-turn conversations

**Days 6-7: Frontend Integration**
- [ ] Build chat UI component
- [ ] Implement streaming responses
- [ ] Add source citation display
- [ ] Test end-to-end flow

### Week 8: Testing & Optimization

**Days 1-3: Testing**
- [ ] Write comprehensive unit tests (>70% coverage)
- [ ] Create integration tests for AI flows
- [ ] Test accuracy on sample data
- [ ] Collect human feedback

**Days 4-5: Optimization**
- [ ] Optimize prompt templates
- [ ] Implement response caching
- [ ] Add cost tracking
- [ ] Tune model parameters

**Days 6-7: Documentation & Polish**
- [ ] Write AI feature documentation
- [ ] Create user guides
- [ ] Polish UI/UX
- [ ] Prepare for demo

---

## Testing Strategy

### 1. Unit Tests

**Evidence Mapping:**
```typescript
describe('EvidenceMappingService', () => {
  it('should generate embeddings for evidence', async () => {
    const evidence = createMockEvidence();
    const embedding = await service.generateEmbedding(evidence);
    expect(embedding.values).toHaveLength(1536);
  });

  it('should map evidence to relevant controls', async () => {
    const result = await service.mapEvidence(evidenceId);
    expect(result.mappings).toHaveLength(5);
    expect(result.mappings[0].confidence).toBeGreaterThan(0.7);
  });
});
```

**Policy Drafting:**
```typescript
describe('PolicyDraftingService', () => {
  it('should draft policy from template', async () => {
    const policy = await service.draftPolicy(input);
    expect(policy.content).toContain('Access Control Policy');
    expect(policy.status).toBe('draft');
  });

  it('should include company context in policy', async () => {
    const policy = await service.draftPolicy(input);
    expect(policy.content).toContain(company.name);
  });
});
```

### 2. Integration Tests

**Copilot Flow:**
```typescript
describe('Copilot E2E', () => {
  it('should answer compliance questions', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/ai/copilot/chat')
      .send({
        conversationId,
        message: 'What is our current compliance score?',
      })
      .expect(200);

    expect(response.body.answer).toBeDefined();
    expect(response.body.sources).toHaveLength(3);
  });
});
```

### 3. Quality Evaluation

**Human Eval Dataset:**
```typescript
// test/ai/evaluation/evidence-mapping.eval.ts
export const evidenceMappingEvalSet = [
  {
    evidence: { content: 'AWS CloudTrail enabled...' },
    expectedControls: ['CC6.2', 'CC7.2'],
    minConfidence: 0.85,
  },
  // ... 100+ examples
];

// Run evaluation
const results = await evaluateEvidenceMapping(evidenceMappingEvalSet);
expect(results.accuracy).toBeGreaterThan(0.90);
```

### 4. Cost Monitoring Tests

```typescript
describe('AI Cost Tracking', () => {
  it('should track token usage per request', async () => {
    await service.draftPolicy(input);
    const usage = await getUsageMetrics(customerId);
    expect(usage.tokens).toBeGreaterThan(0);
    expect(usage.cost).toBeLessThan(0.10); // <$0.10 per request
  });
});
```

---

## Risk Mitigation

### 1. Cost Overruns

**Risk:** AI costs exceed budget  
**Likelihood:** Medium  
**Impact:** High  

**Mitigation:**
- Set strict rate limits per customer tier
- Implement cost alerts (>$100/day)
- Cache aggressively (30-day TTL)
- Use GPT-3.5 for simple tasks
- Monitor cost per request (<$0.10 target)

### 2. Poor AI Quality

**Risk:** AI-generated content is inaccurate  
**Likelihood:** Medium  
**Impact:** Critical  

**Mitigation:**
- Require human review for policies (mandatory approval)
- Show confidence scores on all AI outputs
- Provide source attribution (cite evidence)
- Implement feedback loops (thumbs up/down)
- Maintain fallback to manual processes

### 3. Slow Response Times

**Risk:** AI requests take >5s  
**Likelihood:** Medium  
**Impact:** Medium  

**Mitigation:**
- Implement streaming responses (show progress)
- Use async processing for batch operations
- Cache frequent queries
- Optimize prompt token count
- Use faster models for simple tasks (GPT-3.5)

### 4. API Rate Limits

**Risk:** OpenAI rate limits block production traffic  
**Likelihood:** Low  
**Impact:** High  

**Mitigation:**
- Request increased rate limits from OpenAI
- Implement exponential backoff retry
- Queue requests during high traffic
- Use multiple API keys for load balancing
- Implement Claude fallback

### 5. Data Privacy

**Risk:** Sensitive data sent to OpenAI  
**Likelihood:** Medium  
**Impact:** Critical  

**Mitigation:**
- Redact PII before sending to LLM
- Use OpenAI's zero-retention policy
- Document data processing in privacy policy
- Implement data residency controls
- Offer self-hosted option (Phase 3)

---

## Success Criteria

Phase 2 is successful if:

✅ **Evidence Mapping Accuracy:** >90% (validated by humans)  
✅ **Policy Draft Quality:** >85% usable without edits  
✅ **Copilot Answer Accuracy:** >95% correct  
✅ **Response Time:** <3s (p95) for all AI operations  
✅ **Cost per Request:** <$0.10  
✅ **Test Coverage:** >70% for all AI modules  
✅ **User Satisfaction:** >4.5/5 stars  

---

## Next Steps

1. **Approve Phase 2 scope and budget** ($62K/year AI costs)
2. **Set up OpenAI account** and request rate limit increases
3. **Create AI feature branch** (`feature/phase-2-ai`)
4. **Begin Week 5 development** (Evidence Mapping AI)
5. **Schedule weekly AI demos** (show progress to stakeholders)

**Ready to build?** Let's make compliance intelligent! 🚀

---

**Previous Document:** See `PHASE_1_SUMMARY.md` for what was built in Phase 1.  
**Related Document:** See `LOAD_TESTING.md` for performance testing the AI features.

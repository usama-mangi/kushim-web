# Phase 2: AI Automation (Months 4-6)

**Goal:** Deliver on "true automation" promise that competitors failed on

**Success Metrics:**

- 15 paying customers = $525K ARR
- 90% evidence auto-mapped by AI
- 70% policy drafts accepted without edits
- <5% churn rate
- 3+ customer case studies

---

## AI Architecture Overview

### Tech Stack Additions

**AI/LLM:**

- LLMs: OpenAI GPT-4 Turbo, Anthropic Claude 3.5 Sonnet
- Orchestration: LangChain / LangGraph for agent workflows
- Vector DB: Pinecone for policy/control embeddings
- Embeddings: OpenAI text-embedding-3-large

**Apply llm-app-patterns skill:**

- RAG pipeline for policy knowledge
- Function calling agents for evidence mapping
- Prompt versioning and A/B testing
- LLMOps monitoring and evaluation

---

## Week 1-2: Evidence Mapping Agent

### 1. RAG Pipeline Setup

**Vector Database Configuration:**

```typescript
// src/modules/ai/vector-store.service.ts
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";

export class VectorStoreService {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    this.embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-large",
      dimensions: 3072,
    });
  }

  async indexControl(control: any): Promise<void> {
    const index = this.pinecone.index("compliance-controls");

    // Create embedding for control
    const embedding = await this.embeddings.embedQuery(
      `${control.title} ${control.description} ${control.testProcedure}`,
    );

    await index.upsert([
      {
        id: control.id,
        values: embedding,
        metadata: {
          framework: control.framework,
          controlId: control.controlId,
          title: control.title,
          category: control.category,
        },
      },
    ]);
  }

  async findRelevantControls(evidenceDescription: string, topK: number = 5) {
    const index = this.pinecone.index("compliance-controls");

    const queryEmbedding =
      await this.embeddings.embedQuery(evidenceDescription);

    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    return results.matches;
  }
}
```

### 2. Evidence Mapping Agent

**Apply llm-app-patterns - Function Calling Pattern:**

```typescript
// src/modules/ai/evidence-mapping.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { VectorStoreService } from "./vector-store.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class EvidenceMappingService {
  private readonly logger = new Logger(EvidenceMappingService.name);
  private readonly llm: ChatOpenAI;

  constructor(
    private readonly vectorStore: VectorStoreService,
    private readonly prisma: PrismaService,
  ) {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4-turbo",
      temperature: 0, // Deterministic for consistency
    });
  }

  async mapEvidenceToControls(evidenceId: string): Promise<string[]> {
    // Fetch evidence
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
      include: { control: true },
    });

    // Find potentially relevant controls using vector search
    const candidateControls = await this.vectorStore.findRelevantControls(
      JSON.stringify(evidence.data),
      10,
    );

    // Use LLM to determine which controls this evidence satisfies
    const prompt = `You are a SOC 2 compliance expert. Analyze this evidence and determine which controls it satisfies.

Evidence Type: ${evidence.control.title}
Evidence Data:
${JSON.stringify(evidence.data, null, 2)}

Candidate Controls:
${candidateControls.map((c, i) => `${i + 1}. ${c.metadata.controlId}: ${c.metadata.title}`).join("\n")}

For each control, determine if this evidence satisfies it. Return a JSON array of control IDs that are satisfied.

Example response: ["CC6.1", "CC6.6", "CC7.2"]

Response:`;

    const response = await this.llm.invoke(prompt);
    const mappedControls = JSON.parse(response.content as string);

    // Store mappings
    for (const controlId of mappedControls) {
      const control = await this.prisma.control.findFirst({
        where: { controlId },
      });

      if (control) {
        await this.prisma.complianceCheck.create({
          data: {
            customerId: evidence.customerId,
            controlId: control.id,
            evidenceId: evidence.id,
            status: "PASS",
            checkedAt: new Date(),
          },
        });
      }
    }

    this.logger.log(
      `Mapped evidence ${evidenceId} to ${mappedControls.length} controls`,
    );
    return mappedControls;
  }

  async suggestAdditionalEvidence(controlId: string): Promise<string[]> {
    const control = await this.prisma.control.findUnique({
      where: { id: controlId },
    });

    const prompt = `You are a SOC 2 compliance expert. For the following control, suggest what additional evidence would be needed.

Control: ${control.controlId} - ${control.title}
Description: ${control.description}
Test Procedure: ${control.testProcedure}

List 3-5 specific types of evidence that would satisfy this control.

Response format:
1. [Evidence type]
2. [Evidence type]
...`;

    const response = await this.llm.invoke(prompt);
    const suggestions = (response.content as string)
      .split("\n")
      .filter((line) => line.match(/^\d+\./))
      .map((line) => line.replace(/^\d+\.\s*/, ""));

    return suggestions;
  }
}
```

### 3. Learning from Auditor Feedback

```typescript
// src/modules/ai/feedback-learning.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class FeedbackLearningService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAuditorFeedback(
    evidenceId: string,
    controlId: string,
    accepted: boolean,
    feedback?: string,
  ): Promise<void> {
    // Store feedback for fine-tuning
    await this.prisma.$executeRaw`
      INSERT INTO evidence_feedback (evidence_id, control_id, accepted, feedback, created_at)
      VALUES (${evidenceId}, ${controlId}, ${accepted}, ${feedback}, NOW())
    `;

    // If rejected, trigger re-mapping
    if (!accepted) {
      // Queue for manual review or alternative evidence collection
    }
  }

  async getAccuracyMetrics(): Promise<any> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN accepted THEN 1 ELSE 0 END) as accepted,
        ROUND(100.0 * SUM(CASE WHEN accepted THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
      FROM evidence_feedback
      WHERE created_at > NOW() - INTERVAL '30 days'
    `;

    return result[0];
  }
}
```

---

## Week 3-4: Policy Drafting Assistant

### 1. Policy Template System

```typescript
// src/modules/ai/policy-drafting.service.ts
import { Injectable } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

@Injectable()
export class PolicyDraftingService {
  private readonly llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4-turbo",
      temperature: 0.3, // Slightly creative but consistent
    });
  }

  async generatePolicy(params: {
    controlId: string;
    companyName: string;
    industry: string;
    companySize: string;
    techStack: string[];
  }): Promise<string> {
    const template = new PromptTemplate({
      template: `You are a compliance policy expert. Draft a comprehensive policy document for the following:

Control: {controlId}
Company: {companyName}
Industry: {industry}
Company Size: {companySize}
Tech Stack: {techStack}

The policy should:
1. Be specific to this company's context
2. Include clear procedures and responsibilities
3. Reference relevant frameworks (SOC 2, ISO 27001)
4. Be actionable and implementable
5. Use professional, clear language

Policy Document:`,
      inputVariables: [
        "controlId",
        "companyName",
        "industry",
        "companySize",
        "techStack",
      ],
    });

    const prompt = await template.format({
      controlId: params.controlId,
      companyName: params.companyName,
      industry: params.industry,
      companySize: params.companySize,
      techStack: params.techStack.join(", "),
    });

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }

  async customizePolicy(
    basePolicy: string,
    customizations: string[],
  ): Promise<string> {
    const prompt = `Modify the following policy based on these customization requests:

Base Policy:
${basePolicy}

Customization Requests:
${customizations.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Return the updated policy:`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }

  async generateMultiFrameworkPolicy(
    frameworks: string[],
    controlMappings: any,
  ): Promise<string> {
    const prompt = `Create a unified policy that satisfies requirements across multiple compliance frameworks:

Frameworks: ${frameworks.join(", ")}

Control Mappings:
${JSON.stringify(controlMappings, null, 2)}

Generate a comprehensive policy that addresses all framework requirements while avoiding redundancy:`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }
}
```

### 2. Policy Version Control

```typescript
// src/modules/policies/policy-version.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class PolicyVersionService {
  constructor(private readonly prisma: PrismaService) {}

  async createPolicyVersion(
    customerId: string,
    policyType: string,
    content: string,
    author: string,
  ): Promise<any> {
    return this.prisma.policyVersion.create({
      data: {
        customerId,
        policyType,
        content,
        version: await this.getNextVersion(customerId, policyType),
        author,
        status: "DRAFT",
      },
    });
  }

  async compareVersions(versionId1: string, versionId2: string): Promise<any> {
    const [v1, v2] = await Promise.all([
      this.prisma.policyVersion.findUnique({ where: { id: versionId1 } }),
      this.prisma.policyVersion.findUnique({ where: { id: versionId2 } }),
    ]);

    // Use diff library to show changes
    return {
      version1: v1.version,
      version2: v2.version,
      changes: this.calculateDiff(v1.content, v2.content),
    };
  }

  private async getNextVersion(
    customerId: string,
    policyType: string,
  ): Promise<string> {
    const latest = await this.prisma.policyVersion.findFirst({
      where: { customerId, policyType },
      orderBy: { createdAt: "desc" },
    });

    if (!latest) return "1.0.0";

    const [major, minor, patch] = latest.version.split(".").map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  private calculateDiff(content1: string, content2: string): any {
    // Implement diff logic
    return { added: [], removed: [], modified: [] };
  }
}
```

---

## Week 5-6: Natural Language Query Interface

### 1. Compliance Copilot

**Apply llm-app-patterns - ReAct Agent Pattern:**

```typescript
// src/modules/ai/compliance-copilot.service.ts
import { Injectable } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { PrismaService } from "../../shared/prisma/prisma.service";

interface Tool {
  name: string;
  description: string;
  execute: (args: any) => Promise<any>;
}

@Injectable()
export class ComplianceCopilotService {
  private readonly llm: ChatOpenAI;
  private readonly tools: Tool[];

  constructor(private readonly prisma: PrismaService) {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4-turbo",
      temperature: 0,
    });

    this.tools = this.initializeTools();
  }

  private initializeTools(): Tool[] {
    return [
      {
        name: "get_failing_controls",
        description: "Get all controls that are currently failing",
        execute: async (args: { framework?: string }) => {
          return this.prisma.complianceCheck.findMany({
            where: {
              status: "FAIL",
              control: args.framework
                ? { framework: args.framework }
                : undefined,
            },
            include: { control: true },
          });
        },
      },
      {
        name: "get_missing_evidence",
        description: "Get controls that are missing evidence",
        execute: async (args: { controlId: string }) => {
          return this.prisma.control.findUnique({
            where: { id: args.controlId },
            include: { evidence: true },
          });
        },
      },
      {
        name: "generate_compliance_report",
        description: "Generate a compliance report for a specific timeframe",
        execute: async (args: { startDate: Date; endDate: Date }) => {
          const checks = await this.prisma.complianceCheck.findMany({
            where: {
              checkedAt: {
                gte: args.startDate,
                lte: args.endDate,
              },
            },
            include: { control: true },
          });

          const passing = checks.filter((c) => c.status === "PASS").length;
          const total = checks.length;

          return {
            period: `${args.startDate} to ${args.endDate}`,
            totalChecks: total,
            passingChecks: passing,
            complianceRate: ((passing / total) * 100).toFixed(2),
            failingControls: checks.filter((c) => c.status === "FAIL"),
          };
        },
      },
      {
        name: "get_audit_readiness",
        description: "Check if the organization is ready for audit",
        execute: async () => {
          const allControls = await this.prisma.control.count({
            where: { framework: "SOC2" },
          });

          const passingControls = await this.prisma.complianceCheck.count({
            where: {
              status: "PASS",
              control: { framework: "SOC2" },
            },
          });

          const readiness = (passingControls / allControls) * 100;

          return {
            totalControls: allControls,
            passingControls,
            readinessPercentage: readiness.toFixed(2),
            auditReady: readiness >= 95,
          };
        },
      },
    ];
  }

  async query(userQuery: string): Promise<string> {
    const toolDescriptions = this.tools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join("\n");

    const prompt = `You are a compliance assistant. Answer the user's question using the available tools.

Available tools:
${toolDescriptions}

User question: ${userQuery}

Think step by step:
1. Determine which tool(s) to use
2. Execute the tool(s)
3. Synthesize the results into a clear answer

Response:`;

    const response = await this.llm.invoke(prompt);

    // Parse tool calls from response
    const toolCalls = this.parseToolCalls(response.content as string);

    // Execute tools
    const results = await Promise.all(
      toolCalls.map(async (call) => {
        const tool = this.tools.find((t) => t.name === call.name);
        if (tool) {
          return tool.execute(call.args);
        }
        return null;
      }),
    );

    // Generate final answer
    const finalPrompt = `Based on these tool results, answer the user's question:

Question: ${userQuery}

Tool Results:
${JSON.stringify(results, null, 2)}

Answer:`;

    const finalResponse = await this.llm.invoke(finalPrompt);
    return finalResponse.content as string;
  }

  private parseToolCalls(response: string): Array<{ name: string; args: any }> {
    // Parse tool calls from LLM response
    // This is simplified - in production, use function calling API
    return [];
  }
}
```

### 2. Natural Language API

```typescript
// src/modules/api/nl-query.controller.ts
import { Controller, Post, Body } from "@nestjs/common";
import { ComplianceCopilotService } from "../ai/compliance-copilot.service";

@Controller("api/nl-query")
export class NLQueryController {
  constructor(private readonly copilot: ComplianceCopilotService) {}

  @Post()
  async query(@Body() body: { query: string }) {
    const answer = await this.copilot.query(body.query);
    return { answer };
  }
}
```

**Frontend Component:**

```typescript
// app/components/compliance-copilot.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ComplianceCopilot() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch('/api/nl-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Compliance Copilot</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Ask anything about your compliance status..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </Button>
      </form>

      {answer && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{answer}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p className="font-medium mb-2">Example queries:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Show me all failing MFA controls</li>
          <li>What evidence is missing for SOC 2 CC6.1?</li>
          <li>Generate compliance report for Q4 board meeting</li>
          <li>Which controls are at risk for next audit?</li>
        </ul>
      </div>
    </Card>
  );
}
```

---

## Week 7-8: Automated Control Testing

### 1. Predictive Risk Scoring

```typescript
// src/modules/ai/risk-scoring.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class RiskScoringService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateRiskScore(controlId: string): Promise<number> {
    // Get historical compliance check data
    const checks = await this.prisma.complianceCheck.findMany({
      where: { controlId },
      orderBy: { checkedAt: "desc" },
      take: 30,
    });

    const failureRate =
      checks.filter((c) => c.status === "FAIL").length / checks.length;
    const recentFailures = checks
      .slice(0, 5)
      .filter((c) => c.status === "FAIL").length;

    // Calculate risk score (0-100)
    const riskScore = (failureRate * 70 + recentFailures * 6) * 100;

    return Math.min(100, Math.round(riskScore));
  }

  async identifyAtRiskControls(threshold: number = 50): Promise<any[]> {
    const controls = await this.prisma.control.findMany();

    const riskyControls = await Promise.all(
      controls.map(async (control) => {
        const risk = await this.calculateRiskScore(control.id);
        return { control, risk };
      }),
    );

    return riskyControls
      .filter((rc) => rc.risk >= threshold)
      .sort((a, b) => b.risk - a.risk);
  }
}
```

---

## Week 9-10: Additional Integrations

### New Integrations to Add:

1. **Google Workspace**
2. **Microsoft 365**
3. **Datadog/New Relic**
4. **PagerDuty**
5. **1Password/LastPass**

**Example: Google Workspace Integration:**

```typescript
// src/modules/integrations/google-workspace/google-workspace.service.ts
import { Injectable } from "@nestjs/common";
import { google } from "googleapis";

@Injectable()
export class GoogleWorkspaceService {
  async checkDriveSharing(credentials: any): Promise<any> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials(credentials);

    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.list({
      q: "visibility='anyoneWithLink' or visibility='anyoneCanFind'",
      fields: "files(id, name, permissions)",
    });

    return {
      publiclySharedFiles: response.data.files?.length || 0,
      files: response.data.files,
      collectedAt: new Date(),
    };
  }

  async check2FAEnforcement(credentials: any): Promise<any> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials(credentials);

    const admin = google.admin({ version: "directory_v1", auth });

    const users = await admin.users.list({
      customer: "my_customer",
      maxResults: 500,
    });

    const users2FA =
      users.data.users?.filter((u) => u.isEnrolledIn2Sv).length || 0;

    return {
      totalUsers: users.data.users?.length || 0,
      users2FAEnabled: users2FA,
      enforcement2FA: (users2FA / (users.data.users?.length || 1)) * 100,
      collectedAt: new Date(),
    };
  }
}
```

---

## Week 11-12: LLMOps & Monitoring

### 1. Prompt Versioning

```typescript
// src/modules/ai/prompt-registry.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class PromptRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  async registerPrompt(
    name: string,
    template: string,
    version: string,
  ): Promise<void> {
    await this.prisma.promptVersion.create({
      data: {
        name,
        template,
        version,
        metrics: {},
      },
    });
  }

  async getPrompt(name: string, version: string = "latest"): Promise<string> {
    const prompt = await this.prisma.promptVersion.findFirst({
      where: { name, version },
      orderBy: { createdAt: "desc" },
    });

    return prompt?.template || "";
  }

  async recordOutcome(promptId: string, outcome: any): Promise<void> {
    // Track prompt performance for A/B testing
    await this.prisma.promptMetric.create({
      data: {
        promptId,
        accepted: outcome.accepted,
        latency: outcome.latency,
        tokenCount: outcome.tokenCount,
      },
    });
  }
}
```

### 2. AI Metrics Dashboard

```typescript
// app/dashboard/ai-metrics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function AIMetricsPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetch('/api/ai/metrics').then(r => r.json()).then(setMetrics);
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Performance Metrics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Evidence Mapping Accuracy</h3>
          <p className="text-3xl font-bold text-green-600">{metrics.mappingAccuracy}%</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Policy Acceptance Rate</h3>
          <p className="text-3xl font-bold text-blue-600">{metrics.policyAcceptance}%</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg Response Time</h3>
          <p className="text-3xl font-bold">{metrics.avgLatency}ms</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Token Usage Over Time</h3>
        <LineChart width={800} height={300} data={metrics.tokenUsage}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="tokens" stroke="#0ea5e9" />
        </LineChart>
      </Card>
    </div>
  );
}
```

---

## Success Criteria Checklist

- [ ] 90% evidence auto-mapped by AI
- [ ] Policy drafting assistant generating acceptable policies
- [ ] Natural language query interface working
- [ ] Automated control testing with risk scoring
- [ ] 10+ additional integrations implemented
- [ ] LLMOps monitoring dashboard live
- [ ] Prompt versioning and A/B testing in place
- [ ] 15 paying customers acquired
- [ ] 3+ customer case studies published
- [ ] <5% churn rate maintained

---

## Cost Management

**AI Cost Optimization:**

- Cache deterministic responses (temperature=0)
- Use smaller models for simple tasks
- Batch API calls where possible
- Monitor token usage per customer
- Set spending limits and alerts

**Estimated Monthly AI Costs:**

- Evidence mapping: ~$500/month (15 customers)
- Policy drafting: ~$200/month
- Natural language queries: ~$300/month
- **Total: ~$1,000/month** (scales with customers)

---

## Next Steps to Phase 3

Once Phase 2 is complete with 15 customers and $525K ARR:

- Add ISO 27001, HIPAA, GDPR frameworks
- Implement multi-tenant architecture
- Build custom control frameworks
- Add advanced RBAC
- Target 40 customers for $2M ARR

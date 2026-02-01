# Phase 1: MVP - Core Differentiators (Months 1-3)

**Goal:** Prove integration reliability + real-time monitoring

**Success Metrics:**

- 5 paying customers at $35K/year = $175K ARR
- 99.9% integration uptime
- 80% reduction in manual work
- NPS > 50
- <10% churn rate

---

## Architecture Overview

### Tech Stack

**Backend:**

- Runtime: Node.js 22+ with TypeScript 5+
- Framework: NestJS (modular, enterprise-ready, DI pattern)
- Database: PostgreSQL 16 with Prisma ORM
- Cache: Redis 7 (BullMQ for job queues)
- Queue: BullMQ for background evidence collection

**Frontend:**

- Framework: Next.js 14 (React 18, App Router)
- Styling: TailwindCSS 3 + shadcn/ui components
- State: Zustand (lightweight, no boilerplate)
- Charts: Recharts for compliance dashboards
- Forms: React Hook Form + Zod validation

**Infrastructure:**

- Cloud: AWS (ECS Fargate, RDS PostgreSQL, S3, CloudWatch)
- CDN: CloudFront
- Monitoring: Datadog (APM, logs, metrics)
- Error Tracking: Sentry
- CI/CD: GitHub Actions
- IaC: Terraform

---

## Week 1-2: Foundation & Infrastructure

### 1. Project Setup

**Backend Setup (NestJS):**

```bash
# Initialize NestJS monorepo
npx @nestjs/cli new kushim-backend
cd kushim-backend

# Install core dependencies
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @prisma/client prisma
npm install @nestjs/bull bullmq ioredis
npm install class-validator class-transformer
npm install zod

# Install AWS SDK v3
npm install @aws-sdk/client-s3 @aws-sdk/client-iam @aws-sdk/client-cloudtrail
npm install @aws-sdk/client-config-service

# Install integrations
npm install @octokit/rest @octokit/graphql
npm install @okta/okta-sdk-nodejs
npm install axios p-retry p-queue
```

**Frontend Setup (Next.js):**

```bash
# Initialize Next.js with TypeScript
npx create-next-app@latest kushim-web --typescript --tailwind --app --use-npm

cd kushim-web

# Install UI dependencies
npm install zustand
npm install recharts
npm install react-hook-form @hookform/resolvers zod
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install lucide-react
npm install date-fns

# Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog dropdown-menu input label select table toast
```

**Database Setup:**

```bash
# Initialize Prisma
npx prisma init

# Create schema (see Database Schema section below)
# Run migration
npx prisma migrate dev --name init
npx prisma generate
```

### 2. Database Schema Design

**Apply postgres-best-practices:**

- Use UUIDs for primary keys (better for distributed systems)
- Add indexes on foreign keys and frequently queried columns
- Use JSONB for flexible metadata storage
- Implement proper constraints and cascading deletes
- Add created_at/updated_at timestamps to all tables

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Customer {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  plan      Plan     @default(STARTER)
  status    CustomerStatus @default(ACTIVE)
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  integrations      Integration[]
  complianceChecks  ComplianceCheck[]
  evidence          Evidence[]
  jiraTasks         JiraTask[]

  @@map("customers")
  @@index([email])
  @@index([status])
}

enum Plan {
  STARTER
  GROWTH
  ENTERPRISE
}

enum CustomerStatus {
  ACTIVE
  SUSPENDED
  CANCELED
}

model Integration {
  id           String            @id @default(uuid())
  customerId   String            @map("customer_id")
  type         IntegrationType
  status       IntegrationStatus @default(DISCONNECTED)
  config       Json              // Encrypted credentials
  lastSyncAt   DateTime?         @map("last_sync_at")
  healthScore  Decimal?          @db.Decimal(3, 2) @map("health_score")
  errorCount   Int               @default(0) @map("error_count")
  lastError    String?           @map("last_error")
  createdAt    DateTime          @default(now()) @map("created_at")
  updatedAt    DateTime          @updatedAt @map("updated_at")

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  evidence Evidence[]

  @@map("integrations")
  @@index([customerId])
  @@index([type])
  @@index([status])
}

enum IntegrationType {
  AWS
  GITHUB
  OKTA
  JIRA
  SLACK
}

enum IntegrationStatus {
  ACTIVE
  FAILED
  DISCONNECTED
  SYNCING
}

model Control {
  id             String   @id @default(uuid())
  framework      Framework
  controlId      String   @map("control_id") // e.g., CC6.1, A1.2
  title          String
  description    String   @db.Text
  testProcedure  String   @db.Text @map("test_procedure")
  frequency      Frequency
  category       String?
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  complianceChecks ComplianceCheck[]
  evidence         Evidence[]

  @@map("controls")
  @@unique([framework, controlId])
  @@index([framework])
}

enum Framework {
  SOC2
  ISO27001
  HIPAA
  GDPR
  PCI_DSS
}

enum Frequency {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  ANNUAL
}

model Evidence {
  id             String   @id @default(uuid())
  customerId     String   @map("customer_id")
  controlId      String   @map("control_id")
  integrationId  String   @map("integration_id")
  data           Json
  hash           String   // SHA-256 hash for immutability
  previousHash   String?  @map("previous_hash")
  s3Key          String?  @map("s3_key") // For large files
  collectedAt    DateTime @map("collected_at")
  createdAt      DateTime @default(now()) @map("created_at")

  customer    Customer    @relation(fields: [customerId], references: [id], onDelete: Cascade)
  control     Control     @relation(fields: [controlId], references: [id])
  integration Integration @relation(fields: [integrationId], references: [id])
  complianceChecks ComplianceCheck[]

  @@map("evidence")
  @@index([customerId])
  @@index([controlId])
  @@index([collectedAt])
  @@index([hash])
}

model ComplianceCheck {
  id          String      @id @default(uuid())
  customerId  String      @map("customer_id")
  controlId   String      @map("control_id")
  status      CheckStatus
  evidenceId  String?     @map("evidence_id")
  errorMessage String?    @db.Text @map("error_message")
  checkedAt   DateTime    @map("checked_at")
  nextCheckAt DateTime?   @map("next_check_at")
  createdAt   DateTime    @default(now()) @map("created_at")

  customer Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  control  Control   @relation(fields: [controlId], references: [id])
  evidence Evidence? @relation(fields: [evidenceId], references: [id])
  jiraTasks JiraTask[]

  @@map("compliance_checks")
  @@index([customerId])
  @@index([controlId])
  @@index([status])
  @@index([checkedAt])
}

enum CheckStatus {
  PASS
  FAIL
  WARNING
  PENDING
}

model JiraTask {
  id                 String   @id @default(uuid())
  customerId         String   @map("customer_id")
  complianceCheckId  String   @map("compliance_check_id")
  jiraIssueKey       String   @map("jira_issue_key")
  jiraIssueId        String   @map("jira_issue_id")
  status             String
  syncedAt           DateTime? @map("synced_at")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  customer        Customer        @relation(fields: [customerId], references: [id], onDelete: Cascade)
  complianceCheck ComplianceCheck @relation(fields: [complianceCheckId], references: [id])

  @@map("jira_tasks")
  @@unique([jiraIssueKey])
  @@index([customerId])
  @@index([complianceCheckId])
}
```

### 3. Backend Architecture (NestJS)

**Apply senior-architect and nodejs-best-practices:**

**Project Structure:**

```
kushim-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── aws.config.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── modules/
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── integrations/
│   │   │   ├── aws/
│   │   │   ├── github/
│   │   │   ├── okta/
│   │   │   ├── jira/
│   │   │   └── integration.service.ts
│   │   ├── evidence/
│   │   ├── compliance/
│   │   └── webhooks/
│   └── shared/
│       ├── prisma/
│       └── types/
├── prisma/
│   └── schema.prisma
└── package.json
```

**Core Services Implementation:**

**1. Integration Reliability Pattern (Circuit Breaker + Retry):**

```typescript
// src/common/utils/retry.util.ts
import { sleep } from "./sleep.util";

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        // Log to monitoring system
        console.error(`Failed after ${maxRetries} attempts:`, error);
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error("Unreachable");
}

// Circuit Breaker Implementation
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    const timeSinceFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceFailure >= this.resetTimeout;
  }
}
```

**2. AWS Integration Service:**

```typescript
// src/modules/integrations/aws/aws-integration.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { IAMClient, ListUsersCommand } from "@aws-sdk/client-iam";
import { S3Client, GetBucketEncryptionCommand } from "@aws-sdk/client-s3";
import {
  CloudTrailClient,
  LookupEventsCommand,
} from "@aws-sdk/client-cloudtrail";
import {
  retryWithBackoff,
  CircuitBreaker,
} from "../../../common/utils/retry.util";

@Injectable()
export class AwsIntegrationService {
  private readonly logger = new Logger(AwsIntegrationService.name);
  private readonly circuitBreaker = new CircuitBreaker();

  async collectIAMEvidence(credentials: any): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      return retryWithBackoff(async () => {
        const client = new IAMClient({
          region: "us-east-1",
          credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
          },
        });

        const command = new ListUsersCommand({});
        const response = await client.send(command);

        return {
          users: response.Users,
          mfaEnabled: response.Users?.filter((u) => u.PasswordLastUsed).length,
          collectedAt: new Date(),
        };
      });
    });
  }

  async checkS3Encryption(credentials: any, bucketName: string): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      return retryWithBackoff(async () => {
        const client = new S3Client({
          region: "us-east-1",
          credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
          },
        });

        const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const response = await client.send(command);

        return {
          encrypted: !!response.ServerSideEncryptionConfiguration,
          rules: response.ServerSideEncryptionConfiguration?.Rules,
          collectedAt: new Date(),
        };
      });
    });
  }

  async getHealthScore(customerId: string): Promise<number> {
    // Calculate health score based on recent success/failure rate
    // Return value between 0.00 and 1.00
    return 0.99;
  }
}
```

**3. Evidence Collection Queue:**

```typescript
// src/modules/evidence/evidence-collection.processor.ts
import { Processor, Process } from "@nestjs/bull";
import { Job } from "bull";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AwsIntegrationService } from "../integrations/aws/aws-integration.service";
import * as crypto from "crypto";

@Processor("evidence-collection")
export class EvidenceCollectionProcessor {
  private readonly logger = new Logger(EvidenceCollectionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AwsIntegrationService,
  ) {}

  @Process("collect-aws-evidence")
  async handleAwsEvidence(job: Job) {
    const { customerId, integrationId, controlId } = job.data;

    try {
      // Fetch integration credentials
      const integration = await this.prisma.integration.findUnique({
        where: { id: integrationId },
      });

      // Collect evidence
      const evidenceData = await this.awsService.collectIAMEvidence(
        integration.config,
      );

      // Create hash for immutability
      const hash = this.createHash(evidenceData);

      // Get previous hash for blockchain-style chain
      const previousEvidence = await this.prisma.evidence.findFirst({
        where: { customerId, controlId },
        orderBy: { collectedAt: "desc" },
      });

      // Store evidence
      await this.prisma.evidence.create({
        data: {
          customerId,
          controlId,
          integrationId,
          data: evidenceData,
          hash,
          previousHash: previousEvidence?.hash,
          collectedAt: new Date(),
        },
      });

      this.logger.log(`Evidence collected for control ${controlId}`);
    } catch (error) {
      this.logger.error(`Failed to collect evidence: ${error.message}`);
      throw error; // Will trigger retry
    }
  }

  private createHash(data: any): string {
    const content = JSON.stringify(data);
    return crypto.createHash("sha256").update(content).digest("hex");
  }
}
```

---

## Week 3-4: Core Integrations

### GitHub Integration

```typescript
// src/modules/integrations/github/github-integration.service.ts
import { Injectable } from "@nestjs/common";
import { Octokit } from "@octokit/rest";
import { retryWithBackoff } from "../../../common/utils/retry.util";

@Injectable()
export class GitHubIntegrationService {
  async checkBranchProtection(
    token: string,
    owner: string,
    repo: string,
  ): Promise<any> {
    return retryWithBackoff(async () => {
      const octokit = new Octokit({ auth: token });

      const { data } = await octokit.repos.getBranchProtection({
        owner,
        repo,
        branch: "main",
      });

      return {
        requiresReviews:
          data.required_pull_request_reviews?.required_approving_review_count >
          0,
        requiresSignedCommits: data.required_signatures?.enabled,
        dismissesStaleReviews:
          data.required_pull_request_reviews?.dismiss_stale_reviews,
        collectedAt: new Date(),
      };
    });
  }

  async checkCommitSigning(
    token: string,
    owner: string,
    repo: string,
  ): Promise<any> {
    return retryWithBackoff(async () => {
      const octokit = new Octokit({ auth: token });

      const { data } = await octokit.repos.get({
        owner,
        repo,
      });

      return {
        signingEnabled:
          data.security_and_analysis?.advanced_security?.status === "enabled",
        collectedAt: new Date(),
      };
    });
  }
}
```

### Okta Integration

```typescript
// src/modules/integrations/okta/okta-integration.service.ts
import { Injectable } from "@nestjs/common";
import * as okta from "@okta/okta-sdk-nodejs";
import { retryWithBackoff } from "../../../common/utils/retry.util";

@Injectable()
export class OktaIntegrationService {
  async checkMFAEnforcement(domain: string, apiToken: string): Promise<any> {
    return retryWithBackoff(async () => {
      const client = new okta.Client({
        orgUrl: `https://${domain}`,
        token: apiToken,
      });

      const policies = await client.listPolicies({ type: "MFA_ENROLL" });
      const users = await client.listUsers();

      let mfaEnabledCount = 0;
      for await (const user of users) {
        const factors = await user.listFactors();
        if (factors.length > 0) {
          mfaEnabledCount++;
        }
      }

      return {
        mfaEnforced: policies.length > 0,
        mfaEnabledUsers: mfaEnabledCount,
        totalUsers: (await client.listUsers()).length,
        collectedAt: new Date(),
      };
    });
  }
}
```

### Jira Integration (Secret Weapon)

```typescript
// src/modules/integrations/jira/jira-integration.service.ts
import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "../../../shared/prisma/prisma.service";

@Injectable()
export class JiraIntegrationService {
  private readonly logger = new Logger(JiraIntegrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createComplianceTicket(
    customerId: string,
    complianceCheckId: string,
    controlTitle: string,
    errorMessage: string,
  ): Promise<void> {
    const integration = await this.prisma.integration.findFirst({
      where: { customerId, type: "JIRA" },
    });

    if (!integration) {
      this.logger.warn(`No Jira integration for customer ${customerId}`);
      return;
    }

    const { domain, email, apiToken, projectKey } = integration.config as any;

    const issue = await axios.post(
      `https://${domain}/rest/api/3/issue`,
      {
        fields: {
          project: { key: projectKey },
          summary: `[Compliance] ${controlTitle} - Failed`,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: `Compliance check failed: ${errorMessage}`,
                  },
                ],
              },
            ],
          },
          issuetype: { name: "Task" },
          labels: ["compliance", "automated"],
        },
      },
      {
        auth: { username: email, password: apiToken },
        headers: { "Content-Type": "application/json" },
      },
    );

    // Store Jira task reference
    await this.prisma.jiraTask.create({
      data: {
        customerId,
        complianceCheckId,
        jiraIssueKey: issue.data.key,
        jiraIssueId: issue.data.id,
        status: "Open",
      },
    });

    this.logger.log(
      `Created Jira ticket ${issue.data.key} for compliance check`,
    );
  }

  async syncTicketStatus(jiraTaskId: string): Promise<void> {
    const jiraTask = await this.prisma.jiraTask.findUnique({
      where: { id: jiraTaskId },
      include: { customer: { include: { integrations: true } } },
    });

    const integration = jiraTask.customer.integrations.find(
      (i) => i.type === "JIRA",
    );
    const { domain, email, apiToken } = integration.config as any;

    const response = await axios.get(
      `https://${domain}/rest/api/3/issue/${jiraTask.jiraIssueKey}`,
      {
        auth: { username: email, password: apiToken },
      },
    );

    await this.prisma.jiraTask.update({
      where: { id: jiraTaskId },
      data: {
        status: response.data.fields.status.name,
        syncedAt: new Date(),
      },
    });
  }
}
```

---

## Week 5-6: Frontend Dashboard

### Apply ui-ux-designer and tailwind-design-system principles:

**Design System Setup:**

```typescript
// app/lib/design-tokens.ts
export const designTokens = {
  colors: {
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
    },
    success: {
      50: "#f0fdf4",
      500: "#22c55e",
      700: "#15803d",
    },
    warning: {
      50: "#fffbeb",
      500: "#f59e0b",
      700: "#b45309",
    },
    danger: {
      50: "#fef2f2",
      500: "#ef4444",
      700: "#b91c1c",
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
  },
};
```

**Real-Time Compliance Dashboard:**

```typescript
// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ComplianceScore } from '@/components/dashboard/compliance-score';
import { ControlStatus } from '@/components/dashboard/control-status';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';
import { IntegrationHealth } from '@/components/dashboard/integration-health';

export default function DashboardPage() {
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch compliance data every 15 minutes
    const fetchData = async () => {
      const response = await fetch('/api/compliance/dashboard');
      const data = await response.json();
      setComplianceData(data);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Compliance Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ComplianceScore score={complianceData.overallScore} />
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Controls Passing</h3>
          <p className="text-3xl font-bold text-green-600">
            {complianceData.passingControls}/{complianceData.totalControls}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Evidence Collected</h3>
          <p className="text-3xl font-bold">{complianceData.evidenceCount}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Audit Readiness</h3>
          <p className="text-3xl font-bold text-blue-600">
            {complianceData.auditReadiness}%
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ControlStatus controls={complianceData.controls} />
        <IntegrationHealth integrations={complianceData.integrations} />
      </div>

      <RecentAlerts alerts={complianceData.recentAlerts} />
    </div>
  );
}
```

**Compliance Score Component:**

```typescript
// components/dashboard/compliance-score.tsx
'use client';

import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ComplianceScoreProps {
  score: number;
}

export function ComplianceScore({ score }: ComplianceScoreProps) {
  const data = [
    { name: 'Compliant', value: score },
    { name: 'Non-Compliant', value: 100 - score },
  ];

  const COLORS = ['#22c55e', '#ef4444'];

  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Compliance Score</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-4xl font-bold">{score}%</p>
          <p className="text-sm text-gray-500 mt-1">Overall compliance</p>
        </div>
        <ResponsiveContainer width={100} height={100}>
          <PieChart>
            <Pie
              data={data}
              cx={50}
              cy={50}
              innerRadius={30}
              outerRadius={40}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

---

## Week 7-8: Real-Time Monitoring & SOC 2 Framework

### Continuous Compliance Checks

```typescript
// src/modules/compliance/compliance-scheduler.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

@Injectable()
export class ComplianceSchedulerService {
  private readonly logger = new Logger(ComplianceSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("compliance-checks") private readonly checksQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduleComplianceChecks() {
    this.logger.log("Starting scheduled compliance checks");

    const customers = await this.prisma.customer.findMany({
      where: { status: "ACTIVE" },
      include: { integrations: true },
    });

    for (const customer of customers) {
      // Get all controls that need checking
      const controls = await this.prisma.control.findMany({
        where: { framework: "SOC2" },
      });

      for (const control of controls) {
        await this.checksQueue.add("run-check", {
          customerId: customer.id,
          controlId: control.id,
        });
      }
    }

    this.logger.log(`Scheduled checks for ${customers.length} customers`);
  }
}
```

### SOC 2 Control Implementation

```typescript
// src/modules/compliance/soc2-controls.ts
export const SOC2_CONTROLS = [
  {
    controlId: "CC6.1",
    title: "Logical and Physical Access Controls",
    description: "The entity implements logical access security software...",
    testProcedure: "Verify MFA is enabled for all users",
    frequency: "DAILY",
    category: "Common Criteria",
  },
  {
    controlId: "CC6.6",
    title: "Encryption of Data",
    description: "The entity encrypts data at rest and in transit...",
    testProcedure: "Check S3 bucket encryption and TLS enforcement",
    frequency: "DAILY",
    category: "Common Criteria",
  },
  {
    controlId: "CC7.2",
    title: "System Monitoring",
    description: "The entity monitors system components...",
    testProcedure: "Verify CloudTrail is enabled and logging",
    frequency: "DAILY",
    category: "Common Criteria",
  },
  // Add all 64 SOC 2 controls
];
```

---

## Week 9-10: Testing & Refinement

### Integration Tests

```typescript
// test/integration/aws-integration.e2e-spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { AwsIntegrationService } from "../../src/modules/integrations/aws/aws-integration.service";

describe("AWS Integration (e2e)", () => {
  let service: AwsIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsIntegrationService],
    }).compile();

    service = module.get<AwsIntegrationService>(AwsIntegrationService);
  });

  it("should collect IAM evidence with retry", async () => {
    const credentials = {
      accessKeyId: process.env.TEST_AWS_ACCESS_KEY,
      secretAccessKey: process.env.TEST_AWS_SECRET_KEY,
    };

    const evidence = await service.collectIAMEvidence(credentials);

    expect(evidence).toBeDefined();
    expect(evidence.users).toBeInstanceOf(Array);
    expect(evidence.collectedAt).toBeInstanceOf(Date);
  });

  it("should handle integration failures gracefully", async () => {
    const invalidCredentials = {
      accessKeyId: "invalid",
      secretAccessKey: "invalid",
    };

    await expect(
      service.collectIAMEvidence(invalidCredentials),
    ).rejects.toThrow();
  });
});
```

---

## Week 11-12: Demo & Sales Preparation

### Demo Environment Setup

1. **Seed Demo Data:**

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create demo customer
  const customer = await prisma.customer.create({
    data: {
      name: "Acme Corp",
      email: "demo@acme.com",
      plan: "STARTER",
      status: "ACTIVE",
    },
  });

  // Create demo integrations
  await prisma.integration.createMany({
    data: [
      {
        customerId: customer.id,
        type: "AWS",
        status: "ACTIVE",
        config: {},
        healthScore: 0.99,
      },
      {
        customerId: customer.id,
        type: "GITHUB",
        status: "ACTIVE",
        config: {},
        healthScore: 0.98,
      },
    ],
  });

  // Seed SOC 2 controls
  // Seed sample evidence
  // Seed compliance checks
}

main();
```

2. **Create Demo Script**
3. **Record Product Demo Video**
4. **Build Landing Page**

---

## Infrastructure & Deployment

### Terraform Configuration

```hcl
# terraform/main.tf
provider "aws" {
  region = "us-east-1"
}

# VPC and Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "kushim-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "kushim-db"
  engine              = "postgres"
  engine_version      = "16"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  storage_encrypted   = true

  db_name  = "kushim"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  skip_final_snapshot    = false
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "kushim-cluster"
}

# S3 Bucket for Evidence Storage
resource "aws_s3_bucket" "evidence" {
  bucket = "kushim-evidence-${var.environment}"

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}
```

---

## Success Criteria Checklist

- [ ] 5 core integrations working (AWS, GitHub, Okta, Jira, Slack)
- [ ] 99.9% integration uptime measured
- [ ] Real-time dashboard updating every 15 minutes
- [ ] Jira ticket auto-creation for failed controls
- [ ] SOC 2 framework with 64 controls implemented
- [ ] 80% of controls automated
- [ ] Evidence immutability with hash chains
- [ ] Circuit breaker pattern preventing cascading failures
- [ ] Demo environment with realistic data
- [ ] Landing page and marketing materials ready
- [ ] 5 customer demos scheduled
- [ ] First paying customer signed

---

## Next Steps to Phase 2

Once Phase 1 is complete with 5 paying customers:

- Implement AI evidence mapping
- Add policy drafting assistant
- Build natural language query interface
- Expand to 10+ additional integrations
- Target 15 total customers for $525K ARR

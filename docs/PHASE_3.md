# Phase 3: Scale & Enterprise (Months 7-12)

**Goal:** Expand to multi-framework and enterprise features

**Success Metrics:**

- 40 paying customers = $2M ARR
- 2+ enterprise deals ($300K+)
- Profitability or clear path to it
- Series A fundraising ready
- <3% churn rate

---

## Multi-Framework Support

### 1. Framework Implementation

**ISO 27001 (114 Controls):**

```typescript
// src/modules/frameworks/iso27001/iso27001-controls.ts
export const ISO27001_CONTROLS = [
  {
    controlId: "A.5.1.1",
    title: "Information Security Policy",
    description:
      "A set of policies for information security shall be defined...",
    category: "Organizational Controls",
    mappings: {
      SOC2: ["CC1.1", "CC1.2"],
      HIPAA: ["164.308(a)(2)"],
    },
  },
  {
    controlId: "A.8.2.1",
    title: "Classification of Information",
    description:
      "Information shall be classified in terms of legal requirements...",
    category: "Asset Management",
    mappings: {
      SOC2: ["CC6.1"],
      GDPR: ["Article 32"],
    },
  },
  // ... 112 more controls
];
```

**HIPAA Security Rule:**

```typescript
// src/modules/frameworks/hipaa/hipaa-controls.ts
export const HIPAA_CONTROLS = [
  {
    controlId: "164.308(a)(1)(i)",
    title: "Security Management Process",
    description: "Implement policies and procedures to prevent, detect...",
    category: "Administrative Safeguards",
    mappings: {
      SOC2: ["CC1.1", "CC7.1"],
      ISO27001: ["A.5.1.1", "A.12.6.1"],
    },
  },
  {
    controlId: "164.312(a)(1)",
    title: "Access Control",
    description: "Implement technical policies and procedures...",
    category: "Technical Safeguards",
    mappings: {
      SOC2: ["CC6.1", "CC6.2"],
      ISO27001: ["A.9.1.1", "A.9.2.1"],
    },
  },
  // ... more controls
];
```

### 2. Cross-Framework Mapping Service

```typescript
// src/modules/frameworks/framework-mapping.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class FrameworkMappingService {
  constructor(private readonly prisma: PrismaService) {}

  async mapControlsAcrossFrameworks(
    sourceFramework: string,
    sourceControlId: string,
  ): Promise<any[]> {
    const sourceControl = await this.prisma.control.findFirst({
      where: { framework: sourceFramework, controlId: sourceControlId },
    });

    // Find mapped controls in other frameworks
    const mappings = await this.prisma.$queryRaw`
      SELECT c.* 
      FROM controls c
      JOIN control_mappings cm ON c.id = cm.target_control_id
      WHERE cm.source_control_id = ${sourceControl.id}
    `;

    return mappings;
  }

  async consolidateEvidence(controlIds: string[]): Promise<any> {
    // Find evidence that satisfies multiple controls
    const evidence = await this.prisma.evidence.findMany({
      where: {
        controlId: { in: controlIds },
      },
      include: { control: true },
    });

    // Group by unique evidence
    const consolidated = evidence.reduce((acc, ev) => {
      if (!acc[ev.hash]) {
        acc[ev.hash] = {
          evidence: ev,
          satisfiesControls: [],
        };
      }
      acc[ev.hash].satisfiesControls.push(ev.control);
      return acc;
    }, {});

    return Object.values(consolidated);
  }
}
```

---

## Multi-Tenant Architecture

### 1. Workspace Model

**Apply senior-architect skill for multi-tenant design:**

```prisma
// prisma/schema.prisma additions

model Workspace {
  id          String   @id @default(uuid())
  customerId  String   @map("customer_id")
  name        String
  description String?
  settings    Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  customer     Customer @relation(fields: [customerId], references: [id])
  users        WorkspaceUser[]
  integrations WorkspaceIntegration[]
  controls     WorkspaceControl[]

  @@map("workspaces")
  @@index([customerId])
}

model WorkspaceUser {
  id          String   @id @default(uuid())
  workspaceId String   @map("workspace_id")
  userId      String   @map("user_id")
  role        WorkspaceRole
  createdAt   DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  user      User      @relation(fields: [userId], references: [id])

  @@map("workspace_users")
  @@unique([workspaceId, userId])
}

enum WorkspaceRole {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}

model WorkspaceIntegration {
  id            String   @id @default(uuid())
  workspaceId   String   @map("workspace_id")
  integrationId String   @map("integration_id")
  enabled       Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")

  workspace   Workspace   @relation(fields: [workspaceId], references: [id])
  integration Integration @relation(fields: [integrationId], references: [id])

  @@map("workspace_integrations")
  @@unique([workspaceId, integrationId])
}
```

### 2. Workspace Service

```typescript
// src/modules/workspaces/workspace.service.ts
import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(
    customerId: string,
    name: string,
    ownerId: string,
  ): Promise<any> {
    return this.prisma.workspace.create({
      data: {
        customerId,
        name,
        users: {
          create: {
            userId: ownerId,
            role: "OWNER",
          },
        },
      },
    });
  }

  async getConsolidatedReport(customerId: string): Promise<any> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { customerId },
      include: {
        controls: {
          include: {
            complianceChecks: {
              orderBy: { checkedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    // Aggregate compliance across all workspaces
    const aggregated = workspaces.map((ws) => {
      const totalControls = ws.controls.length;
      const passingControls = ws.controls.filter(
        (c) => c.complianceChecks[0]?.status === "PASS",
      ).length;

      return {
        workspaceName: ws.name,
        totalControls,
        passingControls,
        complianceRate: (passingControls / totalControls) * 100,
      };
    });

    return {
      workspaces: aggregated,
      overall: {
        totalWorkspaces: workspaces.length,
        avgComplianceRate:
          aggregated.reduce((sum, w) => sum + w.complianceRate, 0) /
          aggregated.length,
      },
    };
  }

  async checkUserAccess(
    userId: string,
    workspaceId: string,
    requiredRole: string,
  ): Promise<boolean> {
    const membership = await this.prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) return false;

    const roleHierarchy = {
      VIEWER: 1,
      EDITOR: 2,
      ADMIN: 3,
      OWNER: 4,
    };

    return roleHierarchy[membership.role] >= roleHierarchy[requiredRole];
  }
}
```

---

## Advanced RBAC

### 1. Permission System

```typescript
// src/modules/auth/permissions.ts
export enum Permission {
  // Workspace permissions
  WORKSPACE_VIEW = "workspace:view",
  WORKSPACE_EDIT = "workspace:edit",
  WORKSPACE_DELETE = "workspace:delete",

  // Integration permissions
  INTEGRATION_VIEW = "integration:view",
  INTEGRATION_CREATE = "integration:create",
  INTEGRATION_EDIT = "integration:edit",
  INTEGRATION_DELETE = "integration:delete",

  // Evidence permissions
  EVIDENCE_VIEW = "evidence:view",
  EVIDENCE_UPLOAD = "evidence:upload",
  EVIDENCE_DELETE = "evidence:delete",

  // Policy permissions
  POLICY_VIEW = "policy:view",
  POLICY_DRAFT = "policy:draft",
  POLICY_APPROVE = "policy:approve",
  POLICY_PUBLISH = "policy:publish",

  // User management
  USER_INVITE = "user:invite",
  USER_REMOVE = "user:remove",
  USER_CHANGE_ROLE = "user:change_role",
}

export const ROLE_PERMISSIONS = {
  VIEWER: [
    Permission.WORKSPACE_VIEW,
    Permission.INTEGRATION_VIEW,
    Permission.EVIDENCE_VIEW,
    Permission.POLICY_VIEW,
  ],
  EDITOR: [
    Permission.WORKSPACE_VIEW,
    Permission.WORKSPACE_EDIT,
    Permission.INTEGRATION_VIEW,
    Permission.INTEGRATION_CREATE,
    Permission.INTEGRATION_EDIT,
    Permission.EVIDENCE_VIEW,
    Permission.EVIDENCE_UPLOAD,
    Permission.POLICY_VIEW,
    Permission.POLICY_DRAFT,
  ],
  ADMIN: [
    ...Object.values(Permission).filter(
      (p) => !p.startsWith("workspace:delete"),
    ),
  ],
  OWNER: Object.values(Permission),
};
```

### 2. Permission Guard

```typescript
// src/common/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WorkspaceService } from "../../modules/workspaces/workspace.service";
import { ROLE_PERMISSIONS, Permission } from "../auth/permissions";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private workspaceService: WorkspaceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<Permission[]>(
      "permissions",
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.params.workspaceId || request.body.workspaceId;

    const membership = await this.workspaceService.getUserRole(
      user.id,
      workspaceId,
    );

    if (!membership) return false;

    const userPermissions = ROLE_PERMISSIONS[membership.role];

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
```

---

## Custom Control Frameworks

### 1. Framework Builder

```typescript
// src/modules/frameworks/custom-framework.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class CustomFrameworkService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomFramework(
    customerId: string,
    name: string,
    description: string,
  ): Promise<any> {
    return this.prisma.customFramework.create({
      data: {
        customerId,
        name,
        description,
        status: "DRAFT",
      },
    });
  }

  async addCustomControl(
    frameworkId: string,
    control: {
      title: string;
      description: string;
      testProcedure: string;
      frequency: string;
      mappedControls?: string[]; // Map to standard frameworks
    },
  ): Promise<any> {
    const customControl = await this.prisma.customControl.create({
      data: {
        frameworkId,
        ...control,
      },
    });

    // Create mappings to standard controls
    if (control.mappedControls) {
      await Promise.all(
        control.mappedControls.map((controlId) =>
          this.prisma.controlMapping.create({
            data: {
              sourceControlId: customControl.id,
              targetControlId: controlId,
              mappingType: "EQUIVALENT",
            },
          }),
        ),
      );
    }

    return customControl;
  }

  async generateFrameworkFromTemplate(
    customerId: string,
    industry: string,
  ): Promise<any> {
    // Use AI to generate industry-specific framework
    const industryTemplates = {
      fintech: ["PCI-DSS", "SOC2", "SOX"],
      healthtech: ["HIPAA", "SOC2", "HITRUST"],
      saas: ["SOC2", "ISO27001", "GDPR"],
    };

    const baseFrameworks = industryTemplates[industry] || ["SOC2"];

    // Create custom framework combining relevant controls
    return this.createCustomFramework(
      customerId,
      `${industry.toUpperCase()} Compliance Framework`,
      `Custom framework for ${industry} industry`,
    );
  }
}
```

---

## Enterprise Integrations

### 1. ServiceNow Integration

```typescript
// src/modules/integrations/servicenow/servicenow.service.ts
import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class ServiceNowService {
  async syncComplianceData(
    instance: string,
    username: string,
    password: string,
    complianceData: any,
  ): Promise<void> {
    const baseUrl = `https://${instance}.service-now.com/api/now`;

    // Create GRC risk record
    await axios.post(
      `${baseUrl}/table/sn_grc_risk`,
      {
        short_description: "Compliance Risk Assessment",
        risk_statement: complianceData.summary,
        risk_score: complianceData.riskScore,
      },
      {
        auth: { username, password },
        headers: { "Content-Type": "application/json" },
      },
    );

    // Create compliance controls
    for (const control of complianceData.failingControls) {
      await axios.post(
        `${baseUrl}/table/sn_grc_control`,
        {
          name: control.title,
          description: control.description,
          status: "failed",
        },
        {
          auth: { username, password },
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }
}
```

### 2. Salesforce Integration

```typescript
// src/modules/integrations/salesforce/salesforce.service.ts
import { Injectable } from "@nestjs/common";
import jsforce from "jsforce";

@Injectable()
export class SalesforceService {
  async updateOpportunityCompliance(
    credentials: any,
    opportunityId: string,
    complianceStatus: any,
  ): Promise<void> {
    const conn = new jsforce.Connection({
      instanceUrl: credentials.instanceUrl,
      accessToken: credentials.accessToken,
    });

    await conn.sobject("Opportunity").update({
      Id: opportunityId,
      Compliance_Status__c: complianceStatus.status,
      SOC2_Certified__c: complianceStatus.soc2Certified,
      ISO27001_Certified__c: complianceStatus.iso27001Certified,
      Last_Audit_Date__c: complianceStatus.lastAuditDate,
    });
  }

  async createComplianceTask(
    credentials: any,
    accountId: string,
    task: any,
  ): Promise<void> {
    const conn = new jsforce.Connection({
      instanceUrl: credentials.instanceUrl,
      accessToken: credentials.accessToken,
    });

    await conn.sobject("Task").create({
      WhatId: accountId,
      Subject: task.subject,
      Description: task.description,
      Priority: "High",
      Status: "Not Started",
    });
  }
}
```

---

## White-Label & MSP Features

### 1. White-Label Configuration

```typescript
// src/modules/white-label/white-label.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class WhiteLabelService {
  constructor(private readonly prisma: PrismaService) {}

  async configureBranding(
    customerId: string,
    branding: {
      logo: string;
      primaryColor: string;
      secondaryColor: string;
      companyName: string;
      customDomain?: string;
    },
  ): Promise<any> {
    return this.prisma.whiteLabelConfig.upsert({
      where: { customerId },
      create: {
        customerId,
        ...branding,
      },
      update: branding,
    });
  }

  async getBrandingForDomain(domain: string): Promise<any> {
    return this.prisma.whiteLabelConfig.findFirst({
      where: { customDomain: domain },
    });
  }
}
```

### 2. MSP Multi-Customer Management

```typescript
// src/modules/msp/msp.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class MSPService {
  constructor(private readonly prisma: PrismaService) {}

  async getManagedCustomers(mspId: string): Promise<any[]> {
    return this.prisma.customer.findMany({
      where: { managedBy: mspId },
      include: {
        integrations: true,
        complianceChecks: {
          where: { status: "FAIL" },
        },
      },
    });
  }

  async getAggregatedCompliance(mspId: string): Promise<any> {
    const customers = await this.getManagedCustomers(mspId);

    return customers.map((customer) => ({
      customerId: customer.id,
      customerName: customer.name,
      complianceScore: this.calculateComplianceScore(customer),
      failingControls: customer.complianceChecks.length,
      integrationHealth: this.calculateIntegrationHealth(customer.integrations),
    }));
  }

  private calculateComplianceScore(customer: any): number {
    // Calculate based on passing/failing checks
    return 85; // Placeholder
  }

  private calculateIntegrationHealth(integrations: any[]): number {
    const avgHealth =
      integrations.reduce((sum, i) => sum + Number(i.healthScore), 0) /
      integrations.length;
    return Math.round(avgHealth * 100);
  }
}
```

---

## Advanced Reporting

### 1. Report Builder

```typescript
// src/modules/reporting/report-builder.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import PDFDocument from "pdfkit";

@Injectable()
export class ReportBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async generateExecutiveReport(
    customerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    const data = await this.getReportData(customerId, startDate, endDate);

    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // Title
    doc.fontSize(24).text("Executive Compliance Report", { align: "center" });
    doc.moveDown();

    // Summary
    doc.fontSize(16).text("Compliance Summary");
    doc.fontSize(12).text(`Overall Score: ${data.overallScore}%`);
    doc.text(`Passing Controls: ${data.passingControls}/${data.totalControls}`);
    doc.text(`Audit Readiness: ${data.auditReadiness}%`);
    doc.moveDown();

    // Trends
    doc.fontSize(16).text("Compliance Trends");
    doc
      .fontSize(12)
      .text(`Improvement: ${data.trend > 0 ? "+" : ""}${data.trend}%`);
    doc.moveDown();

    // Failing Controls
    if (data.failingControls.length > 0) {
      doc.fontSize(16).text("Areas Requiring Attention");
      data.failingControls.forEach((control, i) => {
        doc.fontSize(12).text(`${i + 1}. ${control.title}`);
        doc.fontSize(10).text(`   ${control.description}`);
      });
    }

    doc.end();

    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  private async getReportData(
    customerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // Fetch and aggregate data
    return {
      overallScore: 92,
      passingControls: 58,
      totalControls: 64,
      auditReadiness: 95,
      trend: 5,
      failingControls: [],
    };
  }
}
```

---

## Stripe Payment Integration

**Apply stripe-integration skill:**

### 1. Subscription Management

```typescript
// src/modules/billing/stripe.service.ts
import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  }

  async createCheckoutSession(
    customerId: string,
    plan: "STARTER" | "GROWTH" | "ENTERPRISE",
  ): Promise<string> {
    const priceIds = {
      STARTER: process.env.STRIPE_STARTER_PRICE_ID,
      GROWTH: process.env.STRIPE_GROWTH_PRICE_ID,
      ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    };

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceIds[plan],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/billing/cancel`,
      client_reference_id: customerId,
      metadata: {
        customerId,
        plan,
      },
    });

    return session.url;
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "customer.subscription.created":
        await this.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.payment_succeeded":
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = subscription.metadata.customerId;

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        status: "ACTIVE",
        stripeSubscriptionId: subscription.id,
      },
    });
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = subscription.metadata.customerId;

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { status: "CANCELED" },
    });
  }
}
```

---

## Success Criteria Checklist

- [ ] ISO 27001, HIPAA, GDPR frameworks implemented
- [ ] Multi-tenant architecture with workspace isolation
- [ ] Custom control framework builder working
- [ ] Advanced RBAC with granular permissions
- [ ] ServiceNow and Salesforce integrations live
- [ ] White-label configuration for MSPs
- [ ] Executive reporting with PDF generation
- [ ] Stripe subscription billing integrated
- [ ] 40 paying customers acquired
- [ ] 2+ enterprise deals ($300K+) closed
- [ ] <3% churn rate
- [ ] Profitability achieved or clear path defined

---

## Enterprise Sales Playbook

### Target Enterprise Customers:

- Series C+ companies (500+ employees)
- $50M+ ARR
- Multiple business units
- Complex compliance requirements
- Existing GRC tools (ServiceNow, etc.)

### Enterprise Deal Structure:

- Custom pricing based on # of users, workspaces, integrations
- Annual contracts with quarterly business reviews
- Dedicated Customer Success Manager
- SLA guarantees (99.9% uptime)
- Custom integrations included
- White-label options
- Priority support (4-hour response)

### Pricing Strategy:

- Base: $300K/year
- Additional workspaces: $50K each
- Custom integrations: $25K-$50K one-time
- Professional services: $200/hour

---

## Series A Readiness

**Metrics to Achieve:**

- $2M ARR with 40 customers
- 120% net revenue retention
- <3% monthly churn
- $60K average contract value
- 6-month sales cycle for enterprise
- 40% gross margin
- Clear path to $10M ARR in 18 months

**Fundraising Materials:**

- Pitch deck with traction metrics
- Financial model (3-year projection)
- Customer case studies
- Product roadmap
- Competitive analysis
- Team expansion plan

---

## Next Steps Post-Phase 3

**Scale to $10M ARR:**

- Expand to 80+ customers
- Launch partner program
- International expansion (EU, APAC)
- Build mobile apps
- Add more frameworks (NIST, CIS)
- Implement AI-powered audit preparation
- Build compliance marketplace

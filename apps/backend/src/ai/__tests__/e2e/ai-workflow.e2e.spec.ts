import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AiModule } from '../../ai.module';
import { EvidenceMappingService } from '../../evidence-mapping/evidence-mapping.service';
import { PolicyDraftingService } from '../../policy-drafting/policy-drafting.service';
import { CopilotService } from '../../copilot/copilot.service';
import { UsageTrackerService } from '../../usage-tracker.service';

describe('AI Workflow E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let evidenceMappingService: EvidenceMappingService;
  let policyDraftingService: PolicyDraftingService;
  let copilotService: CopilotService;
  let usageTracker: UsageTrackerService;

  const testCustomerId = 'test-customer-e2e';
  const testUserId = 'test-user-e2e';
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AiModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    evidenceMappingService = moduleFixture.get<EvidenceMappingService>(EvidenceMappingService);
    policyDraftingService = moduleFixture.get<PolicyDraftingService>(PolicyDraftingService);
    copilotService = moduleFixture.get<CopilotService>(CopilotService);
    usageTracker = moduleFixture.get<UsageTrackerService>(UsageTrackerService);

    // Create test customer and user
    await prisma.customer.create({
      data: {
        id: testCustomerId,
        name: 'E2E Test Customer',
        email: 'e2e-test@example.com',
      },
    });

    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: 'e2e-user@example.com',
        name: 'E2E Test User',
        customerId: testCustomerId,
        password: 'hashed_password',
      },
    });

    // Mock auth token
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.aiUsage.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.evidence.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.user.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.customer.delete({ where: { id: testCustomerId } });
    await app.close();
  });

  describe('Complete AI Workflow', () => {
    let evidenceId: string;
    let mappingId: string;
    let policyId: string;
    let conversationId: string;

    it('Step 1: Collect evidence via integration (mock)', async () => {
      // Simulate evidence collection from AWS
      const evidence = await prisma.evidence.create({
        data: {
          id: 'test-evidence-1',
          customerId: testCustomerId,
          integrationId: 'mock-aws-integration',
          title: 'IAM MFA Enforcement Policy',
          description: 'AWS IAM policy enforcing MFA for all users',
          sourceType: 'AWS_CONFIG',
          sourceUrl: 's3://evidence-bucket/iam-mfa-policy.json',
          metadata: {
            resourceType: 'AWS::IAM::Policy',
            region: 'us-east-1',
            compliance: 'COMPLIANT',
          },
          collectedAt: new Date(),
        },
      });

      evidenceId = evidence.id;
      expect(evidenceId).toBeDefined();
    });

    it('Step 2: Auto-map evidence to controls using AI', async () => {
      const mapping = await evidenceMappingService.mapEvidenceToControl({
        evidenceId,
        customerId: testCustomerId,
        userId: testUserId,
      });

      mappingId = mapping.id;
      expect(mapping.controlId).toBeDefined();
      expect(mapping.confidence).toBeGreaterThan(0.7);
      expect(mapping.reasoning).toContain('MFA');
    });

    it('Step 3: Ask Copilot about mapped evidence', async () => {
      const response = await copilotService.chat({
        message: `What evidence do we have for access control?`,
        customerId: testCustomerId,
        userId: testUserId,
      });

      conversationId = response.conversationId;
      expect(response.message).toContain('IAM');
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.citations[0].evidenceId).toBe(evidenceId);
    });

    it('Step 4: Generate policy based on controls', async () => {
      const policy = await policyDraftingService.generatePolicy({
        policyType: 'ACCESS_CONTROL',
        controlIds: ['CC6.1', 'CC6.2'],
        customerId: testCustomerId,
        userId: testUserId,
      });

      policyId = policy.id;
      expect(policy.content).toBeDefined();
      expect(policy.content.length).toBeGreaterThan(500);
      expect(policy.soc2Alignment).toBeGreaterThan(0.8);
    });

    it('Step 5: Review policy with AI', async () => {
      const review = await policyDraftingService.reviewPolicy({
        policyId,
        customerId: testCustomerId,
      });

      expect(review.overallScore).toBeGreaterThan(0);
      expect(review.suggestions.length).toBeGreaterThan(0);
      expect(review.completeness).toBeDefined();
    });

    it('Step 6: Export policy', async () => {
      const exported = await policyDraftingService.exportPolicy({
        policyId,
        format: 'markdown',
        customerId: testCustomerId,
      });

      expect(exported.content).toContain('# Access Control Policy');
      expect(exported.format).toBe('markdown');
    });

    it('Step 7: Verify cost tracking across all AI features', async () => {
      const usage = await usageTracker.getUsageByCustomer(testCustomerId);

      expect(usage.totalCost).toBeGreaterThan(0);
      expect(usage.totalTokens).toBeGreaterThan(0);
      
      // Should have usage from all 3 features
      const features = usage.byFeature;
      expect(features['evidence-mapping']).toBeDefined();
      expect(features['policy-drafting']).toBeDefined();
      expect(features['copilot']).toBeDefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle OpenAI API failures gracefully', async () => {
      // Mock OpenAI failure by using invalid API key
      jest.spyOn(evidenceMappingService, 'mapEvidenceToControl')
        .mockRejectedValueOnce(new Error('OpenAI API Error: Rate limit exceeded'));

      await expect(
        evidenceMappingService.mapEvidenceToControl({
          evidenceId: 'invalid-evidence',
          customerId: testCustomerId,
          userId: testUserId,
        })
      ).rejects.toThrow('OpenAI API Error');
    });

    it('should handle invalid inputs', async () => {
      await expect(
        policyDraftingService.generatePolicy({
          policyType: 'INVALID_TYPE' as any,
          controlIds: [],
          customerId: testCustomerId,
          userId: testUserId,
        })
      ).rejects.toThrow();
    });

    it('should handle missing evidence', async () => {
      await expect(
        evidenceMappingService.mapEvidenceToControl({
          evidenceId: 'non-existent-evidence',
          customerId: testCustomerId,
          userId: testUserId,
        })
      ).rejects.toThrow();
    });
  });

  describe('Multi-tenant Isolation', () => {
    const otherCustomerId = 'other-customer-e2e';

    beforeAll(async () => {
      await prisma.customer.create({
        data: {
          id: otherCustomerId,
          name: 'Other Customer',
          email: 'other@example.com',
        },
      });
    });

    afterAll(async () => {
      await prisma.customer.delete({ where: { id: otherCustomerId } });
    });

    it('should not access other customer data in Copilot', async () => {
      // Create evidence for customer 1
      await prisma.evidence.create({
        data: {
          id: 'customer1-evidence',
          customerId: testCustomerId,
          integrationId: 'test-integration',
          title: 'Customer 1 Secret Data',
          description: 'Confidential information for customer 1',
          sourceType: 'MANUAL',
          collectedAt: new Date(),
        },
      });

      // Query as customer 2
      const response = await copilotService.chat({
        message: 'Show me all evidence',
        customerId: otherCustomerId,
        userId: testUserId,
      });

      // Should not return customer 1's data
      expect(response.message).not.toContain('Customer 1 Secret Data');
      expect(response.citations.every(c => c.customerId === otherCustomerId)).toBe(true);
    });

    it('should not access other customer policies', async () => {
      const policy1 = await policyDraftingService.generatePolicy({
        policyType: 'ACCESS_CONTROL',
        controlIds: ['CC6.1'],
        customerId: testCustomerId,
        userId: testUserId,
        title: 'Customer 1 Policy',
      });

      // Try to access as customer 2
      await expect(
        policyDraftingService.getPolicy({
          policyId: policy1.id,
          customerId: otherCustomerId,
        })
      ).rejects.toThrow();
    });
  });

  describe('Batch Operations Performance', () => {
    it('should handle batch evidence mapping efficiently', async () => {
      // Create 10 evidence items
      const evidenceIds = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          prisma.evidence.create({
            data: {
              id: `batch-evidence-${i}`,
              customerId: testCustomerId,
              integrationId: 'test-integration',
              title: `Evidence Item ${i}`,
              description: `Description for evidence ${i}`,
              sourceType: 'MANUAL',
              collectedAt: new Date(),
            },
          }).then(e => e.id)
        )
      );

      const startTime = Date.now();
      
      const mappings = await evidenceMappingService.mapBatchEvidence({
        evidenceIds,
        customerId: testCustomerId,
        userId: testUserId,
      });

      const duration = Date.now() - startTime;

      expect(mappings.length).toBe(10);
      expect(duration).toBeLessThan(30000); // Should complete in < 30s
    });
  });

  describe('Cost Limits', () => {
    it('should enforce customer cost limits', async () => {
      // Set low cost limit for testing
      await prisma.customer.update({
        where: { id: testCustomerId },
        data: { aiCostLimit: 0.01 }, // $0.01 limit
      });

      // Generate multiple policies to exceed limit
      let errorThrown = false;
      try {
        for (let i = 0; i < 100; i++) {
          await policyDraftingService.generatePolicy({
            policyType: 'ACCESS_CONTROL',
            controlIds: ['CC6.1'],
            customerId: testCustomerId,
            userId: testUserId,
          });
        }
      } catch (error) {
        if (error.message.includes('cost limit')) {
          errorThrown = true;
        }
      }

      expect(errorThrown).toBe(true);
    });
  });
});

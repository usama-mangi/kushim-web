import { Test, TestingModule } from '@nestjs/testing';
import { EvidenceMappingService } from '../../evidence-mapping/evidence-mapping.service';
import { PolicyDraftingService } from '../../policy-drafting/policy-drafting.service';
import { CopilotService } from '../../copilot/copilot.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

/**
 * Quality tests for AI responses
 * 
 * These tests verify:
 * - Evidence mapping accuracy
 * - Policy generation completeness
 * - Copilot response quality
 * - Citation accuracy
 * - Confidence score calibration
 */

describe('AI Response Quality Tests', () => {
  let evidenceMappingService: EvidenceMappingService;
  let policyDraftingService: PolicyDraftingService;
  let copilotService: CopilotService;
  let prisma: PrismaService;

  const testCustomerId = 'quality-test-customer';
  const testUserId = 'quality-test-user';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceMappingService,
        PolicyDraftingService,
        CopilotService,
        PrismaService,
      ],
    }).compile();

    evidenceMappingService = module.get<EvidenceMappingService>(EvidenceMappingService);
    policyDraftingService = module.get<PolicyDraftingService>(PolicyDraftingService);
    copilotService = module.get<CopilotService>(CopilotService);
    prisma = module.get<PrismaService>(PrismaService);

    // Setup test customer
    await prisma.customer.upsert({
      where: { id: testCustomerId },
      create: {
        id: testCustomerId,
        name: 'Quality Test Customer',
        email: 'quality@example.com',
      },
      update: {},
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Evidence Mapping Accuracy', () => {
    const testCases = [
      {
        title: 'AWS IAM MFA Policy',
        description: 'Policy requiring multi-factor authentication for all IAM users',
        expectedControl: 'CC6.1',
        minConfidence: 0.85,
      },
      {
        title: 'Database Encryption Configuration',
        description: 'RDS database with encryption at rest enabled using KMS',
        expectedControl: 'CC6.7',
        minConfidence: 0.8,
      },
      {
        title: 'CloudTrail Logging Enabled',
        description: 'AWS CloudTrail logging all API calls to S3 bucket',
        expectedControl: 'CC7.2',
        minConfidence: 0.85,
      },
      {
        title: 'VPC Network Isolation',
        description: 'Private subnet configuration with no internet gateway',
        expectedControl: 'CC6.6',
        minConfidence: 0.75,
      },
      {
        title: 'Backup Retention Policy',
        description: 'Automated backups retained for 30 days with point-in-time recovery',
        expectedControl: 'A1.2',
        minConfidence: 0.8,
      },
      {
        title: 'Security Group Rules',
        description: 'Restrictive security group allowing only port 443 from approved IPs',
        expectedControl: 'CC6.6',
        minConfidence: 0.8,
      },
      {
        title: 'Access Key Rotation',
        description: 'IAM access keys rotated every 90 days automatically',
        expectedControl: 'CC6.1',
        minConfidence: 0.85,
      },
      {
        title: 'GuardDuty Threat Detection',
        description: 'AWS GuardDuty monitoring for malicious activity',
        expectedControl: 'CC7.2',
        minConfidence: 0.8,
      },
      {
        title: 'S3 Bucket Versioning',
        description: 'S3 versioning enabled to prevent accidental deletion',
        expectedControl: 'A1.2',
        minConfidence: 0.75,
      },
      {
        title: 'WAF Rules Configuration',
        description: 'AWS WAF protecting against OWASP Top 10 vulnerabilities',
        expectedControl: 'CC6.6',
        minConfidence: 0.8,
      },
      {
        title: 'SSO Integration',
        description: 'Single sign-on with Okta for all cloud applications',
        expectedControl: 'CC6.1',
        minConfidence: 0.85,
      },
      {
        title: 'Patch Management Policy',
        description: 'Automated patching schedule for all EC2 instances monthly',
        expectedControl: 'CC7.1',
        minConfidence: 0.8,
      },
      {
        title: 'Incident Response Plan',
        description: 'Documented procedures for security incident response',
        expectedControl: 'CC7.3',
        minConfidence: 0.85,
      },
      {
        title: 'Data Classification Policy',
        description: 'Policy defining sensitive data handling procedures',
        expectedControl: 'CC6.7',
        minConfidence: 0.8,
      },
      {
        title: 'Change Management Process',
        description: 'Approval workflow for all production changes',
        expectedControl: 'CC8.1',
        minConfidence: 0.85,
      },
      {
        title: 'Vulnerability Scanning',
        description: 'Weekly automated vulnerability scans with remediation tracking',
        expectedControl: 'CC7.1',
        minConfidence: 0.85,
      },
      {
        title: 'Audit Log Retention',
        description: 'All audit logs retained for 1 year in immutable storage',
        expectedControl: 'CC7.2',
        minConfidence: 0.85,
      },
      {
        title: 'Disaster Recovery Plan',
        description: 'DR procedures with RTO of 4 hours and RPO of 1 hour',
        expectedControl: 'A1.2',
        minConfidence: 0.8,
      },
      {
        title: 'Code Review Requirements',
        description: 'Mandatory peer review for all code before production',
        expectedControl: 'CC8.1',
        minConfidence: 0.8,
      },
      {
        title: 'Employee Background Checks',
        description: 'Background verification for all employees with system access',
        expectedControl: 'CC1.4',
        minConfidence: 0.85,
      },
    ];

    testCases.forEach((testCase, index) => {
      it(`should correctly map: ${testCase.title}`, async () => {
        // Create evidence
        const evidence = await prisma.evidence.create({
          data: {
            id: `quality-evidence-${index}`,
            customerId: testCustomerId,
            integrationId: 'quality-test-integration',
            title: testCase.title,
            description: testCase.description,
            sourceType: 'MANUAL',
            collectedAt: new Date(),
          },
        });

        // Map evidence
        const mapping = await evidenceMappingService.mapEvidenceToControl({
          evidenceId: evidence.id,
          customerId: testCustomerId,
          userId: testUserId,
        });

        // Verify mapping quality
        expect(mapping.controlId).toBe(testCase.expectedControl);
        expect(mapping.confidence).toBeGreaterThanOrEqual(testCase.minConfidence);
        expect(mapping.reasoning).toBeDefined();
        expect(mapping.reasoning.length).toBeGreaterThan(50);
      }, 30000); // 30s timeout for AI calls
    });

    it('should have reasonable confidence score distribution', async () => {
      const mappings = await prisma.aiEvidenceMapping.findMany({
        where: { customerId: testCustomerId },
      });

      const confidenceScores = mappings.map(m => m.confidence);
      const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

      expect(avgConfidence).toBeGreaterThan(0.75);
      expect(avgConfidence).toBeLessThan(0.95); // Too high suggests overfitting
    });
  });

  describe('Policy Generation Quality', () => {
    const policyTypes = [
      'ACCESS_CONTROL',
      'DATA_PROTECTION',
      'INCIDENT_RESPONSE',
      'CHANGE_MANAGEMENT',
      'RISK_ASSESSMENT',
      'VENDOR_MANAGEMENT',
      'ASSET_MANAGEMENT',
      'BUSINESS_CONTINUITY',
      'ACCEPTABLE_USE',
      'BACKUP_RECOVERY',
    ];

    policyTypes.forEach((policyType) => {
      it(`should generate complete ${policyType} policy`, async () => {
        const policy = await policyDraftingService.generatePolicy({
          policyType: policyType as any,
          controlIds: ['CC6.1', 'CC6.2'],
          customerId: testCustomerId,
          userId: testUserId,
        });

        // Verify completeness
        expect(policy.content).toBeDefined();
        expect(policy.content.length).toBeGreaterThan(1000); // Substantial content
        
        // Should not contain placeholders
        expect(policy.content).not.toMatch(/\[.*?\]/); // No [placeholders]
        expect(policy.content).not.toMatch(/<.*?>/); // No <templates>
        expect(policy.content).not.toContain('TODO');
        expect(policy.content).not.toContain('TBD');
        expect(policy.content).not.toContain('FIXME');

        // Should have key sections
        expect(policy.content).toMatch(/purpose|objective/i);
        expect(policy.content).toMatch(/scope/i);
        expect(policy.content).toMatch(/responsibilities/i);
        expect(policy.content).toMatch(/procedures?/i);

        // SOC 2 alignment
        expect(policy.soc2Alignment).toBeGreaterThan(0.7);
        expect(policy.controlsCovered.length).toBeGreaterThan(0);
      }, 60000); // 60s timeout for policy generation
    });

    it('should maintain consistent quality across policies', async () => {
      const policies = await prisma.policy.findMany({
        where: { customerId: testCustomerId },
      });

      const alignmentScores = policies.map(p => p.soc2Alignment);
      const avgAlignment = alignmentScores.reduce((a, b) => a + b, 0) / alignmentScores.length;

      expect(avgAlignment).toBeGreaterThan(0.75);
      
      // Check for outliers (score < 0.6)
      const lowQualityPolicies = policies.filter(p => p.soc2Alignment < 0.6);
      expect(lowQualityPolicies.length).toBe(0);
    });
  });

  describe('Copilot Response Quality', () => {
    const testQuestions = [
      {
        question: 'What is SOC 2 Type II compliance?',
        expectedKeywords: ['SOC 2', 'Type II', 'audit', 'controls', 'operational'],
        requiresCitation: false,
      },
      {
        question: 'What evidence do we have for access control?',
        expectedKeywords: ['access', 'control', 'authentication', 'authorization'],
        requiresCitation: true,
      },
      {
        question: 'How do we handle encryption at rest?',
        expectedKeywords: ['encryption', 'rest', 'data', 'KMS', 'AES'],
        requiresCitation: false,
      },
      {
        question: 'What are the requirements for CC6.1?',
        expectedKeywords: ['CC6.1', 'access', 'logical', 'physical'],
        requiresCitation: false,
      },
      {
        question: 'Show me our backup policies',
        expectedKeywords: ['backup', 'retention', 'recovery'],
        requiresCitation: true,
      },
      {
        question: 'What controls are we missing?',
        expectedKeywords: ['control', 'gap', 'missing', 'requirement'],
        requiresCitation: true,
      },
      {
        question: 'Explain our incident response process',
        expectedKeywords: ['incident', 'response', 'detection', 'remediation'],
        requiresCitation: true,
      },
      {
        question: 'What is our compliance status?',
        expectedKeywords: ['compliance', 'status', 'control', 'coverage'],
        requiresCitation: true,
      },
      {
        question: 'How often should we rotate access keys?',
        expectedKeywords: ['rotate', 'access key', 'days', 'periodic'],
        requiresCitation: false,
      },
      {
        question: 'What logging do we have enabled?',
        expectedKeywords: ['log', 'CloudTrail', 'monitoring', 'audit'],
        requiresCitation: true,
      },
    ];

    testQuestions.forEach((test, index) => {
      it(`should answer: ${test.question}`, async () => {
        const response = await copilotService.chat({
          message: test.question,
          customerId: testCustomerId,
          userId: testUserId,
        });

        // Verify response quality
        expect(response.message).toBeDefined();
        expect(response.message.length).toBeGreaterThan(100);

        // Check for expected keywords
        const lowerMessage = response.message.toLowerCase();
        const hasKeywords = test.expectedKeywords.some(keyword => 
          lowerMessage.includes(keyword.toLowerCase())
        );
        expect(hasKeywords).toBe(true);

        // Verify citations if required
        if (test.requiresCitation) {
          expect(response.citations.length).toBeGreaterThan(0);
          
          // Citations should have required fields
          response.citations.forEach(citation => {
            expect(citation.evidenceId).toBeDefined();
            expect(citation.title).toBeDefined();
            expect(citation.relevanceScore).toBeGreaterThan(0);
          });
        }

        // Response should not be generic
        expect(response.message).not.toContain('I don\'t have enough information');
        expect(response.message).not.toContain('I cannot answer');
      }, 30000);
    });

    it('should provide accurate citations', async () => {
      // Create specific evidence
      const evidence = await prisma.evidence.create({
        data: {
          id: 'citation-test-evidence',
          customerId: testCustomerId,
          integrationId: 'test-integration',
          title: 'Specific MFA Configuration',
          description: 'Multi-factor authentication enforced via Okta for all users',
          sourceType: 'OKTA',
          collectedAt: new Date(),
        },
      });

      const response = await copilotService.chat({
        message: 'What MFA evidence do we have from Okta?',
        customerId: testCustomerId,
        userId: testUserId,
      });

      // Should cite the specific evidence
      const citedEvidence = response.citations.find(c => c.evidenceId === evidence.id);
      expect(citedEvidence).toBeDefined();
      expect(citedEvidence.relevanceScore).toBeGreaterThan(0.7);
    });
  });
});

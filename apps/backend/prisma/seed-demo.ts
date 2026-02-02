import { PrismaClient, Framework, Frequency, IntegrationType, IntegrationStatus, Plan, CustomerStatus, CheckStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING DEMO SEEDING (IDEMPOTENT) ---');

  // 1. Create or Find Demo Customer
  console.log('Seeding Demo Customer...');
  const demoCustomer = await prisma.customer.upsert({
    where: { email: 'demo@kushim.io' },
    update: {},
    create: {
      name: 'Kushim Demo Corp',
      email: 'demo@kushim.io',
      plan: Plan.ENTERPRISE,
      status: CustomerStatus.ACTIVE,
      metadata: { notes: 'Automated demo account' },
    },
  });

  const customerId = demoCustomer.id;

  // 2. Create Home Admin User for Demo
  // Password is 'kushim123'
  console.log('Seeding Admin User...');
  const hashedPassword = await bcrypt.hash('kushim123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@kushim.io' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'admin@kushim.io',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'admin',
    },
  });

  // 3. Create Demo Integrations
  console.log('Seeding Integrations...');
  const integrationsData = [
    { type: IntegrationType.AWS, status: IntegrationStatus.ACTIVE, config: { region: 'us-east-1' }, healthScore: 0.95 },
    { type: IntegrationType.GITHUB, status: IntegrationStatus.ACTIVE, config: { owner: 'kushim-demo', repo: 'web-app' }, healthScore: 0.88 },
    { type: IntegrationType.OKTA, status: IntegrationStatus.ACTIVE, config: { orgUrl: 'kushim-demo.okta.com' }, healthScore: 1.0 },
    { type: IntegrationType.JIRA, status: IntegrationStatus.ACTIVE, config: { projectKey: 'DEMO', domain: 'kushim.atlassian.net' }, healthScore: 0.92 },
    { type: IntegrationType.SLACK, status: IntegrationStatus.ACTIVE, config: { channel: '#compliance-alerts' }, healthScore: 1.0 },
  ];

  const integrationMap: Record<string, string> = {};

  for (const int of integrationsData) {
    const existing = await prisma.integration.findFirst({
        where: { customerId, type: int.type }
    });

    if (existing) {
        integrationMap[int.type] = existing.id;
        console.log(`Integration ${int.type} already exists.`);
    } else {
        const created = await prisma.integration.create({
          data: {
            customerId,
            type: int.type,
            status: int.status,
            config: int.config,
            healthScore: int.healthScore,
          },
        });
        integrationMap[int.type] = created.id;
        console.log(`Created integration ${int.type}.`);
    }
  }

  // 4. Fetch some controls to link evidence to
  const controls = await prisma.control.findMany({
    where: { framework: Framework.SOC2 },
    take: 10,
  });

  if (controls.length === 0) {
    console.error('No controls found. Run seed.ts first!');
    return;
  }

  // 5. Create Mock Evidence and Checks
  console.log('Seeding Evidence and Compliance Checks...');
  
  // Find specific controls for better demoing
  const mfaControl = controls.find(c => c.controlId === 'CC6.1.1') || controls[0];
  const s3Control = controls.find(c => c.controlId === 'CC6.7.1') || controls[1];
  const githubControl = controls.find(c => c.controlId === 'CC8.1.1') || controls[2];
  const failControl = controls.find(c => c.controlId === 'CC7.2.3') || controls[3]; // Vulnerability Scan failure

  const mockEvidenceData = [
    {
      control: mfaControl,
      integration: IntegrationType.OKTA,
      status: 'PASS',
      details: { mfaRate: 1.0, totalUsers: 50, compliantUsers: 50 },
    },
    {
      control: s3Control,
      integration: IntegrationType.AWS,
      status: 'PASS',
      details: { encryptedBuckets: 12, totalBuckets: 12, complianceRate: 1.0 },
    },
    {
      control: githubControl,
      integration: IntegrationType.GITHUB,
      status: 'PASS',
      details: { protectedBranches: ['main', 'dev'], totalRepos: 1 },
    },
    {
      control: failControl,
      integration: IntegrationType.AWS,
      status: 'FAIL',
      details: { highFindings: 3, mediumFindings: 8, scanDate: new Date().toISOString() },
    },
  ];

  for (const ev of mockEvidenceData) {
    // Check if evidence already exists for this control in the last hour to avoid spamming
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingEvists = await prisma.evidence.findFirst({
        where: {
            customerId,
            controlId: ev.control.id,
            collectedAt: { gte: oneHourAgo }
        }
    });

    if (existingEvists) {
        console.log(`Evidence for ${ev.control.controlId} already exists in the last hour.`);
        continue;
    }

    const hash = crypto.createHash('sha256').update(JSON.stringify(ev.details) + Date.now()).digest('hex');
    
    const evidence = await prisma.evidence.create({
      data: {
        customerId,
        controlId: ev.control.id,
        integrationId: integrationMap[ev.integration],
        data: { status: ev.status, ...ev.details },
        hash,
        collectedAt: new Date(),
      },
    });

    const status = ev.status === 'PASS' ? CheckStatus.PASS : CheckStatus.FAIL;
    const check = await prisma.complianceCheck.create({
      data: {
        customerId,
        controlId: ev.control.id,
        evidenceId: evidence.id,
        status,
        checkedAt: new Date(),
        nextCheckAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        errorMessage: status === CheckStatus.FAIL ? 'Critical vulnerabilities found during automated AWS Inspector scan.' : null,
      },
    });

    // 6. If it's a failure, create a Jira Task
    if (status === CheckStatus.FAIL) {
      const issueKey = 'DEMO-101';
      const existingJira = await prisma.jiraTask.findUnique({
          where: { jiraIssueKey: issueKey }
      });

      if (!existingJira) {
          console.log('Seeding Jira Remediation Task...');
          await prisma.jiraTask.create({
            data: {
              customerId,
              complianceCheckId: check.id,
              jiraIssueKey: issueKey,
              jiraIssueId: '10001',
              status: 'IN PROGRESS',
            },
          });
      }
    }
  }

  console.log('--- DEMO SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

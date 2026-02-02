import { PrismaClient, Framework, Frequency, IntegrationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SOC 2 Controls...');

  const controls = [
    {
      framework: Framework.SOC2,
      controlId: 'CC6.1',
      title: 'Logical Access Security',
      description: 'The entity uses logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity\'s objectives.',
      testProcedure: 'Verify that Multi-Factor Authentication (MFA) is enabled for all IAM users with console access.',
      frequency: Frequency.DAILY,
      category: 'Security',
      integrationType: IntegrationType.AWS,
    },
    {
      framework: Framework.SOC2,
      controlId: 'CC6.2',
      title: 'User Registration and De-registration',
      description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity. For those users whose access is administered by the entity, user system credentials are removed when input data or other system access is no longer authorized.',
      testProcedure: 'Review active user list in Okta and verify against HR records. Ensure deprovisioned users are suspended.',
      frequency: Frequency.WEEKLY,
      category: 'Security',
      integrationType: IntegrationType.OKTA,
    },
    {
      framework: Framework.SOC2,
      controlId: 'CC6.7',
      title: 'Data Transmission',
      description: 'The entity implements policies, procedures, and controls to protect data usage and transmission.',
      testProcedure: 'Verify that all S3 buckets have default encryption enabled and block public access.',
      frequency: Frequency.DAILY,
      category: 'Security',
      integrationType: IntegrationType.AWS,
    },
    {
      framework: Framework.SOC2,
      controlId: 'CC7.2',
      title: 'Vulnerability Management',
      description: 'The entity detects and monitors for vulnerabilities in its system.',
      testProcedure: 'Check GitHub repositories for branch protection rules and require signed commits.',
      frequency: Frequency.WEEKLY,
      category: 'Security',
      integrationType: IntegrationType.GITHUB,
    },
    {
      framework: Framework.SOC2,
      controlId: 'CC7.3',
      title: 'Incident Response',
      description: 'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives and, if so, takes actions to prevent or address such failures.',
      testProcedure: 'Simulate an incident and verify that Slack alerts are sent and Jira tickets are created.',
      frequency: Frequency.MONTHLY,
      category: 'Security',
      integrationType: IntegrationType.SLACK,
    },
  ];

  for (const control of controls) {
    const existing = await prisma.control.findUnique({
      where: {
        framework_controlId: {
          framework: control.framework,
          controlId: control.controlId,
        },
      },
    });

    if (!existing) {
      await prisma.control.create({
        data: control,
      });
      console.log(`Created control: ${control.controlId}`);
    } else {
      await prisma.control.update({
        where: { id: existing.id },
        data: control,
      });
      console.log(`Updated control: ${control.controlId}`);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

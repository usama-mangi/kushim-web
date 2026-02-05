import { PrismaClient, Frequency, IntegrationType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSOC2() {
  console.log('Seeding SOC 2 controls...');
  
  // Get SOC2 framework
  const framework = await prisma.frameworkModel.findUnique({
    where: { code: 'SOC2' },
  });

  if (!framework) {
    throw new Error('SOC2 framework not found. Run migration script first.');
  }

  // Get sections for mapping
  const sections = await prisma.frameworkSection.findMany({
    where: { frameworkId: framework.id },
  });

  const sectionMap = Object.fromEntries(
    sections.map(s => [s.code, s.id])
  );

  const controls = [
    // CC1: Control Environment
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC1'],
      controlId: 'CC1.1.1',
      title: 'Code of Conduct',
      description: 'The entity maintains a Code of Conduct and Ethics policy that is reviewed annually and signed by all employees.',
      testProcedure: 'Verify that all employees have signed the Code of Conduct within the last 12 months.',
      frequency: Frequency.ANNUAL,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC1'],
      controlId: 'CC1.1.2',
      title: 'Whistleblower Policy',
      description: 'A whistleblower policy allows employees to report incidents anonymously without fear of retaliation.',
      testProcedure: 'Check for the existence of an anonymous reporting channel.',
      frequency: Frequency.ANNUAL,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC1'],
      controlId: 'CC1.2.1',
      title: 'Board Oversight',
      description: 'The Board of Directors meets quarterly to review security, compliance, and privacy risks.',
      testProcedure: 'Review minutes from quarterly board meetings (redacted for confidentiality).',
      frequency: Frequency.QUARTERLY,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC1'],
      controlId: 'CC1.3.1',
      title: 'Organizational Chart',
      description: 'An organizational chart is maintained to define reporting lines and responsibilities.',
      testProcedure: 'Verify the organizational chart is current and available to employees.',
      frequency: Frequency.QUARTERLY,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC1'],
      controlId: 'CC1.3.2',
      title: 'Job Descriptions',
      description: 'Job descriptions clearly define security roles and responsibilities.',
      testProcedure: 'Sample recent hires to ensure job descriptions include security responsibilities.',
      frequency: Frequency.ANNUAL,
      category: 'HR',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC1'],
      controlId: 'CC1.4.1',
      title: 'Background Checks',
      description: 'Background checks are performed for all new hires prior to employment.',
      testProcedure: 'Review HR records for a sample of new hires to verify completed background checks.',
      frequency: Frequency.WEEKLY,
      category: 'HR',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC1'],
      controlId: 'CC1.4.2',
      title: 'Confidentiality Agreements',
      description: 'All employees and contractors sign NDAs/Confidentiality agreements upon hire.',
      testProcedure: 'Verify signed NDAs for all active employees and contractors.',
      frequency: Frequency.WEEKLY,
      category: 'HR',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC1'],
      controlId: 'CC1.5.1',
      title: 'Performance Reviews',
      description: 'Annual performance reviews evaluate employee adherence to security responsibilities.',
      testProcedure: 'Confirm performance reviews are conducted annually.',
      frequency: Frequency.ANNUAL,
      category: 'HR',
    },

    // CC2: Communication & Information
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC2'],
      controlId: 'CC2.1.1',
      title: 'Security Awareness Training',
      description: 'All employees complete security awareness training upon hire and annually thereafter.',
      testProcedure: 'Check training records for 100% completion rate.',
      frequency: Frequency.MONTHLY,
      category: 'HR',
      integrationType: IntegrationType.OKTA,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC2'],
      controlId: 'CC2.2.1',
      title: 'Internal Security Communication',
      description: 'Security updates and policy changes are communicated to employees via Slack or email.',
      testProcedure: 'Verify a dedicated channel exists for security announcements.',
      frequency: Frequency.MONTHLY,
      category: 'Communication',
      integrationType: IntegrationType.SLACK,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC2'],
      controlId: 'CC2.3.1',
      title: 'External Vulnerability Disclosure',
      description: 'A process exists for external researchers to report security vulnerabilities.',
      testProcedure: 'Verify presence of security.txt or a disclosure policy on the website.',
      frequency: Frequency.ANNUAL,
      category: 'Communication',
    },

    // CC3: Risk Assessment
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC3'],
      controlId: 'CC3.1.1',
      title: 'Annual Risk Assessment',
      description: 'A formal risk assessment is conducted annually to identify threats and vulnerabilities.',
      testProcedure: 'Review the latest Risk Assessment Report.',
      frequency: Frequency.ANNUAL,
      category: 'Risk',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC3'],
      controlId: 'CC3.2.1',
      title: 'Fraud Risk Assessment',
      description: 'The risk assessment specifically considers fraud risks and potential incentives.',
      testProcedure: 'Verify fraud scenarios are included in the risk register.',
      frequency: Frequency.ANNUAL,
      category: 'Risk',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC3'],
      controlId: 'CC3.4.1',
      title: 'Change Impact Analysis',
      description: 'Significant changes to infrastructure or applications undergo a risk assessment.',
      testProcedure: 'Review change logs for evidence of risk analysis on major changes.',
      frequency: Frequency.MONTHLY,
      category: 'Risk',
      integrationType: IntegrationType.JIRA,
    },

    // CC4: Monitoring Activities
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC4'],
      controlId: 'CC4.1.1',
      title: 'Vendor Reviews',
      description: 'Critical vendors are reviewed annually for security compliance (SOC 2, ISO 27001).',
      testProcedure: 'Review vendor management logs and collected vendor audits.',
      frequency: Frequency.ANNUAL,
      category: 'Vendor Management',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC4'],
      controlId: 'CC4.2.1',
      title: 'Internal Audit',
      description: 'Periodic internal audits are performed to assess control effectiveness.',
      testProcedure: 'Review internal audit reports and remediation of findings.',
      frequency: Frequency.ANNUAL,
      category: 'Monitoring',
    },

    // CC5: Control Activities
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC5'],
      controlId: 'CC5.1.1',
      title: 'Information Security Policy',
      description: 'A master InfoSec policy is maintained, reviewed annually, and approved by management.',
      testProcedure: 'Verify the InfoSec policy was reviewed in the last 12 months.',
      frequency: Frequency.ANNUAL,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC5'],
      controlId: 'CC5.2.1',
      title: 'Acceptable Use Policy',
      description: 'An AUP defines acceptable use of company assets and is acknowledged by all users.',
      testProcedure: 'Verify AUP acknowledgement for all active users.',
      frequency: Frequency.ANNUAL,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC5'],
      controlId: 'CC5.3.1',
      title: 'Clean Desk Policy',
      description: 'Policy requires unattended computers to be locked and sensitive documents secured.',
      testProcedure: 'Walkthrough inspection or automated screen lock configuration check.',
      frequency: Frequency.DAILY,
      category: 'Security',
      integrationType: IntegrationType.OKTA,
    },

    // CC6: Logical and Physical Access (truncated for brevity - include all 64 controls)
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC6'],
      controlId: 'CC6.1.1',
      title: 'Access Request and Approval',
      description: 'Access to systems is granted only upon documented request and approval.',
      testProcedure: 'Sample Jira tickets for new access requests for approval evidence.',
      frequency: Frequency.WEEKLY,
      category: 'Access Control',
      integrationType: IntegrationType.JIRA,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['CC6'],
      controlId: 'CC6.1.2',
      title: 'MFA Enforcement (AWS)',
      description: 'Multi-Factor Authentication is enforced for all AWS IAM users.',
      testProcedure: 'Query AWS IAM for users without MFA enabled.',
      frequency: Frequency.DAILY,
      category: 'Access Control',
      integrationType: IntegrationType.AWS,
    },
    // ... Add remaining controls from original seed file
  ];

  for (const control of controls) {
    await prisma.control.upsert({
      where: {
        frameworkId_controlId: {
          frameworkId: control.frameworkId,
          controlId: control.controlId,
        },
      },
      update: control,
      create: control,
    });
    console.log(`✓ Control ${control.controlId}: ${control.title}`);
  }

  console.log(`Seeded ${controls.length} SOC 2 controls`);
}

import { PrismaClient, Frequency, IntegrationType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPCIDSS() {
  console.log('\nSeeding PCI DSS framework...');

  const framework = await prisma.frameworkModel.upsert({
    where: { code: 'PCIDSS' },
    update: {},
    create: {
      code: 'PCIDSS',
      name: 'PCI DSS 4.0',
      description: 'Payment Card Industry Data Security Standard - Requirements for protecting cardholder data',
      version: '4.0',
      isActive: true,
    },
  });

  console.log(`✓ PCI DSS Framework: ${framework.id}`);

  // 12 core requirements
  const sections = [
    { code: 'REQ1', title: 'Install and Maintain Network Security Controls', description: 'Firewalls and network segmentation', order: 1 },
    { code: 'REQ2', title: 'Apply Secure Configurations', description: 'Vendor defaults and security parameters', order: 2 },
    { code: 'REQ3', title: 'Protect Stored Account Data', description: 'Encryption and data retention', order: 3 },
    { code: 'REQ4', title: 'Protect Cardholder Data with Strong Cryptography', description: 'Encryption for transmission', order: 4 },
    { code: 'REQ5', title: 'Protect All Systems and Networks from Malicious Software', description: 'Anti-malware solutions', order: 5 },
    { code: 'REQ6', title: 'Develop and Maintain Secure Systems and Software', description: 'Secure development lifecycle', order: 6 },
    { code: 'REQ7', title: 'Restrict Access by Business Need to Know', description: 'Least privilege access', order: 7 },
    { code: 'REQ8', title: 'Identify Users and Authenticate Access', description: 'User identification and MFA', order: 8 },
    { code: 'REQ9', title: 'Restrict Physical Access', description: 'Physical security controls', order: 9 },
    { code: 'REQ10', title: 'Log and Monitor All Access', description: 'Audit trails and monitoring', order: 10 },
    { code: 'REQ11', title: 'Test Security of Systems and Networks Regularly', description: 'Vulnerability scanning and penetration testing', order: 11 },
    { code: 'REQ12', title: 'Support Information Security with Organizational Policies', description: 'Security policies and procedures', order: 12 },
  ];

  for (const section of sections) {
    await prisma.frameworkSection.upsert({
      where: {
        frameworkId_code: {
          frameworkId: framework.id,
          code: section.code,
        },
      },
      update: {},
      create: {
        frameworkId: framework.id,
        ...section,
      },
    });
    console.log(`✓ Section ${section.code}: ${section.title}`);
  }

  const sectionMap = Object.fromEntries(
    (await prisma.frameworkSection.findMany({
      where: { frameworkId: framework.id },
    })).map(s => [s.code, s.id])
  );

  // Sample controls from each requirement
  const controls = [
    {
      frameworkId: framework.id,
      sectionId: sectionMap['REQ1'],
      controlId: '1.2.1',
      title: 'Network Diagram',
      description: 'Configuration standards are defined and implemented for routers and firewalls, including documented network diagrams.',
      testProcedure: 'Review network diagrams showing cardholder data environment boundaries.',
      frequency: Frequency.QUARTERLY,
      category: 'Network Security',
      integrationType: IntegrationType.AWS,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['REQ3'],
      controlId: '3.5.1',
      title: 'Encryption of Stored Cardholder Data',
      description: 'Account data storage is encrypted with strong cryptography.',
      testProcedure: 'Verify all databases storing cardholder data are encrypted at rest.',
      frequency: Frequency.DAILY,
      category: 'Data Security',
      integrationType: IntegrationType.AWS,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['REQ4'],
      controlId: '4.2.1',
      title: 'Strong Cryptography for Transmission',
      description: 'Strong cryptography and security protocols are used for PAN transmission over open, public networks.',
      testProcedure: 'Verify TLS 1.2+ is enforced for all cardholder data transmission.',
      frequency: Frequency.MONTHLY,
      category: 'Network Security',
      integrationType: IntegrationType.AWS,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['REQ8'],
      controlId: '8.3.1',
      title: 'Multi-Factor Authentication',
      description: 'MFA is implemented for all access to the cardholder data environment.',
      testProcedure: 'Verify MFA is enforced for all CDE access.',
      frequency: Frequency.DAILY,
      category: 'Access Control',
      integrationType: IntegrationType.OKTA,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['REQ10'],
      controlId: '10.2.1',
      title: 'Audit Logs',
      description: 'Audit logs are implemented to support the detection of anomalies and suspicious activity.',
      testProcedure: 'Verify comprehensive audit logging is enabled for all systems in CDE.',
      frequency: Frequency.DAILY,
      category: 'Logging',
      integrationType: IntegrationType.AWS,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['REQ11'],
      controlId: '11.3.1',
      title: 'Vulnerability Scanning',
      description: 'Internal and external vulnerability scans are performed quarterly and after significant changes.',
      testProcedure: 'Review quarterly vulnerability scan reports from ASV.',
      frequency: Frequency.QUARTERLY,
      category: 'Vulnerability Management',
    },
  ];

  console.log(`Seeding ${controls.length} sample PCI DSS controls...`);
  
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
  }

  console.log(`✓ Seeded PCI DSS framework with ${controls.length} controls`);
  console.log('Note: Full PCI DSS 4.0 has 300+ sub-requirements.');
}

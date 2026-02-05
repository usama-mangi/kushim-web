import { PrismaClient, Frequency } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedISO27001() {
  console.log('\nSeeding ISO 27001 framework...');

  // Create ISO 27001 framework
  const framework = await prisma.frameworkModel.upsert({
    where: { code: 'ISO27001' },
    update: {},
    create: {
      code: 'ISO27001',
      name: 'ISO/IEC 27001:2022',
      description: 'Information security management system requirements - International standard for information security management',
      version: '2022',
      isActive: true,
    },
  });

  console.log(`✓ ISO 27001 Framework: ${framework.id}`);

  // Create sections (Annex A controls)
  const sections = [
    { code: 'A.5', title: 'Organizational Controls', description: '37 controls covering policies, roles, and information security organization', order: 1 },
    { code: 'A.6', title: 'People Controls', description: '8 controls for personnel security and awareness', order: 2 },
    { code: 'A.7', title: 'Physical Controls', description: '14 controls for physical and environmental security', order: 3 },
    { code: 'A.8', title: 'Technological Controls', description: '34 controls for technical security measures', order: 4 },
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

  // Get section IDs
  const sectionMap = Object.fromEntries(
    (await prisma.frameworkSection.findMany({
      where: { frameworkId: framework.id },
    })).map(s => [s.code, s.id])
  );

  // Sample controls (114 total in ISO 27001:2022)
  const controls = [
    // A.5 - Organizational Controls (37 controls)
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.5'],
      controlId: 'A.5.1',
      title: 'Policies for information security',
      description: 'Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur.',
      testProcedure: 'Review information security policy documentation, approval records, communication logs, and review cycle records.',
      frequency: Frequency.ANNUAL,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.5'],
      controlId: 'A.5.2',
      title: 'Information security roles and responsibilities',
      description: 'Information security roles and responsibilities shall be defined and allocated according to the organization needs.',
      testProcedure: 'Review organizational charts, job descriptions, and role assignments for information security responsibilities.',
      frequency: Frequency.ANNUAL,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.5'],
      controlId: 'A.5.3',
      title: 'Segregation of duties',
      description: 'Conflicting duties and areas of responsibility shall be segregated.',
      testProcedure: 'Review access control matrices and verify segregation of duties for critical functions.',
      frequency: Frequency.QUARTERLY,
      category: 'Access Control',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.5'],
      controlId: 'A.5.7',
      title: 'Threat intelligence',
      description: 'Information relating to information security threats shall be collected and analyzed to produce threat intelligence.',
      testProcedure: 'Review threat intelligence sources, collection processes, and analysis reports.',
      frequency: Frequency.MONTHLY,
      category: 'Risk',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.5'],
      controlId: 'A.5.10',
      title: 'Acceptable use of information and other associated assets',
      description: 'Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented.',
      testProcedure: 'Review acceptable use policy and evidence of user acknowledgment.',
      frequency: Frequency.ANNUAL,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.5'],
      controlId: 'A.5.23',
      title: 'Information security for use of cloud services',
      description: 'Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization\'s information security requirements.',
      testProcedure: 'Review cloud service inventory, contracts, and security requirements documentation.',
      frequency: Frequency.QUARTERLY,
      category: 'Vendor Management',
    },

    // A.6 - People Controls (8 controls)
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.6'],
      controlId: 'A.6.1',
      title: 'Screening',
      description: 'Background verification checks on all candidates for employment shall be carried out prior to joining the organization and on an ongoing basis taking into consideration applicable laws, regulations and ethics and be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.',
      testProcedure: 'Review background check records for new hires and contractors.',
      frequency: Frequency.WEEKLY,
      category: 'HR',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.6'],
      controlId: 'A.6.2',
      title: 'Terms and conditions of employment',
      description: 'The employment contractual agreements shall state the personnel\'s and the organization\'s responsibilities for information security.',
      testProcedure: 'Review employment contracts for information security clauses.',
      frequency: Frequency.ANNUAL,
      category: 'HR',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.6'],
      controlId: 'A.6.3',
      title: 'Information security awareness, education and training',
      description: 'Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization\'s information security policy, topic-specific policies and procedures, as relevant for their job function.',
      testProcedure: 'Review training records and completion rates for security awareness programs.',
      frequency: Frequency.MONTHLY,
      category: 'HR',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.6'],
      controlId: 'A.6.4',
      title: 'Disciplinary process',
      description: 'A disciplinary process shall be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation.',
      testProcedure: 'Review disciplinary process documentation and incident records.',
      frequency: Frequency.ANNUAL,
      category: 'HR',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.6'],
      controlId: 'A.6.8',
      title: 'Information security event reporting',
      description: 'The organization shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner.',
      testProcedure: 'Review incident reporting procedures and logs of reported events.',
      frequency: Frequency.MONTHLY,
      category: 'Incident Response',
    },

    // A.7 - Physical Controls (14 controls)
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.7'],
      controlId: 'A.7.1',
      title: 'Physical security perimeters',
      description: 'Security perimeters shall be defined and used to protect areas that contain information and other associated assets.',
      testProcedure: 'Inspect physical security perimeters and access controls.',
      frequency: Frequency.QUARTERLY,
      category: 'Physical Security',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.7'],
      controlId: 'A.7.2',
      title: 'Physical entry',
      description: 'Secure areas shall be protected by appropriate entry controls and access points.',
      testProcedure: 'Review physical access logs and badge systems.',
      frequency: Frequency.QUARTERLY,
      category: 'Physical Security',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.7'],
      controlId: 'A.7.4',
      title: 'Physical security monitoring',
      description: 'Premises shall be continuously monitored for unauthorized physical access.',
      testProcedure: 'Review CCTV systems and monitoring logs.',
      frequency: Frequency.MONTHLY,
      category: 'Physical Security',
    },

    // A.8 - Technological Controls (34 controls)
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.8'],
      controlId: 'A.8.1',
      title: 'User endpoint devices',
      description: 'Information stored on, processed by or accessible via user endpoint devices shall be protected.',
      testProcedure: 'Review endpoint protection policies and device management systems.',
      frequency: Frequency.WEEKLY,
      category: 'Workstation Security',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.8'],
      controlId: 'A.8.2',
      title: 'Privileged access rights',
      description: 'The allocation and use of privileged access rights shall be restricted and managed.',
      testProcedure: 'Review privileged access assignments and usage logs.',
      frequency: Frequency.QUARTERLY,
      category: 'Access Control',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.8'],
      controlId: 'A.8.3',
      title: 'Information access restriction',
      description: 'Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.',
      testProcedure: 'Review access control policies and verify implementation.',
      frequency: Frequency.MONTHLY,
      category: 'Access Control',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.8'],
      controlId: 'A.8.5',
      title: 'Secure authentication',
      description: 'Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.',
      testProcedure: 'Review MFA implementation and authentication policies.',
      frequency: Frequency.DAILY,
      category: 'Access Control',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.8'],
      controlId: 'A.8.9',
      title: 'Configuration management',
      description: 'Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.',
      testProcedure: 'Review configuration management processes and baseline configurations.',
      frequency: Frequency.MONTHLY,
      category: 'DevOps',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.8'],
      controlId: 'A.8.16',
      title: 'Monitoring activities',
      description: 'Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.',
      testProcedure: 'Review monitoring systems, alerts, and incident investigation logs.',
      frequency: Frequency.DAILY,
      category: 'Monitoring',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.8'],
      controlId: 'A.8.24',
      title: 'Use of cryptography',
      description: 'Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.',
      testProcedure: 'Review encryption policies and key management procedures.',
      frequency: Frequency.QUARTERLY,
      category: 'Data Security',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['A.8'],
      controlId: 'A.8.28',
      title: 'Secure coding',
      description: 'Secure coding principles shall be applied to software development.',
      testProcedure: 'Review secure coding standards and SAST/DAST implementation.',
      frequency: Frequency.WEEKLY,
      category: 'DevOps',
    },
  ];

  console.log(`Seeding ${controls.length} sample ISO 27001 controls...`);
  
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

  console.log(`✓ Seeded ISO 27001 framework with ${controls.length} controls`);
  console.log('Note: This is a sample set. Full ISO 27001:2022 has 93 Annex A controls.');
}

import { PrismaClient, Frequency, IntegrationType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedHIPAA() {
  console.log('\nSeeding HIPAA framework...');

  // Create HIPAA framework
  const framework = await prisma.frameworkModel.upsert({
    where: { code: 'HIPAA' },
    update: {},
    create: {
      code: 'HIPAA',
      name: 'HIPAA Security Rule',
      description: 'Health Insurance Portability and Accountability Act - Security and privacy standards for protected health information (PHI)',
      version: '2013 Final Omnibus Rule',
      isActive: true,
    },
  });

  console.log(`✓ HIPAA Framework: ${framework.id}`);

  // Create sections
  const sections = [
    { code: 'ADMIN', title: 'Administrative Safeguards', description: '9 standards covering policies, procedures, and workforce security', order: 1 },
    { code: 'PHYSICAL', title: 'Physical Safeguards', description: '4 standards for facility access and workstation security', order: 2 },
    { code: 'TECHNICAL', title: 'Technical Safeguards', description: '5 standards for access control, audit, integrity, and transmission security', order: 3 },
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

  // 45 HIPAA Security Rule controls
  const controls = [
    // Administrative Safeguards (164.308)
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(1)(i)',
      title: 'Security Management Process',
      description: 'Implement policies and procedures to prevent, detect, contain, and correct security violations.',
      testProcedure: 'Review security management policies and procedures documentation.',
      frequency: Frequency.ANNUAL,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(1)(ii)(A)',
      title: 'Risk Analysis',
      description: 'Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of ePHI.',
      testProcedure: 'Review annual risk assessment documentation covering ePHI risks.',
      frequency: Frequency.ANNUAL,
      category: 'Risk',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(1)(ii)(B)',
      title: 'Risk Management',
      description: 'Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level.',
      testProcedure: 'Review risk treatment plans and implementation evidence.',
      frequency: Frequency.QUARTERLY,
      category: 'Risk',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(1)(ii)(C)',
      title: 'Sanction Policy',
      description: 'Apply appropriate sanctions against workforce members who fail to comply with security policies.',
      testProcedure: 'Review sanction policy and evidence of enforcement.',
      frequency: Frequency.ANNUAL,
      category: 'HR',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(1)(ii)(D)',
      title: 'Information System Activity Review',
      description: 'Implement procedures to regularly review records of information system activity.',
      testProcedure: 'Review audit log review procedures and evidence of regular reviews.',
      frequency: Frequency.MONTHLY,
      category: 'Logging',
      integrationType: IntegrationType.AWS,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(3)(i)',
      title: 'Workforce Security',
      description: 'Implement policies and procedures to ensure that all workforce members have appropriate access to ePHI.',
      testProcedure: 'Review workforce security policies and access provisioning procedures.',
      frequency: Frequency.QUARTERLY,
      category: 'Access Control',
      integrationType: IntegrationType.OKTA,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(3)(ii)(A)',
      title: 'Authorization and/or Supervision',
      description: 'Implement procedures for authorization and/or supervision of workforce members who work with ePHI.',
      testProcedure: 'Review access authorization workflows and supervision procedures.',
      frequency: Frequency.QUARTERLY,
      category: 'Access Control',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(3)(ii)(B)',
      title: 'Workforce Clearance Procedure',
      description: 'Implement procedures to determine that the access of a workforce member to ePHI is appropriate.',
      testProcedure: 'Review background check and clearance procedures for ePHI access.',
      frequency: Frequency.WEEKLY,
      category: 'HR',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(3)(ii)(C)',
      title: 'Termination Procedures',
      description: 'Implement procedures for terminating access to ePHI when employment ends.',
      testProcedure: 'Review termination procedures and access revocation logs.',
      frequency: Frequency.WEEKLY,
      category: 'Access Control',
      integrationType: IntegrationType.OKTA,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(4)(i)',
      title: 'Information Access Management',
      description: 'Implement policies and procedures for authorizing access to ePHI.',
      testProcedure: 'Review access management policies and RBAC implementation.',
      frequency: Frequency.QUARTERLY,
      category: 'Access Control',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(5)(i)',
      title: 'Security Awareness and Training',
      description: 'Implement a security awareness and training program for all workforce members.',
      testProcedure: 'Review training program and completion records for all workforce members.',
      frequency: Frequency.MONTHLY,
      category: 'HR',
      integrationType: IntegrationType.OKTA,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(6)(i)',
      title: 'Security Incident Procedures',
      description: 'Implement policies and procedures to address security incidents.',
      testProcedure: 'Review incident response plan and incident logs.',
      frequency: Frequency.ANNUAL,
      category: 'Incident Response',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(7)(i)',
      title: 'Contingency Plan',
      description: 'Establish and implement policies and procedures for responding to emergencies.',
      testProcedure: 'Review contingency plan, backup procedures, and disaster recovery testing.',
      frequency: Frequency.ANNUAL,
      category: 'Business Continuity',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(a)(8)',
      title: 'Evaluation',
      description: 'Perform a periodic technical and non-technical evaluation of security policies.',
      testProcedure: 'Review annual security evaluation reports.',
      frequency: Frequency.ANNUAL,
      category: 'Governance',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['ADMIN'],
      controlId: '164.308(b)(1)',
      title: 'Business Associate Contracts',
      description: 'Obtain satisfactory assurances that business associates will safeguard ePHI.',
      testProcedure: 'Review signed Business Associate Agreements (BAAs).',
      frequency: Frequency.ANNUAL,
      category: 'Vendor Management',
    },

    // Physical Safeguards (164.310)
    {
      frameworkId: framework.id,
      sectionId: sectionMap['PHYSICAL'],
      controlId: '164.310(a)(1)',
      title: 'Facility Access Controls',
      description: 'Implement policies and procedures to limit physical access to electronic information systems and facilities.',
      testProcedure: 'Review physical access control systems and visitor logs.',
      frequency: Frequency.QUARTERLY,
      category: 'Physical Security',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['PHYSICAL'],
      controlId: '164.310(b)',
      title: 'Workstation Use',
      description: 'Implement policies and procedures that specify proper use of workstations.',
      testProcedure: 'Review workstation use policy and monitoring evidence.',
      frequency: Frequency.QUARTERLY,
      category: 'Workstation Security',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['PHYSICAL'],
      controlId: '164.310(c)',
      title: 'Workstation Security',
      description: 'Implement physical safeguards for workstations that access ePHI.',
      testProcedure: 'Review workstation security controls (screen locks, physical placement).',
      frequency: Frequency.MONTHLY,
      category: 'Workstation Security',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['PHYSICAL'],
      controlId: '164.310(d)(1)',
      title: 'Device and Media Controls',
      description: 'Implement policies and procedures for disposal, media reuse, accountability, and data backup/storage.',
      testProcedure: 'Review media handling, disposal, and backup procedures.',
      frequency: Frequency.QUARTERLY,
      category: 'Data Security',
      integrationType: IntegrationType.AWS,
    },

    // Technical Safeguards (164.312)
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(a)(1)',
      title: 'Access Control',
      description: 'Implement technical policies and procedures for electronic information systems that maintain ePHI to allow access only to authorized persons.',
      testProcedure: 'Review access control mechanisms and authorization logs.',
      frequency: Frequency.DAILY,
      category: 'Access Control',
      integrationType: IntegrationType.OKTA,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(a)(2)(i)',
      title: 'Unique User Identification',
      description: 'Assign a unique name and/or number for identifying and tracking user identity.',
      testProcedure: 'Verify all users have unique identifiers.',
      frequency: Frequency.WEEKLY,
      category: 'Access Control',
      integrationType: IntegrationType.OKTA,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(a)(2)(ii)',
      title: 'Emergency Access Procedure',
      description: 'Establish procedures for obtaining necessary ePHI during an emergency.',
      testProcedure: 'Review emergency access procedures and break-glass account documentation.',
      frequency: Frequency.ANNUAL,
      category: 'Access Control',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(a)(2)(iii)',
      title: 'Automatic Logoff',
      description: 'Implement electronic procedures that terminate session after predetermined time of inactivity.',
      testProcedure: 'Verify session timeout configurations across systems.',
      frequency: Frequency.MONTHLY,
      category: 'Access Control',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(a)(2)(iv)',
      title: 'Encryption and Decryption',
      description: 'Implement a mechanism to encrypt and decrypt ePHI.',
      testProcedure: 'Review encryption implementation for ePHI at rest and in transit.',
      frequency: Frequency.MONTHLY,
      category: 'Data Security',
      integrationType: IntegrationType.AWS,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(b)',
      title: 'Audit Controls',
      description: 'Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain ePHI.',
      testProcedure: 'Review audit logging systems and log retention policies.',
      frequency: Frequency.DAILY,
      category: 'Logging',
      integrationType: IntegrationType.AWS,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(c)(1)',
      title: 'Integrity',
      description: 'Implement policies and procedures to protect ePHI from improper alteration or destruction.',
      testProcedure: 'Review integrity controls and change detection mechanisms.',
      frequency: Frequency.MONTHLY,
      category: 'Data Security',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(c)(2)',
      title: 'Mechanism to Authenticate ePHI',
      description: 'Implement electronic mechanisms to corroborate that ePHI has not been altered or destroyed.',
      testProcedure: 'Review hash validation, digital signatures, or checksums for ePHI.',
      frequency: Frequency.MONTHLY,
      category: 'Data Security',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(d)',
      title: 'Person or Entity Authentication',
      description: 'Implement procedures to verify that a person or entity seeking access to ePHI is the one claimed.',
      testProcedure: 'Review MFA implementation and authentication logs.',
      frequency: Frequency.DAILY,
      category: 'Access Control',
      integrationType: IntegrationType.OKTA,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(e)(1)',
      title: 'Transmission Security',
      description: 'Implement technical security measures to guard against unauthorized access to ePHI transmitted over an electronic network.',
      testProcedure: 'Review TLS/SSL configuration and VPN usage for ePHI transmission.',
      frequency: Frequency.MONTHLY,
      category: 'Network Security',
      integrationType: IntegrationType.AWS,
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(e)(2)(i)',
      title: 'Integrity Controls',
      description: 'Implement security measures to ensure electronically transmitted ePHI is not improperly modified.',
      testProcedure: 'Review transmission integrity controls (checksums, encryption).',
      frequency: Frequency.MONTHLY,
      category: 'Data Security',
    },
    {
      frameworkId: framework.id,
      sectionId: sectionMap['TECHNICAL'],
      controlId: '164.312(e)(2)(ii)',
      title: 'Encryption',
      description: 'Implement a mechanism to encrypt ePHI whenever deemed appropriate.',
      testProcedure: 'Verify encryption for ePHI in transit (TLS 1.2+).',
      frequency: Frequency.MONTHLY,
      category: 'Data Security',
      integrationType: IntegrationType.AWS,
    },
  ];

  console.log(`Seeding ${controls.length} HIPAA controls...`);
  
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

  console.log(`✓ Seeded HIPAA framework with ${controls.length} controls`);
}

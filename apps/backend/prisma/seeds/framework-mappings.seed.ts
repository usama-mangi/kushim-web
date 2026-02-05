import { PrismaClient, MappingType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cross-framework control mappings
 * Maps similar/equivalent controls across different frameworks
 */
export async function seedFrameworkMappings() {
  console.log('\nSeeding cross-framework mappings...');

  // Get frameworks
  const soc2 = await prisma.frameworkModel.findUnique({ where: { code: 'SOC2' } });
  const iso27001 = await prisma.frameworkModel.findUnique({ where: { code: 'ISO27001' } });
  const hipaa = await prisma.frameworkModel.findUnique({ where: { code: 'HIPAA' } });
  const pcidss = await prisma.frameworkModel.findUnique({ where: { code: 'PCIDSS' } });

  if (!soc2 || !iso27001 || !hipaa || !pcidss) {
    console.log('⚠ Some frameworks not found. Skipping mappings.');
    return;
  }

  // Define mappings by control IDs
  const mappings = [
    // Access Control mappings
    { soc2: 'CC6.1.2', iso27001: 'A.8.5', hipaa: '164.312(a)(2)(i)', pcidss: '8.3.1', type: MappingType.EQUIVALENT, notes: 'MFA requirement' },
    { soc2: 'CC6.1.3', iso27001: 'A.8.5', hipaa: '164.312(d)', type: MappingType.EQUIVALENT, notes: 'MFA enforcement' },
    
    // Encryption mappings
    { soc2: 'CC6.7.1', iso27001: 'A.8.24', hipaa: '164.312(a)(2)(iv)', pcidss: '3.5.1', type: MappingType.EQUIVALENT, notes: 'Encryption at rest' },
    { soc2: 'CC6.7.3', iso27001: 'A.8.24', hipaa: '164.312(e)(2)(ii)', pcidss: '4.2.1', type: MappingType.EQUIVALENT, notes: 'Encryption in transit' },
    
    // Policy mappings
    { soc2: 'CC5.1.1', iso27001: 'A.5.1', hipaa: '164.308(a)(1)(i)', pcidss: '12.1.1', type: MappingType.SIMILAR, notes: 'Information security policy' },
    
    // Training mappings
    { soc2: 'CC2.1.1', iso27001: 'A.6.3', hipaa: '164.308(a)(5)(i)', type: MappingType.EQUIVALENT, notes: 'Security awareness training' },
    
    // HR mappings
    { soc2: 'CC1.4.1', iso27001: 'A.6.1', hipaa: '164.308(a)(3)(ii)(B)', type: MappingType.EQUIVALENT, notes: 'Background checks' },
    { soc2: 'CC1.4.2', iso27001: 'A.6.2', type: MappingType.SIMILAR, notes: 'Confidentiality agreements' },
    { soc2: 'CC6.2.2', iso27001: 'A.8.2', hipaa: '164.308(a)(3)(ii)(C)', type: MappingType.EQUIVALENT, notes: 'Termination procedures' },
    
    // Logging mappings
    { soc2: 'CC7.2.3', iso27001: 'A.8.16', hipaa: '164.312(b)', pcidss: '10.2.1', type: MappingType.EQUIVALENT, notes: 'Audit logging' },
    
    // Risk assessment mappings
    { soc2: 'CC3.1.1', iso27001: 'A.5.7', hipaa: '164.308(a)(1)(ii)(A)', type: MappingType.EQUIVALENT, notes: 'Risk assessment' },
    
    // Change management mappings
    { soc2: 'CC8.1.2', iso27001: 'A.8.9', type: MappingType.SIMILAR, notes: 'Peer review and configuration management' },
    
    // Incident response mappings
    { soc2: 'CC7.3.1', iso27001: 'A.6.8', hipaa: '164.308(a)(6)(i)', type: MappingType.SIMILAR, notes: 'Incident response plan' },
    
    // Business continuity mappings
    { soc2: 'CC7.4.1', hipaa: '164.308(a)(7)(i)', type: MappingType.SIMILAR, notes: 'Business continuity/contingency plan' },
    { soc2: 'A1.2.1', hipaa: '164.310(d)(1)', type: MappingType.SIMILAR, notes: 'Data backups' },
    
    // Access control - general
    { soc2: 'CC6.1.1', iso27001: 'A.8.3', hipaa: '164.308(a)(4)(i)', pcidss: '7.1.1', type: MappingType.SIMILAR, notes: 'Access request and authorization' },
    { soc2: 'CC6.3.1', iso27001: 'A.8.2', type: MappingType.EQUIVALENT, notes: 'Least privilege' },
    
    // Vendor management mappings
    { soc2: 'CC9.1.1', hipaa: '164.308(b)(1)', type: MappingType.EQUIVALENT, notes: 'Business Associate Agreements / DPAs' },
    { soc2: 'CC4.1.1', iso27001: 'A.5.23', type: MappingType.SIMILAR, notes: 'Vendor/cloud service reviews' },
    
    // Physical security mappings
    { soc2: 'CC6.4.1', iso27001: 'A.7.2', hipaa: '164.310(a)(1)', pcidss: '9.1.1', type: MappingType.SIMILAR, notes: 'Physical access controls' },
    
    // Vulnerability management mappings
    { soc2: 'CC7.2.1', iso27001: 'A.8.28', pcidss: '6.2.1', type: MappingType.SIMILAR, notes: 'Secure coding / SAST' },
    { soc2: 'CC7.2.2', pcidss: '11.3.1', type: MappingType.SIMILAR, notes: 'Vulnerability scanning' },
    
    // Network security mappings
    { soc2: 'CC6.6.1', pcidss: '1.2.1', type: MappingType.SIMILAR, notes: 'Firewall / WAF configuration' },
    { soc2: 'CC6.6.2', iso27001: 'A.8.9', pcidss: '1.2.1', type: MappingType.SIMILAR, notes: 'Network segmentation' },
  ];

  let createdCount = 0;

  for (const mapping of mappings) {
    // Get control IDs for source and targets
    const sourceControl = await prisma.control.findFirst({
      where: {
        frameworkId: soc2.id,
        controlId: mapping.soc2,
      },
    });

    if (!sourceControl) {
      console.log(`⚠ Source control not found: SOC2 ${mapping.soc2}`);
      continue;
    }

    // Map to ISO 27001
    if (mapping.iso27001) {
      const targetControl = await prisma.control.findFirst({
        where: {
          frameworkId: iso27001.id,
          controlId: mapping.iso27001,
        },
      });

      if (targetControl) {
        await prisma.frameworkMapping.upsert({
          where: {
            sourceControlId_targetControlId: {
              sourceControlId: sourceControl.id,
              targetControlId: targetControl.id,
            },
          },
          update: {},
          create: {
            sourceControlId: sourceControl.id,
            targetControlId: targetControl.id,
            mappingType: mapping.type,
            notes: mapping.notes,
          },
        });
        createdCount++;
      }
    }

    // Map to HIPAA
    if (mapping.hipaa) {
      const targetControl = await prisma.control.findFirst({
        where: {
          frameworkId: hipaa.id,
          controlId: mapping.hipaa,
        },
      });

      if (targetControl) {
        await prisma.frameworkMapping.upsert({
          where: {
            sourceControlId_targetControlId: {
              sourceControlId: sourceControl.id,
              targetControlId: targetControl.id,
            },
          },
          update: {},
          create: {
            sourceControlId: sourceControl.id,
            targetControlId: targetControl.id,
            mappingType: mapping.type,
            notes: mapping.notes,
          },
        });
        createdCount++;
      }
    }

    // Map to PCI DSS
    if (mapping.pcidss) {
      const targetControl = await prisma.control.findFirst({
        where: {
          frameworkId: pcidss.id,
          controlId: mapping.pcidss,
        },
      });

      if (targetControl) {
        await prisma.frameworkMapping.upsert({
          where: {
            sourceControlId_targetControlId: {
              sourceControlId: sourceControl.id,
              targetControlId: targetControl.id,
            },
          },
          update: {},
          create: {
            sourceControlId: sourceControl.id,
            targetControlId: targetControl.id,
            mappingType: mapping.type,
            notes: mapping.notes,
          },
        });
        createdCount++;
      }
    }
  }

  console.log(`✓ Created ${createdCount} cross-framework mappings`);
}

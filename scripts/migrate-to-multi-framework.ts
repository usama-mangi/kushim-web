import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to convert existing SOC2 data to multi-framework support
 * 
 * Steps:
 * 1. Create SOC2 framework record
 * 2. Create framework sections for SOC2
 * 3. Update existing controls to reference framework
 * 4. Associate existing customers with SOC2 framework
 */

async function main() {
  console.log('Starting migration to multi-framework support...\n');

  // Step 1: Create SOC2 Framework
  console.log('Step 1: Creating SOC2 Framework...');
  const soc2Framework = await prisma.frameworkModel.upsert({
    where: { code: 'SOC2' },
    update: {},
    create: {
      code: 'SOC2',
      name: 'SOC 2 Type II',
      description: 'System and Organization Controls 2 (SOC 2) - Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy',
      version: '2017',
      isActive: true,
    },
  });
  console.log(`✓ SOC2 Framework created: ${soc2Framework.id}\n`);

  // Step 2: Create SOC2 Sections
  console.log('Step 2: Creating SOC2 Framework Sections...');
  const sections = [
    { code: 'CC1', title: 'Control Environment', description: 'Governance and HR policies', order: 1 },
    { code: 'CC2', title: 'Communication and Information', description: 'Communication policies and procedures', order: 2 },
    { code: 'CC3', title: 'Risk Assessment', description: 'Risk identification and assessment', order: 3 },
    { code: 'CC4', title: 'Monitoring Activities', description: 'Monitoring and vendor management', order: 4 },
    { code: 'CC5', title: 'Control Activities', description: 'Policies and procedures', order: 5 },
    { code: 'CC6', title: 'Logical and Physical Access', description: 'Access controls and security', order: 6 },
    { code: 'CC7', title: 'System Operations', description: 'System monitoring and operations', order: 7 },
    { code: 'CC8', title: 'Change Management', description: 'Change management processes', order: 8 },
    { code: 'CC9', title: 'Risk Mitigation', description: 'Vendor risk management', order: 9 },
    { code: 'A1', title: 'Availability', description: 'System availability and redundancy', order: 10 },
    { code: 'PI1', title: 'Processing Integrity', description: 'Processing completeness and accuracy', order: 11 },
    { code: 'C1', title: 'Confidentiality', description: 'Data confidentiality controls', order: 12 },
    { code: 'P1', title: 'Privacy - Notice', description: 'Privacy notice requirements', order: 13 },
    { code: 'P2', title: 'Privacy - Choice and Consent', description: 'Data subject rights', order: 14 },
    { code: 'P3', title: 'Privacy - Collection', description: 'Data collection controls', order: 15 },
  ];

  for (const section of sections) {
    await prisma.frameworkSection.upsert({
      where: {
        frameworkId_code: {
          frameworkId: soc2Framework.id,
          code: section.code,
        },
      },
      update: {},
      create: {
        frameworkId: soc2Framework.id,
        ...section,
      },
    });
    console.log(`✓ Created section: ${section.code} - ${section.title}`);
  }
  console.log();

  // Step 3: Get existing controls count
  console.log('Step 3: Checking existing controls...');
  const existingControlsCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM controls
  `;
  const controlCount = Number(existingControlsCount[0].count);
  console.log(`Found ${controlCount} existing controls to migrate\n`);

  if (controlCount > 0) {
    console.log('Note: Existing controls will be updated by new seed data');
    console.log('Old "framework" enum field will be replaced with "frameworkId" foreign key\n');
  }

  // Step 4: Associate existing customers with SOC2
  console.log('Step 4: Associating existing customers with SOC2 framework...');
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true },
  });

  for (const customer of customers) {
    await prisma.customerFramework.upsert({
      where: {
        customerId_frameworkId: {
          customerId: customer.id,
          frameworkId: soc2Framework.id,
        },
      },
      update: {},
      create: {
        customerId: customer.id,
        frameworkId: soc2Framework.id,
        status: 'IN_PROGRESS',
      },
    });
    console.log(`✓ Associated customer "${customer.name}" with SOC2 framework`);
  }

  console.log(`\n✓ Migration completed successfully!`);
  console.log(`\nNext steps:`);
  console.log(`1. Run: npm run db:seed to populate framework controls`);
  console.log(`2. Verify the migration in Prisma Studio`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

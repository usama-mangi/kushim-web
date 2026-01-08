import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as argon2 from 'argon2';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = ['ADMIN', 'USER'];

  // 1. Create Roles
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  console.log('Seed: Roles initialized.');

  // 2. Create Default Admin User
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    const passwordHash = await argon2.hash('admin123');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@kushim.com' },
      update: {},
      create: {
        email: 'admin@kushim.com',
        passwordHash,
        roleId: adminRole.id,
      },
    });
    console.log('Seed: Admin user initialized (admin@kushim.com / admin123).');

    // 3. Create Default Data Source (GitHub)
    const githubId = '11111111-1111-1111-1111-111111111111';
    await prisma.dataSource.upsert({
      where: { id: githubId },
      update: {},
      create: {
        id: githubId,
        userId: adminUser.id,
        providerName: 'github',
        credentialsEncrypted: {},
        status: 'active',
      },
    });

    // 4. Create Default Data Source (Jira)
    const jiraId = '22222222-2222-2222-2222-222222222222';
    await prisma.dataSource.upsert({
      where: { id: jiraId },
      update: {},
      create: {
        id: jiraId,
        userId: adminUser.id,
        providerName: 'jira',
        credentialsEncrypted: {},
        status: 'active',
      },
    });

    // 5. Create Default Data Source (Slack)
    const slackId = '33333333-3333-3333-3333-333333333333';
    await prisma.dataSource.upsert({
      where: { id: slackId },
      update: {},
      create: {
        id: slackId,
        userId: adminUser.id,
        providerName: 'slack',
        credentialsEncrypted: {},
        status: 'active',
      },
    });

    console.log(`Seed: Data sources initialized (GitHub: ${githubId}, Jira: ${jiraId}, Slack: ${slackId}).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

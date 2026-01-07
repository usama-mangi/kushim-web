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
    await prisma.dataSource.upsert({
      where: { id: 'default-github-source' }, // specific UUID for stability
      update: {},
      create: {
        id: 'default-github-source',
        userId: adminUser.id,
        providerName: 'github',
        credentialsEncrypted: {}, // Empty for mock adapter
        status: 'active',
      },
    });
    console.log('Seed: Default GitHub data source initialized.');
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

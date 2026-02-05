import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const integrations = await prisma.integration.findMany();
  console.log('--- ALL INTEGRATIONS ---');
  console.log(JSON.stringify(integrations, null, 2));
  
  const customers = await prisma.customer.findMany();
  console.log('--- ALL CUSTOMERS ---');
  console.log(JSON.stringify(customers, null, 2));
  
  const users = await prisma.user.findMany();
  console.log('--- ALL USERS ---');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

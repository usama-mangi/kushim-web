import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@kushim.io' },
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  console.log('User found:', user.email);
  console.log('Password hash:', user.password);

  const isMatch = await bcrypt.compare('kushim123', user.password);
  console.log('Does "kushim123" match?', isMatch);
}

main().finally(() => prisma.$disconnect());

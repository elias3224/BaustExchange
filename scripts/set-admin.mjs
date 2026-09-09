import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'eliasahmad3224@gmail.com';
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin' },
    create: {
      googleId: 'admin_eliasahmad3224',
      email,
      name: 'Elias Ahmad',
      role: 'admin',
      status: 'active',
    },
  });
  console.log('SUCCESS: User promoted/created as admin:', user.email, 'Role:', user.role);
}

main()
  .catch((e) => console.error('ERROR:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });


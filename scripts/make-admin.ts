/**
 * Promote an existing user to admin by email.
 *
 * Usage:
 *   npm run make-admin -- user@example.com
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run make-admin -- user@example.com');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    console.error('The user must sign in with Google at least once first.');
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`${user.email} is already an admin.`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin' },
  });
  console.log(`Done. ${user.email} is now an admin.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
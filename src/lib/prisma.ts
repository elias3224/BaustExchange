import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var prisma` to survive hot reloads in dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * A single Prisma Client instance is reused across hot reloads in development
 * to avoid exhausting database connections. In production a new client is
 * created per process.
 */
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;

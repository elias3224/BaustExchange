/**
 * Reusable server-side authorization helpers.
 *
 * Every protected page / route handler must use these and never trust
 * role information sent from the client.
 */
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

/**
 * Get the currently authenticated user object from the session.
 * Accepts an optional NextRequest for fallback cookie token verification.
 * Returns `null` if unauthenticated or blocked.
 */
export async function currentUser(req?: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const user = session.user as any;
      if (user?.status === 'blocked') return null;
      return user;
    }
    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (dbUser && dbUser.status !== 'blocked') return dbUser;
    }
  } catch (e: any) {
    if (e?.digest !== 'DYNAMIC_SERVER_USAGE') {
      console.warn('currentUser auth() check fallback triggered:', e);
    }
  }


  if (req) {
    try {
      const token = await getToken({ req, secret: process.env.AUTH_SECRET, raw: false });
      if (token?.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (dbUser && dbUser.status !== 'blocked') return dbUser;
      }
      if (token?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email as string } });
        if (dbUser && dbUser.status !== 'blocked') return dbUser;
      }
    } catch (e) {
      console.error('currentUser getToken check failed:', e);
    }
  }

  return null;
}

/**
 * Require an authenticated user. Returns the user or throws an error that
 * route boundaries translate into a 401 / redirect.
 */
export async function requireAuth(req?: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    const err: any = new Error('Authentication required');
    err.redirect = '/login';
    err.status = 401;
    throw err;
  }
  return user;
}

/** Require an authenticated admin. */
export async function requireAdmin(req?: NextRequest) {
  const user = await requireAuth(req);
  if (user.role !== 'admin') {
    const err: any = new Error('Admin access required');
    err.status = 403;
    throw err;
  }
  return user;
}

/** Require an authenticated teacher or admin. */
export async function requireTeacher(req?: NextRequest) {
  const user = await requireAuth(req);
  if (user.role !== 'teacher' && user.role !== 'admin') {
    const err: any = new Error('Teacher access required');
    err.status = 403;
    throw err;
  }
  return user;
}

/** Require an authenticated student or admin (the default role). */
export async function requireStudent(req?: NextRequest) {
  const user = await requireAuth(req);
  if (user.role !== 'student' && user.role !== 'admin') {
    const err: any = new Error('Student access required');
    err.status = 403;
    throw err;
  }
  return user;
}

/**
 * Check whether a user owns a given listing.
 * Performs a real database lookup - ownership is never trusted from the client.
 */
export async function canEditListing(listingId: string, userId: string): Promise<boolean> {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { userId: true } });
  return !!listing && listing.userId === userId;
}

/** Returns true if the user owns the listing (alias for clarity). */
export async function canDeleteListing(listingId: string, userId: string): Promise<boolean> {
  return canEditListing(listingId, userId);
}

/**
 * Simple id-based ownership check (no DB lookup). Use when you already hold
 * the owner id (e.g. after a query).
 */
export function isOwner(userId: string, ownerId: string): boolean {
  return userId === ownerId;
}

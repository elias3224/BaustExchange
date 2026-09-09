import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import prisma from '@/lib/prisma';

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'eliasahmad3224@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.email?.split('@')[0] ?? 'User',
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider !== 'google') return true;

      const email = user?.email || profile?.email;
      const googleId = account?.providerAccountId || user?.id || (profile as any)?.sub;

      if (!email) {
        console.error('signIn error: missing email', { user, profile });
        return true;
      }

      const isTargetAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

      try {
        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              ...(googleId ? [{ googleId }] : []),
              { email: email.toLowerCase() },
            ],
          },
        });

        if (existing && existing.status === 'blocked') {
          console.warn(`Blocked user login attempt: ${email}`);
          return false;
        }

        let targetUserId = existing?.id;
        let targetUserName = user.name || existing?.name || 'User';

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              ...(googleId ? { googleId } : {}),
              name: user.name ?? existing.name,
              image: user.image ?? existing.image,
              ...(isTargetAdmin ? { role: 'admin', hasSelectedRole: true } : {}),
            },
          });
        } else {
          const newUser = await prisma.user.create({
            data: {
              googleId: googleId || email,
              email: email.toLowerCase(),
              name: user.name ?? email.split('@')[0] ?? 'User',
              image: user.image,
              role: isTargetAdmin ? 'admin' : 'student',
              hasSelectedRole: isTargetAdmin ? true : false,
              status: 'active',
            },
          });
          targetUserId = newUser.id;
          targetUserName = newUser.name;
        }

        if (targetUserId) {
          const recentLoginNotif = await prisma.notification.findFirst({
            where: {
              userId: targetUserId,
              type: 'ADMIN',
              message: { contains: 'logged in' },
            },
            orderBy: { createdAt: 'desc' },
          });

          const isRecent = recentLoginNotif && (Date.now() - new Date(recentLoginNotif.createdAt).getTime()) < 15 * 60 * 1000;
          if (!isRecent) {
            await prisma.notification.create({
              data: {
                userId: targetUserId,
                type: 'ADMIN',
                message: `Welcome back, ${targetUserName}! You logged in to BAUST Exchange.`,
              },
            });
          }
        }
      } catch (e) {
        console.error('signIn DB sync error (continuing session):', e);
      }
      return true;
    },

    async redirect({ url, baseUrl }: any) {
      // Allow relative URLs (e.g. '/dashboard') resolved against the app origin.
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Only allow absolute URLs on the same origin (prevents open redirects).
      // NOTE: must never throw - @auth/core passes raw callbackUrl values here
      // (query param / cookie) and an unparseable value previously crashed the
      // whole sign-in action with "TypeError: Invalid URL" -> error=Configuration.
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        return baseUrl;
      }
      return baseUrl;
    },

    async jwt({ token, user, account }: any) {
      if (account && user) {
        token.accessToken = account.access_token;
      }
      const email = user?.email || token?.email;
      if (email) {
        const isTargetAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
              id: true,
              role: true,
              status: true,
              isVerifiedSeller: true,
              hasSelectedRole: true,
              department: true,
              studentId: true,
              phone: true,
              name: true,
              image: true,
            },
          });

          if (!dbUser) {
            const created = await prisma.user.create({
              data: {
                googleId: token.sub || email,
                email: email.toLowerCase(),
                name: token.name || email.split('@')[0] || 'User',
                image: token.picture,
                role: isTargetAdmin ? 'admin' : 'student',
                hasSelectedRole: isTargetAdmin ? true : false,
                status: 'active',
              },
            });
            dbUser = {
              id: created.id,
              role: created.role,
              status: created.status,
              isVerifiedSeller: created.isVerifiedSeller,
              hasSelectedRole: created.hasSelectedRole,
              department: created.department,
              studentId: created.studentId,
              phone: created.phone,
              name: created.name,
              image: created.image,
            };
          }

          if (dbUser) {
            token.id = dbUser.id;
            token.role = isTargetAdmin ? 'admin' : dbUser.role;
            token.status = dbUser.status;
            token.isVerifiedSeller = dbUser.isVerifiedSeller;
            token.hasSelectedRole = isTargetAdmin ? true : dbUser.hasSelectedRole;
            token.department = dbUser.department;
            token.studentId = dbUser.studentId;
            token.phone = dbUser.phone;
            if (dbUser.name) token.name = dbUser.name;
            if (dbUser.image) token.picture = dbUser.image;
          }
        } catch (e) {
          console.error('jwt error fetching dbUser', e);
        }

        if (isTargetAdmin) {
          token.role = 'admin';
          token.hasSelectedRole = true;
        }
      }
      return token;
    },

    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role || 'student';
        (session.user as any).status = token.status || 'active';
        (session.user as any).isVerifiedSeller = token.isVerifiedSeller ?? false;
        (session.user as any).hasSelectedRole = token.hasSelectedRole ?? true;
        (session.user as any).department = token.department;
        (session.user as any).studentId = token.studentId;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV !== 'production',
} satisfies NextAuthConfig;

const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(() => authOptions);

export { auth, signIn, signOut, GET, POST };

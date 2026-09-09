import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import prisma from '@/lib/prisma';

const ADMIN_EMAILS = ['eliasahmad3224@gmail.com'];

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
              { email },
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
              ...(isTargetAdmin ? { role: 'admin' } : {}),
            },
          });
        } else {
          const newUser = await prisma.user.create({
            data: {
              googleId: googleId || email,
              email,
              name: user.name ?? email.split('@')[0] ?? 'User',
              image: user.image,
              role: isTargetAdmin ? 'admin' : 'student',
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
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },

    async jwt({ token, user, account }: any) {
      if (account && user) {
        token.accessToken = account.access_token;
      }
      const email = user?.email || token?.email;
      if (email) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true, status: true, isVerifiedSeller: true, department: true, studentId: true, phone: true, name: true, image: true },
          });

          if (!dbUser) {
            const isTargetAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
            const created = await prisma.user.create({
              data: {
                googleId: token.sub || email,
                email,
                name: token.name || email.split('@')[0] || 'User',
                image: token.picture,
                role: isTargetAdmin ? 'admin' : 'student',
                status: 'active',
              },
            });
            dbUser = {
              id: created.id,
              role: created.role,
              status: created.status,
              isVerifiedSeller: created.isVerifiedSeller,
              department: created.department,
              studentId: created.studentId,
              phone: created.phone,
              name: created.name,
              image: created.image,
            };
          }

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.status = dbUser.status;
            token.isVerifiedSeller = dbUser.isVerifiedSeller;
            token.department = dbUser.department;
            token.studentId = dbUser.studentId;
            token.phone = dbUser.phone;
            if (dbUser.name) token.name = dbUser.name;
            if (dbUser.image) token.picture = dbUser.image;
          }
        } catch (e) {
          console.error('jwt error fetching dbUser', e);
        }

        if (ADMIN_EMAILS.includes(email.toLowerCase())) {
          token.role = 'admin';
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
} = NextAuth(authOptions);

export { auth, signIn, signOut, GET, POST };

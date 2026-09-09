import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that do NOT require authentication (includes SSLCommerz callbacks & IPN).
const PUBLIC_FILE = /^\/(?:_next\/|api\/auth\/|api\/(?:session|upload|health|activities|payments\/sslcommerz)|favicon\.ico|robots\.txt|images\/|uploads\/).*/;

// Root-level static assets (images, etc.) are public too.
const PUBLIC_STATIC = /^\/[^/]+\.(?:jpe?g|png|gif|webp|svg|avif|ico|pdf|txt)$/;

// A page is public if it's the landing or login page.
const PUBLIC_PAGE = /^\/(login|auth\/logout|privacy|terms|privacy-policy|terms-of-service)?$/;

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_FILE.test(pathname) || PUBLIC_STATIC.test(pathname) || PUBLIC_PAGE.test(pathname)) {
    // If user is already authenticated and visits /login, redirect to appropriate dashboard
    if (pathname === '/login') {
      const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
      const cookieName =
        req.cookies.get('__Secure-authjs.session-token')?.value ? '__Secure-authjs.session-token' :
        req.cookies.get('authjs.session-token')?.value ? 'authjs.session-token' :
        req.cookies.get('__Secure-next-auth.session-token')?.value ? '__Secure-next-auth.session-token' :
        'next-auth.session-token';

      const token = await getToken({ req, secret: process.env.AUTH_SECRET, cookieName, secureCookie: isHttps });
      if (token) {
        const url = req.nextUrl.clone();
        if (token.role === 'admin') {
          url.pathname = '/admin';
        } else if (token.hasSelectedRole === false) {
          url.pathname = '/select-role';
        } else if (!token.isVerifiedSeller) {
          url.pathname = '/verify-id';
        } else {
          url.pathname = '/dashboard';
        }
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // Detect session token cookie across Auth.js v5 and NextAuth v4 (HTTP & HTTPS).
  const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  const cookieName =
    req.cookies.get('__Secure-authjs.session-token')?.value ? '__Secure-authjs.session-token' :
    req.cookies.get('authjs.session-token')?.value ? 'authjs.session-token' :
    req.cookies.get('__Secure-next-auth.session-token')?.value ? '__Secure-next-auth.session-token' :
    'next-auth.session-token';

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName,
    secureCookie: isHttps,
  });

  if (!token) {
    const isApi = pathname.startsWith('/api/');
    if (isApi) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Blocked user enforcement.
  if (token.status === 'blocked') {
    const isApi = pathname.startsWith('/api/');
    if (isApi) {
      return NextResponse.json({ error: 'Your account has been blocked.' }, { status: 403 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'Blocked');
    return NextResponse.redirect(url);
  }

  // ADMIN ROLE ENFORCEMENT
  if (token.role === 'admin') {
    // Admin bypasses select-role and verify-id
    if (pathname === '/select-role' || pathname === '/verify-id') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // NORMAL USER ROLE ENFORCEMENT (Student / Teacher)
  // 1. Prevent normal users from accessing admin routes
  if (pathname.startsWith('/admin')) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 2. Check if user needs one-time role selection
  const isSelectRolePage = pathname === '/select-role';
  const isAllowedPathBeforeRole =
    isSelectRolePage ||
    pathname.startsWith('/api/auth') ||
    pathname === '/auth/logout';

  if (token.hasSelectedRole === false && !isAllowedPathBeforeRole) {
    const isApi = pathname.startsWith('/api/');
    if (isApi) {
      return NextResponse.json({ error: 'Role selection required' }, { status: 403 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/select-role';
    return NextResponse.redirect(url);
  }

  // 3. If role is already selected and user visits /select-role, redirect away
  if (token.hasSelectedRole === true && isSelectRolePage) {
    const url = req.nextUrl.clone();
    url.pathname = token.isVerifiedSeller ? '/dashboard' : '/verify-id';
    return NextResponse.redirect(url);
  }

  // 4. Mandatory One-Time ID Card Verification Guard for non-admin users
  const isVerified = token.isVerifiedSeller === true;
  const isVerifyPage = pathname === '/verify-id';
  const isAllowedUnverifiedPath =
    isVerifyPage ||
    isSelectRolePage ||
    pathname.startsWith('/api/profile') ||
    pathname.startsWith('/api/upload') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/auth/logout';

  if (!isVerified && !isAllowedUnverifiedPath) {
    const isApi = pathname.startsWith('/api/');
    if (isApi) {
      return NextResponse.json({ error: 'ID Verification required' }, { status: 403 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/verify-id';
    return NextResponse.redirect(url);
  }

  // If already verified, redirect away from /verify-id to /dashboard
  if (isVerified && isVerifyPage) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
};

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/', '/login', '/signup', '/features', '/pricing', '/how-it-works', '/about', '/resume-ai', '/privacy', '/terms'];
const authRoutes = ['/login', '/signup'];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isPublicRoute = publicRoutes.some(r => nextUrl.pathname === r || nextUrl.pathname.startsWith('/api/auth'));
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  // Resume builder is public — anyone can create a resume (AI features require login)
  const isResumeBuilder = nextUrl.pathname.startsWith('/resume-builder');

  // Forward pathname to layouts via request header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', nextUrl.pathname);

  // Redirect logged-in users away from login/signup
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Allow public routes, API routes, and resume builder
  if (isPublicRoute || isResumeBuilder || nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Protect all other dashboard routes
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

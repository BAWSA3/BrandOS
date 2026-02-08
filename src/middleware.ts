import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
// NOTE: /app temporarily removed for dev testing - restore before production
const protectedRoutes: string[] = [];

// Routes that are always public
const publicRoutes = [
  '/',
  '/score',
  '/shared',
  '/leaderboard',
  '/admin',
  '/api/auth',
  '/article',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route) && !pathname.startsWith('/api')
  );

  // Skip middleware for public routes and API routes
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Also skip for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Static files like .ico, .svg, etc.
  ) {
    return NextResponse.next();
  }

  if (isProtectedRoute && !isPublicRoute) {
    // Check for auth tokens in cookies
    const accessToken = request.cookies.get('sb-access-token')?.value;

    if (!accessToken) {
      // Store the attempted URL to redirect back after login
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      redirectUrl.searchParams.set('authRequired', 'true');

      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

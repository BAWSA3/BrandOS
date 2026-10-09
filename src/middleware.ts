import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// ALLOWED PAGES — only these pages are publicly accessible.
// Everything else returns 404. Add routes here as you launch them.
// Launch week (Oct 2026): /tier-list, /opp, the old /score scan and the dev
// /test-cards preview were removed (they redirect to the homepage scan).
// ============================================================================
const allowedPages = [
  '/', // Homepage / lead magnet
  '/scan', // Scan results (/scan/[username])
  '/shared', // Shared brand profiles (/shared/[token])
  '/thanks', // Post-signup thank you
  '/article', // UTM tracking for article referrals
  '/early-access', // Email signup / early access
  '/privacy', // Legal: privacy policy
  '/terms', // Legal: terms of service
  '/station', // Public reserved-station pages (flex sign + X link preview)
  '/archetype', // Archetype scanner
  '/archetypes', // Archetype showcase
  '/intelligence', // Intelligence Report
  '/card', // Brand Identity Card (/card/[username])
  '/pricing', // Pricing page
  '/audit', // Score Boost Audit — post-purchase results page (/audit/[sessionId])
  '/migrate-account', // Phase 1: legacy user credential migration
  '/dashboard', // Phase 1: authenticated user dashboard
  '/studio', // Onboarding building game: the user's station home (auth-gated)
  '/signup', // Phase 1: new account creation (email/Google/Apple)
  '/today', // Daily creator brief — 1 idea, 1 metric, 1 action
  '/world-preview', // V2 worlds: unauthenticated theme preview (dev)
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: static files, Next.js internals, API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // .ico, .svg, .png, etc.
  ) {
    return NextResponse.next();
  }

  // Check if page is in the allowed list
  const isAllowed = allowedPages.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isAllowed) {
    // Return 404 for all non-allowed pages
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
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
    '/((?!_next/static|_next/image|favicon.ico|public/|archetypes/).*)',
  ],
};

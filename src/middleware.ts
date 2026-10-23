import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { encodeUtm, UTM_COOKIE, UTM_MAX_AGE, utmFromSearch } from '@/lib/utm';

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
  '/breakdown', // Email capture for the full scan breakdown
  '/archetype', // Archetype scanner
  '/archetypes', // Archetype showcase
  '/intelligence', // Intelligence Report
  '/card', // Brand Identity Card (/card/[username])
  '/pricing', // Pricing page
  '/audit', // Score Boost Audit — post-purchase results page (/audit/[sessionId])
  '/migrate-account', // Phase 1: legacy user credential migration
  '/dashboard', // Phase 1: authenticated user dashboard
  '/home', // title screen / main menu after sign-in
  '/signup', // Phase 1: new account creation (email/Google/Apple)
  '/today', // Daily creator brief — 1 idea, 1 metric, 1 action
  '/world-preview', // design previews with sample data (not on the production domain, below)
  '/oauth', // "Sign in with BrandOS" consent for the MCP (Claude / ChatGPT)
  '/b', // public brand page; the public address is /@handle (rewritten below)
  '/bots', // "How many bots follow you?" — public bot check
  '/creators', // the Creator Index; the public address is /index (rewritten below)
];

// Design-review pages (sample data) stay on staging and local, never on the
// live site.
const PRODUCTION_HOSTS = new Set(['mybrandos.app', 'www.mybrandos.app']);
const PREVIEW_ONLY = ['/world-preview'];

// First-touch attribution: the first utm_* a visitor arrives with is kept in
// a cookie for 30 days and attached to signup_completed (auth callback).
export function middleware(request: NextRequest) {
  const response = route(request);
  if (!request.cookies.has(UTM_COOKIE)) {
    const utm = utmFromSearch(request.nextUrl.searchParams);
    if (utm)
      response.cookies.set(UTM_COOKIE, encodeUtm(utm), {
        maxAge: UTM_MAX_AGE,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        path: '/',
      });
  }
  return response;
}

function route(request: NextRequest): NextResponse {
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

  // mybrandos.app/@handle -> the public brand page (/b/handle)
  const at = pathname.match(/^\/(?:@|%40)([A-Za-z0-9_]{1,15})\/?$/);
  if (at) {
    const url = request.nextUrl.clone();
    url.pathname = `/b/${at[1]}`;
    return NextResponse.rewrite(url);
  }

  // mybrandos.app/index -> the Creator Index (/creators). The pages live in
  // /creators (an app/index folder would sit next to Next's internal name for
  // the root page); /index is the public address. They 404 themselves while
  // the Index is closed (INDEX_ENABLED).
  const idx = pathname.match(/^\/index(\/join)?\/?$/);
  if (idx) {
    const url = request.nextUrl.clone();
    url.pathname = `/creators${idx[1] ?? ''}`;
    return NextResponse.rewrite(url);
  }

  const previewOnLive =
    PRODUCTION_HOSTS.has((request.headers.get('host') ?? '').split(':')[0].toLowerCase()) &&
    PREVIEW_ONLY.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  // Check if page is in the allowed list
  const isAllowed = allowedPages.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isAllowed || previewOnLive) {
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

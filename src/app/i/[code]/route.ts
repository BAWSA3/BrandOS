import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { codeIsRedeemable, redeemCode } from '@/lib/early-access';
import { INVITE_COOKIE, INVITE_COOKIE_MAX_AGE, normalizeCode } from '@/lib/early-access-rules';

/**
 * The invite link: mybrandos.app/i/AU7K-2QX9.
 * - Signed in: redeem now, land on the dashboard (?invite=ok or ?invite=invalid).
 * - Signed out: keep the code in an httpOnly cookie, go to sign-in; the auth
 *   callback redeems it right after X sign-in and clears the cookie.
 * Every failure looks the same, so a link says nothing about other codes.
 * - Link previewers (Telegram, X, iMessage, WhatsApp, Slack, Discord…): a
 *   static "You're invited" card, before anything else runs. It never shows,
 *   checks or redeems the code, and sets no cookie.
 */

// Crawlers that unfurl links. iMessage sends a facebookexternalhit/Twitterbot UA.
const PREVIEW_BOT =
  /bot|crawler|spider|facebookexternalhit|facebot|whatsapp|telegram|slack|discord|linkedin|embedly|skype|pinterest|vkshare|redditbot|applebot|googlebot|bingbot|preview/i;

const INVITE_TITLE = "You're invited to BrandOS";
const INVITE_DESCRIPTION =
  'Invite-only. See what your posts say about you: what you’re known for, what’s landing, and the one move to make next. 30 days free, no card.';

function invitePreview(origin: string): Response {
  const img = `${origin}/api/og/invite`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${INVITE_TITLE}</title>
<meta name="description" content="${INVITE_DESCRIPTION}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="BrandOS">
<meta property="og:title" content="${INVITE_TITLE}">
<meta property="og:description" content="${INVITE_DESCRIPTION}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${INVITE_TITLE}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${INVITE_TITLE}">
<meta name="twitter:description" content="${INVITE_DESCRIPTION}">
<meta name="twitter:image" content="${img}">
<meta name="robots" content="noindex">
</head><body></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      // the same URL serves people a redirect: keep caches from mixing them
      Vary: 'User-Agent',
    },
  });
}
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (PREVIEW_BOT.test(request.headers.get('user-agent') ?? '')) {
    return invitePreview(request.nextUrl.origin);
  }
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const ip = getClientIdentifier(request);
  if (checkRateLimit(`invite-link:${ip}`, { interval: 10 * 60 * 1000, maxRequests: 20 }).limited) {
    return go('/signup?invite=invalid');
  }

  const code = normalizeCode((await params).code);
  const user = await getUser();

  if (user) {
    if (
      checkRateLimit(`invite-redeem:${user.id}`, { interval: 60 * 60 * 1000, maxRequests: 10 })
        .limited
    ) {
      return go('/dashboard?invite=invalid');
    }
    const result = code ? await redeemCode(user.id, code) : { ok: false as const };
    return go(`/dashboard?invite=${result.ok ? 'ok' : 'invalid'}`);
  }

  if (!code || !(await codeIsRedeemable(code))) return go('/signup?invite=invalid');

  const response = go('/signup?invite=saved');
  response.cookies.set(INVITE_COOKIE, code, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: INVITE_COOKIE_MAX_AGE,
  });
  return response;
}

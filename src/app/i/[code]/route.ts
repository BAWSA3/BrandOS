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
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
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

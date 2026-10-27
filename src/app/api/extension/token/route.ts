import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { extensionTokensConfigured, mintExtensionToken } from '@/lib/extension-token';

/**
 * POST /api/extension/token — called by /extension-auth (same origin, signed
 * in) to mint a BrandOS for Chrome token for the member. The page hands it to
 * the extension. Scoped to draft scoring; see src/lib/extension-token.ts.
 * Same-origin only (Origin must be this site), 10 per hour per member.
 */

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return !!origin && origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  if (!extensionTokensConfigured())
    return NextResponse.json(
      { error: 'BrandOS for Chrome is not available yet.' },
      { status: 503 }
    );
  if (checkRateLimit(`ext-token:${user.id}`, { interval: 60 * 60 * 1000, maxRequests: 10 }).limited)
    return NextResponse.json({ error: 'Too many sign-ins. Try again later.' }, { status: 429 });

  const x = await prisma.platformConnection
    .findFirst({
      where: { userId: user.id, platform: 'x', status: 'active' },
      select: { platformUsername: true },
    })
    .catch(() => null);
  const { token, expiresAt } = mintExtensionToken(user.id);
  return NextResponse.json(
    { token, expiresAt, handle: x?.platformUsername ?? user.xUsername ?? null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hasPro } from '@/lib/billing';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { bearer, extensionCors, verifyExtensionToken } from '@/lib/extension-token';

/**
 * POST /api/extension/auth — the extension checks its token (Authorization:
 * Bearer bx1…) and gets who it's signed in as. Read-only.
 */

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: extensionCors(request.headers.get('origin')),
  });
}

export async function POST(request: NextRequest) {
  const headers = extensionCors(request.headers.get('origin'));
  if (
    checkRateLimit(`ext-auth:${getClientIdentifier(request)}`, {
      interval: 60_000,
      maxRequests: 30,
    }).limited
  )
    return NextResponse.json(
      { valid: false, error: 'Too many requests' },
      { status: 429, headers }
    );
  const userId = verifyExtensionToken(bearer(request));
  if (!userId) return NextResponse.json({ valid: false }, { status: 401, headers });
  const user = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
  if (!user) return NextResponse.json({ valid: false }, { status: 401, headers });
  const x = await prisma.platformConnection
    .findFirst({
      where: { userId, platform: 'x', status: 'active' },
      select: { platformUsername: true },
    })
    .catch(() => null);
  return NextResponse.json(
    {
      valid: true,
      user: { handle: x?.platformUsername ?? user.xUsername ?? null, pro: hasPro(user) },
    },
    { headers }
  );
}

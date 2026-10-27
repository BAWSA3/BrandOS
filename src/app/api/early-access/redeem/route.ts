import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { redeemCode } from '@/lib/early-access';
import { INVALID_CODE_MESSAGE } from '@/lib/early-access-rules';

/**
 * POST /api/early-access/redeem { code } — the "Have a code?" box on the
 * dashboard. Signed in only (signed-out visitors go through /i/<code>).
 * Limited per IP and per user; every failure gets the same message.
 */
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIdentifier(request);
  const limited =
    checkRateLimit(`ea-redeem-ip:${ip}`, { interval: 60 * 1000, maxRequests: 5 }).limited ||
    checkRateLimit(`ea-redeem-user:${user.id}`, { interval: 60 * 60 * 1000, maxRequests: 10 })
      .limited;
  if (limited) {
    return NextResponse.json(
      { error: 'Too many tries. Wait a minute and try again.' },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const result = await redeemCode(user.id, body?.code);
  if (!result.ok) return NextResponse.json({ error: INVALID_CODE_MESSAGE }, { status: 400 });
  return NextResponse.json({ ok: true, already: result.already });
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isSubscribed } from '@/lib/billing';
import { checkRateLimit } from '@/lib/rate-limit';
import { earlyAccessFor, memberInvites, mintInvite } from '@/lib/early-access';

/**
 * A member's own invites (invite-only trial, migration 051): up to 3 codes,
 * each made on its first copy. Members = a redeemed code, a paid plan, or an
 * admin. Only ever returns the caller's own codes.
 *   GET  → { cap, left, invites: [{ code, link, usedBy, usedAt }] }
 *   POST → makes the next one: { invite } (409 when none are left)
 */
async function member() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const eligible =
    user.role === 'admin' || isSubscribed(user) || !!(await earlyAccessFor(user.id));
  if (!eligible) {
    return { error: NextResponse.json({ error: 'Invites are for members' }, { status: 403 }) };
  }
  return { user };
}

const origin = () => process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';

export async function GET() {
  const m = await member();
  if ('error' in m) return m.error;
  const invites = await memberInvites(m.user.id, origin());
  if (!invites) return NextResponse.json({ error: 'Invites open soon' }, { status: 503 });
  return NextResponse.json(invites);
}

export async function POST(_request: NextRequest) {
  const m = await member();
  if ('error' in m) return m.error;
  if (
    checkRateLimit(`invite-mint:${m.user.id}`, { interval: 60 * 60 * 1000, maxRequests: 10 })
      .limited
  ) {
    return NextResponse.json({ error: 'Too many tries. Wait a bit.' }, { status: 429 });
  }
  const r = await mintInvite(m.user.id, m.user.xUsername ?? null, origin());
  if (!r.ok) {
    return r.reason === 'none-left'
      ? NextResponse.json({ error: 'All 3 invites are out' }, { status: 409 })
      : NextResponse.json({ error: 'Invites open soon' }, { status: 503 });
  }
  return NextResponse.json({ invite: r.invite });
}

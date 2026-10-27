import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { indexOpenForUser } from '@/lib/early-access';
import { setListed } from '@/lib/creator-index';
import { captureFunnelEvent } from '@/lib/funnel-events';

/**
 * PATCH /api/index/me { listed } — leave the Index (hide your entry) or come
 * back. Only ever touches the signed-in user's own entry; the number is kept.
 */
async function handlePatch(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!(await indexOpenForUser(user)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { listed?: unknown } | null;
  if (typeof body?.listed !== 'boolean')
    return NextResponse.json({ error: 'Say whether to list you.' }, { status: 400 });
  const ok = await setListed(user.id, body.listed);
  if (!ok) return NextResponse.json({ error: "You're not in the Index yet." }, { status: 404 });
  await captureFunnelEvent(
    user.supabaseId,
    body.listed ? 'index_joined' : 'index_left',
    body.listed ? { rejoined: true } : {}
  );
  return NextResponse.json({ listed: body.listed });
}

export const PATCH = withRateLimit(handlePatch, rateLimiters.standard);

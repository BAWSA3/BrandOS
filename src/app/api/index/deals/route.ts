import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, withUserRateLimit, rateLimiters } from '@/lib/rate-limit';
import { indexOpenFor } from '@/lib/index-rules';
import { MAX_DEALS, parseDeal } from '@/lib/index-deal-rules';
import { addDeal, listDeals, removeDeal } from '@/lib/index-deals';

/**
 * Past brand deals on your own Creator Index entry (migration 046).
 *   GET    → { member, deals, max }
 *   POST   { brand, brandHandle?, month?, postUrl? } → { deal }
 *   DELETE { id } → { ok }
 *
 * Security:
 * - 404 while the Index is closed (INDEX_ENABLED / allowlist), like the rest
 *   of /api/index. Auth required; every read and write is scoped to the
 *   signed-in user's own entry (no entry or user id is taken from the request).
 * - Deals are private to the member until a brand confirms them; nothing here
 *   is shown on public pages.
 * - Input: brand one line ≤60, handle /^[a-z0-9_]{1,15}$/, month YYYY-MM in
 *   range, post link must be an X status URL (normalised). Nothing reaches an
 *   LLM or an outside service. At most 10 deals per member.
 * - Writes: BotID + IP limit + 10 per 10s per user. No paid calls anywhere.
 */

const ID_RE = /^[0-9a-f-]{36}$/;

type Viewer =
  | { res: NextResponse; user: null }
  | { res: null; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> };

async function viewer(): Promise<Viewer> {
  const user = await getCurrentUser().catch(() => null);
  if (!indexOpenFor(user))
    return { res: NextResponse.json({ error: 'Not found' }, { status: 404 }), user: null };
  if (!user)
    return { res: NextResponse.json({ error: 'Sign in first.' }, { status: 401 }), user: null };
  return { res: null, user };
}

async function handleGet() {
  const v = await viewer();
  if (v.res) return v.res;
  const { member, deals } = await listDeals(v.user.id);
  return NextResponse.json({ member, deals, max: MAX_DEALS });
}

async function handlePost(request: NextRequest) {
  const v = await viewer();
  if (v.res) return v.res;
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  if (withUserRateLimit(v.user.id, 'burst').limited)
    return NextResponse.json({ error: 'Too many tries. Wait a moment.' }, { status: 429 });

  const parsed = parseDeal(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const result = await addDeal(v.user.id, parsed.value);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ deal: result.deal });
}

async function handleDelete(request: NextRequest) {
  const v = await viewer();
  if (v.res) return v.res;
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  if (withUserRateLimit(v.user.id, 'burst').limited)
    return NextResponse.json({ error: 'Too many tries. Wait a moment.' }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!ID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ok = await removeDeal(v.user.id, id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export const GET = withRateLimit(handleGet, rateLimiters.standard);
export const POST = withRateLimit(handlePost, rateLimiters.burst);
export const DELETE = withRateLimit(handleDelete, rateLimiters.burst);

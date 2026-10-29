import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { hasPro, PRO_REQUIRED } from '@/lib/billing';
import { botGuard } from '@/lib/botid-guard';
import { DraftScoreError } from '@/lib/draft-signals';
import { LIVE_MAX_CHARS } from '@/lib/live-marks';
import { liveContext, liveRead } from '@/lib/live-marks-server';
import { checkRateLimit, rateLimiters, withRateLimit } from '@/lib/rate-limit';

/**
 * The live composer (docs/LIVE-COMPOSER-SPEC.md).
 *   GET  ?account=     → what the browser needs for instant marks: the voice
 *                        profile, playbook lines, proof posts, landingReady.
 *   POST { text, account? } → the fast pass: fit score, playbook line, marks.
 * Pro only. The brand must be in the member's own workspace (resolveBrand).
 * AI cost surface: BotID + per-IP limit + 20 reads/min and 300/hour per member,
 * 2,000-character cap, an hour's cache per draft (the same pause is free).
 */
export const maxDuration = 30;

function account(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 && v.length <= 64 ? v : undefined;
}

type Gate =
  | { error: NextResponse }
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; workspaceId: string | null };

async function gate(request: NextRequest): Promise<Gate> {
  const botBlock = await botGuard(request);
  if (botBlock) return { error: botBlock };
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Sign in to write' }, { status: 401 }) };
  if (!hasPro(user)) return { error: NextResponse.json(PRO_REQUIRED, { status: 402 }) };
  const workspace = await getCurrentWorkspace(user).catch(() => null);
  return { user, workspaceId: workspace?.id ?? null };
}

function fail(e: unknown): NextResponse {
  if (e instanceof DraftScoreError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  console.error('[live-marks] error:', e);
  return NextResponse.json({ error: 'Live marks paused. Keep writing.' }, { status: 500 });
}

async function handleGet(request: NextRequest): Promise<NextResponse> {
  const g = await gate(request);
  if ('error' in g) return g.error;
  try {
    const ctx = await liveContext({
      userId: g.user.id,
      workspaceId: g.workspaceId,
      accountId: account(request.nextUrl.searchParams.get('account')),
    });
    return NextResponse.json({
      handle: ctx.handle,
      profile: ctx.profile,
      landingReady: ctx.landingReady,
      pillars: ctx.read.pillars,
      proof: ctx.proof,
    });
  } catch (e) {
    return fail(e);
  }
}

async function handlePost(request: NextRequest): Promise<NextResponse> {
  const g = await gate(request);
  if ('error' in g) return g.error;
  const raw = await request.text();
  if (raw.length > 12_000)
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const text = typeof body.text === 'string' ? body.text : '';
  if (text.trim().length < 12) return NextResponse.json({ marks: [], score: null, pillar: null });
  if ([...text].length > LIVE_MAX_CHARS)
    return NextResponse.json(
      { error: 'Live marks read the first 2,000 characters.' },
      { status: 413 }
    );
  if (
    checkRateLimit(`live-marks:m:${g.user.id}`, { interval: 60_000, maxRequests: 20 }).limited ||
    checkRateLimit(`live-marks:h:${g.user.id}`, { interval: 3_600_000, maxRequests: 300 }).limited
  )
    return NextResponse.json({ error: 'Live marks are catching their breath.' }, { status: 429 });
  try {
    const accountId = account(body.account);
    const ctx = await liveContext({ userId: g.user.id, workspaceId: g.workspaceId, accountId });
    const read = await liveRead({
      userId: g.user.id,
      ctx,
      brandKey: accountId ?? ctx.handle,
      draft: text,
    });
    return NextResponse.json(read);
  } catch (e) {
    return fail(e);
  }
}

export const GET = withRateLimit(handleGet, rateLimiters.standard);
export const POST = withRateLimit(handlePost, rateLimiters.standard);

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import {
  AccountError,
  COMPETITORS_PER_BRAND,
  addAccount,
  brandLimit,
} from '@/lib/tracked-accounts';

/**
 * Growth dashboard accounts for the signed-in user's workspace.
 *
 * GET  → brands (with their competitors and latest snapshot) + limits
 * POST { handle, kind?: 'creator'|'brand', competitorOf?: brandId } → add one
 *
 * Security: auth required; everything is scoped to the caller's own
 * workspace (competitorOf must be a brand in it). Adding reads paid X data,
 * so POST has BotID + 5/min per IP, and plan limits cap how many exist.
 */

async function context() {
  const user = await getCurrentUser();
  if (!user) return null;
  const workspace = await getCurrentWorkspace(user);
  return workspace ? { user, workspace } : null;
}

async function handleGet() {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: 'Sign in' }, { status: 401 });

  const latest = { orderBy: { day: 'desc' as const }, take: 1 };
  const brands = await prisma.trackedAccount.findMany({
    where: { workspaceId: ctx.workspace.id, competitorOfId: null },
    orderBy: { createdAt: 'asc' },
    include: {
      snapshots: latest,
      competitors: { orderBy: { createdAt: 'asc' }, include: { snapshots: latest } },
    },
  });

  const shape = (a: (typeof brands)[number] | (typeof brands)[number]['competitors'][number]) => ({
    id: a.id,
    handle: a.displayHandle,
    kind: a.kind,
    lastSyncedAt: a.lastSyncedAt,
    snapshot: a.snapshots[0] ?? null,
  });

  return NextResponse.json({
    brands: brands.map((b) => ({ ...shape(b), competitors: b.competitors.map(shape) })),
    limits: { brands: brandLimit(ctx.user), competitorsPerBrand: COMPETITORS_PER_BRAND },
  });
}

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: 'Sign in' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    handle?: unknown;
    kind?: unknown;
    competitorOf?: unknown;
  };
  if (typeof body.handle !== 'string' || body.handle.length > 80) {
    return NextResponse.json({ error: 'Enter an X handle' }, { status: 400 });
  }
  const kind = body.kind === 'brand' ? 'brand' : 'creator';
  const competitorOfId = typeof body.competitorOf === 'string' ? body.competitorOf : undefined;

  try {
    const account = await addAccount({
      workspaceId: ctx.workspace.id,
      userId: ctx.user.id,
      limit: brandLimit(ctx.user),
      rawHandle: body.handle,
      kind,
      competitorOfId,
    });
    return NextResponse.json({ id: account.id, handle: account.displayHandle }, { status: 201 });
  } catch (e) {
    if (e instanceof AccountError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[accounts] add failed', e);
    return NextResponse.json({ error: 'Could not add that account' }, { status: 500 });
  }
}

export const GET = withRateLimit(handleGet, rateLimiters.standard);
export const POST = withRateLimit(handlePost, rateLimiters.aiStrict);

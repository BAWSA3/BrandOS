import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';

/**
 * The growth dashboard's idea board, per brand (migration 042).
 *   GET    ?account=<brandId>                 the brand's ideas (newest first)
 *   POST   { account, text }                  an idea written on the blank page
 *   PATCH  { id, status?: saved|drafting|posted, text? }   (at least one)
 *   DELETE { id }
 * Security: auth; the brand must belong to the caller's own workspace; text is
 * capped; 500 ideas per brand.
 */

const STATUSES = ['saved', 'drafting', 'posted'] as const;
const SELECT = {
  id: true,
  suggestion: true,
  title: true,
  hook: true,
  format: true,
  why: true,
  status: true,
  source: true,
  createdAt: true,
} as const;

async function ownBrand(accountId: unknown) {
  const user = await getCurrentUser();
  if (!user)
    return { ok: false as const, error: NextResponse.json({ error: 'Sign in' }, { status: 401 }) };
  const workspace = await getCurrentWorkspace(user);
  if (!workspace || typeof accountId !== 'string')
    return {
      ok: false as const,
      error: NextResponse.json({ error: 'Not found' }, { status: 404 }),
    };
  const brand = await prisma.trackedAccount.findFirst({
    where: { id: accountId, workspaceId: workspace.id, competitorOfId: null },
    select: { id: true },
  });
  if (!brand)
    return {
      ok: false as const,
      error: NextResponse.json({ error: 'Not found' }, { status: 404 }),
    };
  return { ok: true as const, user, brand };
}

async function ownIdea(id: unknown) {
  const user = await getCurrentUser();
  if (!user)
    return { ok: false as const, error: NextResponse.json({ error: 'Sign in' }, { status: 401 }) };
  const workspace = await getCurrentWorkspace(user);
  if (!workspace || typeof id !== 'string' || id.length > 64)
    return {
      ok: false as const,
      error: NextResponse.json({ error: 'Not found' }, { status: 404 }),
    };
  const idea = await prisma.idea.findFirst({
    where: { id, account: { workspaceId: workspace.id } },
    select: { id: true, status: true },
  });
  if (!idea)
    return {
      ok: false as const,
      error: NextResponse.json({ error: 'Not found' }, { status: 404 }),
    };
  return { ok: true as const, user, idea };
}

async function handleGet(request: NextRequest) {
  const ctx = await ownBrand(request.nextUrl.searchParams.get('account'));
  if (!ctx.ok) return ctx.error;
  const ideas = await prisma.idea.findMany({
    where: { accountId: ctx.brand.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: SELECT,
  });
  return NextResponse.json({ ideas });
}

async function handlePost(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { account?: unknown; text?: unknown };
  const ctx = await ownBrand(body.account);
  if (!ctx.ok) return ctx.error;
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2000) : '';
  if (!text) return NextResponse.json({ error: 'Write the idea first.' }, { status: 400 });
  if ((await prisma.idea.count({ where: { accountId: ctx.brand.id } })) >= 500)
    return NextResponse.json({ error: 'This board is full.' }, { status: 400 });
  const idea = await prisma.idea.create({
    data: {
      userId: ctx.user.id,
      accountId: ctx.brand.id,
      source: 'mine',
      suggestion: text,
      title: text.slice(0, 160),
      hook: '',
      format: 'note',
      why: '',
    },
    select: SELECT,
  });
  return NextResponse.json({ idea }, { status: 201 });
}

async function handlePatch(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    id?: unknown;
    status?: unknown;
    text?: unknown;
  };
  const hasStatus = body.status !== undefined;
  const hasText = body.text !== undefined;
  if (!hasStatus && !hasText)
    return NextResponse.json({ error: 'Nothing to change' }, { status: 400 });
  if (hasStatus && !STATUSES.includes(body.status as (typeof STATUSES)[number]))
    return NextResponse.json({ error: 'Bad status' }, { status: 400 });
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2000) : '';
  if (hasText && !text)
    return NextResponse.json({ error: 'Write the idea first.' }, { status: 400 });
  const ctx = await ownIdea(body.id);
  if (!ctx.ok) return ctx.error;
  const status = hasStatus ? (body.status as (typeof STATUSES)[number]) : undefined;
  await prisma.idea.update({
    where: { id: ctx.idea.id },
    data: {
      ...(status ? { status, postedAt: status === 'posted' ? new Date() : null } : {}),
      ...(hasText ? { suggestion: text, title: text.slice(0, 160) } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

async function handleDelete(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { id?: unknown };
  const ctx = await ownIdea(body.id);
  if (!ctx.ok) return ctx.error;
  await prisma.idea.delete({ where: { id: ctx.idea.id } });
  return NextResponse.json({ ok: true });
}

export const GET = withRateLimit(handleGet, rateLimiters.standard);
export const POST = withRateLimit(handlePost, rateLimiters.standard);
export const PATCH = withRateLimit(handlePatch, rateLimiters.standard);
export const DELETE = withRateLimit(handleDelete, rateLimiters.standard);

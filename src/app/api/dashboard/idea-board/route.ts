import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { rateLimiters, withRateLimit } from '@/lib/rate-limit';
import { XP_RULES } from '@/lib/xp';

/**
 * /api/dashboard/idea-board — the studio idea board (migration 035). Own ideas only.
 *   GET                      list (newest first, 50)
 *   POST  { postScoreId?, postExcerpt?, suggestion, idea: {title, hook, format, why} }  save
 *   PATCH { id, status: 'posted' }   mark posted (+XP once per idea)
 * Before 035 is applied: 503 "coming soon" (P2021).
 */

const SOON = NextResponse.json(
  { error: 'The idea board opens soon.', soon: true },
  { status: 503 }
);
const missingTable = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021';
const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const SELECT = {
  id: true,
  postExcerpt: true,
  suggestion: true,
  title: true,
  hook: true,
  format: true,
  why: true,
  status: true,
  createdAt: true,
} as const;

async function handleGet() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  try {
    const ideas = await prisma.idea.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: SELECT,
    });
    return NextResponse.json({ ideas });
  } catch (e) {
    if (missingTable(e)) return SOON.clone();
    throw e;
  }
}

async function handlePost(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const idea = (body.idea ?? {}) as Record<string, unknown>;
  const data = {
    userId: user.id,
    postScoreId: s(body.postScoreId, 64) || null,
    postExcerpt: s(body.postExcerpt, 280) || null,
    suggestion: s(body.suggestion, 280),
    title: s(idea.title, 140),
    hook: s(idea.hook, 220),
    format: s(idea.format, 120),
    why: s(idea.why, 260),
  };
  if (!data.suggestion || !data.title || !data.hook || !data.why)
    return NextResponse.json({ error: 'Missing idea details.' }, { status: 400 });
  try {
    const count = await prisma.idea.count({ where: { userId: user.id } });
    if (count >= 500)
      return NextResponse.json({ error: 'Your idea board is full.' }, { status: 400 });
    const saved = await prisma.idea.create({ data, select: SELECT });
    return NextResponse.json({ idea: saved });
  } catch (e) {
    if (missingTable(e)) return SOON.clone();
    throw e;
  }
}

async function handlePatch(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { id?: unknown; status?: unknown };
  const id = s(body.id, 64);
  if (!id || body.status !== 'posted')
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  try {
    const { count } = await prisma.idea.updateMany({
      where: { id, userId: user.id, status: 'saved' },
      data: { status: 'posted', postedAt: new Date() },
    });
    if (count) {
      await prisma.xPEvent
        .createMany({
          data: [
            {
              userId: user.id,
              kind: 'ideaPosted',
              xp: XP_RULES.ideaPosted,
              dedupeKey: `idea:${id}`,
              label: 'Idea posted',
            },
          ],
          skipDuplicates: true,
        })
        .catch(() => null);
    }
    return NextResponse.json({ ok: true, xp: count ? XP_RULES.ideaPosted : 0 });
  } catch (e) {
    if (missingTable(e)) return SOON.clone();
    throw e;
  }
}

export const GET = withRateLimit(handleGet, rateLimiters.standard);
export const POST = withRateLimit(handlePost, rateLimiters.standard);
export const PATCH = withRateLimit(handlePatch, rateLimiters.standard);

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { botGuard } from '@/lib/botid-guard';
import { checkRateLimit, rateLimiters, withRateLimit } from '@/lib/rate-limit';
import { brandForUser } from '@/lib/post-scores';
import { brainstorm } from '@/lib/brainstorm';

/**
 * POST /api/dashboard/brainstorm { postId, index } — the studio brainstorm:
 * 4 new post ideas (not drafts) built on "Next time" suggestion #index of the
 * signed-in user's own analyzed post. AI cost surface: BotID + the strict
 * per-IP AI limit + 20 brainstorms per hour per user.
 */
export const maxDuration = 60;

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to brainstorm' }, { status: 401 });
  if (
    checkRateLimit(`brainstorm:${user.id}`, { interval: 60 * 60 * 1000, maxRequests: 20 }).limited
  )
    return NextResponse.json(
      { error: 'That is a lot of brainstorming for one hour. Try again soon.' },
      { status: 429 }
    );

  const body = (await request.json().catch(() => ({}))) as { postId?: unknown; index?: unknown };
  const postId = typeof body.postId === 'string' ? body.postId.slice(0, 64) : '';
  const index = Number.isInteger(body.index) ? (body.index as number) : -1;

  const post = postId
    ? await prisma.postScore
        .findFirst({
          where: { id: postId, userId: user.id },
          select: { excerpt: true, fit: true, breakdown: true },
        })
        .catch(() => null)
    : null;
  const sharpen = (post?.breakdown as { sharpen?: unknown } | null)?.sharpen;
  const suggestion =
    Array.isArray(sharpen) && typeof sharpen[index] === 'string'
      ? (sharpen[index] as string)
      : null;
  if (!post || !suggestion)
    return NextResponse.json({ error: 'That post or suggestion was not found.' }, { status: 404 });

  try {
    const brand = await brandForUser(user.id);
    const handle =
      user.platformConnections.find((pc) => pc.platform === 'x')?.platformUsername ??
      user.xUsername ??
      'you';
    const ideas = await brainstorm({
      handle,
      archetype: brand.archetype,
      pillars: brand.pillars,
      summary: brand.summary,
      postExcerpt: post.excerpt,
      postFit: post.fit,
      suggestion,
    });
    return NextResponse.json({ ideas });
  } catch (e) {
    console.error('[brainstorm] failed:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message.slice(0, 160) : 'Brainstorm failed.' },
      { status: 502 }
    );
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.aiStrict);

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { hasPro, PRO_REQUIRED } from '@/lib/billing';
import { botGuard } from '@/lib/botid-guard';
import { checkRateLimit } from '@/lib/rate-limit';
import { brandLimit, COMPETITORS_PER_BRAND } from '@/lib/tracked-accounts';
import { getGrowthView } from '@/lib/growth-data';
import { refreshBrandIdeas } from '@/lib/brand-ideas';

/**
 * POST /api/ideas/generate { account } — new BrandOS ideas for one brand, from
 * its analytics. AI cost surface: auth + Pro access + own workspace + BotID +
 * 5 per hour per user; adds nothing while 3 BrandOS ideas are still waiting.
 */
export async function POST(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  if (!hasPro(user)) return NextResponse.json(PRO_REQUIRED, { status: 402 });
  if (
    checkRateLimit(`ideas-generate:${user.id}`, { interval: 60 * 60 * 1000, maxRequests: 5 })
      .limited
  )
    return NextResponse.json(
      { error: 'That’s plenty of ideas for now. Try again later.' },
      { status: 429 }
    );

  const workspace = await getCurrentWorkspace(user);
  const { account } = (await request.json().catch(() => ({}))) as { account?: unknown };
  if (!workspace || typeof account !== 'string')
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const brand = await prisma.trackedAccount.findFirst({
    where: { id: account, workspaceId: workspace.id, competitorOfId: null },
    select: { id: true },
  });
  if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const view = await getGrowthView(workspace.id, brand.id, {
      brands: brandLimit(user),
      competitors: COMPETITORS_PER_BRAND,
    });
    if (!view) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const added = await refreshBrandIdeas(view, user.id);
    return NextResponse.json({ added });
  } catch (e) {
    console.error('[ideas/generate]', e);
    return NextResponse.json(
      { error: 'Couldn’t come up with ideas right now. Try again.' },
      { status: 500 }
    );
  }
}

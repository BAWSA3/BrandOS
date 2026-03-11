import { NextRequest, NextResponse } from 'next/server';
import { createAgents, validateBrandDNA } from '@/lib/agents';
import { ContentEngineRequestSchema } from '@/lib/agents/content-engine.types';
import { getUser } from '@/lib/auth';
import { checkAndIncrementUsage } from '@/lib/usage';
import { withUserRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Auth guard
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // User-based rate limit
    const { limited, resetIn } = withUserRateLimit(user.id, 'ai');
    if (limited) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait before generating again.', retryAfter: Math.ceil(resetIn / 1000) },
        { status: 429 }
      );
    }

    // Usage limit check
    const { allowed, usage } = await checkAndIncrementUsage(user.id, 'generation');
    if (!allowed) {
      return NextResponse.json(
        { error: 'Generation limit reached for your plan. Upgrade to continue.', usage },
        { status: 403 }
      );
    }

    // Validate input with Zod
    const body = await request.json();
    const parsed = ContentEngineRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { brandDNA, engineConfig, day, slot, topic } = parsed.data;

    if (!validateBrandDNA(brandDNA)) {
      return NextResponse.json(
        { error: 'Invalid or missing brand DNA' },
        { status: 400 }
      );
    }

    const agents = createAgents(brandDNA);
    const result = await agents.createScheduledContent(engineConfig, { day, slot, topic });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Generation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error('Content engine generation failed:', err);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}

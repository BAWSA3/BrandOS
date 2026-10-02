import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { buildBrandContext } from '@/prompts/brand-guardian';
import { BrandDNA } from '@/lib/types';
import { summarizeFingerprint, VoiceFingerprint } from '@/lib/voice-fingerprint';
import { getWorkspaceContext, ownedBrandWhere } from '@/lib/workspace-auth';
import { botGuard } from '@/lib/botid-guard';
import { checkAndIncrementUsage } from '@/lib/usage';
import { GUARD_PREAMBLE, wrapUntrusted } from '@/lib/prompt-safety';
import { readJsonBody } from '@/lib/api-body';

// Content repurposing (consolidation step 6). The legacy route read the dead
// sb-access-token cookie, gated on user.subscriptionTier, and interpolated
// user content into the prompt unfenced. Now: workspace auth + plan gate,
// BotID, prompt-safety fencing, generation-usage metering, and the
// deprecated claude-sonnet-4-20250514 swapped for its replacement tier.

const MAX_BODY_BYTES = 50_000;
const MAX_SOURCE_CHARS = 10_000;
const MAX_FORMATS = 6;
const MAX_OUTPUT_CHARS = 10_000;
const MODEL = 'claude-sonnet-5';

const formatInstructions: Record<string, string> = {
  thread:
    'Create a 3-5 tweet thread that expands on this idea. Each tweet should be under 280 characters. Format: number each tweet like "1/ ...", "2/ ...", etc.',
  poll: 'Create a Twitter poll. Format as: QUESTION: [the question]\\nOPTION 1: [option]\\nOPTION 2: [option]\\nOPTION 3: [option]\\nOPTION 4: [option]',
  'hot-take':
    'Rewrite this as a provocative hot take. Be bold, contrarian, and attention-grabbing. Keep under 280 characters.',
  educational:
    'Rewrite this as an educational post with structure: Hook (attention-grabbing first line) → Concept (the core idea) → Example (concrete illustration) → Takeaway (actionable conclusion).',
  'counter-argument':
    'Argue the opposite side of this take. Be thoughtful and nuanced. Present a compelling counter-perspective.',
  story:
    'Rewrite this as a short narrative/story format. Use personal or hypothetical storytelling to convey the same core message.',
};

function parseJsonColumn<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth lookup (DB) and bot classification (network) are independent —
    // overlap them.
    const [ctx, botBlock] = await Promise.all([
      getWorkspaceContext({ ensure: false }),
      botGuard(request),
    ]);
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Repurposing rides on the PRO Content Calendar feature — enforce on the
    // server, not just in the UI.
    if (!ctx.workspace || ctx.workspace.plan === 'FREE') {
      return NextResponse.json(
        {
          error: 'Content repurposing requires a PRO plan',
          code: 'PLAN_REQUIRED',
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }
    if (botBlock) return botBlock;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const read = await readJsonBody(request, MAX_BODY_BYTES);
    if (!read.ok) return read.response;
    const body = read.body;

    const brandId = typeof body.brandId === 'string' ? body.brandId : '';
    const sourceContent = typeof body.sourceContent === 'string' ? body.sourceContent.trim() : '';
    // Object.hasOwn, not `in`: prototype keys ('toString', 'constructor')
    // must not pass the allowlist and reach the paid prompt.
    const formats = Array.isArray(body.formats)
      ? body.formats
          .filter(
            (f): f is string => typeof f === 'string' && Object.hasOwn(formatInstructions, f)
          )
          .slice(0, MAX_FORMATS)
      : [];

    if (!brandId || !sourceContent || formats.length === 0) {
      return NextResponse.json(
        { error: 'brandId, sourceContent, and formats are required' },
        { status: 400 }
      );
    }
    if (sourceContent.length > MAX_SOURCE_CHARS) {
      return NextResponse.json(
        { error: `Content too long (max ${MAX_SOURCE_CHARS} characters)` },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.findFirst({
      where: ownedBrandWhere(brandId, ctx.workspace.id, ctx.user.id),
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Only after the request is known-valid — rejected requests must not
    // burn a generation credit. One credit per request, not per format: a
    // repurpose is a single user action.
    const { allowed, usage } = await checkAndIncrementUsage(ctx.user.id, 'generation');
    if (!allowed) {
      return NextResponse.json(
        { error: 'Usage limit reached', code: 'USAGE_LIMIT', usage, upgradeUrl: '/pricing' },
        { status: 429 }
      );
    }

    const brandDNA: BrandDNA = {
      id: brand.id,
      name: brand.name,
      colors: parseJsonColumn(brand.colors, { primary: '', secondary: '', accent: '' }),
      tone: parseJsonColumn(brand.tone, { minimal: 50, playful: 50, bold: 50, experimental: 50 }),
      keywords: parseJsonColumn(brand.keywords, []),
      doPatterns: parseJsonColumn(brand.doPatterns, []),
      dontPatterns: parseJsonColumn(brand.dontPatterns, []),
      voiceSamples: parseJsonColumn(brand.voiceSamples, []),
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };

    let fingerprintSummary;
    if (brand.voiceFingerprint) {
      const fp = parseJsonColumn<VoiceFingerprint | null>(brand.voiceFingerprint, null);
      if (fp) fingerprintSummary = summarizeFingerprint(fp);
    }

    const brandContext = buildBrandContext(brandDNA, fingerprintSummary);

    // The source is often third-party text (repurposing someone's tweet) —
    // fence it so it can't override the task instructions.
    const fencedSource = wrapUntrusted(sourceContent, 'source_content', MAX_SOURCE_CHARS);

    const anthropic = new Anthropic({ apiKey });

    // Generate all derivatives in parallel; a single failed format is
    // dropped rather than failing the batch.
    const results = await Promise.all(
      formats.map(async (format) => {
        const prompt = `You are a content repurposing assistant. Your job is to transform source content into different formats while maintaining the brand voice.

${brandContext}

SOURCE CONTENT:
${fencedSource}

TASK: ${formatInstructions[format]}

Return ONLY the repurposed content, no explanations or meta-commentary.`;

        try {
          const message = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 1000,
            // Sonnet 5 defaults to adaptive thinking — keep the budget for
            // output.
            thinking: { type: 'disabled' },
            messages: [{ role: 'user', content: GUARD_PREAMBLE + prompt }],
          });

          const content = message.content[0]?.type === 'text' ? message.content[0].text : '';
          return content.trim() ? { format, content: content.slice(0, MAX_OUTPUT_CHARS) } : null;
        } catch (err) {
          console.error(`[repurpose] Failed to generate ${format}:`, err);
          return null;
        }
      })
    );

    // Never return placeholder "derivatives" the UI would offer to save; if
    // every format failed, say so. (The generation credit is already spent —
    // refunds would need transactional usage tracking, same as /api/check.)
    const derivatives = results.filter((r) => r !== null);
    if (derivatives.length === 0) {
      return NextResponse.json(
        { error: 'Generation failed — try again in a minute.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ derivatives });
  } catch (error: unknown) {
    console.error('[repurpose] error:', error);
    const message =
      error instanceof Anthropic.APIError && error.status === 429
        ? 'Repurposing is busy right now — try again in a minute.'
        : 'Repurposing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

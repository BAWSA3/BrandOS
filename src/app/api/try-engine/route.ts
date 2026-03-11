import { NextRequest, NextResponse } from 'next/server';
import { generateScheduledContent } from '@/lib/agents/content.agent';
import { ContentEngineConfig, TryEngineRequestSchema, DEFAULT_CONTENT_ENGINE_CONFIG } from '@/lib/agents/content-engine.types';
import { BrandDNA } from '@/lib/types';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import type { QuickVoiceScan } from './scan/route';

function buildTrialBrandDNA(
  name?: string,
  tone?: string,
  voiceScan?: QuickVoiceScan
): BrandDNA {
  const tonePresets: Record<string, BrandDNA['tone']> = {
    bold:    { minimal: 70, playful: 40, bold: 85, experimental: 60 },
    chill:   { minimal: 60, playful: 70, bold: 30, experimental: 40 },
    pro:     { minimal: 50, playful: 20, bold: 50, experimental: 20 },
    edgy:    { minimal: 80, playful: 30, bold: 90, experimental: 80 },
    default: { minimal: 50, playful: 50, bold: 50, experimental: 50 },
  };

  // Use voice scan's suggested vibe if no explicit tone selected
  const effectiveTone = tone || voiceScan?.suggestedVibe || 'default';

  return {
    id: 'trial',
    name: name || 'My Brand',
    colors: { primary: '#000000', secondary: '#ffffff', accent: '#0A84FF' },
    tone: tonePresets[effectiveTone] || tonePresets.default,
    keywords: voiceScan?.sampleTopics || [],
    doPatterns: voiceScan?.doPatterns || [],
    dontPatterns: voiceScan?.dontPatterns || [],
    voiceSamples: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const { limited, remaining } = checkRateLimit(`try-engine:${clientId}`, {
    interval: 60 * 1000,
    maxRequests: 2, // Tightened from 3 to 2/min
  });

  if (limited) {
    return NextResponse.json(
      { error: 'Rate limit reached. Sign up for unlimited generations.', upgrade: true },
      { status: 429 }
    );
  }

  try {
    // Validate input with Zod
    const body = await request.json();
    const parsed = TryEngineRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, tone, day, slot, topic, ctaType, gapTargeted, voiceScan } = parsed.data;

    const brandDNA = buildTrialBrandDNA(name, tone, voiceScan);

    // Override CTA and voice constraints from scan
    const engineConfig: ContentEngineConfig = {
      ...DEFAULT_CONTENT_ENGINE_CONFIG,
      voiceConstraints: voiceScan?.toneWords || [],
      neverSay: voiceScan?.dontPatterns || [],
    };

    // Override CTA if user selected one
    if (ctaType) {
      engineConfig.ctaRotation = {
        ...engineConfig.ctaRotation,
        [day]: {
          ...engineConfig.ctaRotation[day],
          [slot]: ctaType,
        },
      };
    }

    // Override gap if user selected one
    if (gapTargeted) {
      engineConfig.engagement = {
        ...engineConfig.engagement,
        topGaps: [gapTargeted],
      };
    }

    const result = await generateScheduledContent(
      { brandDNA },
      engineConfig,
      { day, slot, topic }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Generation failed' }, { status: 500 });
    }

    return NextResponse.json({
      ...result.data,
      remaining,
      brandAlignmentNote: voiceScan
        ? 'Generated with a quick voice scan. Full Brand DNA setup gives much deeper voice matching.'
        : 'Generated with a generic voice. Set up your Brand DNA for posts that actually sound like you.',
    });
  } catch (err) {
    console.error('Try engine generation failed:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

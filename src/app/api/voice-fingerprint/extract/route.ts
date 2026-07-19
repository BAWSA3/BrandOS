import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { VoiceFingerprint, summarizeFingerprint } from '@/lib/voice-fingerprint';
import {
  buildFingerprintExtractionPrompt,
  buildFingerprintRefinementPrompt,
} from '@/prompts/voice-fingerprint';
import { getWorkspaceContext } from '@/lib/workspace-auth';
import { botGuard } from '@/lib/botid-guard';
import { GUARD_PREAMBLE, wrapUntrusted } from '@/lib/prompt-safety';
import { extractJson } from '@/lib/score-schemas';

// Voice fingerprint extraction (consolidation step 5). This was always meant
// to be a PRO feature but the legacy /app surface rendered it ungated and
// this route was anonymously callable. Now: auth + server-side plan gate +
// BotID + prompt-safety fencing + output validation.

const MAX_BODY_BYTES = 100_000;
const MAX_SAMPLES = 10;
const MAX_SAMPLE_CHARS = 2_000;
// Deprecated claude-sonnet-4-20250514 → its designated replacement tier.
const MODEL = 'claude-sonnet-5';

function isFingerprintShape(raw: unknown): raw is VoiceFingerprint {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  return (
    typeof obj.sentencePatterns === 'object' &&
    obj.sentencePatterns !== null &&
    typeof obj.vocabulary === 'object' &&
    obj.vocabulary !== null &&
    typeof obj.formatting === 'object' &&
    obj.formatting !== null &&
    typeof obj.rhetoric === 'object' &&
    obj.rhetoric !== null
  );
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getWorkspaceContext({ ensure: false });
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fingerprint extraction is a PRO feature — enforce on the server, not
    // just in the UI.
    if (!ctx.workspace || ctx.workspace.plan === 'FREE') {
      return NextResponse.json(
        {
          error: 'Voice Fingerprint requires a PRO plan',
          code: 'PLAN_REQUIRED',
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    const botBlock = await botGuard(request);
    if (botBlock) return botBlock;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }
    let body: { samples?: unknown; existingFingerprint?: VoiceFingerprint };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const samples = Array.isArray(body.samples)
      ? body.samples
          .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
          .slice(0, MAX_SAMPLES)
          .map((s) => s.slice(0, MAX_SAMPLE_CHARS))
      : [];

    if (samples.length === 0) {
      return NextResponse.json(
        { error: 'At least one writing sample is required' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // Samples are user-pasted text (often containing third-party content) —
    // fence each one so it can't override the extraction rubric.
    const fencedSamples = samples.map((s, i) =>
      wrapUntrusted(s, `voice_sample_${i + 1}`, MAX_SAMPLE_CHARS)
    );

    const prompt = body.existingFingerprint
      ? buildFingerprintRefinementPrompt(body.existingFingerprint, fencedSamples)
      : buildFingerprintExtractionPrompt(fencedSamples);

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      // Sonnet 5 defaults to adaptive thinking — keep the budget for output.
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: GUARD_PREAMBLE + prompt }],
    });

    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const raw = extractJson(responseText);
    if (!isFingerprintShape(raw)) {
      console.error('[Voice Fingerprint] Model output failed validation');
      return NextResponse.json({ error: 'Extraction returned an invalid result' }, { status: 502 });
    }

    // Metadata is ours to stamp, not the model's.
    const fingerprint: VoiceFingerprint = {
      ...raw,
      metadata: {
        sampleCount: samples.length,
        totalWordCount: samples.join(' ').split(/\s+/).filter(Boolean).length,
        extractedAt: new Date().toISOString(),
        confidence:
          typeof raw.metadata?.confidence === 'number'
            ? Math.max(0, Math.min(100, Math.round(raw.metadata.confidence)))
            : 50,
        version: 1,
      },
    };

    const summary = summarizeFingerprint(fingerprint);

    return NextResponse.json({ fingerprint, summary });
  } catch (error: unknown) {
    console.error('Voice fingerprint extraction error:', error);
    const message =
      error instanceof Anthropic.APIError && error.status === 429
        ? 'Extraction is busy right now — try again in a minute.'
        : 'Fingerprint extraction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

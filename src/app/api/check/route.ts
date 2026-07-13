import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildCheckPrompt } from '@/prompts/brand-guardian';
import { BrandDNA } from '@/lib/types';
import { VoiceFingerprint, AuthenticityScore } from '@/lib/voice-fingerprint';
import { buildAuthenticityCheckPrompt } from '@/prompts/voice-fingerprint';
import { getCurrentUser } from '@/lib/auth';
import { botGuard } from '@/lib/botid-guard';
import { checkAndIncrementUsage } from '@/lib/usage';
import { GUARD_PREAMBLE, wrapUntrusted } from '@/lib/prompt-safety';
import { clampScore, extractJson } from '@/lib/score-schemas';

// Content Check — scores a draft against the user's brand DNA (consolidation
// step 4). Hardened for the dashboard surface: the legacy route allowed
// anonymous callers to burn Anthropic credits and parsed model output
// untyped. Now: auth required, BotID on the browser path, prompt-safety
// fencing on user-pasted content, and strict output validation.

// A draft plus the brand corpus; anything beyond this is abuse, not usage.
const MAX_BODY_BYTES = 100_000;
const MAX_CONTENT_CHARS = 10_000;
// claude-sonnet-4-20250514 (previous model here) is deprecated, retires
// 2026-06-15; claude-sonnet-5 is its designated replacement tier.
const MODEL = 'claude-sonnet-5';

const MAX_LIST_ITEMS = 10;
const MAX_ITEM_CHARS = 500;

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .slice(0, MAX_LIST_ITEMS)
    .map((s) => s.slice(0, MAX_ITEM_CHARS));
}

// Validate + clamp the model's JSON into a CheckResult shape. Returns null
// if the output doesn't look like a check result at all.
function parseCheckResult(text: string) {
  const raw = extractJson(text);
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  // A non-numeric score means the model didn't produce a usable check —
  // reject rather than clamp null/strings into a confident-looking 0.
  if (typeof obj.score !== 'number') return null;

  return {
    score: clampScore(obj.score),
    issues: asStringList(obj.issues),
    strengths: asStringList(obj.strengths),
    suggestions: asStringList(obj.suggestions),
    revisedVersion:
      typeof obj.revisedVersion === 'string' ? obj.revisedVersion.slice(0, MAX_CONTENT_CHARS) : '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const botBlock = await botGuard(request);
    if (botBlock) return botBlock;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    let body: {
      brandDNA?: BrandDNA;
      content?: unknown;
      voiceFingerprint?: VoiceFingerprint;
    };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { brandDNA, voiceFingerprint } = body;
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!brandDNA?.name || !content) {
      return NextResponse.json({ error: 'Missing brand DNA or content' }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_CHARS) {
      return NextResponse.json(
        { error: `Content too long (max ${MAX_CONTENT_CHARS} characters)` },
        { status: 400 }
      );
    }

    // Only after the request is known-valid — rejected requests must not
    // burn a check credit. (An LLM failure after this point still consumes
    // one; refunds would need transactional usage tracking.)
    const { allowed, usage } = await checkAndIncrementUsage(user.id, 'check');
    if (!allowed) {
      return NextResponse.json(
        { error: 'Usage limit reached', code: 'USAGE_LIMIT', usage, upgradeUrl: '/pricing' },
        { status: 429 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // The draft is untrusted (users paste third-party text); fence it so it
    // can't override the rubric. The brand fields are the user's own data
    // and flow through buildCheckPrompt as before.
    const fencedContent = wrapUntrusted(content, 'user_draft', MAX_CONTENT_CHARS);

    // The authenticity check depends only on request inputs, so it runs
    // concurrently with the main check instead of doubling latency. It is
    // non-blocking: failures resolve to null rather than rejecting the pair.
    const mainCall = anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      // Sonnet 5 runs adaptive thinking when the field is omitted — keep the
      // legacy no-thinking behavior so the token budget is all response.
      thinking: { type: 'disabled' },
      messages: [
        {
          role: 'user',
          content: GUARD_PREAMBLE + buildCheckPrompt(brandDNA, fencedContent),
        },
      ],
    });

    const authCall = voiceFingerprint?.metadata
      ? anthropic.messages
          .create({
            model: MODEL,
            max_tokens: 3000,
            thinking: { type: 'disabled' },
            messages: [
              {
                role: 'user',
                content:
                  GUARD_PREAMBLE + buildAuthenticityCheckPrompt(voiceFingerprint, fencedContent),
              },
            ],
          })
          .catch((e: unknown) => {
            console.error('Authenticity check failed (non-blocking):', e);
            return null;
          })
      : Promise.resolve(null);

    const [message, authMessage] = await Promise.all([mainCall, authCall]);

    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const result = parseCheckResult(responseText);
    if (!result) {
      console.error('[Check API] Model output failed validation');
      return NextResponse.json({ error: 'Analysis returned an invalid result' }, { status: 502 });
    }

    let authenticityScore: AuthenticityScore | null = null;
    if (authMessage) {
      const authText = authMessage.content[0]?.type === 'text' ? authMessage.content[0].text : '';
      const parsed = extractJson(authText);
      // Minimal shape gate — non-blocking feature, but never forward
      // unvalidated model output.
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof (parsed as Record<string, unknown>).overall === 'number' &&
        typeof (parsed as Record<string, unknown>).verdict === 'string'
      ) {
        const cand = parsed as AuthenticityScore;
        authenticityScore = { ...cand, overall: clampScore(cand.overall) };
      }
    }

    return NextResponse.json({ ...result, authenticityScore });
  } catch (error: unknown) {
    console.error('Check API error:', error);

    let message = 'Analysis failed';
    if (error instanceof Anthropic.APIError) {
      message =
        error.status === 429
          ? 'Analysis is busy right now — try again in a minute.'
          : 'Analysis failed';
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

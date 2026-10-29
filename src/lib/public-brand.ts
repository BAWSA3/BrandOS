import Anthropic from '@anthropic-ai/sdk';
import { computeBrandScore } from '@/lib/brand-score';
import { freshRead, profileCard, publicRead, type ProfileRead } from '@/lib/mcp/profile-read';
import { GUARD_PREAMBLE, wrapUntrusted } from '@/lib/prompt-safety';
import { extractJson } from '@/lib/score-schemas';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { replyText } from '@/lib/model-text';

/**
 * The public brand page (mybrandos.app/@handle) and its "Compare your brand"
 * funnel. Public scan data only: a BrandOS user's private dashboard never
 * shows here. A scan under 7 days old is reused; otherwise the page scans.
 */

export const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
export type BrandCard = ReturnType<typeof profileCard>;

export class BrandLookupError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** Stored public read (free) or a fresh scan. Throws BrandLookupError. */
export async function readOrScan(rawHandle: string, origin: string): Promise<ProfileRead> {
  const handle = rawHandle.replace(/^@/, '');
  if (!HANDLE_RE.test(handle)) throw new BrandLookupError('That is not a valid X handle.', 400);
  const stored = await publicRead(handle);
  if (stored) return stored;
  const result = await computeBrandScore(handle.toLowerCase(), origin);
  if (result.status === 404) throw new BrandLookupError(`Couldn't find @${handle} on X.`, 404);
  if (result.status !== 200) throw new BrandLookupError('The scan failed. Try again shortly.', 502);
  const profile = result.body.profile as { username?: string } | undefined;
  return freshRead(
    profile?.username || handle,
    (result.body.brandScore ?? {}) as Record<string, unknown>
  );
}

const gapCache = new Map<string, { at: number; gaps: string[] }>();
const GAP_TTL = 24 * 60 * 60 * 1000;

function brief(r: ProfileRead): string {
  const i = r.intel;
  const arch = r.archetype ? (getArchetypeInfo(r.archetype)?.name ?? r.archetype) : 'unknown';
  return [
    `Score ${r.score}/100, archetype ${arch}.`,
    i.phaseScores
      ? `Phases: define ${i.phaseScores.define}, check ${i.phaseScores.check}, generate ${i.phaseScores.generate}, scale ${i.phaseScores.scale}.`
      : '',
    i.contentPillars?.length ? `Pillars: ${i.contentPillars.slice(0, 4).join('; ')}.` : '',
    i.strengths?.length ? `Strengths: ${i.strengths.slice(0, 3).join(' | ')}` : '',
    i.improvements?.length ? `Weak spots: ${i.improvements.slice(0, 3).join(' | ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** 2-3 lines: what @them does that @me doesn't. Never throws (empty on failure). */
export async function compareGaps(me: ProfileRead, them: ProfileRead): Promise<string[]> {
  const key = `${me.handle.toLowerCase()}>${them.handle.toLowerCase()}:${me.score}:${them.score}`;
  const hit = gapCache.get(key);
  if (hit && Date.now() - hit.at < GAP_TTL) return hit.gaps;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];
  try {
    const msg = await new Anthropic({ apiKey }).messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 500,
      thinking: { type: 'disabled' },
      messages: [
        {
          role: 'user',
          content: `${GUARD_PREAMBLE}
You are BrandOS, a brand strategist. Compare two X creators' brand reads. Write 2-3 short lines, each a concrete thing @${them.handle} does that @${me.handle} doesn't (yet), addressed to @${me.handle} as "you". Specific to the evidence, no generic advice, one sentence each, never rewrite anyone's posts. Return ONLY JSON: {"gaps":["",""]}

@${me.handle} (YOU):
${wrapUntrusted(brief(me), 'your_brand', 2000)}

@${them.handle}:
${wrapUntrusted(brief(them), 'their_brand', 2000)}`,
        },
      ],
    });
    const text = replyText(msg);
    const raw = extractJson(text) as { gaps?: unknown } | null;
    const gaps = Array.isArray(raw?.gaps)
      ? raw.gaps
          .filter((g): g is string => typeof g === 'string' && !!g.trim())
          .slice(0, 3)
          .map((g) => g.trim().slice(0, 220))
      : [];
    gapCache.set(key, { at: Date.now(), gaps });
    return gaps;
  } catch (e) {
    console.error('[public-brand] compare gaps failed:', e);
    return [];
  }
}

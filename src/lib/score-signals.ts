/**
 * Measured score signals: the half of a brand score that comes from numbers,
 * not the model's judgment. Pure, no network/DB.
 *
 * Why this exists: Claude at temperature 0 settles on a handful of "default"
 * phase tuples. In the 14 days to 2026-10-24, 62 of 174 scanned users shared
 * their exact four phase scores with someone else, and 52 of 228 scans scored
 * exactly 72. @levelsio (981K followers) and @jbawsa (31K) got identical phases.
 * Generate (content performance) and Scale (reputation) are mostly measurable,
 * so those phases now blend the model's read with these signals, and the
 * overall score is computed from the phases instead of taken from the model.
 */
import type { ContentPatterns, TweetAnalysisStats, XProfileData } from '@/lib/gemini';

/**
 * Bump when the scoring method changes. Scores recorded under an older version
 * aren't used as a smoothing anchor (a new method shouldn't be pinned to ±3 of
 * an old number); see brand-score.ts.
 */
export const SCORER_VERSION = 2;

export const PHASE_WEIGHTS = { define: 0.3, check: 0.25, generate: 0.25, scale: 0.2 } as const;
export type PhaseKey = keyof typeof PHASE_WEIGHTS;

/** How much of the blended phase the measured signal carries. */
export const MEASURED_SHARE = { generate: 0.5, scale: 0.6 } as const;

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const clampScore = (n: number) => Math.round(Math.min(100, Math.max(0, n)));
const log10p = (n: number) => Math.log10(Math.max(0, n) + 1);

/**
 * Reputation from public metrics: audience size (log scale, ~100 → 0,
 * ~2M → full), how many people curate the account into lists, and whether
 * people follow it for the content (follower/following ratio). 0-100.
 */
export function measuredScale(profile: Pick<XProfileData, 'public_metrics' | 'verified'>): number {
  const m = profile.public_metrics;
  const followers = m?.followers_count || 0;
  const following = m?.following_count || 0;
  const listed = m?.listed_count || 0;

  const size = clamp01((log10p(followers) - 2) / 4.3);
  const curated = clamp01(log10p(listed) / 4.3);
  const ratio = clamp01((Math.log10((followers + 1) / (following + 1)) + 0.5) / 3.5);

  return clampScore(
    100 * (0.55 * size + 0.25 * curated + 0.2 * ratio) + (profile.verified ? 3 : 0)
  );
}

/**
 * Content performance from the sampled posts: reach per post (absolute
 * interactions), efficiency (engagement rate of views, or interactions per
 * 1K followers when views are missing) and cadence. 0-100, or null when there
 * are no sampled posts to measure.
 */
export function measuredGenerate(
  stats: TweetAnalysisStats | null | undefined,
  followers: number,
  patterns?: ContentPatterns | null
): number | null {
  if (!stats || !stats.totalTweets) return null;

  const perPost = (stats.avgLikes || 0) + (stats.avgRetweets || 0) + (stats.avgReplies || 0);
  const reach = clamp01(log10p(perPost) / 3.7); // ~5K interactions a post → full

  const efficiency =
    stats.engagementRateKnown !== false && stats.avgEngagementRate > 0
      ? clamp01(log10p(stats.avgEngagementRate * 10) / Math.log10(51)) // 5% of views → full
      : clamp01(log10p((perPost / Math.max(1, followers)) * 1000) / 2); // 100 per 1K followers → full

  const ppd = stats.postsPerDay ?? 0;
  const cadence = ppd > 0 ? clamp01(log10p(ppd * 10) / Math.log10(31)) : 0.3; // 3/day → full

  const media =
    patterns && stats.totalTweets > 0 ? clamp01(patterns.mediaUsage / stats.totalTweets / 0.4) : 0;

  return clampScore(100 * (0.38 * reach + 0.37 * efficiency + 0.18 * cadence + 0.07 * media));
}

export interface PhaseScores {
  define: number;
  check: number;
  generate: number;
  scale: number;
}

/** Weighted overall from the four phases (the documented 30/25/25/20 split). */
export function weightedOverall(p: PhaseScores): number {
  return clampScore(
    p.define * PHASE_WEIGHTS.define +
      p.check * PHASE_WEIGHTS.check +
      p.generate * PHASE_WEIGHTS.generate +
      p.scale * PHASE_WEIGHTS.scale
  );
}

export interface BlendInput {
  model: PhaseScores;
  measured: { generate: number | null; scale: number };
  /** Model sub-scores that are more granular than its phase scores, if returned. */
  topicConcentration?: number | null;
  voiceConsistency?: number | null;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/**
 * Final phase scores. Define and Check stay judgment calls (nudged by the
 * model's own finer-grained topic-concentration and voice-consistency reads);
 * Generate and Scale blend in the measured signals.
 */
export function blendPhases({
  model,
  measured,
  topicConcentration,
  voiceConsistency,
}: BlendInput): PhaseScores {
  const mix = (a: number, b: number, share: number) => clampScore(a * (1 - share) + b * share);
  return {
    define: finite(topicConcentration)
      ? mix(model.define, topicConcentration, 0.25)
      : clampScore(model.define),
    check: finite(voiceConsistency)
      ? mix(model.check, voiceConsistency, 0.25)
      : clampScore(model.check),
    generate:
      measured.generate === null
        ? clampScore(model.generate)
        : mix(model.generate, measured.generate, MEASURED_SHARE.generate),
    scale: mix(model.scale, measured.scale, MEASURED_SHARE.scale),
  };
}

/**
 * Apply the blend to a parsed brand-score object in place: rewrites each
 * phase's score and the overall. Returns the final phases.
 */
export function applyMeasuredSignals(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the rich model object is consumed dynamically
  brandScore: any,
  profile: Pick<XProfileData, 'public_metrics' | 'verified'>,
  stats?: TweetAnalysisStats | null,
  patterns?: ContentPatterns | null
): PhaseScores {
  const phases = brandScore.phases ?? {};
  const model: PhaseScores = {
    define: Number(phases.define?.score) || 0,
    check: Number(phases.check?.score) || 0,
    generate: Number(phases.generate?.score) || 0,
    scale: Number(phases.scale?.score) || 0,
  };
  const followers = profile.public_metrics?.followers_count || 0;
  const final = blendPhases({
    model,
    measured: {
      generate: measuredGenerate(stats, followers, patterns),
      scale: measuredScale(profile),
    },
    topicConcentration: phases.define?.contentIdentity?.topicConcentration,
    voiceConsistency: brandScore.voiceAnalysis?.consistencyScore,
  });
  for (const k of Object.keys(final) as PhaseKey[]) {
    brandScore.phases = brandScore.phases ?? {};
    brandScore.phases[k] = { ...(brandScore.phases[k] ?? {}), score: final[k] };
  }
  brandScore.overallScore = weightedOverall(final);
  return final;
}

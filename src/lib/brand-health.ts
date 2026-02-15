import { BrandDNA } from './types';
import { buildBrandContext } from '@/prompts/brand-guardian';

// ── Types ──────────────────────────────────────────────────────

export interface HealthDimensions {
  completeness: number;
  consistency: number;
  voiceMatch: number;
  engagement: number;
  activity: number;
}

export interface AvailableDataFlags {
  hasCheckEntries: boolean; // ≥ 3 content checks
  hasPosts: boolean;        // has X posts for voice/engagement
}

export interface TrendResult {
  direction: 'up' | 'down' | 'stable';
  delta: number;
}

// ── Completeness (15%) ─────────────────────────────────────────
// Server-side mirror of useBrandCompleteness() hook logic

export function computeCompleteness(brand: BrandDNA): number {
  const items = [
    { isComplete: Boolean(brand.name?.trim()), weight: 15 },
    { isComplete: Boolean(brand.colors?.primary && brand.colors?.secondary && brand.colors?.accent), weight: 15 },
    { isComplete: brand.tone?.minimal !== undefined, weight: 15 },
    { isComplete: Boolean(brand.keywords && brand.keywords.length >= 3), weight: 15 },
    { isComplete: Boolean(brand.doPatterns && brand.doPatterns.length >= 2), weight: 15 },
    { isComplete: Boolean(brand.dontPatterns && brand.dontPatterns.length >= 2), weight: 10 },
    { isComplete: Boolean(brand.voiceSamples && brand.voiceSamples.length >= 2), weight: 15 },
  ];

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = items.filter(i => i.isComplete).reduce((sum, item) => sum + item.weight, 0);

  return Math.round((completedWeight / totalWeight) * 100);
}

// ── Consistency (25%) ──────────────────────────────────────────
// Average of last 20 content-check alignment scores

export function computeConsistency(checkEntries: { score: number | null }[]): number {
  const scores = checkEntries
    .map(e => e.score)
    .filter((s): s is number => s !== null)
    .slice(0, 20);

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ── Voice Match (25%) ──────────────────────────────────────────
// Claude call: send last 10 posts + brand DNA → get 0-100 score

export function buildVoiceMatchPrompt(brand: BrandDNA, posts: string[]): string {
  return `You are a brand voice analyst. Analyze how well these recent posts match the brand's defined voice and identity.

${buildBrandContext(brand)}

RECENT POSTS:
${posts.map((p, i) => `${i + 1}. "${p}"`).join('\n')}

Score how consistently these posts match the brand voice on a scale of 0-100.
- 90-100: Posts perfectly embody the brand voice
- 70-89: Posts mostly match with minor deviations
- 50-69: Posts are somewhat aligned but inconsistent
- 30-49: Posts frequently deviate from the brand voice
- 0-29: Posts don't match the brand voice at all

Return ONLY valid JSON:
{"score": <number 0-100>, "reasoning": "<one sentence explanation>"}`;
}

export async function computeVoiceMatch(
  posts: string[],
  brand: BrandDNA,
  callClaude: (prompt: string) => Promise<string>
): Promise<number> {
  if (posts.length === 0) return 0;

  const prompt = buildVoiceMatchPrompt(brand, posts.slice(0, 10));
  try {
    const response = await callClaude(prompt);
    const parsed = JSON.parse(response);
    const score = Number(parsed.score);
    if (isNaN(score)) return 0;
    return Math.max(0, Math.min(100, Math.round(score)));
  } catch {
    return 0;
  }
}

// ── Engagement (20%) ───────────────────────────────────────────
// Engagement rate mapped to percentile

interface PostMetrics {
  like_count: number;
  retweet_count: number;
  reply_count: number;
  impression_count: number;
}

export function computeEngagement(posts: { public_metrics: PostMetrics }[]): number {
  if (posts.length === 0) return 0;

  const avgRate =
    posts.reduce((sum, p) => {
      const engagement = p.public_metrics.like_count + p.public_metrics.retweet_count + p.public_metrics.reply_count;
      const impressions = p.public_metrics.impression_count || 1;
      return sum + (engagement / impressions) * 100;
    }, 0) / posts.length;

  // Map engagement rate to 0-100 score
  if (avgRate >= 3) return 100;
  if (avgRate >= 2) return 85;
  if (avgRate >= 1.5) return 75;
  if (avgRate >= 1) return 60;
  if (avgRate >= 0.5) return 40;
  if (avgRate > 0) return 20;
  return 0;
}

// ── Activity (15%) ─────────────────────────────────────────────
// Action count in last 14 days mapped to score

export function computeActivity(actionCount: number): number {
  if (actionCount >= 21) return 100;
  if (actionCount >= 16) return 90;
  if (actionCount >= 11) return 85;
  if (actionCount >= 6) return 70;
  if (actionCount >= 3) return 50;
  if (actionCount >= 1) return 25;
  return 0;
}

// ── Overall Score ──────────────────────────────────────────────
// Weighted average with redistribution when data is missing

const BASE_WEIGHTS: Record<keyof HealthDimensions, number> = {
  completeness: 15,
  consistency: 25,
  voiceMatch: 25,
  engagement: 20,
  activity: 15,
};

export function computeOverallScore(
  dimensions: HealthDimensions,
  flags: AvailableDataFlags
): number {
  const weights = { ...BASE_WEIGHTS };

  // Redistribute weights when data is missing
  if (!flags.hasPosts) {
    // Voice Match + Engagement → Completeness + Consistency
    const redistributed = weights.voiceMatch + weights.engagement;
    weights.voiceMatch = 0;
    weights.engagement = 0;
    weights.completeness += Math.round(redistributed * 0.4);
    weights.consistency += Math.round(redistributed * 0.6);
  }

  if (!flags.hasCheckEntries) {
    // Consistency → Completeness
    weights.completeness += weights.consistency;
    weights.consistency = 0;
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0;

  const weightedSum =
    dimensions.completeness * weights.completeness +
    dimensions.consistency * weights.consistency +
    dimensions.voiceMatch * weights.voiceMatch +
    dimensions.engagement * weights.engagement +
    dimensions.activity * weights.activity;

  return Math.round(weightedSum / totalWeight);
}

// ── Trend ──────────────────────────────────────────────────────
// Compare to previous snapshot

export function computeTrend(currentScore: number, previousScore: number | null): TrendResult {
  if (previousScore === null) {
    return { direction: 'stable', delta: 0 };
  }

  const delta = currentScore - previousScore;
  let direction: TrendResult['direction'] = 'stable';
  if (delta > 3) direction = 'up';
  else if (delta < -3) direction = 'down';

  return { direction, delta };
}

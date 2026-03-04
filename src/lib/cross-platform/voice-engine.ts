// =============================================================================
// CROSS-PLATFORM VOICE CONSISTENCY ENGINE
// Wraps the existing voice-consistency module with platform-agnostic input.
// =============================================================================

import type { ContentItem, SocialPlatform } from './types';
import { PLATFORM_NORMS } from './types';
import type { VoiceConsistencyReport } from '@/lib/schemas/voice-consistency.schema';
import type { VoiceFingerprint } from '@/lib/voice-fingerprint';
import { analyzeVoiceConsistency as coreAnalyze } from '@/lib/voice-consistency';

/**
 * Extract analyzable text from a ContentItem.
 * Prefers transcript for video content, falls back to textContent.
 */
function extractAnalyzableText(item: ContentItem): string | null {
  if (item.transcript) return item.transcript;
  if (item.textContent) return item.textContent;
  return null;
}

/**
 * Convert ContentItem[] into the TweetInput format the core engine expects.
 */
function contentItemsToTweetInputs(
  items: ContentItem[]
): { id: string; text: string; created_at: string }[] {
  return items
    .map((item) => {
      const text = extractAnalyzableText(item);
      if (!text) return null;
      return {
        id: item.id,
        text,
        created_at: item.metadata.postedAt,
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
}

/**
 * Analyze voice consistency across ContentItems from any platform.
 */
export async function analyzeVoiceConsistencyForContent(
  items: ContentItem[],
  options?: {
    fingerprint?: VoiceFingerprint | null;
    fallbackDescription?: string;
  }
): Promise<VoiceConsistencyReport | null> {
  const tweetInputs = contentItemsToTweetInputs(items);
  if (tweetInputs.length === 0) return null;

  return coreAnalyze(tweetInputs, options);
}

/**
 * Analyze voice consistency per platform, returning a breakdown.
 */
export async function analyzeVoiceConsistencyByPlatform(
  items: ContentItem[],
  options?: {
    fingerprint?: VoiceFingerprint | null;
    fallbackDescription?: string;
  }
): Promise<Record<SocialPlatform, VoiceConsistencyReport | null>> {
  const grouped = groupByPlatform(items);

  const results: Record<string, VoiceConsistencyReport | null> = {};

  for (const [platform, platformItems] of Object.entries(grouped)) {
    results[platform] = await analyzeVoiceConsistencyForContent(
      platformItems,
      options
    );
  }

  return results as Record<SocialPlatform, VoiceConsistencyReport | null>;
}

/**
 * Cross-platform voice consistency — how similar is the voice across platforms.
 * Compares per-platform dimension scores and computes a consistency delta.
 */
export function computeCrossPlatformVoiceScore(
  perPlatform: Record<SocialPlatform, VoiceConsistencyReport | null>
): {
  crossPlatformScore: number;
  platformScores: { platform: SocialPlatform; score: number }[];
  explanation: string;
} {
  const scores: { platform: SocialPlatform; score: number }[] = [];

  for (const [platform, report] of Object.entries(perPlatform)) {
    if (report) {
      scores.push({
        platform: platform as SocialPlatform,
        score: report.overallScore,
      });
    }
  }

  if (scores.length === 0) {
    return {
      crossPlatformScore: 0,
      platformScores: [],
      explanation: 'No platform data available for cross-platform analysis.',
    };
  }

  if (scores.length === 1) {
    return {
      crossPlatformScore: scores[0].score,
      platformScores: scores,
      explanation: `Only ${PLATFORM_NORMS[scores[0].platform]?.description ?? scores[0].platform} data available. Connect more platforms for cross-platform scoring.`,
    };
  }

  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

  // Variance — lower variance = more consistent across platforms
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s.score - avgScore, 2), 0) /
    scores.length;
  const stdDev = Math.sqrt(variance);

  // Consistency bonus: low variance across platforms adds up to 10 points
  const consistencyBonus = Math.max(0, 10 - stdDev / 2);
  const crossPlatformScore = Math.round(
    Math.min(100, avgScore * 0.8 + consistencyBonus + avgScore * 0.2)
  );

  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  let explanation = `Voice consistency averages ${Math.round(avgScore)} across ${scores.length} platforms.`;
  if (stdDev > 15) {
    explanation += ` Significant variance detected (±${Math.round(stdDev)}). ${PLATFORM_NORMS[weakest.platform]?.description ?? weakest.platform} is weakest at ${weakest.score}.`;
  } else {
    explanation += ` Brand voice is well-aligned across platforms.`;
  }

  return { crossPlatformScore, platformScores: scores, explanation };
}

// ── Helpers ─────────────────────────────────────────────────────

function groupByPlatform(
  items: ContentItem[]
): Partial<Record<SocialPlatform, ContentItem[]>> {
  const grouped: Partial<Record<SocialPlatform, ContentItem[]>> = {};
  for (const item of items) {
    if (!grouped[item.platform]) grouped[item.platform] = [];
    grouped[item.platform]!.push(item);
  }
  return grouped;
}

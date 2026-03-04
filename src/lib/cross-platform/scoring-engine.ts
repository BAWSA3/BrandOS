// =============================================================================
// CROSS-PLATFORM SCORING ENGINE
// Computes unified brand consistency scores across all connected platforms.
// =============================================================================

import type {
  ContentItem,
  SocialPlatform,
  CrossPlatformScore,
  PlatformBrandScore,
} from './types';
import { PLATFORM_NORMS, PLATFORM_LABELS } from './types';
import { computeEngagementFromContent, computeActivityFromContent } from './brand-health-engine';
import {
  analyzeVoiceConsistencyByPlatform,
  computeCrossPlatformVoiceScore,
} from './voice-engine';
import type { VoiceFingerprint } from '@/lib/voice-fingerprint';

/**
 * Compute the full cross-platform brand score.
 */
export async function computeCrossPlatformBrandScore(
  allContent: ContentItem[],
  options?: {
    fingerprint?: VoiceFingerprint | null;
    fallbackDescription?: string;
    visualScores?: Partial<Record<SocialPlatform, number>>;
  }
): Promise<CrossPlatformScore> {
  const grouped = groupByPlatform(allContent);
  const platforms = Object.keys(grouped) as SocialPlatform[];

  // 1. Per-platform voice consistency
  const voiceReports = await analyzeVoiceConsistencyByPlatform(allContent, {
    fingerprint: options?.fingerprint,
    fallbackDescription: options?.fallbackDescription,
  });

  const crossPlatformVoice = computeCrossPlatformVoiceScore(voiceReports);

  // 2. Build per-platform scores
  const perPlatform: Record<string, PlatformBrandScore> = {};

  for (const platform of platforms) {
    const items = grouped[platform] ?? [];
    const voiceReport = voiceReports[platform];
    const voiceScore = voiceReport?.overallScore ?? 0;
    const visualScore = options?.visualScores?.[platform] ?? 0;

    // Theme score: based on content theme consistency within the platform
    const themeScore = voiceReport?.dimensions?.topicConsistency ?? 0;

    // Overall per-platform score
    const platformOverall = computePlatformOverall(voiceScore, visualScore, themeScore, items.length);

    perPlatform[platform] = {
      platform,
      connected: true,
      contentCount: items.length,
      voiceScore,
      visualScore,
      themeScore,
      overallScore: platformOverall,
      lastAnalyzedAt: new Date().toISOString(),
    };
  }

  // 3. Cross-platform consistency metrics
  const platformScores = Object.values(perPlatform).map((p) => p.overallScore);
  const avgScore = platformScores.length > 0
    ? Math.round(platformScores.reduce((a, b) => a + b, 0) / platformScores.length)
    : 0;

  const variance = platformScores.length > 1
    ? platformScores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / platformScores.length
    : 0;
  const crossPlatformConsistency = Math.round(Math.max(0, 100 - Math.sqrt(variance) * 2));

  // 4. Visual consistency dimension (average of per-platform visual scores)
  const visualScoreValues = platforms
    .map((p) => perPlatform[p]?.visualScore ?? 0)
    .filter((s) => s > 0);
  const avgVisual = visualScoreValues.length > 0
    ? Math.round(visualScoreValues.reduce((a, b) => a + b, 0) / visualScoreValues.length)
    : 0;

  // 5. Posting cadence health
  const cadenceHealth = computePostingCadenceHealth(grouped);

  // 6. Drift detection
  const drift = detectDrift(perPlatform as Record<SocialPlatform, PlatformBrandScore>);

  // 7. Overall score
  const overallScore = computeOverallCrossPlatformScore({
    voiceConsistency: crossPlatformVoice.crossPlatformScore,
    visualConsistency: avgVisual,
    contentThemeAlignment: avgScore,
    postingCadenceHealth: cadenceHealth,
    crossPlatformConsistency,
  });

  return {
    overallScore,
    perPlatform: perPlatform as Record<SocialPlatform, PlatformBrandScore>,
    crossPlatformConsistency,
    dimensions: {
      voiceConsistency: crossPlatformVoice.crossPlatformScore,
      visualConsistency: avgVisual,
      contentThemeAlignment: avgScore,
      postingCadenceHealth: cadenceHealth,
    },
    drift,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Per-platform overall score: weighted combination of voice, visual, and theme.
 */
function computePlatformOverall(
  voiceScore: number,
  visualScore: number,
  themeScore: number,
  contentCount: number
): number {
  if (contentCount === 0) return 0;

  // If no visual data, redistribute weight to voice and theme
  if (visualScore === 0) {
    return Math.round(voiceScore * 0.65 + themeScore * 0.35);
  }

  return Math.round(voiceScore * 0.45 + visualScore * 0.25 + themeScore * 0.3);
}

/**
 * Posting cadence health: are they posting consistently across platforms?
 */
function computePostingCadenceHealth(
  grouped: Partial<Record<SocialPlatform, ContentItem[]>>
): number {
  const platformActivities: number[] = [];

  for (const [platform, items] of Object.entries(grouped)) {
    if (!items || items.length === 0) continue;
    const activity = computeActivityFromContent(items);
    platformActivities.push(activity);
  }

  if (platformActivities.length === 0) return 0;

  const avgActivity =
    platformActivities.reduce((a, b) => a + b, 0) / platformActivities.length;

  // Penalize if some platforms are active but others are neglected
  if (platformActivities.length > 1) {
    const minActivity = Math.min(...platformActivities);
    const maxActivity = Math.max(...platformActivities);
    const imbalancePenalty = (maxActivity - minActivity) > 40 ? 10 : 0;
    return Math.round(Math.max(0, avgActivity - imbalancePenalty));
  }

  return Math.round(avgActivity);
}

/**
 * Detect which platform (if any) is drifting from the brand.
 */
function detectDrift(
  perPlatform: Record<SocialPlatform, PlatformBrandScore>
): CrossPlatformScore['drift'] {
  const scored = Object.values(perPlatform).filter((p) => p.contentCount > 0);

  if (scored.length <= 1) {
    return {
      direction: 'stable',
      explanation: scored.length === 0
        ? 'No content to analyze for drift.'
        : 'Only one platform connected. Connect more for drift detection.',
    };
  }

  const avgScore = scored.reduce((s, p) => s + p.overallScore, 0) / scored.length;
  const sorted = [...scored].sort((a, b) => a.overallScore - b.overallScore);
  const weakest = sorted[0];

  const gap = avgScore - weakest.overallScore;

  if (gap > 20) {
    return {
      direction: 'drifting',
      worstPlatform: weakest.platform,
      explanation: `${PLATFORM_LABELS[weakest.platform]} is significantly below average (${weakest.overallScore} vs ${Math.round(avgScore)} avg). Brand voice may be drifting on this platform.`,
    };
  }

  if (gap > 10) {
    return {
      direction: 'evolving',
      worstPlatform: weakest.platform,
      explanation: `${PLATFORM_LABELS[weakest.platform]} shows some deviation (${weakest.overallScore} vs ${Math.round(avgScore)} avg). Minor adjustments recommended.`,
    };
  }

  return {
    direction: 'stable',
    explanation: `Brand consistency is strong across all ${scored.length} platforms (avg score: ${Math.round(avgScore)}).`,
  };
}

/**
 * Final overall cross-platform score: weighted dimensions.
 */
function computeOverallCrossPlatformScore(dims: {
  voiceConsistency: number;
  visualConsistency: number;
  contentThemeAlignment: number;
  postingCadenceHealth: number;
  crossPlatformConsistency: number;
}): number {
  const hasVisual = dims.visualConsistency > 0;

  if (!hasVisual) {
    // Without visual data, redistribute
    return Math.round(
      dims.voiceConsistency * 0.4 +
      dims.contentThemeAlignment * 0.25 +
      dims.postingCadenceHealth * 0.15 +
      dims.crossPlatformConsistency * 0.2
    );
  }

  return Math.round(
    dims.voiceConsistency * 0.3 +
    dims.visualConsistency * 0.2 +
    dims.contentThemeAlignment * 0.2 +
    dims.postingCadenceHealth * 0.1 +
    dims.crossPlatformConsistency * 0.2
  );
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

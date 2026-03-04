// =============================================================================
// CROSS-PLATFORM BRAND HEALTH ENGINE
// Extends existing brand-health.ts with platform-agnostic engagement/activity.
// =============================================================================

import type { ContentItem, SocialPlatform } from './types';
import { computeEngagementRate } from './normalizers';
import {
  computeCompleteness,
  computeConsistency,
  type HealthDimensions,
  type AvailableDataFlags,
} from '@/lib/brand-health';
import type { BrandDNA } from '@/lib/types';

/**
 * Compute engagement score from platform-agnostic ContentItems.
 * Maps average engagement rate to a 0-100 score.
 */
export function computeEngagementFromContent(items: ContentItem[]): number {
  if (items.length === 0) return 0;

  const avgRate =
    items.reduce((sum, item) => sum + computeEngagementRate(item.metadata.engagement), 0) /
    items.length;

  if (avgRate >= 3) return 100;
  if (avgRate >= 2) return 85;
  if (avgRate >= 1.5) return 75;
  if (avgRate >= 1) return 60;
  if (avgRate >= 0.5) return 40;
  if (avgRate > 0) return 20;
  return 0;
}

/**
 * Compute activity score from ContentItems within a given window (default 14 days).
 */
export function computeActivityFromContent(
  items: ContentItem[],
  windowDays = 14
): number {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const recentCount = items.filter(
    (item) => new Date(item.metadata.postedAt).getTime() >= cutoff
  ).length;

  if (recentCount >= 21) return 100;
  if (recentCount >= 16) return 90;
  if (recentCount >= 11) return 85;
  if (recentCount >= 6) return 70;
  if (recentCount >= 3) return 50;
  if (recentCount >= 1) return 25;
  return 0;
}

/**
 * Compute per-platform health breakdown.
 */
export function computePerPlatformHealth(
  items: ContentItem[]
): Record<SocialPlatform, { engagement: number; activity: number; contentCount: number }> {
  const grouped: Partial<Record<SocialPlatform, ContentItem[]>> = {};
  for (const item of items) {
    if (!grouped[item.platform]) grouped[item.platform] = [];
    grouped[item.platform]!.push(item);
  }

  const result: Record<string, { engagement: number; activity: number; contentCount: number }> = {};
  for (const [platform, platformItems] of Object.entries(grouped)) {
    result[platform] = {
      engagement: computeEngagementFromContent(platformItems!),
      activity: computeActivityFromContent(platformItems!),
      contentCount: platformItems!.length,
    };
  }

  return result as Record<SocialPlatform, { engagement: number; activity: number; contentCount: number }>;
}

/**
 * Full cross-platform health dimensions.
 * Uses existing completeness/consistency logic + new content-based engagement/activity.
 */
export function computeCrossPlatformHealthDimensions(
  brand: BrandDNA,
  checkEntries: { score: number | null }[],
  allContent: ContentItem[],
  voiceMatchScore: number
): { dimensions: HealthDimensions; flags: AvailableDataFlags } {
  const completeness = computeCompleteness(brand);
  const consistency = computeConsistency(checkEntries);
  const engagement = computeEngagementFromContent(allContent);
  const activity = computeActivityFromContent(allContent);

  const dimensions: HealthDimensions = {
    completeness,
    consistency,
    voiceMatch: voiceMatchScore,
    engagement,
    activity,
  };

  const flags: AvailableDataFlags = {
    hasCheckEntries: checkEntries.length >= 3,
    hasPosts: allContent.length > 0,
  };

  return { dimensions, flags };
}

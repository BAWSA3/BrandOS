'use client';

import React from 'react';
import BrandOSDashboard, { BrandOSDashboardData } from './BrandOSDashboard';

// Types matching the API response
interface XProfileData {
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count?: number;
  };
  followers_count?: number;
  following_count?: number;
  tweet_count?: number;
  verified: boolean;
  location?: string;
  url?: string;
}

interface CreatorArchetype {
  primary: string;
  emoji: string;
  tagline?: string;
  description?: string;
  strengths?: string[];
  growthTip?: string;
}

interface BrandScoreResult {
  overallScore: number;
  phases: {
    define: { score: number; insights: string[] };
    check: { score: number; insights: string[] };
    generate: { score: number; insights: string[] };
    scale: { score: number; insights: string[] };
  };
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
  archetype?: CreatorArchetype;
  brandKeywords?: string[];
  brandColors?: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  contentPillars?: Array<{
    name: string;
    frequency: number;
    avgEngagement?: number;
  }>;
  toneAnalysis?: {
    formality: number;
    energy: number;
    confidence: number;
    style?: number;
  };
  influenceTier?: string;
}

interface BrandOSDashboardWrapperProps {
  profile: XProfileData;
  brandScore: BrandScoreResult;
}

// Format follower count to display string (e.g., "2.1M", "150K")
function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toString();
}

// Determine personality type label
function getPersonalityType(archetype?: string): string {
  const typeMap: Record<string, string> = {
    'The Prophet': 'INTJ',
    'The Alpha': 'ENTJ',
    'The Builder': 'ISTP',
    'The Educator': 'ENFJ',
    'The Degen': 'ESTP',
    'The Analyst': 'INTP',
    'The Philosopher': 'INFJ',
    'The Networker': 'ESFJ',
    'The Contrarian': 'ENTP',
  };
  return typeMap[archetype || ''] || 'INTJ';
}

// Transform API data to BrandOSDashboardData format
function transformToDashboardData(
  profile: XProfileData,
  brandScore: BrandScoreResult
): BrandOSDashboardData {
  // Get follower count from either location
  const followersCount = profile.public_metrics?.followers_count || profile.followers_count || 0;

  // Default tone values based on phase scores if not provided
  const defaultTone = {
    formality: Math.round((brandScore.phases.define.score + brandScore.phases.check.score) / 2),
    energy: Math.round((brandScore.phases.generate.score * 0.8)),
    confidence: Math.round((brandScore.phases.scale.score + brandScore.phases.define.score) / 2),
  };

  // Default content pillars based on insights
  const defaultPillars = [
    { label: 'Expertise', value: brandScore.phases.define.score },
    { label: 'Consistency', value: brandScore.phases.check.score },
    { label: 'Content', value: brandScore.phases.generate.score },
  ];

  // Extract keywords from strengths and insights
  const keywords = brandScore.brandKeywords ||
    brandScore.topStrengths.slice(0, 5).map(s => {
      // Extract key word from strength
      const words = s.split(' ').filter(w => w.length > 4);
      return words[0] || s.split(' ')[0];
    });

  return {
    profile: {
      username: profile.username,
      displayName: profile.name,
      profileImageUrl: profile.profile_image_url?.replace('_normal', '_200x200') || '',
      followersCount: formatFollowers(followersCount),
      verified: profile.verified,
    },
    scores: {
      brandScore: brandScore.overallScore,
      voiceConsistency: brandScore.phases.check.score,
      engagementScore: brandScore.phases.scale.score,
    },
    personality: {
      archetype: brandScore.archetype?.primary || 'The Creator',
      emoji: brandScore.archetype?.emoji || '/emojis/Faces & Emotions/🤓 - Nerd Face.svg',
      type: getPersonalityType(brandScore.archetype?.primary),
    },
    tone: brandScore.toneAnalysis || defaultTone,
    pillars: brandScore.contentPillars?.slice(0, 3).map(p => ({
      label: p.name,
      value: p.frequency,
    })) || defaultPillars,
    dna: {
      keywords: keywords.slice(0, 5),
      voice: brandScore.summary || brandScore.archetype?.description || 'Authentic voice that resonates with your audience.',
    },
  };
}

export default function BrandOSDashboardWrapper({ profile, brandScore }: BrandOSDashboardWrapperProps) {
  const dashboardData = transformToDashboardData(profile, brandScore);

  return <BrandOSDashboard data={dashboardData} />;
}

// Also export the transform function for use elsewhere
export { transformToDashboardData };

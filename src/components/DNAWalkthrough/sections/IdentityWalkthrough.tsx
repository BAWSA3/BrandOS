'use client';

import { motion } from 'framer-motion';
import WalkthroughSection from '../WalkthroughSection';
import { AuthenticityAnalysis, ActivityAnalysis } from '@/lib/gemini';
import type { ParallaxLayerConfig } from '../motion';

interface XProfileData {
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  verified: boolean;
  location?: string;
  url?: string;
}

interface IdentityWalkthroughProps {
  profile: XProfileData;
  authenticity?: AuthenticityAnalysis | null;
  activity?: ActivityAnalysis | null;
  theme: string;
  parallaxLayers?: ParallaxLayerConfig[];
}

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getActivityLabel(activity?: ActivityAnalysis | null): string {
  if (!activity) return 'Unknown';
  const level = activity.level;
  if (level === 'very_active') return 'Very Active';
  if (level === 'active') return 'Active';
  if (level === 'moderate') return 'Moderate';
  if (level === 'inactive') return 'Inactive';
  return 'Suspicious';
}

function getFollowerRatio(followers: number, following: number): { ratio: number; label: string; color: string } {
  if (following === 0) return { ratio: Infinity, label: 'Influencer', color: '#10B981' };
  const ratio = followers / following;
  if (ratio >= 10) return { ratio, label: 'Influencer', color: '#10B981' };
  if (ratio >= 2) return { ratio, label: 'Creator', color: '#3B82F6' };
  if (ratio >= 0.5) return { ratio, label: 'Balanced', color: '#F59E0B' };
  return { ratio, label: 'Growing', color: '#EF4444' };
}

function getContentStrength(profile: XProfileData): { score: number; items: { name: string; complete: boolean; weight: number }[] } {
  const items = [
    { name: 'Has Posted (1+)', complete: profile.tweet_count >= 1, weight: 10 },
    { name: 'Content Foundation (100+)', complete: profile.tweet_count >= 100, weight: 20 },
    { name: 'Active Creator (500+)', complete: profile.tweet_count >= 500, weight: 25 },
    { name: 'Prolific Output (2K+)', complete: profile.tweet_count >= 2000, weight: 20 },
    { name: 'Audience Response (1K+ followers)', complete: profile.followers_count >= 1000, weight: 15 },
    { name: 'Curated by Others (100+ lists)', complete: (profile as any).listed_count >= 100 || profile.followers_count >= 10000, weight: 10 },
  ];
  const score = items.reduce((total, item) => total + (item.complete ? item.weight : 0), 0);
  return { score, items };
}

function getInfluenceTier(followers: number): { tier: string; color: string; next: string; progress: number } {
  if (followers >= 1000000) return { tier: 'Mega', color: '#8B5CF6', next: 'Max tier reached', progress: 100 };
  if (followers >= 100000) return { tier: 'Macro', color: '#10B981', next: `${formatFollowers(1000000 - followers)} to Mega`, progress: (followers / 1000000) * 100 };
  if (followers >= 10000) return { tier: 'Micro', color: '#3B82F6', next: `${formatFollowers(100000 - followers)} to Macro`, progress: (followers / 100000) * 100 };
  if (followers >= 1000) return { tier: 'Nano', color: '#F59E0B', next: `${formatFollowers(10000 - followers)} to Micro`, progress: (followers / 10000) * 100 };
  return { tier: 'Rising', color: '#EF4444', next: `${formatFollowers(1000 - followers)} to Nano`, progress: (followers / 1000) * 100 };
}

export default function IdentityWalkthrough({
  profile,
  authenticity,
  activity,
  theme,
  parallaxLayers,
}: IdentityWalkthroughProps) {
  const isDark = theme === 'dark';
  const authScore = authenticity ? (100 - authenticity.score) : 100;
  const activityLabel = getActivityLabel(activity);

  const followerRatio = getFollowerRatio(profile.followers_count, profile.following_count);
  const contentStrength = getContentStrength(profile);
  const influenceTier = getInfluenceTier(profile.followers_count);

  const howWeCalculated = `We analyzed your content output (${formatFollowers(profile.tweet_count)} posts), audience response (${formatFollowers(profile.followers_count)} followers), and reputation signals (${followerRatio.ratio === Infinity ? '∞' : followerRatio.ratio.toFixed(1)}:1 ratio)${authenticity ? `. Authenticity: ${authScore}%` : ''}.`;

  const whyItMatters = `Your brand is your reputation — what you're known for, built entirely through your content. Content strength: ${contentStrength.score}%.`;

  const whatYouCanDo: string[] = [];

  if (profile.tweet_count < 500) {
    whatYouCanDo.push(
      'Post more consistently. Your brand is built through content output — aim for 3-5 posts per week minimum.'
    );
  }
  if (authScore < 80) {
    whatYouCanDo.push(
      'Improve engagement authenticity by focusing on genuine interactions rather than growth hacks.'
    );
  }
  if (followerRatio.ratio < 1) {
    whatYouCanDo.push(
      'Focus on creating original content. Your follower ratio shows room to build an audience that follows for your content specifically.'
    );
  }
  if (whatYouCanDo.length === 0) {
    whatYouCanDo.push(
      'Strong content foundation. Focus on deepening your content pillars and maintaining voice consistency.'
    );
  }

  return (
    <WalkthroughSection
      label="Identity"
      howWeCalculated={howWeCalculated}
      whyItMatters={whyItMatters}
      whatYouCanDo={whatYouCanDo}
      theme={theme}
      accentColor="#FFFFFF"
      parallaxLayers={parallaxLayers}
    >
      <div className="space-y-4">
        {/* Top Row: Profile Card + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Profile Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-[4px] p-5"
            style={{ background: '#FFFFFF' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <img
                  src={profile.profile_image_url?.replace('_normal', '_400x400')}
                  alt={profile.name}
                  className="w-14 h-14 rounded-full object-cover"
                  style={{ filter: 'grayscale(20%)' }}
                />
                {profile.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: '#000000' }}>
                  {profile.name}
                </h3>
                <p className="text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>
                  @{profile.username}
                </p>
              </div>
            </div>

            {/* Influence Tier Badge */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-semibold"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  letterSpacing: '0.05em',
                  background: `${influenceTier.color}20`,
                  color: influenceTier.color,
                }}
              >
                {influenceTier.tier.toUpperCase()} INFLUENCER
              </span>
              <span
                className="px-2 py-1 rounded text-[10px]"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  background: activityLabel === 'Very Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                  color: activityLabel === 'Very Active' ? '#059669' : 'rgba(0,0,0,0.5)',
                }}
              >
                {activityLabel.toUpperCase()}
              </span>
            </div>

            {/* Stats Row */}
            <div className="flex justify-between text-center">
              {[
                { value: formatFollowers(profile.followers_count), label: 'FOLLOWERS' },
                { value: formatFollowers(profile.following_count), label: 'FOLLOWING' },
                { value: formatFollowers(profile.tweet_count), label: 'POSTS' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-lg font-semibold" style={{ color: '#000000' }}>
                    {stat.value}
                  </div>
                  <div
                    className="text-[9px] tracking-wider"
                    style={{ fontFamily: "'VCR OSD Mono', monospace", color: 'rgba(0,0,0,0.4)' }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Profile Completeness Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-[4px] p-4"
            style={{
              background: isDark ? '#1A1A1A' : '#F5F5F5',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] tracking-wider"
                style={{ fontFamily: "'VCR OSD Mono', monospace", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
              >
                CONTENT STRENGTH
              </span>
              <span
                className="text-lg font-semibold"
                style={{
                  color: contentStrength.score >= 80 ? '#10B981' : contentStrength.score >= 60 ? '#F59E0B' : '#EF4444',
                }}
              >
                {contentStrength.score}%
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="h-2 rounded-full overflow-hidden mb-3"
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${contentStrength.score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full rounded-full"
                style={{
                  background: contentStrength.score >= 80 ? '#10B981' : contentStrength.score >= 60 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-1.5">
              {contentStrength.items.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span style={{ color: item.complete ? '#10B981' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                    {item.complete ? '✓' : '○'}
                  </span>
                  <span style={{ color: item.complete ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)') : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)') }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Follower Ratio Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-[4px] p-4"
            style={{
              background: isDark ? '#1A1A1A' : '#F5F5F5',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-3"
              style={{ fontFamily: "'VCR OSD Mono', monospace", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
            >
              FOLLOWER RATIO
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-semibold" style={{ color: followerRatio.color }}>
                {followerRatio.ratio === Infinity ? '∞' : followerRatio.ratio.toFixed(1)}
              </span>
              <span className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                :1
              </span>
            </div>

            <span
              className="inline-block px-2 py-1 rounded text-[10px] mb-3"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                background: `${followerRatio.color}20`,
                color: followerRatio.color,
              }}
            >
              {followerRatio.label.toUpperCase()}
            </span>

            <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              {followerRatio.ratio >= 10
                ? 'Strong authority signal - people follow you for value'
                : followerRatio.ratio >= 2
                ? 'Good creator ratio - content is driving growth'
                : 'Consider being more selective with follows'}
            </p>
          </motion.div>
        </div>

        {/* Bottom Row: Content Output + Authenticity + Growth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Content Output Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-[4px] p-4"
            style={{
              background: isDark ? '#1A1A1A' : '#F5F5F5',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-3"
              style={{ fontFamily: "'VCR OSD Mono', monospace", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
            >
              CONTENT OUTPUT
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-semibold" style={{ color: profile.tweet_count >= 1000 ? '#10B981' : profile.tweet_count >= 500 ? '#F59E0B' : '#EF4444' }}>
                {formatFollowers(profile.tweet_count)}
              </span>
              <span className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                posts
              </span>
            </div>

            <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min((profile.tweet_count / 5000) * 100, 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: profile.tweet_count >= 1000 ? '#10B981' : profile.tweet_count >= 500 ? '#F59E0B' : '#EF4444' }}
              />
            </div>

            <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              {profile.tweet_count >= 5000
                ? 'High output creator - strong content foundation'
                : profile.tweet_count >= 1000
                ? 'Consistent content history - building brand equity'
                : profile.tweet_count >= 500
                ? 'Growing content library - keep posting consistently'
                : 'Low content output - your brand is built through what you post'}
            </p>
          </motion.div>

          {/* Authenticity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-[4px] p-4"
            style={{
              background: isDark ? '#1A1A1A' : '#F5F5F5',
              border: authScore < 70 ? '1px solid rgba(239, 68, 68, 0.3)' : isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-3"
              style={{ fontFamily: "'VCR OSD Mono', monospace", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
            >
              AUTHENTICITY SCORE
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="text-3xl font-semibold"
                style={{ color: authScore >= 80 ? '#10B981' : authScore >= 50 ? '#F59E0B' : '#EF4444' }}
              >
                {authScore}%
              </span>
              {authScore < 70 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                  ATTENTION
                </span>
              )}
            </div>

            <p className="text-xs mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              {authScore >= 90
                ? 'Excellent - genuine organic engagement'
                : authScore >= 70
                ? 'Good - mostly organic growth signals'
                : authScore >= 50
                ? 'Suspicious patterns detected'
                : 'Multiple red flags for bot-like behavior'}
            </p>

            {authenticity?.signals && (
              <div className="text-[10px] space-y-1">
                {Object.entries(authenticity.signals).slice(0, 2).map(([key, signal]) => (
                  <div key={key} className="flex items-start gap-1.5" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                    <span>•</span>
                    <span>{signal.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Growth Potential Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-[4px] p-4"
            style={{
              background: isDark ? '#1A1A1A' : '#F5F5F5',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-3"
              style={{ fontFamily: "'VCR OSD Mono', monospace", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
            >
              GROWTH POTENTIAL
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-semibold" style={{ color: influenceTier.color }}>
                {influenceTier.tier}
              </span>
              <span className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                tier
              </span>
            </div>

            {influenceTier.tier !== 'Mega' && (
              <>
                <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(influenceTier.progress, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full rounded-full"
                    style={{ background: influenceTier.color }}
                  />
                </div>
                <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                  {influenceTier.next}
                </p>
              </>
            )}

            {influenceTier.tier === 'Mega' && (
              <p className="text-xs" style={{ color: '#10B981' }}>
                Top tier achieved - focus on engagement quality
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </WalkthroughSection>
  );
}

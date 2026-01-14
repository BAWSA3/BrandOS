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

function getProfileCompleteness(profile: XProfileData): { score: number; items: { name: string; complete: boolean; weight: number }[] } {
  const items = [
    { name: 'Profile Picture', complete: !!profile.profile_image_url && !profile.profile_image_url.includes('default_profile'), weight: 20 },
    { name: 'Display Name', complete: !!profile.name && profile.name !== profile.username, weight: 15 },
    { name: 'Bio', complete: (profile.description?.length || 0) >= 50, weight: 25 },
    { name: 'Full Bio (100+ chars)', complete: (profile.description?.length || 0) >= 100, weight: 10 },
    { name: 'Website Link', complete: !!profile.url, weight: 15 },
    { name: 'Location', complete: !!profile.location, weight: 10 },
    { name: 'Post History', complete: profile.tweet_count >= 100, weight: 5 },
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
  const bioLength = profile.description?.length || 0;
  const hasLink = !!profile.url;
  const hasLocation = !!profile.location;
  const authScore = authenticity ? (100 - authenticity.score) : 100;
  const activityLabel = getActivityLabel(activity);

  const followerRatio = getFollowerRatio(profile.followers_count, profile.following_count);
  const profileCompleteness = getProfileCompleteness(profile);
  const influenceTier = getInfluenceTier(profile.followers_count);

  // Build a cleaner calculation explanation
  const signals: string[] = [];
  signals.push(`bio length (${bioLength}/160 chars)`);
  if (hasLink) signals.push('website linked');
  if (hasLocation) signals.push('location set');
  signals.push(`${formatFollowers(profile.followers_count)} followers`);

  const howWeCalculated = `We analyzed ${signals.length} profile signals: ${signals.join(', ')}${authenticity ? `. Authenticity score: ${authScore}%` : ''}.`;

  const whyItMatters = `Your profile is your first impression. Complete profiles see up to 40% more follows. Your profile is ${profileCompleteness.score}% complete.`;

  const whatYouCanDo: string[] = [];

  if (bioLength < 100) {
    whatYouCanDo.push(
      `Expand your bio from ${bioLength} to 160 characters - include your value proposition, what you post about, and a call-to-action.`
    );
  }
  if (!hasLink) {
    whatYouCanDo.push(
      'Add a link to your website, newsletter, or featured content to drive traffic.'
    );
  }
  if (!hasLocation) {
    whatYouCanDo.push(
      'Add a location (real or brand-related) to help with discoverability and relatability.'
    );
  }
  if (authScore < 80) {
    whatYouCanDo.push(
      'Improve engagement authenticity by focusing on genuine interactions rather than growth hacks.'
    );
  }
  if (whatYouCanDo.length === 0) {
    whatYouCanDo.push(
      'Your profile is well-optimized! Consider A/B testing different bio variations to maximize conversions.'
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
                PROFILE COMPLETENESS
              </span>
              <span
                className="text-lg font-semibold"
                style={{
                  color: profileCompleteness.score >= 80 ? '#10B981' : profileCompleteness.score >= 60 ? '#F59E0B' : '#EF4444',
                }}
              >
                {profileCompleteness.score}%
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="h-2 rounded-full overflow-hidden mb-3"
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${profileCompleteness.score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full rounded-full"
                style={{
                  background: profileCompleteness.score >= 80 ? '#10B981' : profileCompleteness.score >= 60 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-1.5">
              {profileCompleteness.items.slice(0, 5).map((item) => (
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

        {/* Bottom Row: Bio + Authenticity + Growth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Bio Analysis Card */}
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
              BIO ANALYSIS
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-semibold" style={{ color: bioLength >= 100 ? '#10B981' : bioLength >= 50 ? '#F59E0B' : '#EF4444' }}>
                {bioLength}
              </span>
              <span className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                /160 chars
              </span>
            </div>

            <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(bioLength / 160) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: bioLength >= 100 ? '#10B981' : bioLength >= 50 ? '#F59E0B' : '#EF4444' }}
              />
            </div>

            <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              {bioLength >= 120
                ? 'Excellent bio length - maximizing space'
                : bioLength >= 80
                ? 'Good bio length - room for more detail'
                : bioLength >= 50
                ? 'Short bio - missing opportunity to sell yourself'
                : 'Bio too short - visitors leave without context'}
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

            {authenticity?.signals && authenticity.signals.length > 0 && (
              <div className="text-[10px] space-y-1">
                {authenticity.signals.slice(0, 2).map((signal, i) => (
                  <div key={i} className="flex items-start gap-1.5" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                    <span>•</span>
                    <span>{signal}</span>
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import BrandOSDashboard, { BrandOSDashboardData } from './BrandOSDashboard';

// =============================================================================
// TYPES
// =============================================================================

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
  };
}

interface ScoreRevealProps {
  profile: XProfileData;
  brandScore: BrandScoreResult;
  isVisible: boolean;
  theme: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toString();
}

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

// Map archetype to pixel emoji path
function getArchetypeEmoji(archetype?: CreatorArchetype): string {
  if (!archetype) return '/emojis/Faces & Emotions/🤓 - Nerd Face.svg';

  const emojiMap: Record<string, string> = {
    'The Prophet': '/emojis/Creatures & Nature/👽 - Alien.svg',
    'The Alpha': '/emojis/Symbols & Objects/⚡ - High Voltage.svg',
    'The Builder': '/emojis/Activities & Objects/🚀 - Rocket.svg',
    'The Educator': '/emojis/Faces & Emotions/🤓 - Nerd Face.svg',
    'The Degen': '/emojis/Faces & Emotions/🤪 - Zany Face.svg',
    'The Analyst': '/emojis/Creatures & Nature/👀 - Eyes.svg',
    'The Philosopher': '/emojis/Faces & Emotions/🤓 - Nerd Face.svg',
    'The Networker': '/emojis/Gestures & Hands/🤝 - Handshake.svg',
    'The Contrarian': '/emojis/Creatures & Nature/🔥 - Fire.svg',
  };

  return emojiMap[archetype.primary] || archetype.emoji || '/emojis/Faces & Emotions/🤓 - Nerd Face.svg';
}

function transformToDashboardData(
  profile: XProfileData,
  brandScore: BrandScoreResult
): BrandOSDashboardData {
  const defaultTone = {
    formality: Math.round((brandScore.phases.define.score + brandScore.phases.check.score) / 2),
    energy: Math.round(brandScore.phases.generate.score * 0.8),
    confidence: Math.round((brandScore.phases.scale.score + brandScore.phases.define.score) / 2),
  };

  const defaultPillars = [
    { label: 'Expertise', value: brandScore.phases.define.score },
    { label: 'Consistency', value: brandScore.phases.check.score },
    { label: 'Content', value: brandScore.phases.generate.score },
  ];

  const keywords = brandScore.brandKeywords ||
    brandScore.topStrengths.slice(0, 5).map(s => {
      const words = s.split(' ').filter(w => w.length > 4);
      return words[0] || s.split(' ')[0];
    });

  return {
    profile: {
      username: profile.username,
      displayName: profile.name,
      profileImageUrl: profile.profile_image_url?.replace('_normal', '_200x200') || '',
      followersCount: formatFollowers(profile.followers_count || 0),
      verified: profile.verified,
    },
    scores: {
      brandScore: brandScore.overallScore,
      voiceConsistency: brandScore.phases.check.score,
      engagementScore: brandScore.phases.scale.score,
    },
    personality: {
      archetype: brandScore.archetype?.primary || 'The Creator',
      emoji: getArchetypeEmoji(brandScore.archetype),
      type: getPersonalityType(brandScore.archetype?.primary),
    },
    tone: brandScore.toneAnalysis || defaultTone,
    pillars: brandScore.contentPillars?.slice(0, 3).map(p => ({
      label: p.name,
      value: p.frequency,
    })) || defaultPillars,
    dna: {
      keywords: keywords.slice(0, 5),
      voice: brandScore.archetype?.description || brandScore.summary || 'Authentic voice that resonates with your audience.',
    },
  };
}

// =============================================================================
// SHARE BUTTONS
// =============================================================================

function ShareButtons({
  score,
  username,
  topStrength,
  theme
}: {
  score: number;
  username: string;
  topStrength: string;
  theme: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    const tweetText = `My @BrandOS_xyz brand score: ${score}/100

"${topStrength}"

Check yours  brandos.xyz`;

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }, [score, topStrength]);

  const handleCopyLink = useCallback(() => {
    const shareUrl = `https://brandos.xyz?ref=${username}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [username]);

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <motion.button
        onClick={handleShare}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 28px',
          background: '#2E6AFF',
          border: 'none',
          borderRadius: '4px',
          color: '#FFFFFF',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          fontWeight: 700,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        SHARE ON X
      </motion.button>

      <motion.button
        onClick={handleCopyLink}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 28px',
          background: copied ? 'rgba(0, 255, 65, 0.2)' : theme === 'dark' ? '#1A1A1A' : '#F0F0F0',
          border: `2px solid ${copied ? '#00FF41' : theme === 'dark' ? '#333' : '#DDD'}`,
          borderRadius: '4px',
          color: copied ? '#00FF41' : theme === 'dark' ? '#FFFFFF' : '#000000',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          fontWeight: 700,
        }}
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            COPIED!
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            COPY LINK
          </>
        )}
      </motion.button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ScoreReveal({ profile, brandScore, isVisible, theme }: ScoreRevealProps) {
  const [showDashboard, setShowDashboard] = useState(false);
  const dashboardData = transformToDashboardData(profile, brandScore);

  useEffect(() => {
    if (isVisible) {
      // Slight delay for dramatic effect
      const timer = setTimeout(() => setShowDashboard(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!showDashboard) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            color: '#666',
            letterSpacing: '0.2em',
          }}
        >
          GENERATING BRAND DNA...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {/* Main Dashboard */}
      <BrandOSDashboard data={dashboardData} />

      {/* Share Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          padding: '48px 24px',
          background: '#050505',
          borderTop: '1px solid #222',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: '#666',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            SHARE_RESULTS
          </span>
          <h3
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '24px',
              fontWeight: 900,
              fontStyle: 'italic',
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            Flex your Brand DNA
          </h3>
        </div>

        <ShareButtons
          score={brandScore.overallScore}
          username={profile.username}
          topStrength={brandScore.topStrengths[0] || 'Strong brand presence'}
          theme={theme}
        />

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <motion.button
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#888',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            ANALYZE ANOTHER
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '12px 24px',
              background: '#2E6AFF',
              border: 'none',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            CLAIM YOUR BRAND
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

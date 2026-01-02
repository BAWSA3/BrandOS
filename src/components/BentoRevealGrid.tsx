'use client';

import { motion, Variants } from 'framer-motion';
import { useState, useRef } from 'react';
import { BentoShareCardData, generateBentoShareImage } from './ShareableBentoCard';

// =============================================================================
// Premium Staggered Grid Animation Variants
// =============================================================================

// Container variant for orchestrating staggered children
const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
      when: 'beforeChildren',
    },
  },
};

// Individual card variant with 3D rotation reveal
const cardRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
    rotateX: -15,
    scale: 0.9,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 100,
      mass: 0.8,
    },
  },
};

// Special variant for the large brand score card
const heroCardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    rotateY: -10,
    filter: 'blur(15px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      damping: 18,
      stiffness: 80,
      mass: 1,
      delay: 0.1,
    },
  },
};

// Card accent colors matching ShareableBentoCard
const CARD_COLORS = {
  brandScore: '#10B981',
  toneProfile: '#6366F1',
  voiceConsistency: '#9CA3AF',
  followers: '#F97316',
  influence: '#8B5CF6',
  engagement: '#22C55E',
  archetype: '#EAB308',
};

// Score label based on value
function getScoreLabel(score: number): string {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 80) return 'STRONG';
  if (score >= 70) return 'GOOD';
  if (score >= 60) return 'SOLID';
  if (score >= 50) return 'FAIR';
  return 'DEVELOPING';
}

// Format follower count
function formatFollowerCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

// Card base styles
const cardBaseStyle = (theme: string, accentColor?: string): React.CSSProperties => ({
  background: theme === 'dark'
    ? accentColor
      ? `linear-gradient(135deg, rgba(${hexToRgb(accentColor)}, 0.15) 0%, rgba(255, 255, 255, 0.04) 100%)`
      : 'rgba(255, 255, 255, 0.04)'
    : accentColor
      ? `linear-gradient(135deg, rgba(${hexToRgb(accentColor)}, 0.1) 0%, rgba(0, 0, 0, 0.02) 100%)`
      : 'rgba(0, 0, 0, 0.03)',
  borderRadius: '16px',
  border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
});

// Helper to convert hex to rgb
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}

// ============ CARD COMPONENTS ============

// Tone Profile Card - 4 horizontal bars
function ToneProfileCard({ tone, theme }: { tone: BentoShareCardData['tone']; theme: string }) {
  const bars = [
    { key: 'formality', label: 'Formality' },
    { key: 'energy', label: 'Energy' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'style', label: 'Style' },
  ];

  return (
    <motion.div
      style={{ ...cardBaseStyle(theme, CARD_COLORS.toneProfile), perspective: '1000px' }}
      variants={cardRevealVariants}
    >
      <span style={{
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        marginBottom: '12px',
      }}>
        TONE PROFILE
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'center' }}>
        {bars.map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '10px',
              color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              width: '70px',
            }}>
              {label}
            </span>
            <div style={{
              flex: 1,
              height: '6px',
              background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tone[key as keyof typeof tone]}%` }}
                transition={{ duration: 0.8, delay: 0.2 + bars.findIndex(b => b.key === key) * 0.1 }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${CARD_COLORS.toneProfile}, #818CF8)`,
                  borderRadius: '3px',
                }}
              />
            </div>
            <span style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '10px',
              color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
              width: '32px',
              textAlign: 'right',
            }}>
              {tone[key as keyof typeof tone]}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Voice Consistency Card - Circular progress
function VoiceConsistencyCard({ voiceConsistency, theme }: { voiceConsistency: number; theme: string }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const progress = (voiceConsistency / 100) * circumference;

  return (
    <motion.div
      style={{ ...cardBaseStyle(theme), alignItems: 'center', justifyContent: 'center' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <span style={{
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        marginBottom: '8px',
      }}>
        VOICE
      </span>
      <svg width="90" height="90" viewBox="0 0 90 90">
        {/* Background circle */}
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="6"
        />
        {/* Progress arc */}
        <motion.circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke={CARD_COLORS.voiceConsistency}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1, delay: 0.3 }}
          transform="rotate(-90 45 45)"
        />
        {/* Percentage text */}
        <text
          x="45"
          y="45"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '20px',
            fontWeight: 700,
            fill: theme === 'dark' ? '#FFFFFF' : '#000000',
          }}
        >
          {voiceConsistency}%
        </text>
      </svg>
      <span style={{
        fontFamily: "'Helvetica Neue', sans-serif",
        fontSize: '10px',
        color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        marginTop: '4px',
      }}>
        Consistency
      </span>
    </motion.div>
  );
}

// Engagement Card - Dot matrix
function EngagementCard({
  contentPillars,
  theme,
}: {
  contentPillars?: BentoShareCardData['contentPillars'];
  theme: string;
}) {
  const pillarsCount = contentPillars?.length || 0;
  const avgEngagement = contentPillars?.reduce((sum, p) => sum + p.avgEngagement, 0) || 0;
  const avgEng = pillarsCount > 0 ? (avgEngagement / pillarsCount).toFixed(0) : '0';

  // Generate dot matrix (7x5 grid)
  const dots = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      const isActive = Math.random() > 0.3;
      dots.push({ row, col, isActive });
    }
  }

  return (
    <motion.div
      style={{ ...cardBaseStyle(theme, CARD_COLORS.engagement), alignItems: 'center' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <span style={{
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        marginBottom: '8px',
      }}>
        ENGAGEMENT
      </span>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '12px',
      }}>
        {dots.map((dot, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: dot.isActive ? 1 : 0.2 }}
            transition={{ delay: 0.4 + i * 0.01 }}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: CARD_COLORS.engagement,
            }}
          />
        ))}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 'auto',
      }}>
        <span style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: '10px',
          color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        }}>
          {pillarsCount} pillars
        </span>
        <span style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: '10px',
          color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        }}>
          ~{avgEng} avg
        </span>
      </div>
    </motion.div>
  );
}

// Influence Tier Card - Tier bars
function InfluenceTierCard({
  influenceTier,
  followersCount,
  theme,
}: {
  influenceTier: BentoShareCardData['influenceTier'];
  followersCount: number;
  theme: string;
}) {
  const tiers = ['Nano', 'Micro', 'Mid', 'Macro', 'Mega'] as const;
  const tierIndex = tiers.indexOf(influenceTier);

  return (
    <motion.div
      style={{ ...cardBaseStyle(theme, CARD_COLORS.influence), alignItems: 'center' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <span style={{
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        marginBottom: '8px',
      }}>
        INFLUENCE
      </span>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '6px',
        height: '40px',
        marginBottom: '8px',
      }}>
        {tiers.map((tier, i) => (
          <motion.div
            key={tier}
            initial={{ height: 0 }}
            animate={{ height: `${20 + i * 10}px` }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
            style={{
              width: '20px',
              background: i <= tierIndex
                ? CARD_COLORS.influence
                : theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
              opacity: i === tierIndex ? 1 : 0.5,
            }}
          />
        ))}
      </div>
      <span style={{
        fontFamily: "'Helvetica Neue', sans-serif",
        fontSize: '18px',
        fontWeight: 700,
        color: theme === 'dark' ? '#FFFFFF' : '#000000',
      }}>
        {influenceTier}
      </span>
      <span style={{
        fontFamily: "'Helvetica Neue', sans-serif",
        fontSize: '10px',
        color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
      }}>
        {formatFollowerCount(followersCount)} followers
      </span>
    </motion.div>
  );
}

// Brand Score Card - Large with concentric arcs
function BrandScoreCard({
  brandScore,
  tone,
  theme,
}: {
  brandScore: number;
  tone: BentoShareCardData['tone'];
  theme: string;
}) {
  const arcs = [
    { value: tone.formality, radius: 70, color: '#10B981' },
    { value: tone.energy, radius: 58, color: '#22C55E' },
    { value: tone.confidence, radius: 46, color: '#34D399' },
    { value: tone.style, radius: 34, color: '#6EE7B7' },
  ];

  return (
    <motion.div
      style={{
        ...cardBaseStyle(theme, CARD_COLORS.brandScore),
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        width: '150px',
        height: '150px',
        background: `radial-gradient(circle, rgba(${hexToRgb(CARD_COLORS.brandScore)}, 0.3) 0%, transparent 70%)`,
        filter: 'blur(20px)',
      }} />

      <span style={{
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        marginBottom: '12px',
        zIndex: 1,
      }}>
        BRAND SCORE
      </span>

      <svg width="160" height="160" viewBox="0 0 160 160" style={{ zIndex: 1 }}>
        {/* Background arcs */}
        {arcs.map((arc, i) => (
          <circle
            key={`bg-${i}`}
            cx="80"
            cy="80"
            r={arc.radius}
            fill="none"
            stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="5"
          />
        ))}
        {/* Progress arcs */}
        {arcs.map((arc, i) => {
          const circumference = 2 * Math.PI * arc.radius;
          const progress = (arc.value / 100) * circumference;
          return (
            <motion.circle
              key={`progress-${i}`}
              cx="80"
              cy="80"
              r={arc.radius}
              fill="none"
              stroke={arc.color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - progress }}
              transition={{ duration: 1, delay: 0.4 + i * 0.15 }}
              transform="rotate(-90 80 80)"
            />
          );
        })}
        {/* Score number */}
        <motion.text
          x="80"
          y="75"
          textAnchor="middle"
          dominantBaseline="middle"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '42px',
            fontWeight: 700,
            fill: theme === 'dark' ? '#FFFFFF' : '#000000',
          }}
        >
          {brandScore}
        </motion.text>
        {/* Label */}
        <motion.text
          x="80"
          y="100"
          textAnchor="middle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            fill: CARD_COLORS.brandScore,
          }}
        >
          {getScoreLabel(brandScore)}
        </motion.text>
        {/* /100 */}
        <text
          x="80"
          y="118"
          textAnchor="middle"
          style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '11px',
            fill: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          }}
        >
          /100
        </text>
      </svg>
    </motion.div>
  );
}

// Followers Card - Large number
function FollowersCard({ followersCount, theme }: { followersCount: number; theme: string }) {
  return (
    <motion.div
      style={{ ...cardBaseStyle(theme, CARD_COLORS.followers), justifyContent: 'center', alignItems: 'center' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <span style={{
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        marginBottom: '8px',
      }}>
        FOLLOWERS
      </span>
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: '32px',
          fontWeight: 700,
          color: CARD_COLORS.followers,
        }}
      >
        {formatFollowerCount(followersCount)}
      </motion.span>
      <span style={{
        fontFamily: "'Helvetica Neue', sans-serif",
        fontSize: '11px',
        color: CARD_COLORS.followers,
        marginTop: '4px',
      }}>
        trending
      </span>
    </motion.div>
  );
}

// Archetype Card - Emoji + CTA
function ArchetypeCard({
  archetype,
  archetypeEmoji,
  theme,
}: {
  archetype: string;
  archetypeEmoji: string;
  theme: string;
}) {
  return (
    <motion.div
      style={{
        ...cardBaseStyle(theme, CARD_COLORS.archetype),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.7, type: 'spring' }}
          style={{ fontSize: '36px' }}
        >
          {archetypeEmoji}
        </motion.span>
        <div>
          <div style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '18px',
            fontWeight: 700,
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
          }}>
            {archetype}
          </div>
          <div style={{
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: '12px',
            color: CARD_COLORS.archetype,
          }}>
            brandos.xyz
          </div>
        </div>
      </div>
      <span style={{
        fontFamily: "'Helvetica Neue', sans-serif",
        fontSize: '14px',
        color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
      }}>
        Get yours →
      </span>
    </motion.div>
  );
}

// ============ MAIN COMPONENT ============

interface BentoRevealGridProps {
  data: BentoShareCardData;
  theme: 'light' | 'dark';
  onClaim: () => void;
  onAnalyzeAnother: () => void;
}

export default function BentoRevealGrid({
  data,
  theme,
  onClaim,
  onAnalyzeAnother,
}: BentoRevealGridProps) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate and copy image to clipboard
  const handleCopyToX = async () => {
    setCopying(true);
    try {
      const blob = await generateBentoShareImage(data);
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
    setCopying(false);
  };

  // Generate preview
  const handlePreview = async () => {
    const blob = await generateBentoShareImage(data);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    }
  };

  // Download image
  const handleDownload = async () => {
    const blob = await generateBentoShareImage(data);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brandos-bento-${data.username}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        width: '100%',
        maxWidth: '900px',
        padding: '32px',
        position: 'relative',
        zIndex: 10,
        // Add background container for better readability
        background: theme === 'dark'
          ? 'linear-gradient(135deg, rgba(10, 10, 18, 0.95) 0%, rgba(15, 15, 24, 0.92) 50%, rgba(10, 10, 18, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 252, 0.92) 50%, rgba(255, 255, 255, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: theme === 'dark'
          ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(0, 0, 0, 0.3)'
          : '0 20px 60px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {data.profileImageUrl && (
            <img
              src={data.profileImageUrl.replace('_normal', '_200x200')}
              alt={data.displayName}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: `2px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              }}
            />
          )}
          <div>
            <div style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '18px',
              fontWeight: 600,
              color: theme === 'dark' ? '#FFFFFF' : '#000000',
            }}>
              {data.displayName}
            </div>
            <div style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '14px',
              color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            }}>
              @{data.username}
            </div>
          </div>
        </div>
        {/* BrandOS Logo */}
        <div style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: '20px',
          fontWeight: 700,
        }}>
          <span style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000', fontStyle: 'italic' }}>Brand</span>
          <span style={{ color: data.brandColors.primary }}>OS</span>
        </div>
      </motion.div>

      {/* Bento Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr) 1.4fr',
        gridTemplateRows: '160px 160px',
        gap: '12px',
        width: '100%',
      }}>
        {/* Row 1: 4 small cards + Brand Score (spans 2 rows) */}
        <ToneProfileCard tone={data.tone} theme={theme} />
        <VoiceConsistencyCard voiceConsistency={data.voiceConsistency} theme={theme} />
        <EngagementCard contentPillars={data.contentPillars} theme={theme} />
        <InfluenceTierCard
          influenceTier={data.influenceTier}
          followersCount={data.followersCount}
          theme={theme}
        />
        <div style={{ gridRow: '1 / 3' }}>
          <BrandScoreCard brandScore={data.brandScore} tone={data.tone} theme={theme} />
        </div>

        {/* Row 2: Followers + Archetype */}
        <FollowersCard followersCount={data.followersCount} theme={theme} />
        <div style={{ gridColumn: '2 / 5' }}>
          <ArchetypeCard
            archetype={data.archetype}
            archetypeEmoji={data.archetypeEmoji}
            theme={theme}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          marginTop: '16px',
          width: '100%',
        }}
      >
        {/* Share buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 71, 255, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopyToX}
            disabled={copying}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: '#FFFFFF',
              background: copied ? '#10B981' : '#0047FF',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(0, 71, 255, 0.3)',
            }}
          >
            {copied ? '✓ COPIED!' : copying ? 'GENERATING...' : 'COPY TO X'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePreview}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: '#FFFFFF',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.8)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
              padding: '14px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            PREVIEW
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: '#FFFFFF',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.8)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
              padding: '14px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            DOWNLOAD
          </motion.button>
        </div>

        {/* Claim & Analyze buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(212, 165, 116, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClaim}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: '#FFFFFF',
              background: '#D4A574',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(212, 165, 116, 0.3)',
            }}
          >
            CLAIM YOUR BRAND DNA
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAnalyzeAnother}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: '#FFFFFF',
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.6)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)'}`,
              padding: '16px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            ANALYZE ANOTHER
          </motion.button>
        </div>
      </motion.div>

      {/* Preview Modal */}
      {previewUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }}
        >
          <img
            src={previewUrl}
            alt="Bento card preview"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          />
          <div style={{
            marginTop: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}>
            <span style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
            }}>
              1200 x 630 px - Bento Card
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyToX();
              }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                color: '#FFFFFF',
                background: '#0047FF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              COPY
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                color: 'rgba(255,255,255,0.8)',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

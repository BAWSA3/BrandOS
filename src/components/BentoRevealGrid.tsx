'use client';

import { motion, Variants } from 'framer-motion';
import { useState } from 'react';
import { AnimateNumber } from 'motion-plus/react';
import { BentoShareCardData, generateBentoShareImage } from './ShareableBentoCard';

// =============================================================================
// Color Scheme (BrandOS Brand Kit)
// =============================================================================
const COLORS = {
  // Background
  bgColor: '#0a0a0a',

  // Card backgrounds (BrandOS blue gradient)
  cardHero: 'rgba(0, 71, 255, 0.06)',       // Glassmorphic with blue tint
  cardTone: '#001847',                       // Deep blue
  cardFollowers: '#002FA7',                  // Klein blue
  cardArchetype: '#0047FF',                  // Electric blue (primary)

  // Text
  textLight: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  textDark: '#1A1A1A',

  // Accents
  accentBlue: '#0047FF',
  accentGlow: 'rgba(0, 71, 255, 0.4)',

  // Glass effects
  glassBg: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glowBorder: 'rgba(0, 71, 255, 0.3)',
};

// =============================================================================
// Helper Functions
// =============================================================================
function mapInfluenceToPercent(tier: string): number {
  const map: Record<string, number> = { Nano: 20, Micro: 40, Mid: 60, Macro: 80, Mega: 100 };
  return map[tier] || 50;
}

function calculateEngagement(tone: BentoShareCardData['tone']): number {
  return Math.round((tone.formality + tone.energy + tone.confidence + tone.style) / 4);
}

function formatFollowers(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
  return count.toString();
}

// =============================================================================
// Animation Variants
// =============================================================================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, damping: 20, stiffness: 100 },
  },
};

const heroVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, damping: 18, stiffness: 80, delay: 0.1 },
  },
};

// =============================================================================
// Hero Score Card Component (Glassmorphic with Blue Glow)
// =============================================================================
function HeroScoreCard({
  brandScore,
  voiceConsistency,
  engagement,
  influence,
}: {
  brandScore: number;
  voiceConsistency: number;
  engagement: number;
  influence: number;
}) {
  const progressBars = [
    { label: 'Voice Consistency', value: voiceConsistency },
    { label: 'Engagement', value: engagement },
    { label: 'Influence', value: influence },
  ];

  return (
    <motion.div
      variants={heroVariants}
      style={{
        backgroundColor: COLORS.cardHero,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${COLORS.glowBorder}`,
        boxShadow: `0 0 40px ${COLORS.accentGlow}, inset 0 0 60px rgba(0, 71, 255, 0.03)`,
        color: COLORS.textLight,
        borderRadius: '30px',
        padding: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '220px',
        width: '100%',
      }}
    >
      {/* Left Side - Progress Bars */}
      <div style={{ width: '45%' }}>
        <div
          style={{
            border: `1px solid ${COLORS.glassBorder}`,
            padding: '6px 16px',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '25px',
            fontSize: '14px',
            fontFamily: "'Helvetica Neue', sans-serif",
            background: COLORS.glassBg,
          }}
        >
          Your Brand Score
        </div>

        {progressBars.map((bar, index) => (
          <div key={bar.label} style={{ marginBottom: '15px' }}>
            <span
              style={{
                fontSize: '14px',
                marginBottom: '5px',
                display: 'block',
                fontWeight: 500,
                fontFamily: "'Helvetica Neue', sans-serif",
                color: COLORS.textMuted,
              }}
            >
              {bar.label}
            </span>
            <div
              style={{
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                width: '100%',
                maxWidth: '300px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar.value}%` }}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.15 }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${COLORS.cardTone}, ${COLORS.accentBlue})`,
                  borderRadius: '3px',
                  boxShadow: `0 0 10px ${COLORS.accentGlow}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Right Side - Big Score */}
      <div
        style={{
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '20px',
            fontFamily: "'Helvetica Neue', sans-serif",
            color: COLORS.textMuted,
          }}
        >
          BRAND DNA
          <div
            style={{
              background: COLORS.accentBlue,
              color: 'white',
              padding: '4px 12px',
              borderRadius: '15px',
              display: 'flex',
              gap: '5px',
              fontSize: '10px',
            }}
          >
            <span style={{ opacity: 0.5 }}>OFF</span>
            <span>ON</span>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
          style={{
            fontSize: '100px',
            fontWeight: 400,
            letterSpacing: '-4px',
            lineHeight: 1,
            fontFamily: "'Helvetica Neue', sans-serif",
            textShadow: `0 0 40px ${COLORS.accentGlow}, 0 0 80px ${COLORS.accentGlow}`,
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          <span>+</span>
          <AnimateNumber>{brandScore}</AnimateNumber>
        </motion.div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Content Pillars Card Component (Deep Blue - Pillar Tags)
// =============================================================================
function ContentPillarsCard({ contentPillars }: { contentPillars?: BentoShareCardData['contentPillars'] }) {
  // Default pillars if none provided
  const pillars = contentPillars && contentPillars.length > 0
    ? contentPillars
    : [
        { name: 'Insights', frequency: 40, avgEngagement: 0 },
        { name: 'Stories', frequency: 30, avgEngagement: 0 },
        { name: 'Tips', frequency: 20, avgEngagement: 0 },
        { name: 'News', frequency: 10, avgEngagement: 0 },
      ];

  // DNA rainbow colors for pillars
  const pillarColors = [
    '#E8A838', // Golden Amber
    '#00ff88', // Green
    '#9d4edd', // Purple
    '#ff6b35', // Orange
  ];

  return (
    <motion.div
      variants={cardVariants}
      style={{
        backgroundColor: COLORS.cardTone,
        color: COLORS.textLight,
        borderRadius: '30px',
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '400px',
        position: 'relative',
        border: `1px solid ${COLORS.glassBorder}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            border: `1px solid ${COLORS.glassBorder}`,
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '14px',
            fontFamily: "'Helvetica Neue', sans-serif",
          }}
        >
          Content Pillars
        </div>
        <div
          style={{
            background: COLORS.accentBlue,
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '8px',
            color: '#fff',
            fontFamily: "'Helvetica Neue', sans-serif",
          }}
        >
          {pillars.length} pillars
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '14px',
          color: COLORS.textMuted,
          marginBottom: '24px',
          lineHeight: 1.4,
          fontFamily: "'Helvetica Neue', sans-serif",
        }}
      >
        Core topics that define your brand&apos;s content strategy.
      </p>

      {/* Pillar Tags */}
      <div
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {pillars.slice(0, 4).map((pillar, index) => (
          <motion.div
            key={pillar.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Color indicator */}
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: pillarColors[index % pillarColors.length],
                boxShadow: `0 0 10px ${pillarColors[index % pillarColors.length]}`,
              }}
            />
            {/* Pillar name */}
            <div
              style={{
                flex: 1,
                fontSize: '15px',
                fontWeight: 500,
                fontFamily: "'Helvetica Neue', sans-serif",
              }}
            >
              {pillar.name}
            </div>
            {/* Frequency bar */}
            <div
              style={{
                width: '80px',
                height: '6px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pillar.frequency}%` }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                style={{
                  height: '100%',
                  backgroundColor: pillarColors[index % pillarColors.length],
                  borderRadius: '3px',
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom label */}
      <div
        style={{
          marginTop: '20px',
          fontSize: '12px',
          color: COLORS.textMuted,
          fontFamily: "'Helvetica Neue', sans-serif",
          textAlign: 'center',
        }}
      >
        Based on your content themes
      </div>
    </motion.div>
  );
}

// =============================================================================
// Followers Card Component (Klein Blue)
// =============================================================================
function FollowersCard({ count }: { count: number }) {
  return (
    <motion.div
      variants={cardVariants}
      style={{
        backgroundColor: COLORS.cardFollowers,
        color: COLORS.textLight,
        borderRadius: '30px',
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '400px',
        border: `1px solid ${COLORS.glassBorder}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            border: `1px solid ${COLORS.glassBorder}`,
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '14px',
            fontFamily: "'Helvetica Neue', sans-serif",
          }}
        >
          Followers
        </div>
      </div>

      {/* Big Stat */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        style={{
          fontSize: '48px',
          fontWeight: 500,
          letterSpacing: '-2px',
          marginBottom: '5px',
          fontFamily: "'Helvetica Neue', sans-serif",
          display: 'flex',
          alignItems: 'baseline',
        }}
      >
        <span>+</span>
        <AnimateNumber
          format={{
            notation: 'compact',
            maximumFractionDigits: 1,
          }}
        >
          {count}
        </AnimateNumber>
      </motion.div>
      <div
        style={{
          fontSize: '14px',
          color: COLORS.textMuted,
          marginBottom: '40px',
          fontFamily: "'Helvetica Neue', sans-serif",
        }}
      >
        Total followers
      </div>

      {/* Block Chart */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: '100px',
          gap: '4px',
          marginTop: 'auto',
        }}
      >
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '80px' }}
          transition={{ duration: 0.5, delay: 0.7 }}
          style={{
            background: COLORS.accentBlue,
            width: '60%',
            borderRadius: '4px',
            boxShadow: `0 0 15px ${COLORS.accentGlow}`,
          }}
        />
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '40px' }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{
            background: COLORS.cardTone,
            width: '40%',
            borderRadius: '4px',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          marginTop: '5px',
          fontFamily: "'Helvetica Neue', sans-serif",
          color: COLORS.textMuted,
        }}
      >
        <span style={{ color: COLORS.textLight }}>+18.56%</span>
        <span style={{ textAlign: 'right' }}>
          Estimated
          <br />
          +15.78%
        </span>
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px solid ${COLORS.glassBorder}`,
          paddingTop: '15px',
          fontSize: '14px',
          fontFamily: "'Helvetica Neue', sans-serif",
          color: COLORS.textMuted,
        }}
      >
        <span>←</span>
        <span>This Month</span>
        <span>→</span>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Archetype Card Component (Electric Blue)
// =============================================================================
function ArchetypeCard({
  emoji,
  name,
  summary,
  onClaim,
}: {
  emoji: string;
  name: string;
  summary: string;
  onClaim: () => void;
}) {
  return (
    <motion.div
      variants={cardVariants}
      style={{
        backgroundColor: COLORS.cardArchetype,
        color: COLORS.textLight,
        borderRadius: '30px',
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '400px',
        border: `1px solid ${COLORS.glassBorder}`,
        boxShadow: `0 0 30px ${COLORS.accentGlow}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            border: `1px solid ${COLORS.glassBorder}`,
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '14px',
            fontFamily: "'Helvetica Neue', sans-serif",
          }}
        >
          Archetype
        </div>
        <div style={{ fontSize: '20px', cursor: 'pointer', opacity: 0.8 }}>⚙</div>
      </div>

      {/* Archetype Display */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.7, type: 'spring' }}
          style={{ fontSize: '64px', marginBottom: '10px' }}
        >
          {emoji}
        </motion.div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 600,
            fontFamily: "'Helvetica Neue', sans-serif",
          }}
        >
          {name}
        </div>
      </div>

      {/* Summary */}
      <p
        style={{
          fontSize: '14px',
          lineHeight: 1.5,
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: '20px',
          fontFamily: "'Helvetica Neue', sans-serif",
          flex: 1,
        }}
      >
        {summary}
      </p>

      {/* CTA Button */}
      <motion.button
        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.15)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onClaim}
        style={{
          marginTop: 'auto',
          width: '100%',
          padding: '14px',
          border: `1px solid ${COLORS.glassBorder}`,
          background: COLORS.glassBg,
          borderRadius: '25px',
          fontSize: '16px',
          cursor: 'pointer',
          fontFamily: "'Helvetica Neue', sans-serif",
          fontWeight: 500,
          color: COLORS.textLight,
          backdropFilter: 'blur(10px)',
        }}
      >
        Claim Your Brand
      </motion.button>
    </motion.div>
  );
}

// =============================================================================
// Main Component
// =============================================================================
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
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{
        backgroundColor: COLORS.bgColor,
        color: COLORS.textLight,
        display: 'flex',
        justifyContent: 'center',
        padding: '20px',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Top Nav */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 500,
              fontFamily: "'Helvetica Neue', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            YOUR BRAND DNA
            {/* Profile Info */}
            {data.profileImageUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={data.profileImageUrl.replace('_normal', '_200x200')}
                  alt={data.displayName}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{data.displayName}</div>
                  <div style={{ fontSize: '12px', color: COLORS.textMuted }}>@{data.username}</div>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyToX}
              disabled={copying}
              style={{
                background: copied ? '#10B981' : 'transparent',
                border: '1px solid #444',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: "'Helvetica Neue', sans-serif",
              }}
            >
              {copied ? '✓ Copied!' : copying ? 'Copying...' : 'Share'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAnalyzeAnother}
              style={{
                background: 'transparent',
                border: '1px solid #444',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: "'Helvetica Neue', sans-serif",
              }}
            >
              Analyze Another
            </motion.button>
          </div>
        </motion.div>

        {/* Hero Score Card */}
        <HeroScoreCard
          brandScore={data.brandScore}
          voiceConsistency={data.voiceConsistency}
          engagement={calculateEngagement(data.tone)}
          influence={mapInfluenceToPercent(data.influenceTier)}
        />

        {/* Grid Section */}
        <motion.div
          variants={containerVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}
        >
          <ContentPillarsCard contentPillars={data.contentPillars} />
          <FollowersCard count={data.followersCount} />
          <ArchetypeCard
            emoji={data.archetypeEmoji}
            name={data.archetype}
            summary={data.personalitySummary}
            onClaim={onClaim}
          />
        </motion.div>

        {/* Additional Action Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '10px',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePreview}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: "'Helvetica Neue', sans-serif",
            }}
          >
            Preview Card
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: "'Helvetica Neue', sans-serif",
            }}
          >
            Download
          </motion.button>
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
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                1200 x 630 px - Bento Card
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyToX();
                }}
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '12px',
                  color: '#FFFFFF',
                  background: '#0047FF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.8)',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

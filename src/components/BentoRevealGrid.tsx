'use client';

import { motion, Variants } from 'framer-motion';
import { useState } from 'react';
import { BentoShareCardData, generateBentoShareImage } from './ShareableBentoCard';

// =============================================================================
// Color Scheme (Financial Dashboard Style)
// =============================================================================
const COLORS = {
  bgColor: '#000000',
  cardMint: '#E2EFE1',
  cardOlive: '#B6B228',
  cardLavender: '#AFA8C9',
  cardOrange: '#FF5E3A',
  textDark: '#1A1A1A',
  textLight: '#FFFFFF',
  textGrey: '#888888',
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
// Hero Score Card Component
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
        backgroundColor: COLORS.cardMint,
        color: COLORS.textDark,
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
            border: `1px solid ${COLORS.textDark}`,
            padding: '6px 16px',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '25px',
            fontSize: '14px',
            fontFamily: "'Helvetica Neue', sans-serif",
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
              }}
            >
              {bar.label}
            </span>
            <div
              style={{
                height: '6px',
                background: 'rgba(0,0,0,0.1)',
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
                  background: COLORS.textDark,
                  borderRadius: '3px',
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
          }}
        >
          BRAND DNA
          <div
            style={{
              background: COLORS.textDark,
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
          }}
        >
          +{brandScore}
        </motion.div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Tone Card Component (Olive - Bar Chart)
// =============================================================================
function ToneCard({ tone }: { tone: BentoShareCardData['tone'] }) {
  const bars = [
    { key: 'formality', value: tone.formality },
    { key: 'energy', value: tone.energy },
    { key: 'confidence', value: tone.confidence },
    { key: 'style', value: tone.style },
  ];

  const avgTone = Math.round(bars.reduce((sum, b) => sum + b.value, 0) / bars.length);

  return (
    <motion.div
      variants={cardVariants}
      style={{
        backgroundColor: COLORS.cardOlive,
        color: COLORS.textDark,
        borderRadius: '30px',
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '400px',
        position: 'relative',
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
            border: '1px solid rgba(0,0,0,0.3)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '14px',
            fontFamily: "'Helvetica Neue', sans-serif",
          }}
        >
          Tone
        </div>
        <div
          style={{
            background: '#1a1a1a',
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '8px',
            color: '#fff',
            fontFamily: "'Helvetica Neue', sans-serif",
          }}
        >
          <span style={{ color: '#888' }}>Weekly</span>{' '}
          <span style={{ color: '#fff' }}>Daily</span>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '14px',
          opacity: 0.8,
          marginBottom: '40px',
          lineHeight: 1.4,
          fontFamily: "'Helvetica Neue', sans-serif",
        }}
      >
        Calculated on average engagement, we use AI to get these numbers.
      </p>

      {/* Bar Chart */}
      <div
        style={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          justifyContent: 'space-around',
        }}
      >
        {bars.map((bar, index) => (
          <motion.div
            key={bar.key}
            initial={{ height: 0 }}
            animate={{ height: `${bar.value * 2}px` }}
            transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
            style={{
              background: '#1a1a1a',
              width: '20px',
              borderRadius: '4px',
              minHeight: '20px',
            }}
          />
        ))}
      </div>

      {/* Floating Tag */}
      <div
        style={{
          background: '#1a1a1a',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '10px',
          fontSize: '12px',
          position: 'absolute',
          top: '45%',
          left: '35%',
          fontFamily: "'Helvetica Neue', sans-serif",
        }}
      >
        {avgTone}% avg
      </div>
    </motion.div>
  );
}

// =============================================================================
// Followers Card Component (Lavender)
// =============================================================================
function FollowersCard({ count }: { count: number }) {
  return (
    <motion.div
      variants={cardVariants}
      style={{
        backgroundColor: COLORS.cardLavender,
        color: COLORS.textDark,
        borderRadius: '30px',
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '400px',
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
            border: '1px solid rgba(0,0,0,0.3)',
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
        }}
      >
        +{formatFollowers(count)}
      </motion.div>
      <div
        style={{
          fontSize: '14px',
          opacity: 0.7,
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
          style={{ background: '#000', width: '60%', borderRadius: '4px' }}
        />
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '40px' }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{ background: 'rgba(0,0,0,0.2)', width: '40%', borderRadius: '4px' }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          marginTop: '5px',
          fontFamily: "'Helvetica Neue', sans-serif",
        }}
      >
        <span>+18.56%</span>
        <span style={{ opacity: 0.5, textAlign: 'right' }}>
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
          borderTop: '1px solid rgba(0,0,0,0.1)',
          paddingTop: '15px',
          fontSize: '14px',
          fontFamily: "'Helvetica Neue', sans-serif",
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
// Archetype Card Component (Orange)
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
        backgroundColor: COLORS.cardOrange,
        color: COLORS.textDark,
        borderRadius: '30px',
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '400px',
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
            border: '1px solid #000',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '14px',
            fontFamily: "'Helvetica Neue', sans-serif",
          }}
        >
          Archetype
        </div>
        <div style={{ fontSize: '20px', cursor: 'pointer' }}>⚙</div>
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
          opacity: 0.85,
          marginBottom: '20px',
          fontFamily: "'Helvetica Neue', sans-serif",
          flex: 1,
        }}
      >
        {summary}
      </p>

      {/* CTA Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClaim}
        style={{
          marginTop: 'auto',
          width: '100%',
          padding: '14px',
          border: `1px solid ${COLORS.textDark}`,
          background: 'transparent',
          borderRadius: '25px',
          fontSize: '16px',
          cursor: 'pointer',
          fontFamily: "'Helvetica Neue', sans-serif",
          fontWeight: 500,
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
                  <div style={{ fontSize: '12px', color: COLORS.textGrey }}>@{data.username}</div>
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
          <ToneCard tone={data.tone} />
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

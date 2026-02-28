'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { JourneyEndData } from '../index';
import { InviteCodeDisplay } from '@/components/InviteCodeDisplay';

interface HighlightReelProps {
  data: JourneyEndData;
  onContinue: () => void;
  theme: string;
}

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#0047FF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

// Get percentile approximation
function getPercentile(score: number): string {
  if (score >= 90) return 'top 5%';
  if (score >= 80) return 'top 15%';
  if (score >= 70) return 'top 30%';
  if (score >= 60) return 'top 45%';
  return 'top 60%';
}

export default function HighlightReel({
  data,
  onContinue,
  theme,
}: HighlightReelProps) {
  const [isInnerCircle, setIsInnerCircle] = useState(false);

  // Check Inner Circle status on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlValue = urlParams.get('innerCircle');
    const localValue = localStorage.getItem('innerCircle');
    const earlyAccessMode = process.env.NEXT_PUBLIC_EARLY_ACCESS_MODE === 'true';

    const hasAccess = earlyAccessMode ||
                      String(urlValue).toLowerCase() === 'true' ||
                      String(localValue).toLowerCase() === 'true';
    setIsInnerCircle(hasAccess);
  }, []);

  const scoreColor = getScoreColor(data.score);
  const percentile = getPercentile(data.score);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Pixel Art Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: 'rgba(10, 8, 20, 0.95)',
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          border: `3px solid ${scoreColor}40`,
          imageRendering: 'pixelated',
          position: 'relative',
          boxShadow: `
            0 0 40px ${scoreColor}15,
            inset 3px 3px 0 rgba(255,255,255,0.04),
            inset -3px -3px 0 rgba(0,0,0,0.3)
          `,
        }}
      >
        {/* Corner decorations */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
          <div
            key={corner}
            style={{
              position: 'absolute',
              [corner.includes('top') ? 'top' : 'bottom']: -3,
              [corner.includes('left') ? 'left' : 'right']: -3,
              width: 8,
              height: 8,
              background: scoreColor,
              opacity: 0.6,
            }}
          />
        ))}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
            fontSize: '9px',
            letterSpacing: '0.25em',
            color: scoreColor,
            marginBottom: '24px',
          }}
        >
          ▸ YOUR BRAND HIGHLIGHTS ◂
        </motion.div>

        {/* Highlight Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Score */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                background: `${scoreColor}20`,
                border: `2px solid ${scoreColor}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '24px',
                fontWeight: 800,
                color: '#FFFFFF',
              }}
            >
              {data.score}
            </div>
            <div>
              <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>
                Brand Score
              </div>
              <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                {percentile.toUpperCase()}
              </div>
            </div>
          </motion.div>

          {/* Archetype */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                background: 'rgba(232, 138, 74, 0.15)',
                border: '2px solid rgba(232, 138, 74, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              {data.archetypeEmoji || '🧬'}
            </div>
            <div>
              <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>
                {data.archetype}
              </div>
              <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                {data.personalityType}
              </div>
            </div>
          </motion.div>

          {/* Best Phase */}
          {data.bestPhase.diff > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: 'rgba(90, 191, 62, 0.15)',
                  border: '2px solid rgba(90, 191, 62, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#5ABF3E',
                }}
              >
                +{data.bestPhase.diff}
              </div>
              <div>
                <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>
                  {data.bestPhase.name} Phase
                </div>
                <div style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                  ABOVE AVERAGE
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Pixel divider */}
        <div
          style={{
            margin: '24px 0',
            height: 2,
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 4px, transparent 4px, transparent 6px)',
          }}
        />

        {/* Action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.02, y: -2, boxShadow: '0 0 30px rgba(90, 191, 62, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '16px 24px',
              border: '2px solid #6BD04A',
              background: 'linear-gradient(135deg, #5ABF3E 0%, #4AA235 100%)',
              color: '#050505',
              fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
              fontSize: '11px',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(90, 191, 62, 0.3)',
              fontWeight: 600,
              imageRendering: 'pixelated',
            }}
          >
            CLAIM YOUR BRAND DNA
          </motion.button>
        </motion.div>

        {/* Inner Circle Invite Codes */}
        {isInnerCircle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{ marginTop: '24px', position: 'relative' }}
          >
            <InviteCodeDisplay username={data.username} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

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
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: '#0F1115',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: `
            0 0 60px ${scoreColor}20,
            0 25px 50px rgba(0,0,0,0.5)
          `,
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: scoreColor,
            marginBottom: '24px',
          }}
        >
          YOUR BRAND HIGHLIGHTS
        </motion.div>

        {/* Highlight Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Score */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${scoreColor}, ${scoreColor}99)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
                fontSize: '28px',
                fontWeight: 800,
                color: '#FFFFFF',
              }}
            >
              {data.score}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                }}
              >
                Brand Score
              </div>
              <div
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '2px',
                }}
              >
                {percentile.toUpperCase()}
              </div>
            </div>
          </motion.div>

          {/* Archetype */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #E8C49A 0%, #D4A574 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}
            >
              {data.archetypeEmoji || '🧬'}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                }}
              >
                {data.archetype}
              </div>
              <div
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '2px',
                }}
              >
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#10B981',
                }}
              >
                +{data.bestPhase.diff}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}
                >
                  {data.bestPhase.name} Phase
                </div>
                <div
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '2px',
                  }}
                >
                  ABOVE AVERAGE
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: '32px',
          }}
        >
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #E8C49A 0%, #D4A574 100%)',
              color: '#050505',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(212, 165, 116, 0.4)',
              fontWeight: 600,
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

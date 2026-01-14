'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AchievementUnlockProps {
  archetype: string;
  archetypeEmoji: string;
  score: number;
  personalityType: string;
  onComplete: () => void;
  theme: string;
}

export default function AchievementUnlock({
  archetype,
  archetypeEmoji,
  score,
  personalityType,
  onComplete,
  theme,
}: AchievementUnlockProps) {
  const [stage, setStage] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Stage timing
    const holdTimer = setTimeout(() => setStage('hold'), 800);
    const exitTimer = setTimeout(() => setStage('exit'), 3000);
    const completeTimer = setTimeout(onComplete, 3500);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Get score tier for XP bar visualization
  const getScoreTier = (score: number) => {
    if (score >= 90) return { tier: 'S', color: '#FFD700', next: 100 };
    if (score >= 80) return { tier: 'A', color: '#10B981', next: 90 };
    if (score >= 70) return { tier: 'B', color: '#0047FF', next: 80 };
    if (score >= 60) return { tier: 'C', color: '#F59E0B', next: 70 };
    return { tier: 'D', color: '#EF4444', next: 60 };
  };

  const tierInfo = getScoreTier(score);
  const progressInTier = ((score - (tierInfo.next - 10)) / 10) * 100;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background glow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.3, scale: 1.5 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${tierInfo.color}40 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* Achievement Badge */}
      <motion.div
        initial={{ x: '100vw', rotate: 10 }}
        animate={{
          x: stage === 'exit' ? '-100vw' : 0,
          rotate: 0,
        }}
        transition={{
          type: 'spring',
          damping: stage === 'exit' ? 20 : 25,
          stiffness: stage === 'exit' ? 100 : 200,
          duration: stage === 'exit' ? 0.5 : undefined,
        }}
        style={{
          background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
          borderRadius: '24px',
          padding: '32px 48px',
          border: `2px solid ${tierInfo.color}`,
          boxShadow: `
            0 0 40px ${tierInfo.color}40,
            0 20px 60px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer effect */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Unlocked label */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: tierInfo.color,
              marginBottom: '16px',
            }}
          >
            ACHIEVEMENT UNLOCKED
          </motion.div>

          {/* Emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.4 }}
            style={{ fontSize: '64px', marginBottom: '16px' }}
          >
            {archetypeEmoji || '🧬'}
          </motion.div>

          {/* Archetype name */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '24px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '0 0 8px 0',
            }}
          >
            {archetype}
          </motion.h2>

          {/* Personality type badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              display: 'inline-block',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '20px',
            }}
          >
            {personalityType}
          </motion.div>

          {/* XP Bar */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            style={{ originX: 0 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '8px',
              }}
            >
              {/* Tier badge */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: tierInfo.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#000',
                }}
              >
                {tierInfo.tier}
              </div>

              {/* Progress bar */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressInTier}%` }}
                    transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${tierInfo.color}, ${tierInfo.color}CC)`,
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <span>{score} XP</span>
                  <span>NEXT: {tierInfo.next}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Particle burst */}
      <AnimatePresence>
        {stage === 'enter' && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  scale: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  x: Math.cos((i / 12) * Math.PI * 2) * 200,
                  y: Math.sin((i / 12) * Math.PI * 2) * 200,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, delay: 0.3 + i * 0.02 }}
                style={{
                  position: 'absolute',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: tierInfo.color,
                  boxShadow: `0 0 10px ${tierInfo.color}`,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

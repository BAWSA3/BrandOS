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
}: AchievementUnlockProps) {
  const [stage, setStage] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const holdTimer = setTimeout(() => setStage('hold'), 800);
    const exitTimer = setTimeout(() => setStage('exit'), 3000);
    const completeTimer = setTimeout(onComplete, 3500);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const getScoreTier = (score: number) => {
    if (score >= 90) return { tier: 'S', color: '#FFD700', next: 100 };
    if (score >= 80) return { tier: 'A', color: '#5ABF3E', next: 90 };
    if (score >= 70) return { tier: 'B', color: '#FFE066', next: 80 };
    if (score >= 60) return { tier: 'C', color: '#E88A4A', next: 70 };
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
        imageRendering: 'pixelated',
      }}
    >
      {/* Pixel glow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.25, scale: 1.2 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${tierInfo.color}30 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />

      {/* Pixel Achievement Card */}
      <motion.div
        initial={{ x: '100vw', rotate: 5 }}
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
          background: 'rgba(10, 8, 20, 0.95)',
          padding: '32px 48px',
          border: `3px solid ${tierInfo.color}`,
          boxShadow: `
            0 0 30px ${tierInfo.color}30,
            inset 3px 3px 0 rgba(255,255,255,0.06),
            inset -3px -3px 0 rgba(0,0,0,0.3)
          `,
          position: 'relative',
          overflow: 'hidden',
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
              width: 10,
              height: 10,
              background: tierInfo.color,
              opacity: 0.7,
            }}
          />
        ))}

        {/* Pixel scanline shimmer */}
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
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
              fontSize: '9px',
              letterSpacing: '0.25em',
              color: tierInfo.color,
              marginBottom: '16px',
            }}
          >
            ▸ ACHIEVEMENT UNLOCKED ◂
          </motion.div>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.4 }}
            style={{ fontSize: '56px', marginBottom: '16px' }}
          >
            {archetypeEmoji || '🧬'}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
              fontSize: '20px',
              fontWeight: 400,
              color: '#FFFFFF',
              margin: '0 0 8px 0',
              letterSpacing: '0.1em',
            }}
          >
            {archetype}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              display: 'inline-block',
              padding: '5px 12px',
              background: `${tierInfo.color}15`,
              border: `1px solid ${tierInfo.color}40`,
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '20px',
            }}
          >
            {personalityType}
          </motion.div>

          {/* Pixel XP Bar */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            style={{ originX: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: tierInfo.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#000',
                }}
              >
                {tierInfo.tier}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 8,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressInTier}%` }}
                    transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: `repeating-linear-gradient(90deg, ${tierInfo.color} 0px, ${tierInfo.color} 4px, ${tierInfo.color}80 4px, ${tierInfo.color}80 6px)`,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '8px',
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

      {/* Square pixel particle burst */}
      <AnimatePresence>
        {stage === 'enter' && (
          <>
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  x: Math.cos((i / 16) * Math.PI * 2) * 180,
                  y: Math.sin((i / 16) * Math.PI * 2) * 180,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, delay: 0.3 + i * 0.02 }}
                style={{
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  background: tierInfo.color,
                  boxShadow: `0 0 8px ${tierInfo.color}`,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

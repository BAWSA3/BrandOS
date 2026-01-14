'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SpotlightScoreProps {
  score: number;
  children: ReactNode; // The full dashboard
  onReady?: () => void;
}

// Get color based on score
function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#0047FF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'EXCEPTIONAL';
  if (score >= 80) return 'EXCELLENT';
  if (score >= 70) return 'STRONG';
  if (score >= 60) return 'GOOD';
  if (score >= 50) return 'DECENT';
  if (score >= 40) return 'NEEDS WORK';
  return 'CRITICAL';
}

export default function SpotlightScore({
  score,
  children,
  onReady,
}: SpotlightScoreProps) {
  const [stage, setStage] = useState<'spotlight' | 'expanding' | 'revealed'>('spotlight');

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  useEffect(() => {
    // Hold spotlight for 2 seconds, then expand
    const expandTimer = setTimeout(() => setStage('expanding'), 2000);
    const revealTimer = setTimeout(() => {
      setStage('revealed');
      onReady?.();
    }, 2800);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(revealTimer);
    };
  }, [onReady]);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {/* Spotlight Score Card */}
      <AnimatePresence>
        {(stage === 'spotlight' || stage === 'expanding') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: stage === 'expanding' ? 0 : 1,
              scale: stage === 'expanding' ? 0.5 : 1,
              x: stage === 'expanding' ? '-30vw' : 0,
              y: stage === 'expanding' ? '-20vh' : 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: stage === 'expanding' ? 0.8 : 0.5,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#050505',
            }}
          >
            {/* Background glow */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${scoreColor}40 0%, transparent 70%)`,
                filter: 'blur(60px)',
              }}
            />

            {/* Score Card */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                background: `linear-gradient(135deg, ${scoreColor} 0%, ${scoreColor}CC 100%)`,
                borderRadius: '32px',
                padding: '48px 64px',
                textAlign: 'center',
                boxShadow: `
                  0 0 60px ${scoreColor}60,
                  0 25px 50px rgba(0,0,0,0.5)
                `,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Grid pattern overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                  opacity: 0.3,
                  pointerEvents: 'none',
                }}
              />

              {/* Label */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '12px',
                  position: 'relative',
                }}
              >
                YOUR BRAND SCORE
              </motion.div>

              {/* Score Number */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', damping: 15 }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(80px, 15vw, 140px)',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1,
                  position: 'relative',
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                {score}
              </motion.div>

              {/* Score Label Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{
                  display: 'inline-block',
                  marginTop: '16px',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  color: '#FFFFFF',
                  position: 'relative',
                }}
              >
                {scoreLabel}
              </motion.div>
            </motion.div>

            {/* Hint to wait */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                position: 'absolute',
                bottom: '80px',
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.1em',
              }}
            >
              LOADING DASHBOARD...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard with staggered reveal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 'revealed' ? 1 : 0.3 }}
        transition={{ duration: 0.5 }}
        style={{
          filter: stage === 'revealed' ? 'blur(0px)' : 'blur(10px)',
          transition: 'filter 0.5s ease-out',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Export a hook to use in dashboard components for staggered animation
export function useSpotlightStagger(index: number, totalItems: number = 6) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const delay = 2800 + index * 150; // After spotlight, stagger each item
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [index]);

  return {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: isVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  };
}

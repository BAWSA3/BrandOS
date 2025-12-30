'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================
interface JourneyBackgroundProps {
  progress: number;      // 0-1 (overall progress across all phases)
  currentPhase: number;  // 1-4
  theme: string;
}

interface OrbPosition {
  x: string;
  y: string;
}

// ============================================================================
// Configuration
// ============================================================================
const orbPositions: OrbPosition[] = [
  { x: '20%', y: '30%' },   // Top-left area
  { x: '80%', y: '25%' },   // Top-right area
  { x: '15%', y: '70%' },   // Bottom-left area
  { x: '75%', y: '65%' },   // Bottom-right area
];

// ============================================================================
// Reactive Orb Component - DRAMATIC MODE
// ============================================================================
function ReactiveOrb({
  index,
  progress,
  theme,
  position,
}: {
  index: number;
  progress: number;
  theme: string;
  position: OrbPosition;
}) {
  // Orb appears based on progress threshold
  const threshold = index * 0.2; // Orbs appear faster (0%, 20%, 40%, 60%)
  const isVisible = progress >= threshold;

  // DRAMATIC reactive properties
  const localScale = 1 + (progress * 0.8);           // 1 → 1.8 (80% growth!)
  const localOpacity = 0.4 + (progress * 0.6);       // 0.4 → 1.0 (full intensity)
  const duration = Math.max(2, 6 - (progress * 4));  // 6s → 2s (much faster)
  const blurAmount = 60 - (progress * 30);           // 60px → 30px (much sharper)
  const gradientStop = 25 + (progress * 30);         // 25% → 55% (solid core)
  const orbSize = 400 + (progress * 200);            // 400px → 600px (grows!)

  // Movement amplitude increases with progress
  const moveAmplitude = 20 + (progress * 30);        // 20px → 50px drift

  const staggerDelay = index * 0.1;

  if (!isVisible) return null;

  return (
    <motion.div
      key={`orb-${index}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [localScale, localScale * 1.15, localScale * 0.95, localScale],
        opacity: localOpacity,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        scale: {
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: staggerDelay,
        },
        opacity: {
          duration: 0.4,
          ease: "easeOut",
        },
      }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: `${orbSize}px`,
        height: `${orbSize}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(0, 71, 255, ${0.7 + progress * 0.3}) ${gradientStop}%, rgba(0, 47, 167, ${0.3 + progress * 0.3}) 60%, transparent 75%)`,
        filter: `blur(${blurAmount}px)`,
        transform: 'translate(-50%, -50%)',
        willChange: 'transform, opacity',
        pointerEvents: 'none',
        boxShadow: progress > 0.5 ? `0 0 ${80 + progress * 60}px rgba(0, 71, 255, ${0.3 + progress * 0.4})` : 'none',
      }}
    >
      {/* Inner floating motion - more dramatic movement */}
      <motion.div
        animate={{
          x: [0, moveAmplitude, 0, -moveAmplitude, 0],
          y: [0, -moveAmplitude * 1.2, 0, moveAmplitude * 1.2, 0],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{
          x: { duration: duration * 1.3, repeat: Infinity, ease: "easeInOut", delay: staggerDelay },
          y: { duration: duration * 1.1, repeat: Infinity, ease: "easeInOut", delay: staggerDelay + 0.3 },
          rotate: { duration: duration * 2, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// Phase Pulse Component - DRAMATIC MODE
// ============================================================================
function PhasePulse({
  trigger,
  theme
}: {
  trigger: number;
  theme: string;
}) {
  if (trigger === 0) return null;

  return (
    <>
      {/* Primary pulse ring */}
      <motion.div
        key={`pulse-${trigger}`}
        initial={{ scale: 0, opacity: 0.9 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{
          duration: 1.2,
          ease: [0.34, 1.56, 0.64, 1]
        }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          border: '3px solid rgba(0, 71, 255, 0.8)',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 80px rgba(0, 71, 255, 0.6), inset 0 0 40px rgba(0, 71, 255, 0.3)',
          pointerEvents: 'none',
        }}
      />
      {/* Secondary pulse - slightly delayed */}
      <motion.div
        key={`pulse-secondary-${trigger}`}
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{
          duration: 1,
          delay: 0.15,
          ease: "easeOut"
        }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 71, 255, 0.4) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
      {/* Flash effect */}
      <motion.div
        key={`flash-${trigger}`}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 0 }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 71, 255, 0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function JourneyBackground({
  progress,
  currentPhase,
  theme,
}: JourneyBackgroundProps) {
  const prevPhaseRef = useRef(currentPhase);
  const [pulseKey, setPulseKey] = useState(0);

  // Detect phase transitions and trigger pulse
  useEffect(() => {
    if (currentPhase !== prevPhaseRef.current) {
      setPulseKey(prev => prev + 1);
      prevPhaseRef.current = currentPhase;
    }
  }, [currentPhase]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Ambient glow layer that intensifies with progress - DRAMATIC */}
      <motion.div
        animate={{
          opacity: 0.2 + (progress * 0.5),
          scale: 1 + (progress * 0.3),
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200vw',
          height: '200vh',
          background: `radial-gradient(ellipse at center, rgba(0, 71, 255, ${0.25 + progress * 0.35}) 0%, rgba(0, 47, 167, ${0.1 + progress * 0.15}) 30%, transparent 55%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Secondary pulsing glow - adds energy */}
      <motion.div
        animate={{
          opacity: [0.1 + progress * 0.3, 0.2 + progress * 0.4, 0.1 + progress * 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3 - progress * 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '120vw',
          height: '120vh',
          background: 'radial-gradient(ellipse at center, rgba(0, 71, 255, 0.2) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Reactive orbs */}
      <AnimatePresence mode="sync">
        {orbPositions.map((position, index) => (
          <ReactiveOrb
            key={`reactive-orb-${index}`}
            index={index}
            progress={progress}
            theme={theme}
            position={position}
          />
        ))}
      </AnimatePresence>

      {/* Phase transition pulse */}
      <AnimatePresence mode="wait">
        <PhasePulse trigger={pulseKey} theme={theme} />
      </AnimatePresence>

      {/* Subtle vignette that decreases with progress (more open feel as energy builds) */}
      <motion.div
        animate={{
          opacity: 0.4 - (progress * 0.2),
        }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, ${theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'} 100%)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

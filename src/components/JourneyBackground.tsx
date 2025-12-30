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

// ============================================================================
// Phase Pulse Component - DRAMATIC MODE
// ============================================================================
function PhasePulse({
  trigger,
}: {
  trigger: number;
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
      {/* Ambient glow layer that intensifies with progress */}
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

      {/* Phase transition pulse */}
      <AnimatePresence mode="wait">
        <PhasePulse trigger={pulseKey} />
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

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

export type ParticleAnimationPhase = 'floating' | 'converging' | 'collapsed' | 'dispersing';


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
// PROGRESSIVE PARTICLES - Unified particle system that evolves with progress
// ============================================================================
interface ParticleData {
  id: number;
  initialX: number;
  initialY: number;
  size: number;
  speedMultiplier: number;
  phaseOffset: number;
}

// Generate stable particle data once
const generateParticles = (count: number): ParticleData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
    size: 0.7 + Math.random() * 0.6, // 0.7 to 1.3 multiplier for organic feel
    speedMultiplier: 0.8 + Math.random() * 0.4,
    phaseOffset: Math.random() * Math.PI * 2,
  }));
};

const PARTICLE_DATA = generateParticles(50);

function ProgressiveParticles({
  progress,
  theme,
  isComplete,
  animationPhase,
}: {
  progress: number;
  theme: string;
  isComplete: boolean;
  animationPhase: 'floating' | 'converging' | 'collapsed' | 'dispersing';
}) {
  // Scale properties with progress
  const baseSize = 2 + progress * 6;           // 2px → 8px
  const baseOpacity = 0.3 + progress * 0.5;    // 0.3 → 0.8
  const glowIntensity = 5 + progress * 20;     // 5px → 25px glow
  const driftSpeed = 3 + progress * 4;         // Animation duration: 3s → 7s (faster = shorter)

  // Converge factor for 90%+ progress
  const convergeFactor = progress > 0.9 ? (progress - 0.9) / 0.1 : 0; // 0 → 1 as progress goes 90% → 100%

  return (
    <>
      {PARTICLE_DATA.map((particle) => {
        const particleSize = baseSize * particle.size;
        const duration = (8 - driftSpeed) * particle.speedMultiplier;

        // Calculate position based on animation phase
        let targetX = particle.initialX;
        let targetY = particle.initialY;

        if (animationPhase === 'converging' || convergeFactor > 0) {
          // Lerp toward center (50%, 50%)
          const factor = animationPhase === 'converging' ? 1 : convergeFactor;
          targetX = particle.initialX + (50 - particle.initialX) * factor * 0.8;
          targetY = particle.initialY + (50 - particle.initialY) * factor * 0.8;
        }

        if (animationPhase === 'collapsed') {
          targetX = 50;
          targetY = 50;
        }

        if (animationPhase === 'dispersing') {
          // Explode outward from center
          const angle = (particle.id / PARTICLE_DATA.length) * Math.PI * 2 + particle.phaseOffset;
          targetX = 50 + Math.cos(angle) * 80;
          targetY = 50 + Math.sin(angle) * 80;
        }

        return (
          <motion.div
            key={`progressive-particle-${particle.id}`}
            initial={{
              left: `${particle.initialX}%`,
              top: `${particle.initialY}%`,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              left: animationPhase === 'floating'
                ? [
                    `${targetX}%`,
                    `${targetX + (Math.sin(particle.phaseOffset) * 8 * (1 - convergeFactor))}%`,
                    `${targetX + (Math.cos(particle.phaseOffset) * 6 * (1 - convergeFactor))}%`,
                    `${targetX}%`,
                  ]
                : `${targetX}%`,
              top: animationPhase === 'floating'
                ? [
                    `${targetY}%`,
                    `${targetY + (Math.cos(particle.phaseOffset) * 8 * (1 - convergeFactor))}%`,
                    `${targetY + (Math.sin(particle.phaseOffset) * 6 * (1 - convergeFactor))}%`,
                    `${targetY}%`,
                  ]
                : `${targetY}%`,
              opacity: animationPhase === 'dispersing' ? [baseOpacity, 0] : baseOpacity,
              scale: animationPhase === 'dispersing' ? [1, 2] : 1,
            }}
            transition={{
              left: animationPhase === 'floating'
                ? { duration: duration, repeat: Infinity, ease: "easeInOut" }
                : { duration: animationPhase === 'dispersing' ? 0.8 : 0.5, ease: "easeOut" },
              top: animationPhase === 'floating'
                ? { duration: duration * 1.1, repeat: Infinity, ease: "easeInOut" }
                : { duration: animationPhase === 'dispersing' ? 0.8 : 0.5, ease: "easeOut" },
              opacity: { duration: animationPhase === 'dispersing' ? 0.8 : 0.5 },
              scale: { duration: animationPhase === 'dispersing' ? 0.8 : 0.3 },
            }}
            style={{
              position: 'absolute',
              width: `${particleSize}px`,
              height: `${particleSize}px`,
              borderRadius: '50%',
              background: `rgba(0, 71, 255, ${0.7 + progress * 0.3})`,
              boxShadow: `
                0 0 ${glowIntensity * particle.size}px rgba(0, 71, 255, ${0.4 + progress * 0.3}),
                0 0 ${glowIntensity * particle.size * 2}px rgba(0, 71, 255, ${0.2 + progress * 0.2})
              `,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              filter: progress > 0.6 ? `blur(${(1 - particle.size) * 2}px)` : 'none',
            }}
          />
        );
      })}

      {/* Central glow that appears as particles converge */}
      {(animationPhase === 'converging' || animationPhase === 'collapsed' || convergeFactor > 0.5) && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: animationPhase === 'collapsed' ? 1.5 : 1,
            opacity: animationPhase === 'collapsed' ? 1 : convergeFactor,
          }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(0, 71, 255, 0.5) 40%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        />
      )}
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
  animationPhase = 'floating',
  isComplete = false,
}: JourneyBackgroundProps & {
  animationPhase?: ParticleAnimationPhase;
  isComplete?: boolean;
}) {
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

      {/* Progressive Particles - unified particle system */}
      <ProgressiveParticles
        progress={progress}
        theme={theme}
        isComplete={isComplete}
        animationPhase={animationPhase}
      />

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

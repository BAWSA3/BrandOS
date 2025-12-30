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
  { x: '5%', y: '15%' },    // Top-left corner - pushed to edge
  { x: '95%', y: '10%' },   // Top-right corner - pushed to edge
  { x: '0%', y: '85%' },    // Bottom-left corner - pushed to edge
  { x: '90%', y: '90%' },   // Bottom-right corner - pushed to edge
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
// COMPLETION ANIMATION 1: Ripple Wave
// ============================================================================
function RippleWave({ isActive, theme }: { isActive: boolean; theme: string }) {
  if (!isActive) return null;

  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={`ripple-${i}`}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 6, opacity: 0 }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: `2px solid rgba(0, 71, 255, ${0.6 - i * 0.1})`,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${30 - i * 5}px rgba(0, 71, 255, 0.4)`,
            pointerEvents: 'none',
          }}
        />
      ))}
      {/* Central glow pulse */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 71, 255, 0.8) 0%, rgba(0, 71, 255, 0.3) 50%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(10px)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

// ============================================================================
// COMPLETION ANIMATION 2: Aurora Effect
// ============================================================================
function AuroraEffect({ isActive, theme }: { isActive: boolean; theme: string }) {
  if (!isActive) return null;

  const auroraColors = [
    'rgba(0, 71, 255, 0.4)',
    'rgba(138, 43, 226, 0.35)',
    'rgba(0, 191, 255, 0.3)',
    'rgba(75, 0, 130, 0.25)',
  ];

  return (
    <>
      {auroraColors.map((color, i) => (
        <motion.div
          key={`aurora-${i}`}
          animate={{
            x: ['-20%', '20%', '-10%', '15%', '-20%'],
            y: [`${-30 + i * 15}%`, `${-20 + i * 10}%`, `${-35 + i * 12}%`, `${-25 + i * 8}%`, `${-30 + i * 15}%`],
            scaleX: [1, 1.3, 0.9, 1.2, 1],
            opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '200%',
            height: '40%',
            background: `linear-gradient(180deg, transparent 0%, ${color} 50%, transparent 100%)`,
            filter: 'blur(60px)',
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        />
      ))}
      {/* Shimmering particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`shimmer-${i}`}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -100],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeOut",
          }}
          style={{
            position: 'absolute',
            left: `${10 + Math.random() * 80}%`,
            top: `${40 + Math.random() * 40}%`,
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 0 10px rgba(0, 71, 255, 0.8)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

// ============================================================================
// COMPLETION ANIMATION 3: Converging Particles
// ============================================================================
function ConvergingParticles({ isActive, theme }: { isActive: boolean; theme: string }) {
  const particleCount = 40;

  if (!isActive) return null;

  return (
    <>
      {[...Array(particleCount)].map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2;
        const startX = Math.cos(angle) * 150; // Start from edges (150% from center)
        const startY = Math.sin(angle) * 150;
        const size = 3 + Math.random() * 6;
        const duration = 1.5 + Math.random() * 1;
        const delay = (i / particleCount) * 0.8;

        return (
          <motion.div
            key={`particle-${i}`}
            initial={{
              x: `${startX}vw`,
              y: `${startY}vh`,
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              x: ['0vw'],
              y: ['0vh'],
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.5, 1, 0],
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: `rgba(0, 71, 255, ${0.6 + Math.random() * 0.4})`,
              boxShadow: `0 0 ${size * 2}px rgba(0, 71, 255, 0.8), 0 0 ${size * 4}px rgba(0, 71, 255, 0.4)`,
              pointerEvents: 'none',
            }}
          />
        );
      })}
      {/* Central energy burst on convergence */}
      <motion.div
        animate={{
          scale: [0.8, 1.5, 0.8],
          opacity: [0.4, 0.9, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(0, 71, 255, 0.6) 40%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(5px)',
          pointerEvents: 'none',
        }}
      />
      {/* Outer glow ring */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: '2px solid rgba(0, 71, 255, 0.5)',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 40px rgba(0, 71, 255, 0.3), inset 0 0 30px rgba(0, 71, 255, 0.2)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

// ============================================================================
// Completion Animation Type
// ============================================================================
export type CompletionAnimationType = 'ripple' | 'aurora' | 'converging' | 'none';

// ============================================================================
// Main Component
// ============================================================================
export default function JourneyBackground({
  progress,
  currentPhase,
  theme,
  completionAnimation = 'converging',
}: JourneyBackgroundProps & { completionAnimation?: CompletionAnimationType }) {
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

      {/* Completion Animations - triggered when progress > 0.9 */}
      <AnimatePresence>
        {progress > 0.9 && completionAnimation === 'ripple' && (
          <RippleWave isActive={true} theme={theme} />
        )}
        {progress > 0.9 && completionAnimation === 'aurora' && (
          <AuroraEffect isActive={true} theme={theme} />
        )}
        {progress > 0.9 && completionAnimation === 'converging' && (
          <ConvergingParticles isActive={true} theme={theme} />
        )}
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

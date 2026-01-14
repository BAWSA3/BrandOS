'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

interface ScoreCountdownProps {
  targetScore: number;
  onComplete: () => void;
  theme: string;
}

// Particle for burst effect
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

export default function ScoreCountdown({
  targetScore,
  onComplete,
  theme,
}: ScoreCountdownProps) {
  const [stage, setStage] = useState<'counting' | 'burst' | 'complete'>('counting');
  const [particles, setParticles] = useState<Particle[]>([]);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate count up
  useEffect(() => {
    const controls = animate(count, targetScore, {
      duration: 2,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (v) => setDisplayValue(Math.round(v)),
      onComplete: () => {
        setStage('burst');
        createParticleBurst();
        setTimeout(() => setStage('complete'), 800);
        setTimeout(onComplete, 1500);
      },
    });

    return () => controls.stop();
  }, [targetScore, onComplete]);

  // Create particle burst
  const createParticleBurst = () => {
    const colors = ['#0047FF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 4 + Math.random() * 8;
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }

    setParticles(newParticles);

    // Animate particles
    let frame = 0;
    const animateParticles = () => {
      frame++;
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2, // Gravity
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0)
      );
      if (frame < 60) {
        requestAnimationFrame(animateParticles);
      }
    };
    requestAnimationFrame(animateParticles);
  };

  // Get color based on score
  const getScoreColor = () => {
    if (targetScore >= 80) return '#10B981';
    if (targetScore >= 60) return '#0047FF';
    if (targetScore >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const scoreColor = getScoreColor();

  return (
    <div
      ref={containerRef}
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
      {/* Convergent particles during count */}
      {stage === 'counting' && (
        <>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: (Math.random() - 0.5) * 800,
                y: (Math.random() - 0.5) * 800,
                opacity: 0.5,
                scale: 0.5,
              }}
              animate={{
                x: 0,
                y: 0,
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 2,
                delay: i * 0.05,
                ease: 'easeIn',
              }}
              style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: scoreColor,
                boxShadow: `0 0 20px ${scoreColor}`,
              }}
            />
          ))}
        </>
      )}

      {/* Pulsing glow background */}
      <motion.div
        animate={{
          scale: stage === 'burst' ? [1, 1.5, 1] : [1, 1.1, 1],
          opacity: stage === 'burst' ? [0.3, 0.6, 0] : [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: stage === 'burst' ? 0.5 : 1,
          repeat: stage === 'counting' ? Infinity : 0,
        }}
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${scoreColor}60 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />

      {/* Score number */}
      <motion.div
        animate={{
          scale: stage === 'burst' ? [1, 1.3, 0.8] : 1,
        }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '12px',
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '12px',
          }}
        >
          BRAND SCORE
        </motion.div>

        {/* Big number */}
        <motion.div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(80px, 20vw, 160px)',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1,
            textShadow: `0 0 60px ${scoreColor}80`,
          }}
        >
          {displayValue}
        </motion.div>

        {/* Progress ring */}
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: stage === 'counting' ? 0.3 : 0,
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={scoreColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={565}
            initial={{ strokeDashoffset: 565 }}
            animate={{ strokeDashoffset: 565 - (565 * displayValue) / 100 }}
            style={{
              transformOrigin: 'center',
              transform: 'rotate(-90deg)',
            }}
          />
        </svg>
      </motion.div>

      {/* Burst particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 10px ${p.color}`,
            x: p.x,
            y: p.y,
            opacity: p.life,
          }}
        />
      ))}

      {/* Flash on complete */}
      {stage === 'burst' && (
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FFFFFF',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

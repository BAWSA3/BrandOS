'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InnerCircleUnlockProps {
  onComplete: () => void;
  theme: string;
}

export default function InnerCircleUnlock({
  onComplete,
  theme,
}: InnerCircleUnlockProps) {
  const [stage, setStage] = useState<'enter' | 'hold' | 'exit'>('enter');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Stage timing - extended hold for the premium feel
    const holdTimer = setTimeout(() => setStage('hold'), 1000);
    const exitTimer = setTimeout(() => setStage('exit'), 6000);
    const completeTimer = setTimeout(onComplete, 6500);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Gold particle effect on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = ['#FFD700', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'];

    // Create initial burst particles
    const createBurst = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < 60; i++) {
        const angle = (Math.PI * 2 * i) / 60 + Math.random() * 0.5;
        const speed = 3 + Math.random() * 6;
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 4,
          alpha: 1,
          decay: 0.008 + Math.random() * 0.01,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    // Create floating particles continuously
    const createFloatingParticle = () => {
      if (particles.length < 100) {
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 1,
          vy: -1 - Math.random() * 2,
          size: 1 + Math.random() * 3,
          alpha: 0.3 + Math.random() * 0.5,
          decay: 0.003,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    // Initial burst after badge appears
    const burstTimer = setTimeout(createBurst, 600);

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add floating particles
      if (Math.random() < 0.3) {
        createFloatingParticle();
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // Slight gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      clearTimeout(burstTimer);
      cancelAnimationFrame(animationId);
    };
  }, []);

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
        background: '#050505',
      }}
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Background glow effect - warm gold */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 0.5, scale: 2 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(217,119,6,0.2) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Secondary glow ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.3, 0.1], scale: [0.5, 1.5, 2] }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          border: '2px solid rgba(255,215,0,0.3)',
          boxShadow: '0 0 60px rgba(255,215,0,0.2)',
        }}
      />

      {/* Main Badge Card */}
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.8, rotateX: 20 }}
        animate={{
          y: stage === 'exit' ? -100 : 0,
          opacity: stage === 'exit' ? 0 : 1,
          scale: stage === 'exit' ? 0.9 : 1,
          rotateX: 0,
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 150,
          duration: stage === 'exit' ? 0.5 : undefined,
        }}
        style={{
          background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
          borderRadius: '28px',
          padding: '40px 56px',
          border: '2px solid #F59E0B',
          boxShadow: `
            0 0 60px rgba(245,158,11,0.4),
            0 0 120px rgba(245,158,11,0.2),
            0 30px 80px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Continuous shimmer effect */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{
            duration: 2,
            delay: 0.5,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 1.5
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* Pulsing border glow */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '28px',
            boxShadow: 'inset 0 0 30px rgba(255,215,0,0.15)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Exclusive Access label */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.25em',
              background: 'linear-gradient(90deg, #FFD700, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '20px',
              fontWeight: 600,
            }}
          >
            EXCLUSIVE ACCESS GRANTED
          </motion.div>

          {/* Crown icon with glow */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.4 }}
            style={{
              fontSize: '72px',
              marginBottom: '20px',
              filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.6))',
            }}
          >
            👑
          </motion.div>

          {/* Inner Circle text */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '32px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 50%, #D97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 12px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Inner Circle
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: 'rgba(255,255,255,0.6)',
              margin: '0 auto 24px auto',
              maxWidth: '280px',
            }}
          >
            You're one of the first to experience BrandOS
          </motion.p>

          {/* Badge preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: 'spring', damping: 15 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 50%, #D97706 100%)',
              boxShadow: `
                0 0 20px rgba(245,158,11,0.5),
                0 0 40px rgba(245,158,11,0.3),
                inset 0 1px 0 rgba(255,255,255,0.4)
              `,
            }}
          >
            <span style={{ fontSize: '16px' }}>👑</span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                color: '#1a1a1a',
                letterSpacing: '0.05em',
              }}
            >
              INNER CIRCLE
            </span>
          </motion.div>

          {/* Perks hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <span>EARLY ACCESS</span>
            <span style={{ color: '#F59E0B' }}>•</span>
            <span>EXCLUSIVE FEATURES</span>
            <span style={{ color: '#F59E0B' }}>•</span>
            <span>PRIORITY SUPPORT</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Radial lines burst */}
      <AnimatePresence>
        {stage === 'enter' && (
          <>
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0, 1.5, 2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.4 + i * 0.03 }}
                style={{
                  position: 'absolute',
                  width: '2px',
                  height: '100px',
                  background: 'linear-gradient(to top, transparent, #FFD700, transparent)',
                  transformOrigin: 'center bottom',
                  transform: `rotate(${(360 / 16) * i}deg) translateY(-150px)`,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'motion/react';
import { useBrandStore } from '@/lib/store';
import XBrandScoreHero from '@/components/XBrandScoreHero';

// =============================================================================
// Dynamic Score Page - Shareable URL: /score/@username or /score/username
// =============================================================================

// Cursor-reactive Klein Blue Orb Component
function KleinBlueOrb({ 
  theme, 
  mouseX, 
  mouseY 
}: { 
  theme: string;
  mouseX: ReturnType<typeof useSpring>;
  mouseY: ReturnType<typeof useSpring>;
}) {
  const orbX = useTransform(mouseX, [0, 1], [30, -30]);
  const orbY = useTransform(mouseY, [0, 1], [20, -20]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        opacity: { duration: 1.5, ease: 'easeOut' },
        scale: { duration: 1.5, ease: 'easeOut' },
      }}
      style={{
        position: 'fixed',
        top: '15%',
        right: '10%',
        width: 'clamp(300px, 50vw, 600px)',
        height: 'clamp(300px, 50vw, 600px)',
        background: theme === 'dark'
          ? 'radial-gradient(circle at 40% 40%, rgba(0, 71, 255, 0.5) 0%, rgba(0, 47, 167, 0.3) 30%, rgba(0, 24, 71, 0.15) 60%, transparent 80%)'
          : 'radial-gradient(circle at 40% 40%, rgba(60, 138, 255, 0.6) 0%, rgba(0, 71, 255, 0.4) 30%, rgba(0, 47, 167, 0.2) 60%, transparent 80%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 1,
        x: orbX,
        y: orbY,
      }}
    />
  );
}

function SecondaryOrb({ 
  theme, 
  mouseX, 
  mouseY 
}: { 
  theme: string;
  mouseX: ReturnType<typeof useSpring>;
  mouseY: ReturnType<typeof useSpring>;
}) {
  const orbX = useTransform(mouseX, [0, 1], [-40, 40]);
  const orbY = useTransform(mouseY, [0, 1], [-30, 30]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 0.6, scale: 1 }}
      transition={{
        opacity: { duration: 2, delay: 0.5, ease: 'easeOut' },
        scale: { duration: 2, delay: 0.5, ease: 'easeOut' },
      }}
      style={{
        position: 'fixed',
        bottom: '20%',
        left: '5%',
        width: 'clamp(150px, 25vw, 300px)',
        height: 'clamp(150px, 25vw, 300px)',
        background: theme === 'dark'
          ? 'radial-gradient(circle, rgba(0, 71, 255, 0.35) 0%, rgba(0, 47, 167, 0.15) 50%, transparent 80%)'
          : 'radial-gradient(circle, rgba(60, 138, 255, 0.45) 0%, rgba(0, 71, 255, 0.2) 50%, transparent 80%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 1,
        x: orbX,
        y: orbY,
      }}
    />
  );
}

function FloatingCircle({ 
  size, 
  top, 
  left, 
  delay, 
  duration,
  theme,
  mouseX,
  mouseY,
  parallaxFactor,
}: { 
  size: number; 
  top: string; 
  left: string; 
  delay: number;
  duration: number;
  theme: string;
  mouseX: ReturnType<typeof useSpring>;
  mouseY: ReturnType<typeof useSpring>;
  parallaxFactor: number;
}) {
  const circleX = useTransform(mouseX, [0, 1], [-20 * parallaxFactor, 20 * parallaxFactor]);
  const circleY = useTransform(mouseY, [0, 1], [-15 * parallaxFactor, 15 * parallaxFactor]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: [0.08, 0.15, 0.08],
        scale: [0.95, 1.05, 0.95],
        rotate: [0, 180, 360],
      }}
      transition={{
        opacity: { duration: duration, repeat: Infinity, ease: 'easeInOut', delay },
        scale: { duration: duration * 1.2, repeat: Infinity, ease: 'easeInOut', delay },
        rotate: { duration: duration * 4, repeat: Infinity, ease: 'linear', delay },
      }}
      style={{
        position: 'fixed',
        top,
        left,
        width: size,
        height: size,
        border: `1px solid ${theme === 'dark' ? 'rgba(0, 71, 255, 0.3)' : 'rgba(0, 71, 255, 0.25)'}`,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 1,
        x: circleX,
        y: circleY,
      }}
    />
  );
}

function CrossMark({ 
  top, 
  left, 
  size,
  theme,
  delay,
  mouseX,
  mouseY,
  parallaxFactor,
}: { 
  top: string; 
  left: string; 
  size: number;
  theme: string;
  delay: number;
  mouseX: ReturnType<typeof useSpring>;
  mouseY: ReturnType<typeof useSpring>;
  parallaxFactor: number;
}) {
  const crossX = useTransform(mouseX, [0, 1], [-10 * parallaxFactor, 10 * parallaxFactor]);
  const crossY = useTransform(mouseY, [0, 1], [-8 * parallaxFactor, 8 * parallaxFactor]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.05, 0.12, 0.05] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{
        position: 'fixed',
        top,
        left,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 1,
        x: crossX,
        y: crossY,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path 
          d="M10 4V16M4 10H16" 
          stroke={theme === 'dark' ? 'rgba(0, 71, 255, 0.5)' : 'rgba(0, 71, 255, 0.4)'} 
          strokeWidth="1" 
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

function PulsingDot({ 
  top, 
  left, 
  theme,
  mouseX,
  mouseY,
  parallaxFactor,
}: { 
  top: string; 
  left: string; 
  theme: string;
  mouseX: ReturnType<typeof useSpring>;
  mouseY: ReturnType<typeof useSpring>;
  parallaxFactor: number;
}) {
  const dotX = useTransform(mouseX, [0, 1], [-15 * parallaxFactor, 15 * parallaxFactor]);
  const dotY = useTransform(mouseY, [0, 1], [-12 * parallaxFactor, 12 * parallaxFactor]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        ease: 'easeInOut',
        delay: Math.random() * 2,
      }}
      style={{
        position: 'fixed',
        top,
        left,
        width: 6,
        height: 6,
        background: theme === 'dark' ? '#0047FF' : '#3C8AFF',
        borderRadius: '50%',
        boxShadow: `0 0 10px ${theme === 'dark' ? 'rgba(0, 71, 255, 0.5)' : 'rgba(60, 138, 255, 0.5)'}`,
        pointerEvents: 'none',
        zIndex: 1,
        x: dotX,
        y: dotY,
      }}
    />
  );
}

function CursorGlow({
  theme,
  mouseX,
  mouseY,
}: {
  theme: string;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const glowX = useTransform(mouseX, (v: number) => `${v * 100}%`);
  const glowY = useTransform(mouseY, (v: number) => `${v * 100}%`);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3,
        background: theme === 'dark'
          ? `radial-gradient(600px circle at ${glowX.get()} ${glowY.get()}, rgba(0, 71, 255, 0.06), transparent 40%)`
          : `radial-gradient(600px circle at ${glowX.get()} ${glowY.get()}, rgba(60, 138, 255, 0.08), transparent 40%)`,
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          top: glowY,
          left: glowX,
          width: 400,
          height: 400,
          marginLeft: -200,
          marginTop: -200,
          background: theme === 'dark'
            ? 'radial-gradient(circle, rgba(0, 71, 255, 0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(60, 138, 255, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
        }}
      />
    </motion.div>
  );
}

export default function DynamicScorePage() {
  const params = useParams();
  const { theme, toggleTheme } = useBrandStore();
  const [mounted, setMounted] = useState(false);

  // Extract username from URL params (handle @ prefix)
  const rawUsername = params.username as string;
  const cleanUsername = rawUsername?.replace(/^@/, '') || '';

  // Mouse position tracking
  const mouseXRaw = useMotionValue(0.5);
  const mouseYRaw = useMotionValue(0.5);
  const mouseX = useSpring(mouseXRaw, { stiffness: 50, damping: 20, mass: 0.5 });
  const mouseY = useSpring(mouseYRaw, { stiffness: 50, damping: 20, mass: 0.5 });

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseXRaw.set(e.clientX / window.innerWidth);
      mouseYRaw.set(e.clientY / window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseXRaw, mouseYRaw]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme === 'dark'
          ? 'linear-gradient(160deg, #0a0a0f 0%, #0d0d18 40%, #0f0f1a 70%, #141428 100%)'
          : 'linear-gradient(160deg, #f0e6d8 0%, #e8d8f0 35%, #d0e0f8 70%, #c8d8ff 100%)',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Base gradient overlay for depth */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: theme === 'dark'
            ? `
              radial-gradient(ellipse 100% 80% at 50% 120%, rgba(0, 47, 167, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse 80% 60% at 100% 0%, rgba(0, 71, 255, 0.08) 0%, transparent 50%)
            `
            : `
              radial-gradient(ellipse 100% 80% at 50% 120%, rgba(0, 71, 255, 0.1) 0%, transparent 60%),
              radial-gradient(ellipse 80% 60% at 100% 0%, rgba(60, 138, 255, 0.15) 0%, transparent 50%)
            `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Cursor glow effect */}
      {mounted && (
        <CursorGlow theme={theme} mouseX={mouseXRaw} mouseY={mouseYRaw} />
      )}

      {/* Klein Blue Orbs */}
      {mounted && (
        <>
          <KleinBlueOrb theme={theme} mouseX={mouseX} mouseY={mouseY} />
          <SecondaryOrb theme={theme} mouseX={mouseX} mouseY={mouseY} />
        </>
      )}

      {/* Floating Geometric Circles */}
      {mounted && (
        <>
          <FloatingCircle 
            size={400} top="10%" left="60%" delay={0} duration={8} 
            theme={theme} mouseX={mouseX} mouseY={mouseY} parallaxFactor={1.5} 
          />
          <FloatingCircle 
            size={250} top="50%" left="75%" delay={1} duration={10} 
            theme={theme} mouseX={mouseX} mouseY={mouseY} parallaxFactor={1} 
          />
          <FloatingCircle 
            size={180} top="70%" left="15%" delay={2} duration={12} 
            theme={theme} mouseX={mouseX} mouseY={mouseY} parallaxFactor={0.8} 
          />
        </>
      )}

      {/* Cross Marks */}
      {mounted && (
        <>
          <CrossMark top="20%" left="25%" size={20} theme={theme} delay={0} mouseX={mouseX} mouseY={mouseY} parallaxFactor={2} />
          <CrossMark top="35%" left="80%" size={16} theme={theme} delay={1.5} mouseX={mouseX} mouseY={mouseY} parallaxFactor={1.5} />
          <CrossMark top="65%" left="10%" size={18} theme={theme} delay={0.8} mouseX={mouseX} mouseY={mouseY} parallaxFactor={1.8} />
          <CrossMark top="80%" left="70%" size={14} theme={theme} delay={2.2} mouseX={mouseX} mouseY={mouseY} parallaxFactor={1.2} />
        </>
      )}

      {/* Pulsing Dots */}
      {mounted && (
        <>
          <PulsingDot top="15%" left="40%" theme={theme} mouseX={mouseX} mouseY={mouseY} parallaxFactor={2.5} />
          <PulsingDot top="45%" left="85%" theme={theme} mouseX={mouseX} mouseY={mouseY} parallaxFactor={1.8} />
          <PulsingDot top="75%" left="30%" theme={theme} mouseX={mouseX} mouseY={mouseY} parallaxFactor={2} />
        </>
      )}

      {/* Grainy texture overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: theme === 'dark' ? 0.2 : 0.15,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 150px',
          mixBlendMode: 'overlay',
          zIndex: 4,
        }}
      />

      {/* Subtle grid overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, ${theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px),
            linear-gradient(to bottom, ${theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />

      {/* Theme Toggle */}
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.05, boxShadow: theme === 'dark' ? '0 0 20px rgba(0, 71, 255, 0.3)' : '0 0 20px rgba(60, 138, 255, 0.3)' }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 100,
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          borderRadius: '14px',
          padding: '12px',
          cursor: 'pointer',
          transition: 'background 0.3s ease, border-color 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="1.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </motion.button>

      {/* Main Content - XBrandScoreHero with initialUsername */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <XBrandScoreHero 
          theme={theme} 
          initialUsername={cleanUsername}
          autoStart={true}
        />
      </div>
    </div>
  );
}

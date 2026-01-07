'use client';

import { useBrandStore } from '@/lib/store';
import XBrandScoreHero from '@/components/XBrandScoreHero';
import { useEffect, useRef, useState, useCallback } from 'react';
import { scroll, animate } from 'motion';


// =============================================================================
// Scroll-Linked Parallax Component - Premium depth effect
// =============================================================================
function ScrollParallax() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Parallax layers - different speeds create depth
    const heroTitle = document.querySelector('.hero-parallax-title');
    const heroSubtitle = document.querySelector('.hero-parallax-subtitle');
    const heroOrbs = document.querySelector('.hero-parallax-orbs');
    const heroForm = document.querySelector('.hero-parallax-form');

    const cleanups: (() => void)[] = [];

    // Title moves fastest (closest to viewer)
    if (heroTitle) {
      const cleanup = scroll(
        animate(heroTitle, {
          y: [0, -120],
          opacity: [1, 0],
          scale: [1, 0.95],
        }),
        {
          target: containerRef.current,
          offset: ['start start', 'end start'],
        }
      );
      if (cleanup) cleanups.push(cleanup);
    }

    // Subtitle follows title
    if (heroSubtitle) {
      const cleanup = scroll(
        animate(heroSubtitle, {
          y: [0, -80],
          opacity: [1, 0],
        }),
        {
          target: containerRef.current,
          offset: ['start start', '0.6 start'],
        }
      );
      if (cleanup) cleanups.push(cleanup);
    }

    // Form moves slower (further back)
    if (heroForm) {
      const cleanup = scroll(
        animate(heroForm, {
          y: [0, -40],
          opacity: [1, 0.3],
        }),
        {
          target: containerRef.current,
          offset: ['start start', '0.8 start'],
        }
      );
      if (cleanup) cleanups.push(cleanup);
    }

    // Background orbs move slowest and scale up (furthest back)
    if (heroOrbs) {
      const cleanup = scroll(
        animate(heroOrbs, {
          y: [0, 80],
          scale: [1, 1.2],
          opacity: [0.6, 0.2],
        }),
        {
          target: containerRef.current,
          offset: ['start start', 'end start'],
        }
      );
      if (cleanup) cleanups.push(cleanup);
    }

    return () => {
      cleanups.forEach(cleanup => cleanup?.());
    };
  }, []);

  return <div ref={containerRef} className="scroll-parallax-container" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}

// =============================================================================
// Landing Page / Lead Magnet - Grainy Aura Aesthetic
// Warm gradient with vignette and film grain texture
// =============================================================================

export default function LandingPage() {
  const { theme, toggleTheme } = useBrandStore();

  return (
    <div
      className="aura-background"
      style={{
        minHeight: '100vh',
        background: theme === 'dark'
          ? '#000000'
          : 'linear-gradient(180deg, #faf8f5 0%, #f5f0e8 50%, #efe8df 100%)',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Warm Orange Glow (Top Center) - Disabled for black background */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120vh',
          height: '100vh',
          background: 'radial-gradient(circle, rgba(215, 120, 60, 0.7) 0%, rgba(215, 120, 60, 0) 70%)',
          filter: 'blur(60px)',
          opacity: 0, // Disabled for pure black background
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* White/Beige Horizontal Streak (Middle) - Disabled for black background */}
      <div
        style={{
          position: 'fixed',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '150vw',
          height: '60vh',
          background: 'radial-gradient(ellipse at center, rgba(255, 235, 210, 0.18) 0%, rgba(255, 235, 210, 0) 60%)',
          filter: 'blur(80px)',
          zIndex: 2,
          pointerEvents: 'none',
          opacity: 0, // Disabled for pure black background
        }}
      />

      {/* Dark Vignette (Edges) - Disabled for black background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at 50% 45%, transparent 40%, rgba(10, 10, 10, 0.9) 100%)',
          zIndex: 3,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          opacity: 0, // Disabled - not needed on pure black
        }}
      />


      {/* Scroll-Linked Parallax */}
      <ScrollParallax />

      {/* Parallax Background Orbs - Move on scroll */}
      <div
        className="hero-parallax-orbs"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          willChange: 'transform',
          opacity: theme === 'dark' ? 1 : 0.7,
        }}
      >
        {/* Large ambient orb - top right */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '15%',
            width: '400px',
            height: '400px',
            background: theme === 'dark'
              ? 'radial-gradient(circle, rgba(0, 71, 255, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0, 71, 255, 0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
            borderRadius: '50%',
          }}
        />
        {/* Medium orb - bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '10%',
            width: '300px',
            height: '300px',
            background: theme === 'dark'
              ? 'radial-gradient(circle, rgba(212, 165, 116, 0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(212, 165, 116, 0.15) 0%, transparent 70%)',
            filter: 'blur(50px)',
            borderRadius: '50%',
          }}
        />
        {/* Small accent orb - center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            background: theme === 'dark'
              ? 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Film Grain Texture */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: theme === 'dark' ? 0.05 : 0.03,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px',
          zIndex: 10,
        }}
      />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 100,
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '12px',
          padding: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Main Content - X Brand Score Lead Magnet */}
      <XBrandScoreHero theme={theme} />
    </div>
  );
}

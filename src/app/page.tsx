'use client';

import { useBrandStore } from '@/lib/store';
import XBrandScoreHero from '@/components/XBrandScoreHero';

// =============================================================================
// Landing Page - Lead Magnet (X Brand Score)
// =============================================================================

export default function LandingPage() {
  const { theme, toggleTheme } = useBrandStore();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme === 'dark'
          ? 'linear-gradient(160deg, #141414 0%, #141414 50%, #1a1a2e 75%, #252545 100%)'
          : 'linear-gradient(160deg, #EAB27A 0%, #D0BBEB 45%, #3C8AFF 100%)',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Gradient color blobs */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: theme === 'dark'
            ? `
              radial-gradient(ellipse 70% 50% at 80% 15%, rgba(69, 92, 255, 0.2) 0%, transparent 55%),
              radial-gradient(ellipse 60% 60% at 15% 85%, rgba(69, 92, 255, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 50% 50%, rgba(69, 92, 255, 0.08) 0%, transparent 50%)
            `
            : `
              radial-gradient(ellipse 70% 50% at 80% 15%, rgba(60, 138, 255, 0.5) 0%, transparent 55%),
              radial-gradient(ellipse 60% 50% at 15% 75%, rgba(234, 178, 122, 0.5) 0%, transparent 50%),
              radial-gradient(ellipse 50% 50% at 50% 45%, rgba(208, 187, 235, 0.4) 0%, transparent 50%)
            `,
          pointerEvents: 'none',
        }}
      />

      {/* Grainy texture overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: theme === 'dark' ? 0.35 : 0.25,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 150px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, ${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)'} 1px, transparent 1px),
            linear-gradient(to bottom, ${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)'} 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          pointerEvents: 'none',
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
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Main Content - X Brand Score Lead Magnet */}
      <XBrandScoreHero theme={theme} redirectAfterSignup="/thanks" />
    </div>
  );
}

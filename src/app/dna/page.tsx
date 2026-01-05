'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useBrandStore } from '@/lib/store';

// Dynamically import Canvas and 3D components to avoid SSR issues
const Scene = dynamic(() => import('@/components/DNAScene'), { ssr: false });

const PHASE_INFO = [
  { name: 'DEFINE', color: '#00FFFF', description: 'Extracting your brand DNA' },
  { name: 'CHECK', color: '#00FF99', description: 'Validating brand consistency' },
  { name: 'GENERATE', color: '#8A2BE2', description: 'Creating brand assets' },
  { name: 'SCALE', color: '#FF4500', description: 'Amplifying your reach' },
];

export default function DNAPage() {
  const { theme, toggleTheme } = useBrandStore();
  const [activePhase, setActivePhase] = useState<number | null>(null);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: theme === 'dark'
          ? 'linear-gradient(180deg, #0a0a0f 0%, #0d0d18 50%, #141428 100%)'
          : 'linear-gradient(180deg, #faf8f5 0%, #f5f0e8 50%, #efe8df 100%)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.3s ease',
      }}
    >
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

      {/* Title */}
      <div
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          zIndex: 100,
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Brand DNA
        </h1>
        <p
          style={{
            fontSize: '12px',
            color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            margin: '4px 0 0 0',
            fontFamily: 'monospace',
          }}
        >
          HOVER TO EXPLORE PHASES
        </p>
      </div>

      {/* Phase Info Card */}
      {activePhase !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: '48px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            border: `2px solid ${PHASE_INFO[activePhase].color}`,
            borderRadius: '16px',
            padding: '20px 32px',
            textAlign: 'center',
            boxShadow: `0 0 40px ${PHASE_INFO[activePhase].color}40`,
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: PHASE_INFO[activePhase].color,
              letterSpacing: '2px',
              marginBottom: '8px',
              fontFamily: 'monospace',
            }}
          >
            PHASE {activePhase + 1}
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: theme === 'dark' ? 'white' : 'black',
              marginBottom: '8px',
            }}
          >
            {PHASE_INFO[activePhase].name}
          </div>
          <div
            style={{
              fontSize: '14px',
              color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            }}
          >
            {PHASE_INFO[activePhase].description}
          </div>
        </div>
      )}

      {/* Phase Legend */}
      <div
        style={{
          position: 'fixed',
          right: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {PHASE_INFO.map((phase, i) => (
          <div
            key={phase.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: activePhase === i ? 1 : 0.5,
              transition: 'opacity 0.3s ease',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: phase.color,
                boxShadow: activePhase === i ? `0 0 12px ${phase.color}` : 'none',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                fontFamily: 'monospace',
                letterSpacing: '1px',
              }}
            >
              {phase.name}
            </span>
          </div>
        ))}
      </div>

      {/* 3D Canvas */}
      <Scene onPhaseChange={setActivePhase} />
    </div>
  );
}

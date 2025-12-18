'use client';

import React, { useState, useEffect } from 'react';
import BrandOSLogo from './BrandOSLogo';

interface Phase {
  number: number;
  title: string;
  subtitle: string;
  features: string[];
  icon: React.ReactNode;
}

const phases: Phase[] = [
  {
    number: 1,
    title: 'DEFINE',
    subtitle: 'Brand DNA',
    features: ['Brand Identity', 'Safe Zones', 'Design Intents', 'Voice & Tone'],
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    number: 2,
    title: 'CHECK',
    subtitle: 'Content Analysis',
    features: ['Content Scoring', 'Brand Cohesion', 'Guardrails', 'Consistency'],
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    number: 3,
    title: 'GENERATE',
    subtitle: 'Create Content',
    features: ['Multi-format', 'Platform Adapt', 'Visual Concepts', 'Templates'],
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 5v14M5 12h14" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    number: 4,
    title: 'SCALE',
    subtitle: 'Track & Export',
    features: ['Dashboard', 'History', 'Export', 'Compare'],
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    ),
  },
];

interface PhasesBreakdownProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

export default function PhasesBreakdown({ onGetStarted, onSkip }: PhasesBreakdownProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handlePhaseClick = (phaseNumber: number) => {
    setExpandedPhase(expandedPhase === phaseNumber ? null : phaseNumber);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--background)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'auto',
      }}
    >
      {/* Noise texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '1000px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '48px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <BrandOSLogo size="lg" />
          <p
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              marginTop: '16px',
            }}
          >
            Your brand journey in four phases
          </p>
        </div>

        {/* Phase Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            width: '100%',
          }}
        >
          {phases.map((phase, index) => (
            <div
              key={phase.number}
              onClick={() => handlePhaseClick(phase.number)}
              style={{
                background: expandedPhase === phase.number ? 'var(--surface)' : 'transparent',
                border: `1px solid ${expandedPhase === phase.number ? '#0000FF' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s ease-out',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: `${index * 100}ms`,
              }}
              onMouseEnter={(e) => {
                if (expandedPhase !== phase.number) {
                  e.currentTarget.style.borderColor = '#0000FF';
                  e.currentTarget.style.background = 'var(--surface)';
                }
              }}
              onMouseLeave={(e) => {
                if (expandedPhase !== phase.number) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Phase number badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    color: '#0000FF',
                    background: 'rgba(0, 0, 255, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}
                >
                  PHASE {phase.number}
                </span>
                <div style={{ color: 'var(--muted)' }}>{phase.icon}</div>
              </div>

              {/* Phase title */}
              <h2
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '18px',
                  fontWeight: 400,
                  letterSpacing: '0.05em',
                  color: 'var(--foreground)',
                  marginBottom: '4px',
                }}
              >
                {phase.title}
              </h2>

              {/* Phase subtitle */}
              <p
                style={{
                  fontFamily: "'Helvetica Custom', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: '14px',
                  color: 'var(--muted)',
                  marginBottom: expandedPhase === phase.number ? '16px' : '0',
                }}
              >
                {phase.subtitle}
              </p>

              {/* Expanded features */}
              <div
                style={{
                  maxHeight: expandedPhase === phase.number ? '200px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out',
                  opacity: expandedPhase === phase.number ? 1 : 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  {phase.features.map((feature) => (
                    <span
                      key={feature}
                      style={{
                        fontFamily: "'Helvetica Custom', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                        fontSize: '12px',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instruction text */}
        <p
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.05em',
            color: 'var(--muted)',
            textAlign: 'center',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: '400ms',
          }}
        >
          Click any phase to explore details
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            transitionDelay: '500ms',
          }}
        >
          {/* Get Started button */}
          <button
            onClick={onGetStarted}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: '#FFFFFF',
              background: '#0000FF',
              border: 'none',
              padding: '16px 48px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            GET STARTED
          </button>

          {/* Skip link */}
          <button
            onClick={onSkip}
            style={{
              fontFamily: "'Helvetica Custom', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: '13px',
              color: 'var(--muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 16px',
              transition: 'color 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted)';
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

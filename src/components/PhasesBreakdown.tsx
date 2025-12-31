'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PhaseDetail {
  title: string;
  description: string;
}

interface Phase {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  details: PhaseDetail[];
  icon: React.ReactNode;
  gridArea: string;
}

const phases: Phase[] = [
  {
    number: 1,
    title: 'DEFINE',
    subtitle: 'Build Your System',
    description: 'Turn your intuition into rules AI can follow. Define what makes your brand yours—so it stays consistent whether you\'re creating or someone else is.',
    features: ['Brand Identity', 'Safe Zones', 'Design Intents', 'Voice & Tone'],
    details: [
      { title: 'Brand Identity', description: 'Define your name, colors, and core visual elements that make your brand recognizable.' },
      { title: 'Tone Spectrum', description: 'Set sliders for formality, energy, confidence, and style to capture your unique voice.' },
      { title: 'Safe Zones', description: 'Lock critical brand elements while allowing flexibility in others.' },
      { title: 'Voice Samples', description: 'Add examples of your brand writing to train the AI on your style.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    gridArea: 'define',
  },
  {
    number: 2,
    title: 'CHECK',
    subtitle: 'Score Against Your DNA',
    description: 'Run any content through your DNA. Get a score, see what\'s off, and know exactly what to fix—before it goes live.',
    features: ['Content Scoring', 'Brand Cohesion', 'Guardrails', 'Consistency'],
    details: [
      { title: 'Content Scoring', description: 'Get a 0-100 score showing how well your content aligns with your brand.' },
      { title: 'Real-time Analysis', description: 'See tone analysis as you type with instant feedback.' },
      { title: 'Guardrails', description: 'Review content from creators and agencies against your guidelines.' },
      { title: 'Suggestions', description: 'Receive AI-powered rewrites that match your brand voice.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    gridArea: 'check',
  },
  {
    number: 3,
    title: 'GENERATE',
    subtitle: 'Create From Your DNA',
    description: 'Generate content that sounds like you from the start. Your DNA shapes every output—so you create faster without losing your voice.',
    features: ['Multi-format', 'Platform Adapt', 'Visual Concepts', 'Templates'],
    details: [
      { title: 'Multi-format Output', description: 'Generate tweets, emails, headlines, taglines, and more.' },
      { title: 'Platform Adaptation', description: 'Automatically adjust content for different social platforms.' },
      { title: 'Visual Concepts', description: 'Get AI-powered design direction and mood boards.' },
      { title: 'Brand Kit', description: 'Manage logos, colors, typography, and templates in one place.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 5v14M5 12h14" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    gridArea: 'generate',
  },
  {
    number: 4,
    title: 'SCALE',
    subtitle: 'Let Your System Run',
    description: 'You\'ve built the system. Now let it work. Automate content, enforce your DNA across tools, and watch your brand scale—without you in the middle of every decision.',
    features: ['Dashboard', 'History', 'Export', 'Compare'],
    details: [
      { title: 'Analytics Dashboard', description: 'Track content checks, scores, and brand health over time.' },
      { title: 'History & Memory', description: 'Review past generations and learn what works for your brand.' },
      { title: 'Export Guidelines', description: 'Download your brand guidelines as JSON or shareable links.' },
      { title: 'Competitor Analysis', description: 'Compare your brand voice against competitors.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    ),
    gridArea: 'scale',
  },
];

interface PhasesBreakdownProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

export default function PhasesBreakdown({ onGetStarted, onSkip }: PhasesBreakdownProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Grid background animation (matching landing page)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 3; // Taller for scroll
    };
    resize();
    window.addEventListener('resize', resize);

    const gridSize = 60;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handlePhaseClick = (phaseNumber: number) => {
    setExpandedPhase(expandedPhase === phaseNumber ? null : phaseNumber);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000000',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Grid Canvas Background */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Noise texture overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Bento Frame Corners */}
      <div style={{ position: 'fixed', inset: '24px', pointerEvents: 'none', zIndex: 10 }}>
        {/* Top Left */}
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <div style={{ width: '8px', height: '8px', background: '#0000FF' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '48px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '48px', background: 'rgba(255,255,255,0.2)' }} />
        </div>
        {/* Top Right */}
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <div style={{ width: '8px', height: '8px', background: '#0000FF', marginLeft: 'auto' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '48px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '1px', height: '48px', background: 'rgba(255,255,255,0.2)' }} />
        </div>
        {/* Bottom Left */}
        <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
          <div style={{ width: '8px', height: '8px', background: '#0000FF' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '48px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '1px', height: '48px', background: 'rgba(255,255,255,0.2)' }} />
        </div>
        {/* Bottom Right */}
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <div style={{ width: '8px', height: '8px', background: '#0000FF', marginLeft: 'auto' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '48px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '1px', height: '48px', background: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 5 }}>
        {/* Hero Section */}
        <section
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
          }}
        >
          {/* Large BrandOS Logo */}
          <h1
            style={{
              fontSize: 'clamp(80px, 15vw, 200px)',
              lineHeight: 1,
              margin: 0,
              display: 'flex',
              alignItems: 'baseline',
              letterSpacing: '-0.05em',
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 700,
                fontStyle: 'italic',
                color: '#FFFFFF',
              }}
            >
              Brand
            </span>
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontWeight: 400,
                color: '#0000FF',
                position: 'relative',
                top: '0.05em',
              }}
            >
              OS
            </span>
          </h1>

          {/* Large Tagline */}
          <p
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: 'clamp(16px, 3vw, 28px)',
              letterSpacing: '0.15em',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '48px',
            }}
          >
            Your Brand Journey in Four Phases
          </p>

          {/* Scroll indicator */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              marginTop: '48px',
              animation: 'bounce 2s infinite',
            }}
          >
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.2em',
                color: 'rgba(255, 255, 255, 0.3)',
                textTransform: 'uppercase',
              }}
            >
              Scroll to explore
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </section>

        {/* Phases Bento Grid */}
        <section
          style={{
            padding: '48px',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridTemplateRows: 'auto',
              gap: '24px',
            }}
          >
            {phases.map((phase, index) => (
              <div
                key={phase.number}
                onClick={() => handlePhaseClick(phase.number)}
                style={{
                  background: expandedPhase === phase.number
                    ? 'rgba(0, 0, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${expandedPhase === phase.number ? '#0000FF' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '16px',
                  padding: '32px',
                  cursor: 'pointer',
                  transition: 'all 0.7s cubic-bezier(0.25, 0.1, 0.25, 1), background 0.5s ease, border-color 0.5s ease',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                  transitionDelay: `${index * 150 + 300}ms`,
                  gridColumn: expandedPhase === phase.number ? '1 / -1' : 'auto',
                }}
                onMouseEnter={(e) => {
                  if (expandedPhase !== phase.number) {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 255, 0.5)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (expandedPhase !== phase.number) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* Phase Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '24px',
                  }}
                >
                  <div>
                    {/* Phase badge */}
                    <span
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '11px',
                        letterSpacing: '0.15em',
                        color: '#0000FF',
                        background: 'rgba(0, 0, 255, 0.15)',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginBottom: '16px',
                      }}
                    >
                      PHASE {phase.number}
                    </span>

                    {/* Title */}
                    <h2
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: expandedPhase === phase.number ? '48px' : '32px',
                        fontWeight: 400,
                        letterSpacing: '0.05em',
                        color: '#FFFFFF',
                        margin: 0,
                        marginBottom: '8px',
                        transition: 'font-size 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
                      }}
                    >
                      {phase.title}
                    </h2>

                    {/* Subtitle */}
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        fontSize: '16px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        margin: 0,
                      }}
                    >
                      {phase.subtitle}
                    </p>
                  </div>

                  {/* Icon */}
                  <div
                    style={{
                      color: expandedPhase === phase.number ? '#0000FF' : 'rgba(255, 255, 255, 0.3)',
                      transition: 'color 0.5s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                      transform: expandedPhase === phase.number ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {phase.icon}
                  </div>
                </div>

                {/* Description (shown when expanded) */}
                <div
                  style={{
                    maxHeight: expandedPhase === phase.number ? '800px' : '0',
                    overflow: 'hidden',
                    transition: expandedPhase === phase.number
                      ? 'max-height 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s, padding 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)'
                      : 'max-height 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), padding 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    opacity: expandedPhase === phase.number ? 1 : 0,
                    paddingTop: expandedPhase === phase.number ? '16px' : '0',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontSize: '18px',
                      lineHeight: 1.6,
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '32px',
                      maxWidth: '600px',
                    }}
                  >
                    {phase.description}
                  </p>

                  {/* Detailed breakdown grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '16px',
                      paddingTop: '24px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {phase.details.map((detail, i) => (
                      <div
                        key={detail.title}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          padding: '20px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <h4
                          style={{
                            fontFamily: "'VCR OSD Mono', monospace",
                            fontSize: '12px',
                            letterSpacing: '0.1em',
                            color: '#0000FF',
                            margin: 0,
                            marginBottom: '8px',
                          }}
                        >
                          {detail.title}
                        </h4>
                        <p
                          style={{
                            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                            fontSize: '14px',
                            lineHeight: 1.5,
                            color: 'rgba(255, 255, 255, 0.6)',
                            margin: 0,
                          }}
                        >
                          {detail.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature tags (shown when collapsed) */}
                {expandedPhase !== phase.number && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginTop: '16px',
                    }}
                  >
                    {phase.features.map((feature) => (
                      <span
                        key={feature}
                        style={{
                          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expand/Collapse indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '24px',
                    color: 'rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      marginRight: '8px',
                    }}
                  >
                    {expandedPhase === phase.number ? 'COLLAPSE' : 'EXPAND'}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    style={{
                      transform: expandedPhase === phase.number ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section
          style={{
            padding: '96px 48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            transitionDelay: '800ms',
          }}
        >
          <p
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '14px',
              letterSpacing: '0.2em',
              color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Ready to build your brand system?
          </p>

          <button
            onClick={onGetStarted}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '14px',
              letterSpacing: '0.15em',
              color: '#FFFFFF',
              background: '#0000FF',
              border: 'none',
              padding: '20px 64px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            GET STARTED
          </button>

          <button
            onClick={onSkip}
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.4)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '12px 24px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
            }}
          >
            Skip for now
          </button>
        </section>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}

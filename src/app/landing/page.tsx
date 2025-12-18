'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);
  const gradientPhaseRef = useRef(0);
  const lastGradientTimeRef = useRef(0);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const colors = isDark ? {
    bg: '#000000',
    text: '#FFFFFF',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    textSubtle: 'rgba(255, 255, 255, 0.3)',
    gridLine: 'rgba(255, 255, 255, 0.08)',
    accent: '#0000FF',
    particleColor: 'rgba(0, 0, 255, 0.3)',
  } : {
    bg: '#FFFFFF',
    text: '#000000',
    textMuted: 'rgba(0, 0, 0, 0.6)',
    textSubtle: 'rgba(0, 0, 0, 0.3)',
    gridLine: 'rgba(0, 0, 0, 0.08)',
    accent: '#0000FF',
    particleColor: 'rgba(0, 0, 255, 0.2)',
  };

  // Interactive background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      // Add particles on mouse move
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
        });
      }

      // Limit particles
      if (particlesRef.current.length > 100) {
        particlesRef.current = particlesRef.current.slice(-100);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const pixelSize = 8;
    let startTime: number | null = null;

    const animate = (time: number) => {
      // Initialize start time on first frame to delay initial sweep
      if (startTime === null) {
        startTime = time;
        lastGradientTimeRef.current = time;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 60;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Pixelated gradient wave (every 5-6 seconds)
      const gradientInterval = 5500; // 5.5 seconds
      if (time - lastGradientTimeRef.current > gradientInterval) {
        lastGradientTimeRef.current = time;
        gradientPhaseRef.current = 0;
      }

      if (gradientPhaseRef.current < 1) {
        gradientPhaseRef.current += 0.008; // Speed of wave

        const waveX = gradientPhaseRef.current * (canvas.width + 400) - 200;
        const waveWidth = 300;

        for (let x = Math.max(0, waveX - waveWidth); x < Math.min(canvas.width, waveX + waveWidth); x += pixelSize) {
          for (let y = 0; y < canvas.height; y += pixelSize) {
            const dist = Math.abs(x - waveX);
            const intensity = Math.max(0, 1 - dist / waveWidth);
            const alpha = intensity * 0.12;

            if (alpha > 0.01) {
              // Create pixelated gradient colors - brand blue
              const hue = 240; // Pure blue matching brand color #0000FF
              ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
              ctx.fillRect(
                Math.floor(x / pixelSize) * pixelSize,
                Math.floor(y / pixelSize) * pixelSize,
                pixelSize,
                pixelSize
              );
            }
          }
        }
      }

      // Draw cursor-reactive particles
      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.015;

        if (particle.life > 0) {
          const size = Math.floor(particle.life * 12 / pixelSize) * pixelSize;
          if (size > 0) {
            ctx.fillStyle = isDark
              ? `rgba(0, 0, 255, ${particle.life * 0.4})`
              : `rgba(0, 0, 255, ${particle.life * 0.3})`;
            ctx.fillRect(
              Math.floor(particle.x / pixelSize) * pixelSize,
              Math.floor(particle.y / pixelSize) * pixelSize,
              size,
              size
            );
          }
        }
      });

      // Remove dead particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Draw cursor glow effect (pixelated)
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const glowRadius = 150;

      for (let x = mx - glowRadius; x < mx + glowRadius; x += pixelSize) {
        for (let y = my - glowRadius; y < my + glowRadius; y += pixelSize) {
          const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
          if (dist < glowRadius) {
            const alpha = (1 - dist / glowRadius) * 0.08;
            ctx.fillStyle = isDark
              ? `rgba(100, 100, 255, ${alpha})`
              : `rgba(0, 0, 200, ${alpha})`;
            ctx.fillRect(
              Math.floor(x / pixelSize) * pixelSize,
              Math.floor(y / pixelSize) * pixelSize,
              pixelSize,
              pixelSize
            );
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [isDark, mounted]);

  // Prevent hydration mismatch by rendering nothing until mounted
  if (!mounted) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: '#FFFFFF',
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: colors.bg,
        transition: 'background 0.3s ease',
      }}
    >
      {/* Interactive Canvas Background */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
        }}
      />

      {/* Noise Texture Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          opacity: 0.03,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <main
        className="content-entrance main-content"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        {/* Theme Toggle - Pixelated */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="theme-toggle"
          style={{
            position: 'absolute',
            top: '32px',
            right: '32px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: `1px solid ${colors.textSubtle}`,
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          {isDark ? (
            /* Pixelated Sun */
            <svg width="20" height="20" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
              <rect x="7" y="0" width="2" height="2" fill="#FFB800" />
              <rect x="7" y="14" width="2" height="2" fill="#FFB800" />
              <rect x="0" y="7" width="2" height="2" fill="#FFB800" />
              <rect x="14" y="7" width="2" height="2" fill="#FFB800" />
              <rect x="2" y="2" width="2" height="2" fill="#FFB800" />
              <rect x="12" y="2" width="2" height="2" fill="#FFB800" />
              <rect x="2" y="12" width="2" height="2" fill="#FFB800" />
              <rect x="12" y="12" width="2" height="2" fill="#FFB800" />
              <rect x="5" y="5" width="6" height="6" fill="#FFB800" />
            </svg>
          ) : (
            /* Moon emoji - dark charcoal for contrast */
            <span style={{
              fontSize: '18px',
              filter: 'grayscale(1) brightness(0.3)',
            }}>
              🌙
            </span>
          )}
        </button>

        {/* Bento Frame Corners */}
        <div className="bento-frame" style={{ position: 'absolute', inset: '32px', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: 0 }}>
            <div className="corner-pulse" style={{ width: '8px', height: '8px', background: colors.accent }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '48px', height: '1px', background: colors.textSubtle }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '48px', background: colors.textSubtle }} />
          </div>
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <div className="corner-pulse" style={{ width: '8px', height: '8px', background: colors.accent, marginLeft: 'auto', animationDelay: '0.5s' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '48px', height: '1px', background: colors.textSubtle }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '1px', height: '48px', background: colors.textSubtle }} />
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
            <div className="corner-pulse" style={{ width: '8px', height: '8px', background: colors.accent, marginTop: 'auto', animationDelay: '1s' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '48px', height: '1px', background: colors.textSubtle }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '1px', height: '48px', background: colors.textSubtle }} />
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <div className="corner-pulse" style={{ width: '8px', height: '8px', background: colors.accent, marginLeft: 'auto', marginTop: 'auto', animationDelay: '1.5s' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '48px', height: '1px', background: colors.textSubtle }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '1px', height: '48px', background: colors.textSubtle }} />
          </div>
        </div>

        {/* Center Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px', marginTop: '60px' }}>
          {/* Logo */}
          <h1 style={{ fontSize: 'clamp(72px, 14vw, 180px)', lineHeight: 1, margin: 0, display: 'flex', alignItems: 'baseline', letterSpacing: '-0.05em' }}>
            <span
              style={{
                fontFamily: "'Helvetica Custom', 'Helvetica Neue', Helvetica, sans-serif",
                fontWeight: 700,
                fontStyle: 'italic',
                color: colors.text,
                transition: 'color 0.3s ease',
              }}
            >
              Brand
            </span>
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontWeight: 400,
                position: 'relative',
                top: '0.05em',
                color: '#0000FF',
              }}
              className="os-shimmer"
            >
              OS
            </span>
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontFamily: "'Helvetica Custom', 'Helvetica Neue', Helvetica, sans-serif",
              fontSize: 'clamp(14px, 2vw, 20px)',
              fontWeight: 400,
              color: colors.textMuted,
              maxWidth: '600px',
              lineHeight: 1.6,
              margin: 0,
              transition: 'color 0.3s ease',
            }}
          >
            AI-powered brand system that{' '}
            <span style={{ color: colors.text, fontWeight: 500 }}>understands</span>,{' '}
            <span style={{ color: colors.text, fontWeight: 500 }}>enforces</span>, and{' '}
            <span style={{ color: colors.text, fontWeight: 500 }}>scales</span> brand identity.
          </p>
        </div>

        {/* CTA */}
        <div
          className="cta-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            marginTop: '32px',
          }}
        >
          <button
            onClick={() => router.push('/?showPhases=true')}
            className="cta-pulse"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 48px',
              background: '#0000FF',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0000CC';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0000FF';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '14px',
                color: '#FFFFFF',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Enter
            </span>
          </button>

          <p
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              color: colors.textSubtle,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: 0,
              marginTop: '24px',
              transition: 'color 0.3s ease',
            }}
          >
            Define. Check. Generate. Scale.
          </p>
        </div>

        {/* Side Labels */}
        <div
          className="side-label side-label-left"
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%) rotate(180deg)',
            writingMode: 'vertical-rl',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '9px',
            color: colors.textSubtle,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            transition: 'color 0.3s ease',
          }}
        >
          BRAND CONSISTENCY
        </div>
        <div
          className="side-label side-label-right"
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            writingMode: 'vertical-rl',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '9px',
            color: colors.textSubtle,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            transition: 'color 0.3s ease',
          }}
        >
          AI-POWERED
        </div>
      </main>

      {/* Animation Keyframes */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cornerPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }

        @keyframes ctaGlow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(0, 0, 255, 0.15);
          }
          50% {
            box-shadow: 0 0 25px rgba(0, 0, 255, 0.25);
          }
        }

        .os-shimmer {
          background: linear-gradient(90deg, #0000FF 0%, #4444FF 25%, #0000FF 50%, #4444FF 75%, #0000FF 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .content-entrance {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .corner-pulse {
          animation: cornerPulse 3s ease-in-out infinite;
        }

        .cta-pulse {
          animation: ctaGlow 2.5s ease-in-out infinite;
        }

        .cta-pulse:hover {
          animation: none;
          box-shadow: 0 8px 32px rgba(0, 0, 255, 0.4);
        }

        .theme-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 0 20px rgba(0, 0, 255, 0.2);
          border-color: rgba(0, 0, 255, 0.5);
        }

        /* Mobile Responsive Styles */
        @media (max-width: 480px) {
          .main-content {
            padding: 24px 40px !important;
          }

          .side-label {
            font-size: 8px !important;
            letter-spacing: 0.15em !important;
          }

          .side-label-left {
            left: 8px !important;
          }

          .side-label-right {
            right: 8px !important;
          }

          .theme-toggle {
            top: 16px !important;
            right: 16px !important;
            width: 36px !important;
            height: 36px !important;
          }

          .cta-container {
            margin-top: 24px !important;
          }

          .bento-frame {
            inset: 16px !important;
          }
        }

        /* Tablet Responsive Styles */
        @media (min-width: 481px) and (max-width: 768px) {
          .main-content {
            padding: 32px !important;
          }

          .side-label-left {
            left: 24px !important;
          }

          .side-label-right {
            right: 24px !important;
          }
        }

        /* Desktop styles - restore original positioning */
        @media (min-width: 769px) {
          .side-label-left {
            left: 48px !important;
          }

          .side-label-right {
            right: 48px !important;
          }

          .side-label {
            font-size: 10px !important;
            letter-spacing: 0.3em !important;
          }
        }
      `}</style>
    </div>
  );
}

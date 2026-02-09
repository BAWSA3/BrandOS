'use client';

import React from 'react';

interface BrandOSLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  /** 'landing' = pixel-font style matching the landing page. 'app' = clean app-shell style. */
  variant?: 'landing' | 'app';
}

const sizeConfig = {
  sm: '18px',
  md: '24px',
  lg: '48px',
  xl: '64px',
  hero: 'clamp(72px, 14vw, 180px)',
};

// "OS" in Mac Minecraft renders at a similar scale to Brand, slight adjustment
const osSizeRatio = 0.82;

export default function BrandOSLogo({
  size = 'md',
  className = '',
  variant = 'app',
}: BrandOSLogoProps) {
  const fontSize = sizeConfig[size];

  // Landing variant: text-based with individual letter spans for effects
  if (variant === 'landing') {
    const brandLetters = 'Brand'.split('');
    const osLetters = 'OS'.split('');

    return (
      <div
        className={`brandos-logo-text ${className}`}
        role="heading"
        aria-level={1}
        aria-label="BrandOS"
        style={{
          fontSize,
          lineHeight: 1,
          margin: 0,
          display: 'inline-flex',
          alignItems: 'baseline',
          userSelect: 'none',
        }}
      >
        {/* "Brand" — Blauer Nue 800 italic */}
        {brandLetters.map((letter, i) => (
          <span
            key={`brand-${i}`}
            className="brandos-letter brandos-brand-letter"
            data-letter={letter}
            data-index={i}
            style={{
              fontFamily: "'Blauer Nue', 'Inter', sans-serif",
              fontWeight: 800,
              fontStyle: 'italic',
              color: 'var(--foreground)',
              letterSpacing: '-0.04em',
              transition: 'color 0.3s ease, transform 0.2s ease',
              display: 'inline-block',
            }}
          >
            {letter}
          </span>
        ))}

        {/* "OS" — Mac Minecraft bold italic */}
        {osLetters.map((letter, i) => (
          <span
            key={`os-${i}`}
            className="brandos-letter brandos-os-letter"
            data-letter={letter}
            data-index={i}
            style={{
              fontFamily: "'Mac Minecraft', 'Press Start 2P', cursive",
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: `${osSizeRatio}em`,
              color: '#0047FF',
              letterSpacing: '-0.05em',
              ...(i === 0 ? { marginLeft: '0.08em' } : {}),
              display: 'inline-block',
              position: 'relative',
              top: '0.04em',
              transition: 'color 0.3s ease, transform 0.2s ease',
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    );
  }

  // App shell: clean, one font family
  return (
    <div
      className={className}
      role="heading"
      aria-level={1}
      aria-label="BrandOS"
      style={{ fontSize, lineHeight: 1, margin: 0, display: 'flex', alignItems: 'baseline', letterSpacing: '-0.03em' }}
    >
      <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>Brand</span>
      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>OS</span>
    </div>
  );
}

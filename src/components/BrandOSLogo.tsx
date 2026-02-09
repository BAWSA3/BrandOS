'use client';

import React from 'react';

interface BrandOSLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  /** Use the landing-page style (pixel font + shimmer for OS). Default: false (clean app-shell style). */
  variant?: 'landing' | 'app';
}

const sizeConfig = {
  sm: '18px',
  md: '24px',
  lg: '48px',
  xl: '64px',
  hero: 'clamp(72px, 14vw, 180px)',
};

export default function BrandOSLogo({
  size = 'md',
  className = '',
  variant = 'app',
}: BrandOSLogoProps) {
  const fontSize = sizeConfig[size];

  // Landing page keeps the original pixel-font + shimmer style
  if (variant === 'landing') {
    return (
      <h1
        className={className}
        style={{ fontSize, lineHeight: 1, margin: 0, display: 'flex', alignItems: 'baseline', letterSpacing: '-0.05em' }}
      >
        <span
          style={{
            fontFamily: "'Helvetica Custom', 'Helvetica Neue', Helvetica, sans-serif",
            fontWeight: 700,
            fontStyle: 'italic',
            color: 'var(--foreground)',
            transition: 'color 0.3s ease',
          }}
        >
          Brand
        </span>
        <span
          className="os-shimmer"
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontWeight: 400,
            position: 'relative',
            top: '0.05em',
          }}
        >
          OS
        </span>
      </h1>
    );
  }

  // App shell: clean, one font family, no shimmer
  return (
    <h1
      className={className}
      style={{ fontSize, lineHeight: 1, margin: 0, display: 'flex', alignItems: 'baseline', letterSpacing: '-0.03em' }}
    >
      <span style={{ fontWeight: 700, color: '#F5F5F7' }}>Brand</span>
      <span style={{ fontWeight: 700, color: '#0A84FF' }}>OS</span>
    </h1>
  );
}

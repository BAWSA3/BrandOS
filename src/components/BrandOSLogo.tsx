'use client';

import React from 'react';

interface BrandOSLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
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
  className = ''
}: BrandOSLogoProps) {
  const fontSize = sizeConfig[size];

  return (
    <h1
      className={className}
      style={{
        fontSize: fontSize,
        lineHeight: 1,
        margin: 0,
        display: 'flex',
        alignItems: 'baseline',
        letterSpacing: '-0.05em',
      }}
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

'use client';

import Image from 'next/image';

interface MetalArchetypeIconProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

/**
 * Renders an archetype SVG icon with a polished metal sheen effect.
 * Falls back to plain emoji text if src doesn't start with '/'.
 */
export default function MetalArchetypeIcon({ src, alt, size = 80, className }: MetalArchetypeIconProps) {
  if (!src.startsWith('/')) {
    return <span style={{ fontSize: size * 0.8 }}>{src}</span>;
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        flexShrink: 0,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        style={{
          objectFit: 'contain',
          filter: 'contrast(1.1) brightness(1.05) saturate(0.85)',
        }}
      />
      {/* Metal sheen overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.25) 55%, transparent 70%)',
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />
      {/* Chrome edge highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 12,
          boxShadow:
            'inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

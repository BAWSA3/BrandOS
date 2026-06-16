'use client';

import type { WorldSceneProps } from '../types';

export default function TerminalOsScene({ intensity = 1, className = '' }: WorldSceneProps) {
  const scanlineOpacity = 0.06 * intensity;
  const gridOpacity = 0.04 * intensity;

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 ${className}`}
      style={{
        backgroundColor: '#060A0F',
        backgroundImage: [
          `repeating-linear-gradient(0deg, rgba(0,255,136,${scanlineOpacity}) 0px, rgba(0,255,136,${scanlineOpacity}) 1px, transparent 1px, transparent 3px)`,
          `linear-gradient(rgba(0,255,136,${gridOpacity}) 1px, transparent 1px)`,
          `linear-gradient(90deg, rgba(0,255,136,${gridOpacity}) 1px, transparent 1px)`,
          `radial-gradient(ellipse at 50% 0%, rgba(0,255,136,${0.08 * intensity}) 0%, transparent 60%)`,
        ].join(', '),
        backgroundSize: '100% 3px, 48px 48px, 48px 48px, 100% 100%',
      }}
    />
  );
}

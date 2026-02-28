'use client';

import { motion } from 'motion/react';

interface ParallaxBackgroundProps {
  theme?: string;
}

export default function ParallaxBackground({ theme = 'dark' }: ParallaxBackgroundProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        imageRendering: 'pixelated',
      }}
    >
      {/* Deep pixel sky */}
      <div
        className="absolute inset-0"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(180deg, #050510 0%, #0A0A1A 30%, #0D1020 60%, #101428 100%)'
            : 'linear-gradient(180deg, #0A0A1A 0%, #101428 100%)',
        }}
      />

      {/* Subtle pixel star field */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 3 + (i % 4), delay: i * 0.3, repeat: Infinity }}
          style={{
            position: 'absolute',
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 23 + 7) % 100}%`,
            width: i % 5 === 0 ? 3 : 2,
            height: i % 5 === 0 ? 3 : 2,
            background: 'rgba(176, 216, 240, 0.3)',
          }}
        />
      ))}

      {/* Ground terrain -- parallax layer at bottom */}
      <svg
        viewBox="0 0 320 60"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full"
        style={{ height: '10%', opacity: 0.1 }}
      >
        <polygon
          points="0,60 0,40 20,30 50,35 80,25 110,32 140,20 170,30 200,22 230,35 260,28 290,32 320,25 320,60"
          fill="#2D7A1A"
        />
      </svg>

      {/* Pixel tree silhouettes on edges */}
      <svg
        viewBox="0 0 320 80"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full"
        style={{ height: '15%', opacity: 0.06 }}
      >
        {[20, 50, 90, 140, 180, 230, 270, 300].map((x, i) => (
          <g key={i} transform={`translate(${x}, 0)`}>
            <rect x="-6" y="30" width="4" height="10" fill="#1A4A3A" />
            <rect x="-10" y="20" width="12" height="12" fill="#1A4A3A" />
            <rect x="-8" y="12" width="8" height="10" fill="#1E5A44" />
            <rect x="-6" y="6" width="4" height="8" fill="#1A4A3A" />
          </g>
        ))}
      </svg>

      {/* Ambient color orbs (softened pixel-style) */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '15%',
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(90,191,62,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          left: '10%',
          width: 180,
          height: 180,
          background: 'radial-gradient(circle, rgba(232,138,74,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '25%',
          width: 150,
          height: 150,
          background: 'radial-gradient(circle, rgba(176,216,240,0.03) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.02) 3px, rgba(0,0,0,0.02) 4px)',
        }}
      />
    </div>
  );
}

'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

const STAR_COUNT = 40;

function generateStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 55,
    size: Math.random() > 0.7 ? 3 : 2,
    delay: Math.random() * 4,
    duration: 2 + Math.random() * 3,
  }));
}

export default function PixelHeroBackground() {
  const [stars] = useState(generateStars);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className="fixed inset-0 w-full h-screen z-0 overflow-hidden"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Dusk sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0B0E17 0%, #1A1338 30%, #2D1B4E 50%, #4A2545 70%, #7A3B3B 85%, #C4713B 95%, #E8A838 100%)',
        }}
      />

      {/* Pixel stars */}
      {mounted && stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.3, 0.9, 0] }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'steps(4)',
          }}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: '#F5DEB3',
            boxShadow: '0 0 2px #F5DEB3',
          }}
        />
      ))}

      {/* Distant mountain silhouettes */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '35%' }}>
        {/* Far mountains */}
        <svg
          viewBox="0 0 320 80"
          preserveAspectRatio="none"
          className="absolute bottom-[25%] w-full"
          style={{ height: '40%', opacity: 0.3, imageRendering: 'pixelated' }}
        >
          <polygon points="0,80 0,50 20,35 40,45 60,25 80,40 100,20 120,38 140,15 160,30 180,22 200,35 220,18 240,32 260,28 280,40 300,22 320,38 320,80" fill="#1A1338" />
        </svg>

        {/* Near mountains */}
        <svg
          viewBox="0 0 320 80"
          preserveAspectRatio="none"
          className="absolute bottom-[15%] w-full"
          style={{ height: '35%', opacity: 0.5, imageRendering: 'pixelated' }}
        >
          <polygon points="0,80 0,55 30,40 50,50 80,30 110,45 140,25 170,42 200,28 230,45 260,32 290,48 320,35 320,80" fill="#2D1B4E" />
        </svg>

        {/* Ground / bare earth */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: '18%',
            background: 'linear-gradient(180deg, #3D2B1F 0%, #2A1E15 100%)',
          }}
        />

        {/* Pixel grass blades on ground edge */}
        <svg
          viewBox="0 0 320 12"
          preserveAspectRatio="none"
          className="absolute bottom-[17%] w-full"
          style={{ height: '3%', imageRendering: 'pixelated' }}
        >
          {Array.from({ length: 40 }, (_, i) => (
            <rect key={i} x={i * 8} y={Math.random() > 0.5 ? 4 : 6} width="2" height={4 + Math.random() * 4} fill="#2D4A1A" opacity={0.6 + Math.random() * 0.4} />
          ))}
        </svg>

        {/* Seed in center */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.4, ease: 'steps(3)' }}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: '18%',
            width: 8,
            height: 8,
            background: '#8B6914',
            borderRadius: '0 0 50% 50%',
            boxShadow: '0 0 8px rgba(232, 168, 56, 0.4)',
          }}
        />

        {/* Tiny sprout from seed */}
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 2, duration: 0.6, ease: 'steps(4)' }}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: 'calc(18% + 6px)',
            width: 2,
            height: 10,
            background: '#4A7A2A',
            transformOrigin: 'bottom center',
          }}
        />
      </div>

      {/* Wind particles */}
      {mounted && Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`wind-${i}`}
          initial={{ x: '-5%', opacity: 0 }}
          animate={{ x: '105%', opacity: [0, 0.3, 0.3, 0] }}
          transition={{
            duration: 6 + Math.random() * 4,
            delay: i * 1.2,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            top: `${60 + Math.random() * 30}%`,
            width: 12 + Math.random() * 8,
            height: 1,
            background: 'rgba(245, 222, 179, 0.15)',
          }}
        />
      ))}

      {/* Subtle scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
        }}
      />
    </div>
  );
}

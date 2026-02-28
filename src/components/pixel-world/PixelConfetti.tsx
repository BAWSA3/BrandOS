'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface PixelConfettiProps {
  isActive: boolean;
}

export default function PixelConfetti({ isActive }: PixelConfettiProps) {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      color: string;
      delay: number;
      size: number;
    }>
  >([]);

  useEffect(() => {
    if (isActive) {
      const colors = ['#5ABF3E', '#FFE066', '#E88A4A', '#B0D8F0', '#10B981', '#FFD700', '#FF6B8A', '#E6E6FA'];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        size: 4 + Math.floor(Math.random() * 3) * 2,
      }));
      setParticles(newParticles);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', imageRendering: 'pixelated' }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: '50%',
            y: '40%',
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            scale: [0, 1.2, 0.8],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.5,
            delay: particle.delay,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            background: particle.color,
          }}
        />
      ))}
    </div>
  );
}

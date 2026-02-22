'use client';

import { motion } from 'motion/react';
import type { Season } from '../ascii-sky/ascii-sky-engine';

interface PathAvatarProps {
  season: Season;
  x: number;  // 0-1, position along the full path
  size?: number;
}

const AVATAR_FRAMES = ['🧑', '🚶', '🧑', '🚶'];

const SEASON_GLOW: Record<Season, string> = {
  spring: '#E8A838',
  summer: '#FFD700',
  autumn: '#FF6B35',
  winter: '#00D4FF',
};

export default function PathAvatar({ season, x, size = 16 }: PathAvatarProps) {
  const glowColor = SEASON_GLOW[season];

  return (
    <motion.div
      animate={{ x: `${x * 100}%` }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      style={{
        position: 'absolute',
        bottom: '22%',
        left: 0,
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
        filter: `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 12px ${glowColor}50)`,
      }}
    >
      {/* Pixel character using VCR font */}
      <motion.span
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: size * 0.8,
          color: glowColor,
          textShadow: `0 0 8px ${glowColor}`,
          lineHeight: 1,
        }}
      >
        ◆
      </motion.span>

      {/* Position glow ring */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: size * 1.5,
          height: size * 1.5,
          borderRadius: '50%',
          border: `1px solid ${glowColor}`,
          opacity: 0.3,
        }}
      />
    </motion.div>
  );
}

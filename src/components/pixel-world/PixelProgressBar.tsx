'use client';

import { motion } from 'motion/react';

const SEASON_LABELS = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
const SEASON_COLORS = [
  '#5ABF3E', // Spring green
  '#FFE066', // Summer gold
  '#E88A4A', // Autumn orange
  '#B0D8F0', // Winter ice
];

interface PixelProgressBarProps {
  currentPhase: number;
  phaseProgress: number;
  theme?: string;
}

export default function PixelProgressBar({
  currentPhase,
  phaseProgress,
}: PixelProgressBarProps) {
  const overallProgress = ((currentPhase - 1) + phaseProgress) / 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: '24px',
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* Pixel art progress container */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '10px 16px',
          background: 'rgba(10, 8, 20, 0.9)',
          border: '2px solid rgba(255,255,255,0.2)',
          imageRendering: 'pixelated',
          boxShadow: `
            inset 2px 2px 0 rgba(255,255,255,0.08),
            inset -2px -2px 0 rgba(0,0,0,0.3),
            0 4px 20px rgba(0,0,0,0.4)
          `,
        }}
      >
        {SEASON_LABELS.map((season, index) => {
          const phaseNum = index + 1;
          const isActive = currentPhase === phaseNum;
          const isCompleted = currentPhase > phaseNum;
          const color = SEASON_COLORS[index];

          return (
            <motion.div
              key={season}
              animate={{
                scale: isActive ? 1.05 : 1,
                opacity: isActive || isCompleted ? 1 : 0.4,
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                background: isActive
                  ? `${color}20`
                  : isCompleted
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'transparent',
                border: isActive
                  ? `1px solid ${color}60`
                  : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid transparent',
              }}
            >
              {/* Pixel season icon */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: isCompleted ? '#10B981' : isActive ? color : 'rgba(255,255,255,0.3)',
                  transition: 'background 0.3s',
                }}
              />
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  color: isActive ? color : isCompleted ? '#10B981' : 'rgba(255,255,255,0.5)',
                }}
              >
                {isCompleted ? '✓' : season}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* XP bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: 160,
            height: 8,
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ width: `${overallProgress * 100}%` }}
            transition={{ duration: 0.5 }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${SEASON_COLORS[Math.min(currentPhase - 1, 3)]}, ${SEASON_COLORS[Math.min(currentPhase - 1, 3)]}CC)`,
              imageRendering: 'pixelated',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
            fontSize: '9px',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {Math.round(overallProgress * 100)}%
        </span>
      </div>
    </motion.div>
  );
}

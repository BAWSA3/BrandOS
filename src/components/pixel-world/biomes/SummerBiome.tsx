'use client';

import { motion } from 'motion/react';

interface BiomeProps {
  progress: number;
  isActive: boolean;
}

function PixelTree({ x, height, delay }: { x: number; height: number; delay: number }) {
  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ delay, duration: 0.5, ease: 'steps(5)' }}
      style={{
        position: 'absolute',
        bottom: '28%',
        left: `${x}%`,
        transformOrigin: 'bottom center',
      }}
    >
      {/* Canopy layers (pixel triangle) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: height * 0.5, height: height * 0.15, background: '#2D7A1A', marginBottom: -1 }} />
        <div style={{ width: height * 0.7, height: height * 0.15, background: '#3A8F28', marginBottom: -1 }} />
        <div style={{ width: height * 0.9, height: height * 0.15, background: '#4AA235', marginBottom: -1 }} />
        <div style={{ width: height, height: height * 0.15, background: '#3A8F28' }} />
      </div>
      {/* Trunk */}
      <div style={{ width: height * 0.15, height: height * 0.35, background: '#6B4226', margin: '0 auto' }} />
    </motion.div>
  );
}

export default function SummerBiome({ progress, isActive }: BiomeProps) {
  const bloomStage = Math.min(progress / 4, 1);

  return (
    <div className="absolute inset-0" style={{ imageRendering: 'pixelated' }}>
      {/* Bright sky */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #4A90D9 0%, #6BB3E8 35%, #8FD4F0 60%, #C8E8F0 85%, #E8F5E0 100%)',
        }}
      />

      {/* Sun with rays */}
      <div style={{ position: 'absolute', right: '15%', top: '8%' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'relative', width: 36, height: 36 }}
        >
          {/* Sun rays */}
          {[0, 45, 90, 135].map((angle) => (
            <div
              key={angle}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 44,
                height: 2,
                background: 'rgba(255, 224, 102, 0.3)',
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              }}
            />
          ))}
        </motion.div>
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            width: 24,
            height: 24,
            background: '#FFE066',
            boxShadow: '0 0 30px rgba(255,224,102,0.6)',
          }}
        />
      </div>

      {/* Clouds */}
      {[
        { x: 10, y: 5, w: 40 },
        { x: 60, y: 12, w: 32 },
      ].map((cloud, i) => (
        <motion.div
          key={i}
          animate={{ x: [0, 15, 0] }}
          transition={{ duration: 25 + i * 8, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', left: `${cloud.x}%`, top: `${cloud.y}%` }}
        >
          <svg width={cloud.w} height="16" viewBox={`0 0 ${cloud.w} 16`}>
            <rect x="6" y="6" width={cloud.w - 12} height="6" fill="rgba(255,255,255,0.6)" />
            <rect x="10" y="2" width={cloud.w - 20} height="4" fill="rgba(255,255,255,0.4)" />
          </svg>
        </motion.div>
      ))}

      {/* Distant forest line */}
      <svg viewBox="0 0 320 40" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: '32%', height: '12%', opacity: 0.35 }}>
        <polygon points="0,40 0,20 8,10 16,18 24,8 32,16 40,5 48,15 56,8 64,18 72,6 80,14 88,10 96,20 104,8 112,16 120,4 128,14 136,10 144,18 152,6 160,16 168,8 176,14 184,10 192,20 200,8 208,16 216,5 224,15 232,10 240,18 248,6 256,14 264,10 272,20 280,8 288,16 296,12 304,18 312,8 320,14 320,40" fill="#2D7A1A" />
      </svg>

      {/* Ground with grass */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '30%',
          background: 'linear-gradient(180deg, #4AA235 0%, #3A8F28 30%, #2D7A1A 60%, #256B15 100%)',
        }}
      />

      {/* Grass blades */}
      <svg viewBox="0 0 320 16" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: '28%', height: '4%' }}>
        {Array.from({ length: 50 }, (_, i) => (
          <rect key={i} x={i * 6.4} y={0} width="2" height={6 + Math.random() * 8} fill={i % 3 === 0 ? '#5ABF3E' : '#4AA235'} />
        ))}
      </svg>

      {/* Trees growing in */}
      {[
        { x: 8, h: 50, d: 0 },
        { x: 22, h: 62, d: 0.2 },
        { x: 38, h: 44, d: 0.4 },
        { x: 58, h: 56, d: 0.6 },
        { x: 75, h: 48, d: 0.3 },
        { x: 90, h: 58, d: 0.5 },
      ].map((tree, i) => (
        <PixelTree key={i} x={tree.x} height={tree.h} delay={tree.d} />
      ))}

      {/* Flowers */}
      {bloomStage > 0.3 && Array.from({ length: 10 }, (_, i) => {
        const colors = ['#FF6B8A', '#FFD700', '#FF8C42', '#E6E6FA', '#FFB6C1'];
        return (
          <motion.div
            key={`flower-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 * i, duration: 0.2, ease: 'steps(2)' }}
            style={{
              position: 'absolute',
              bottom: `${29 + Math.random() * 6}%`,
              left: `${5 + i * 9.5}%`,
              width: 4,
              height: 4,
              background: colors[i % colors.length],
            }}
          />
        );
      })}

      {/* Sunlight streaks */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, transparent 30%, rgba(255,224,102,0.15) 50%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

'use client';

import { motion } from 'motion/react';

interface BiomeProps {
  progress: number;
  isActive: boolean;
}

export default function SpringBiome({ progress, isActive }: BiomeProps) {
  const growthStage = Math.min(progress / 4, 1);

  return (
    <div className="absolute inset-0" style={{ imageRendering: 'pixelated' }}>
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 40%, #E0F0E8 70%, #F0F8F0 100%)',
        }}
      />

      {/* Clouds */}
      {[
        { x: 15, y: 8, w: 48, delay: 0 },
        { x: 55, y: 15, w: 36, delay: 2 },
        { x: 80, y: 6, w: 42, delay: 4 },
      ].map((cloud, i) => (
        <motion.div
          key={i}
          animate={isActive ? { x: [0, 20, 0] } : {}}
          transition={{ duration: 20 + i * 5, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: `${cloud.x}%`,
            top: `${cloud.y}%`,
          }}
        >
          <svg width={cloud.w} height="20" viewBox={`0 0 ${cloud.w} 20`} style={{ imageRendering: 'pixelated' }}>
            <rect x="8" y="8" width={cloud.w - 16} height="8" fill="rgba(255,255,255,0.8)" />
            <rect x="4" y="12" width={cloud.w - 8} height="4" fill="rgba(255,255,255,0.7)" />
            <rect x="12" y="4" width={cloud.w - 24} height="4" fill="rgba(255,255,255,0.6)" />
          </svg>
        </motion.div>
      ))}

      {/* Sun */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          position: 'absolute',
          right: '12%',
          top: '10%',
          width: 24,
          height: 24,
          background: '#FFE066',
          boxShadow: '0 0 20px rgba(255,224,102,0.6), 0 0 40px rgba(255,224,102,0.3)',
        }}
      />

      {/* Far hills */}
      <svg viewBox="0 0 320 60" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: '28%', height: '15%', opacity: 0.4 }}>
        <polygon points="0,60 0,30 40,20 80,28 120,12 160,24 200,16 240,22 280,10 320,25 320,60" fill="#6B8E5A" />
      </svg>

      {/* Mid hills */}
      <svg viewBox="0 0 320 60" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: '22%', height: '18%', opacity: 0.6 }}>
        <polygon points="0,60 0,35 30,25 70,32 100,18 140,30 180,20 220,28 260,14 300,26 320,30 320,60" fill="#7DA96A" />
      </svg>

      {/* Ground */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '25%',
          background: 'linear-gradient(180deg, #5A8C3E 0%, #4A7A2A 40%, #3D6B22 100%)',
        }}
      />

      {/* Soil patches */}
      <svg viewBox="0 0 320 30" preserveAspectRatio="none" className="absolute w-full bottom-0" style={{ height: '8%' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={10 + i * 26} y={Math.random() * 10} width={8 + Math.random() * 12} height="4" fill="#5C4A2A" opacity={0.3 + Math.random() * 0.3} rx="0" />
        ))}
      </svg>

      {/* Growing sprouts */}
      {Array.from({ length: 8 }, (_, i) => {
        const sproutProgress = Math.max(0, growthStage - i * 0.1);
        const height = sproutProgress * 20;
        return (
          <motion.div
            key={`sprout-${i}`}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={isActive ? { scaleY: 1, opacity: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.4, ease: 'steps(4)' }}
            style={{
              position: 'absolute',
              bottom: '25%',
              left: `${12 + i * 10}%`,
              transformOrigin: 'bottom center',
            }}
          >
            {/* Stem */}
            <div style={{ width: 2, height: Math.max(4, height), background: '#4A7A2A', margin: '0 auto' }} />
            {/* Leaf */}
            {sproutProgress > 0.3 && (
              <div style={{ width: 6, height: 4, background: '#6BBF4A', marginTop: -2, marginLeft: i % 2 === 0 ? -4 : 2, borderRadius: '0 50% 50% 0' }} />
            )}
          </motion.div>
        );
      })}

      {/* Small flowers appearing */}
      {growthStage > 0.5 && [
        { x: 20, color: '#FFB6C1' },
        { x: 45, color: '#FFFACD' },
        { x: 72, color: '#E6E6FA' },
        { x: 88, color: '#FFB6C1' },
      ].map((flower, i) => (
        <motion.div
          key={`flower-${i}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.2, duration: 0.3, ease: 'steps(3)' }}
          style={{
            position: 'absolute',
            bottom: `${26 + Math.random() * 3}%`,
            left: `${flower.x}%`,
            width: 6,
            height: 6,
            background: flower.color,
          }}
        />
      ))}

      {/* Butterflies */}
      {isActive && growthStage > 0.6 && (
        <motion.div
          animate={{ x: [0, 30, -10, 20, 0], y: [0, -15, -5, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', bottom: '40%', left: '35%' }}
        >
          <div style={{ width: 4, height: 4, background: '#FFD700' }} />
        </motion.div>
      )}
    </div>
  );
}

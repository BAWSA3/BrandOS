'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface BiomeProps {
  progress: number;
  isActive: boolean;
}

function PixelAutumnTree({ x, variant, delay }: { x: number; variant: number; delay: number }) {
  const foliageColors = [
    ['#C76B3A', '#E88A4A', '#D4763E'],
    ['#B84C2F', '#D46B3E', '#CC5A34'],
    ['#E8A838', '#F0C060', '#DDA030'],
  ];
  const colors = foliageColors[variant % 3];

  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ delay, duration: 0.4, ease: 'steps(4)' }}
      style={{
        position: 'absolute',
        bottom: '26%',
        left: `${x}%`,
        transformOrigin: 'bottom center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 18, height: 8, background: colors[0], marginBottom: -1 }} />
        <div style={{ width: 26, height: 8, background: colors[1], marginBottom: -1 }} />
        <div style={{ width: 34, height: 8, background: colors[2], marginBottom: -1 }} />
        <div style={{ width: 28, height: 6, background: colors[0] }} />
      </div>
      <div style={{ width: 6, height: 16, background: '#5C3A1E', margin: '0 auto' }} />
    </motion.div>
  );
}

export default function AutumnBiome({ progress, isActive }: BiomeProps) {
  const harvestStage = Math.min(progress / 4, 1);
  const [leaves, setLeaves] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (!isActive) return;
    const colors = ['#C76B3A', '#E8A838', '#D46B3E', '#B84C2F', '#DDA030'];
    setLeaves(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
    );
  }, [isActive]);

  return (
    <div className="absolute inset-0" style={{ imageRendering: 'pixelated' }}>
      {/* Warm sky */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #5A7098 0%, #8A7A6A 30%, #C89858 55%, #E8B060 75%, #F0C878 100%)',
        }}
      />

      {/* Low sun */}
      <motion.div
        animate={isActive ? { y: [0, 2, 0] } : {}}
        transition={{ duration: 4, repeat: Infinity }}
        style={{
          position: 'absolute',
          left: '18%',
          top: '22%',
          width: 32,
          height: 32,
          background: '#F0A830',
          boxShadow: '0 0 40px rgba(240,168,48,0.5), 0 0 80px rgba(240,168,48,0.2)',
          opacity: 0.9,
        }}
      />

      {/* Distant tree line */}
      <svg viewBox="0 0 320 40" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: '30%', height: '12%', opacity: 0.4 }}>
        <polygon points="0,40 0,20 15,12 30,18 45,8 60,16 75,10 90,18 105,6 120,14 135,10 150,20 165,8 180,16 195,12 210,18 225,6 240,14 255,10 270,20 285,8 300,14 315,10 320,16 320,40" fill="#8A5A30" />
      </svg>

      {/* Ground */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '28%',
          background: 'linear-gradient(180deg, #8A6B3A 0%, #6B5228 30%, #5A4420 60%, #4A3818 100%)',
        }}
      />

      {/* Leaf litter on ground */}
      <svg viewBox="0 0 320 20" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: '25%', height: '5%' }}>
        {Array.from({ length: 30 }, (_, i) => {
          const colors = ['#C76B3A', '#E8A838', '#D46B3E', '#B84C2F'];
          return (
            <rect key={i} x={i * 10 + Math.random() * 6} y={Math.random() * 12} width={4} height={3} fill={colors[i % 4]} opacity={0.6} />
          );
        })}
      </svg>

      {/* Autumn trees */}
      {[
        { x: 5, v: 0, d: 0 },
        { x: 18, v: 1, d: 0.15 },
        { x: 32, v: 2, d: 0.3 },
        { x: 50, v: 0, d: 0.2 },
        { x: 65, v: 1, d: 0.35 },
        { x: 80, v: 2, d: 0.1 },
        { x: 92, v: 0, d: 0.25 },
      ].map((tree, i) => (
        <PixelAutumnTree key={i} x={tree.x} variant={tree.v} delay={tree.d} />
      ))}

      {/* Fruit on trees (harvest) */}
      {harvestStage > 0.4 && [
        { x: 20, y: 58 },
        { x: 34, y: 60 },
        { x: 52, y: 59 },
        { x: 67, y: 58 },
        { x: 82, y: 60 },
      ].map((fruit, i) => (
        <motion.div
          key={`fruit-${i}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.15, ease: 'steps(2)' }}
          style={{
            position: 'absolute',
            bottom: `${fruit.y}%`,
            left: `${fruit.x}%`,
            width: 5,
            height: 5,
            background: '#E84040',
            borderRadius: '50%',
          }}
        />
      ))}

      {/* Falling leaves */}
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          animate={{
            y: ['0vh', '80vh'],
            x: [0, Math.sin(leaf.id) * 40, Math.cos(leaf.id) * -30, Math.sin(leaf.id) * 20],
            rotate: [0, 360, 720],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            delay: leaf.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            top: '-5%',
            left: `${leaf.x}%`,
            width: 4,
            height: 4,
            background: leaf.color,
            opacity: 0.7,
          }}
        />
      ))}

      {/* Harvest glow */}
      {harvestStage > 0.7 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 80%, rgba(232,168,56,0.3) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

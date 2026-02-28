'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface BiomeProps {
  progress: number;
  isActive: boolean;
}

function PixelPineTree({ x, height, delay }: { x: number; height: number; delay: number }) {
  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ delay, duration: 0.4, ease: 'steps(4)' }}
      style={{
        position: 'absolute',
        bottom: '25%',
        left: `${x}%`,
        transformOrigin: 'bottom center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: height * 0.3, height: height * 0.12, background: '#1A4A3A', marginBottom: -1 }} />
        <div style={{ width: height * 0.5, height: height * 0.14, background: '#1E5A44', marginBottom: -1 }} />
        <div style={{ width: height * 0.7, height: height * 0.14, background: '#1A4A3A', marginBottom: -1 }} />
        <div style={{ width: height * 0.85, height: height * 0.14, background: '#1E5A44', marginBottom: -1 }} />
        <div style={{ width: height, height: height * 0.14, background: '#1A4A3A' }} />
      </div>
      {/* Snow caps */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: height * 0.25, height: 3, background: '#E8F0FF' }} />
      <div style={{ position: 'absolute', top: height * 0.12, left: '50%', transform: 'translateX(-50%)', width: height * 0.45, height: 2, background: 'rgba(232,240,255,0.7)' }} />
      {/* Trunk */}
      <div style={{ width: height * 0.12, height: height * 0.2, background: '#4A3220', margin: '0 auto' }} />
    </motion.div>
  );
}

export default function WinterBiome({ progress, isActive }: BiomeProps) {
  const frostStage = Math.min(progress / 4, 1);
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; x: number; delay: number; size: number }>>([]);

  useEffect(() => {
    if (!isActive) return;
    setSnowflakes(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 5,
        size: Math.random() > 0.7 ? 3 : 2,
      }))
    );
  }, [isActive]);

  return (
    <div className="absolute inset-0" style={{ imageRendering: 'pixelated' }}>
      {/* Night sky */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0B1428 0%, #152040 25%, #1E3058 45%, #2A4070 60%, #3A5088 75%, #7090B0 90%, #C0D8E8 100%)',
        }}
      />

      {/* Stars */}
      {Array.from({ length: 25 }, (_, i) => (
        <motion.div
          key={`star-${i}`}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 3, repeat: Infinity }}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 40}%`,
            width: Math.random() > 0.8 ? 3 : 2,
            height: Math.random() > 0.8 ? 3 : 2,
            background: '#E8F0FF',
          }}
        />
      ))}

      {/* Northern lights */}
      {frostStage > 0.3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute"
          style={{
            top: '5%',
            left: '10%',
            right: '10%',
            height: '35%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(100,200,150,0.12) 20%, rgba(120,100,220,0.1) 50%, rgba(80,180,200,0.08) 80%, transparent 100%)',
            filter: 'blur(12px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Aurora bands */}
      {frostStage > 0.6 && (
        <motion.div
          animate={{ x: [0, 20, -10, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute"
          style={{
            top: '8%',
            left: '20%',
            right: '20%',
            height: '25%',
            background: 'linear-gradient(90deg, transparent, rgba(130,220,180,0.1), rgba(100,150,240,0.08), rgba(180,100,220,0.06), transparent)',
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Distant mountains with snow */}
      <svg viewBox="0 0 320 80" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: '25%', height: '25%' }}>
        <polygon points="0,80 0,40 25,20 50,35 80,10 110,30 140,5 170,28 200,15 230,32 260,8 290,25 320,18 320,80" fill="#2A4070" />
        <polygon points="75,18 80,10 85,15" fill="#C0D8E8" opacity="0.6" />
        <polygon points="135,12 140,5 145,10" fill="#C0D8E8" opacity="0.6" />
        <polygon points="255,15 260,8 265,12" fill="#C0D8E8" opacity="0.6" />
      </svg>

      {/* Snow ground */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '28%',
          background: 'linear-gradient(180deg, #C0D8E8 0%, #A8C8D8 30%, #90B8CA 60%, #80A8C0 100%)',
        }}
      />

      {/* Snow drifts */}
      <svg viewBox="0 0 320 20" preserveAspectRatio="none" className="absolute w-full" style={{ bottom: '26%', height: '4%' }}>
        <path d="M0,20 Q40,5 80,15 Q120,0 160,12 Q200,2 240,14 Q280,4 320,10 L320,20 Z" fill="#D0E4F0" />
      </svg>

      {/* Pine trees */}
      {[
        { x: 5, h: 45, d: 0 },
        { x: 15, h: 55, d: 0.1 },
        { x: 28, h: 40, d: 0.2 },
        { x: 42, h: 58, d: 0.15 },
        { x: 55, h: 48, d: 0.25 },
        { x: 68, h: 52, d: 0.1 },
        { x: 82, h: 44, d: 0.2 },
        { x: 93, h: 50, d: 0.05 },
      ].map((tree, i) => (
        <PixelPineTree key={i} x={tree.x} height={tree.h} delay={tree.d} />
      ))}

      {/* Crystal / frost structure revealed */}
      {frostStage > 0.5 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'steps(4)' }}
          style={{
            position: 'absolute',
            bottom: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <svg width="32" height="40" viewBox="0 0 32 40" style={{ imageRendering: 'pixelated' }}>
            <polygon points="16,0 20,10 28,12 22,20 24,30 16,26 8,30 10,20 4,12 12,10" fill="#B0D8F0" opacity="0.8" />
            <polygon points="16,4 19,12 26,14 20,20 22,28 16,24 10,28 12,20 6,14 13,12" fill="#D0ECFF" opacity="0.6" />
          </svg>
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: -10,
              background: 'radial-gradient(circle, rgba(176,216,240,0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        </motion.div>
      )}

      {/* Snowfall */}
      {snowflakes.map((flake) => (
        <motion.div
          key={flake.id}
          animate={{
            y: ['0vh', '100vh'],
            x: [0, Math.sin(flake.id) * 15, Math.cos(flake.id) * -10],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            delay: flake.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            top: '-3%',
            left: `${flake.x}%`,
            width: flake.size,
            height: flake.size,
            background: '#E8F0FF',
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

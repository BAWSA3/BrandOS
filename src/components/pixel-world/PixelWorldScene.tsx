'use client';

import { motion, AnimatePresence } from 'motion/react';
import SpringBiome from './biomes/SpringBiome';
import SummerBiome from './biomes/SummerBiome';
import AutumnBiome from './biomes/AutumnBiome';
import WinterBiome from './biomes/WinterBiome';

type FlowState = 'input' | 'journey' | 'walkthrough' | 'reveal' | 'signup' | 'insufficient_data';

interface PixelWorldSceneProps {
  flowState: FlowState;
  currentPhase: number;
  itemProgress: number;
  theme?: string;
  onPhaseChange?: (phase: number | null) => void;
}

const BIOME_COMPONENTS = [SpringBiome, SummerBiome, AutumnBiome, WinterBiome];

export default function PixelWorldScene({
  flowState,
  currentPhase,
  itemProgress,
}: PixelWorldSceneProps) {
  const biomeIndex = Math.min(currentPhase - 1, 3);
  const BiomeComponent = BIOME_COMPONENTS[biomeIndex] || SpringBiome;
  const isActive = flowState === 'journey';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        imageRendering: 'pixelated',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={biomeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        >
          <BiomeComponent progress={itemProgress} isActive={isActive} />
        </motion.div>
      </AnimatePresence>

      {/* Scanline CRT overlay for retro feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          zIndex: 10,
        }}
      />
    </div>
  );
}

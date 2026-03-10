'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// Post-processing removed for performance
import GlassDNA from './GlassDNA';
import AutoOrbitCamera from './AutoOrbitCamera';

type FlowState = 'input' | 'journey' | 'reveal' | 'signup';

interface DNASceneProps {
  onPhaseChange?: (phase: number | null) => void;
  flowState?: FlowState;
}

export default function DNAScene({ onPhaseChange, flowState = 'input' }: DNASceneProps) {
  // Interactive mode during journey/reveal, auto-orbit on landing
  const isInteractive = flowState === 'journey' || flowState === 'reveal' || flowState === 'signup';
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0, 40], fov: 45 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          alpha: true,
        }}
        style={{ background: 'transparent' }}
      >
        {/* Background handled by GradientSphere inside GlassDNA */}
        <GlassDNA onPhaseChange={onPhaseChange} />

        {/* Auto-orbit on landing, manual controls during journey */}
        {isInteractive ? (
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            minDistance={20}
            maxDistance={80}
          />
        ) : (
          <AutoOrbitCamera radius={40} speed={0.15} height={5} />
        )}

        {/* Post-processing removed for performance */}
      </Canvas>
    </div>
  );
}

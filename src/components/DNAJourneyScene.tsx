'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { OrbitControls } from '@react-three/drei';
import GlassDNA from './GlassDNA';
import AutoOrbitCamera from './AutoOrbitCamera';
import { FlowState } from '@/lib/useDNAJourneySync';

interface DNAJourneySceneProps {
  flowState: FlowState;
  currentPhase: number;
  itemProgress: number;
  theme?: string;
  onPhaseChange?: (phase: number | null) => void;
}

export default function DNAJourneyScene({
  flowState,
  currentPhase,
  itemProgress,
  theme = 'dark',
  onPhaseChange,
}: DNAJourneySceneProps) {
  // Determine camera mode: auto-orbit on landing, interactive during journey
  const isInteractive = flowState === 'journey' || flowState === 'reveal' || flowState === 'signup';

  // Increase bloom during journey for dramatic effect
  const bloomIntensity = flowState === 'journey' ? 0.25 : 0.15;

  // Rotation speed: slower during journey for focus
  const rotationMultiplier = flowState === 'journey' ? 0.2 : flowState === 'reveal' ? 0.5 : 1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        // Warm amber glow effect
        filter: 'drop-shadow(0 0 20px rgba(232, 168, 56, 0.4))',
      }}
    >
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
        shadows
      >
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

        {/* DNA with external phase control */}
        <GlassDNA
          onPhaseChange={onPhaseChange}
          rotationMultiplier={rotationMultiplier}
          highlightIntensity={flowState === 'journey' ? 1.2 : 1}
        />

        {/* Post-processing effects */}
        <EffectComposer>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.3}
            radius={0.5}
            mipmapBlur
          />

          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0003, 0.0003]}
          />

          <Vignette
            offset={0.3}
            darkness={0.4}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

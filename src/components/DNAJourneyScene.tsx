'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import GlassDNA from './GlassDNA';
import AnimatedCamera from './AnimatedCamera';
import { useDNAJourneySync, FlowState } from '@/lib/useDNAJourneySync';

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
  const { cameraTarget, highlightPhase, rotationMultiplier } = useDNAJourneySync(
    flowState,
    currentPhase,
    itemProgress
  );

  // Increase bloom during journey for dramatic effect
  const bloomIntensity = flowState === 'journey' ? 0.25 : 0.15;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        // Bioluminescent glow effect (Design #2)
        filter: 'drop-shadow(0 0 20px rgba(0, 200, 255, 0.4))',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 40], fov: 45 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        shadows
      >
        {/* Animated camera that moves between phases */}
        <AnimatedCamera target={cameraTarget} transitionDuration={1.0} />

        {/* DNA with external phase control */}
        <GlassDNA
          onPhaseChange={onPhaseChange}
          activePhase={highlightPhase}
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

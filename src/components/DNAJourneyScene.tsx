'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { OrbitControls } from '@react-three/drei';
import GlassDNA from './GlassDNA';
import AutoOrbitCamera from './AutoOrbitCamera';
import JourneyCameraController from './JourneyCameraController';
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
  // Increase bloom during journey for dramatic effect
  const bloomIntensity = flowState === 'journey' ? 0.25 : 0.15;

  // Rotation speed: slower during journey for focus
  const rotationMultiplier = flowState === 'journey' ? 0.2 : flowState === 'reveal' ? 0.5 : 1;

  // Capture wheel events and prevent them from affecting the 3D scene.
  // Must use a native listener with { passive: false } since browsers
  // register wheel events as passive by default, blocking preventDefault().
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();
      window.scrollBy(0, e.deltaY);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        // Higher z-index during journey to capture pointer events
        zIndex: flowState === 'journey' ? 5 : 0,
        // White bloom glow effect
        filter: 'drop-shadow(0 0 25px rgba(255, 255, 255, 0.5))',
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
        {/* Camera control based on flow state */}
        {flowState === 'input' ? (
          // Landing page: auto-orbit camera
          <AutoOrbitCamera radius={45} speed={0.03} topDown={true} />
        ) : flowState === 'journey' || flowState === 'reveal' ? (
          // Journey/Reveal: animated camera following phases
          <JourneyCameraController
            currentPhase={currentPhase}
            flowState={flowState}
            lerpSpeed={0.03}
          />
        ) : (
          // Signup: manual controls
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            minDistance={20}
            maxDistance={80}
          />
        )}

        {/* DNA with external phase control */}
        <GlassDNA
          onPhaseChange={onPhaseChange}
          rotationMultiplier={rotationMultiplier}
          highlightIntensity={flowState === 'journey' ? 1.2 : 1}
          interactive={flowState === 'signup' || flowState === 'journey'}
          activePhase={flowState === 'journey' ? currentPhase - 1 : undefined}
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

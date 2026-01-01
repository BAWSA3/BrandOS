'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import GlassDNA from './GlassDNA';

interface DNASceneProps {
  onPhaseChange?: (phase: number | null) => void;
}

export default function DNAScene({ onPhaseChange }: DNASceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}>
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
        {/* Background handled by GradientSphere inside GlassDNA */}
        <GlassDNA onPhaseChange={onPhaseChange} />
        {/* User can rotate camera around DNA */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          minDistance={20}
          maxDistance={80}
        />

        {/* Post-processing - subtle effects only */}
        <EffectComposer>
          <Bloom
            intensity={0.15}
            luminanceThreshold={0.9}
            luminanceSmoothing={0.3}
            radius={0.4}
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

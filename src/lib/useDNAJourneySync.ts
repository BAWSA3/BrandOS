'use client';

import { useEffect, useState } from 'react';

export type CameraTarget = 'landing' | 'DEFINE' | 'CHECK' | 'GENERATE' | 'SCALE' | 'reveal';
export type FlowState = 'input' | 'journey' | 'reveal' | 'signup' | 'insufficient_data';

export const PHASE_CAMERA_TARGETS: Record<CameraTarget, { position: [number, number, number]; target: [number, number, number] }> = {
  landing: { position: [0, 0, 40], target: [0, 0, 0] },
  DEFINE: { position: [-8, 7.5, 25], target: [0, 7.5, 0] },
  CHECK: { position: [-8, 2.5, 25], target: [0, 2.5, 0] },
  GENERATE: { position: [-8, -2.5, 25], target: [0, -2.5, 0] },
  SCALE: { position: [-8, -7.5, 25], target: [0, -7.5, 0] },
  reveal: { position: [0, 0, 40], target: [0, 0, 0] },
};

const PHASE_NAMES: CameraTarget[] = ['DEFINE', 'CHECK', 'GENERATE', 'SCALE'];

interface DNAJourneySyncResult {
  cameraTarget: CameraTarget;
  highlightPhase: number | null;
  rotationMultiplier: number;
}

export function useDNAJourneySync(
  flowState: FlowState,
  currentPhase: number,
  itemProgress: number
): DNAJourneySyncResult {
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>('landing');
  const [highlightPhase, setHighlightPhase] = useState<number | null>(null);
  const [rotationMultiplier, setRotationMultiplier] = useState(1);

  useEffect(() => {
    if (flowState === 'input') {
      setCameraTarget('landing');
      setHighlightPhase(null);
      setRotationMultiplier(1);
    } else if (flowState === 'journey') {
      // Map phase number (1-4) to camera target
      const phaseIndex = Math.max(0, Math.min(3, currentPhase - 1));
      setCameraTarget(PHASE_NAMES[phaseIndex]);
      setHighlightPhase(phaseIndex);
      setRotationMultiplier(0.2); // Slow rotation during journey
    } else if (flowState === 'reveal' || flowState === 'signup') {
      setCameraTarget('reveal');
      setHighlightPhase(null); // All phases subtle glow
      setRotationMultiplier(0.5);
    }
  }, [flowState, currentPhase, itemProgress]);

  return { cameraTarget, highlightPhase, rotationMultiplier };
}

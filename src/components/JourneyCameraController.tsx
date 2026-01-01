'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FlowState } from '@/lib/useDNAJourneySync';

interface CameraTarget {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

// Camera positions for each phase (front-facing view, camera on right looking left at DNA)
const PHASE_CAMERA_POSITIONS: Record<string, CameraTarget> = {
  // Phase 1: DEFINE - Top section of DNA
  '1': {
    position: new THREE.Vector3(25, 7, 0),
    lookAt: new THREE.Vector3(0, 7, 0),
  },
  // Phase 2: CHECK - Upper-middle section
  '2': {
    position: new THREE.Vector3(25, 2.5, 0),
    lookAt: new THREE.Vector3(0, 2.5, 0),
  },
  // Phase 3: GENERATE - Lower-middle section
  '3': {
    position: new THREE.Vector3(25, -2.5, 0),
    lookAt: new THREE.Vector3(0, -2.5, 0),
  },
  // Phase 4: SCALE - Bottom section
  '4': {
    position: new THREE.Vector3(25, -7, 0),
    lookAt: new THREE.Vector3(0, -7, 0),
  },
  // Reveal - Full DNA view (zoomed out)
  'reveal': {
    position: new THREE.Vector3(0, 0, 45),
    lookAt: new THREE.Vector3(0, 0, 0),
  },
};

interface JourneyCameraControllerProps {
  currentPhase: number;
  flowState: FlowState;
  lerpSpeed?: number; // Speed of camera transition (0-1, lower = smoother)
}

export default function JourneyCameraController({
  currentPhase,
  flowState,
  lerpSpeed = 0.03,
}: JourneyCameraControllerProps) {
  const { camera } = useThree();
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  // Get target based on flow state and phase
  const target = useMemo(() => {
    if (flowState === 'reveal' || flowState === 'signup') {
      return PHASE_CAMERA_POSITIONS['reveal'];
    }
    if (flowState === 'journey' && currentPhase >= 1 && currentPhase <= 4) {
      return PHASE_CAMERA_POSITIONS[String(currentPhase)];
    }
    // Default to phase 1 position
    return PHASE_CAMERA_POSITIONS['1'];
  }, [flowState, currentPhase]);

  useFrame(() => {
    // Smoothly interpolate camera position
    camera.position.lerp(target.position, lerpSpeed);

    // Smoothly interpolate lookAt point
    lookAtRef.current.lerp(target.lookAt, lerpSpeed);
    camera.lookAt(lookAtRef.current);
  });

  return null;
}

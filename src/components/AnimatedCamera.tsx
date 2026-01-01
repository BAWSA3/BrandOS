'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraTarget, PHASE_CAMERA_TARGETS } from '@/lib/useDNAJourneySync';

interface AnimatedCameraProps {
  target: CameraTarget;
  transitionDuration?: number;
}

export default function AnimatedCamera({ target, transitionDuration = 1.2 }: AnimatedCameraProps) {
  const { camera } = useThree();

  const currentPos = useRef(new THREE.Vector3(0, 0, 40));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetPos = useRef(new THREE.Vector3(0, 0, 40));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Update targets when prop changes
  useEffect(() => {
    const config = PHASE_CAMERA_TARGETS[target];
    targetPos.current.set(...config.position);
    targetLookAt.current.set(...config.target);
  }, [target]);

  useFrame((state, delta) => {
    // Calculate lerp factor based on desired duration
    // Using exponential decay for smooth easing
    const lerpFactor = 1 - Math.pow(0.01, delta / transitionDuration);

    // Smooth position interpolation
    currentPos.current.lerp(targetPos.current, lerpFactor);
    camera.position.copy(currentPos.current);

    // Smooth lookAt interpolation
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

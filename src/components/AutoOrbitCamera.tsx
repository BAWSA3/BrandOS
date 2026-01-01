'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

interface AutoOrbitCameraProps {
  radius?: number;        // Distance from center (default: 40)
  speed?: number;         // Rotation speed (default: 0.15)
  height?: number;        // Camera Y position (default: 5)
  topDown?: boolean;      // Start from top-down view (default: false)
  tiltAngle?: number;     // Angle from horizontal in radians (default: 0.3)
}

export default function AutoOrbitCamera({
  radius = 40,
  speed = 0.15,
  height = 5,
  topDown = false,
  tiltAngle = 0.3
}: AutoOrbitCameraProps) {
  const { camera } = useThree();
  const angleRef = useRef(0);

  useFrame((_, delta) => {
    angleRef.current += delta * speed;

    if (topDown) {
      // Diagonal orbital view - camera looks down at an angle while orbiting
      const elevationAngle = Math.PI / 4; // 45 degrees from horizontal (more diagonal)
      const orbitRadius = radius * Math.cos(elevationAngle);
      const cameraHeight = radius * Math.sin(elevationAngle);

      camera.position.x = Math.sin(angleRef.current) * orbitRadius;
      camera.position.z = Math.cos(angleRef.current) * orbitRadius;
      camera.position.y = cameraHeight;
    } else {
      // Standard horizontal orbit
      camera.position.x = Math.sin(angleRef.current) * radius;
      camera.position.z = Math.cos(angleRef.current) * radius;
      camera.position.y = height;
    }

    // Always look at center
    camera.lookAt(0, 0, 0);
  });

  return null;
}

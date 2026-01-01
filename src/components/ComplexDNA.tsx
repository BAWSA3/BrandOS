import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// CONFIGURATION
const DNA_HEIGHT = 40;
const RUNG_COUNT = 60;
const RADIUS = 2.2;
const TWISTS = 6;

// Phase colors with gradients
const PHASE_COLORS = {
  0: { base: '#00D4FF', glow: '#00FFFF' }, // Define - Cyan
  1: { base: '#00FF88', glow: '#00FF99' }, // Check - Green
  2: { base: '#9D4EDD', glow: '#B266FF' }, // Generate - Purple
  3: { base: '#FF6B35', glow: '#FF8855' }, // Scale - Orange
};

interface Rung {
  pos: THREE.Vector3;
  rotation: number;
  phase: number;
  id: number;
  t: number;
}

interface ComplexDNAProps {
  onPhaseChange?: (phase: number | null) => void;
}

// Floating particles with varied sizes
function Particles({ count = 150 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const distance = 5 + Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;
      temp.push({
        position: [
          Math.cos(angle) * distance,
          (Math.random() - 0.5) * 50,
          Math.sin(angle) * distance,
        ],
        speed: 0.005 + Math.random() * 0.015,
        offset: Math.random() * Math.PI * 2,
        size: 0.02 + Math.random() * 0.04,
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;

    particles.forEach((particle, i) => {
      const matrix = new THREE.Matrix4();
      const pos = new THREE.Vector3(
        particle.position[0] + Math.sin(time * particle.speed + particle.offset) * 3,
        particle.position[1] + Math.cos(time * particle.speed * 0.3) * 2,
        particle.position[2] + Math.cos(time * particle.speed + particle.offset) * 3
      );
      matrix.setPosition(pos);
      matrix.scale(new THREE.Vector3(particle.size, particle.size, particle.size));
      mesh.current!.setMatrixAt(i, matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#8888ff" transparent opacity={0.3} />
    </instancedMesh>
  );
}

// Small orbiting spheres along the helix
function HelixOrbs({ curve, count = 20, color = '#ffffff' }: { curve: THREE.CatmullRomCurve3; count?: number; color?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      const t = ((i / count) + time * 0.02) % 1;
      const point = curve.getPoint(t);
      const offset = Math.sin(time * 2 + i) * 0.3;
      child.position.set(
        point.x + offset,
        point.y,
        point.z + offset
      );
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

// Wireframe overlay for texture
function WireframeOverlay({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  return (
    <mesh>
      <tubeGeometry args={[curve, 120, 0.42, 8, false]} />
      <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.03} />
    </mesh>
  );
}

export default function ComplexDNA({ onPhaseChange }: ComplexDNAProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null);
  const timeRef = useRef(0);

  // Generate helix geometry data
  const { pointsA, pointsB, rungs } = useMemo(() => {
    const pA: THREE.Vector3[] = [];
    const pB: THREE.Vector3[] = [];
    const r: Rung[] = [];

    for (let i = 0; i <= RUNG_COUNT; i++) {
      const t = i / RUNG_COUNT;
      const angle = t * Math.PI * 2 * TWISTS;
      const y = (t - 0.5) * DNA_HEIGHT;

      // Add slight wave to radius for organic feel
      const waveRadius = RADIUS + Math.sin(t * Math.PI * 4) * 0.15;

      const x1 = Math.cos(angle) * waveRadius;
      const z1 = Math.sin(angle) * waveRadius;
      const x2 = Math.cos(angle + Math.PI) * waveRadius;
      const z2 = Math.sin(angle + Math.PI) * waveRadius;

      pA.push(new THREE.Vector3(x1, y, z1));
      pB.push(new THREE.Vector3(x2, y, z2));

      const center = new THREE.Vector3((x1 + x2) / 2, y, (z1 + z2) / 2);

      let phaseId = 0;
      if (t > 0.25) phaseId = 1;
      if (t > 0.50) phaseId = 2;
      if (t > 0.75) phaseId = 3;

      r.push({
        pos: center,
        rotation: angle + Math.PI / 2,
        phase: phaseId,
        id: i,
        t,
      });
    }
    return { pointsA: pA, pointsB: pB, rungs: r };
  }, []);

  const curveA = useMemo(() => new THREE.CatmullRomCurve3(pointsA), [pointsA]);
  const curveB = useMemo(() => new THREE.CatmullRomCurve3(pointsB), [pointsB]);

  // Animation loop with breathing effect
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    // Slow rotation
    groupRef.current.rotation.y += delta * 0.1;

    // Subtle breathing/pulsing
    const breathe = Math.sin(timeRef.current * 0.5) * 0.015 + 1;
    groupRef.current.scale.setScalar(breathe);
  });

  // Get phase color based on hover state
  const getPhaseColor = (phaseIndex: number, isGlow = false): string => {
    const colors = PHASE_COLORS[phaseIndex as keyof typeof PHASE_COLORS];
    if (hoveredPhase === phaseIndex) {
      return isGlow ? colors.glow : colors.glow;
    }
    return '#e0e0e0';
  };

  // Get emissive intensity based on hover
  const getEmissiveIntensity = (phaseIndex: number, rungT: number): number => {
    if (hoveredPhase === phaseIndex) {
      const pulse = Math.sin(timeRef.current * 4 + rungT * 10) * 0.3 + 1;
      return 1.5 * pulse;
    }
    return 0.1;
  };

  // Get rung thickness based on position for variety
  const getRungThickness = (t: number): number => {
    return 0.08 + Math.sin(t * Math.PI * 8) * 0.02;
  };

  return (
    <group ref={groupRef}>
      {/* --- LIGHTING SETUP --- */}
      <ambientLight intensity={0.25} />
      <pointLight position={[15, 15, 15]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-15, -15, -15]} intensity={0.8} color="#6366f1" />
      <pointLight position={[0, 25, 0]} intensity={0.6} color="#a855f7" />
      <spotLight
        position={[0, 30, 10]}
        angle={0.25}
        penumbra={1}
        intensity={0.8}
        color="#ffffff"
      />

      {/* --- FLOATING PARTICLES --- */}
      <Particles count={120} />

      {/* --- BACKBONE STRAND A with texture --- */}
      <mesh>
        <tubeGeometry args={[curveA, 150, 0.32, 16, false]} />
        <meshStandardMaterial
          color="#5b5fc7"
          metalness={0.75}
          roughness={0.18}
          emissive="#4338ca"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Wireframe overlay for texture */}
      <WireframeOverlay curve={curveA} />
      {/* Orbiting spheres */}
      <HelixOrbs curve={curveA} count={15} color="#818cf8" />

      {/* --- BACKBONE STRAND B with texture --- */}
      <mesh>
        <tubeGeometry args={[curveB, 150, 0.32, 16, false]} />
        <meshStandardMaterial
          color="#7c3aed"
          metalness={0.75}
          roughness={0.18}
          emissive="#6d28d9"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Wireframe overlay for texture */}
      <WireframeOverlay curve={curveB} />
      {/* Orbiting spheres */}
      <HelixOrbs curve={curveB} count={15} color="#a78bfa" />

      {/* --- INNER GLOW CORE --- */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, DNA_HEIGHT * 0.95, 8]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.03} />
      </mesh>

      {/* --- RUNGS WITH PHASE COLORS --- */}
      {rungs.map((rung) => {
        const thickness = getRungThickness(rung.t);
        return (
          <group key={rung.id}>
            {/* Main rung */}
            <mesh
              position={rung.pos}
              rotation={[Math.PI / 2, rung.rotation, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredPhase(rung.phase);
                if (onPhaseChange) onPhaseChange(rung.phase);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredPhase(null);
                if (onPhaseChange) onPhaseChange(null);
                document.body.style.cursor = 'auto';
              }}
            >
              <cylinderGeometry args={[thickness, thickness, RADIUS * 2, 8]} />
              <meshStandardMaterial
                color={getPhaseColor(rung.phase)}
                emissive={getPhaseColor(rung.phase, true)}
                emissiveIntensity={getEmissiveIntensity(rung.phase, rung.t)}
                metalness={0.5}
                roughness={0.25}
              />
            </mesh>

            {/* Small spheres at rung endpoints for detail */}
            <mesh position={[rung.pos.x + Math.cos(rung.rotation - Math.PI/2) * RADIUS, rung.pos.y, rung.pos.z + Math.sin(rung.rotation - Math.PI/2) * RADIUS]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshStandardMaterial
                color={getPhaseColor(rung.phase)}
                emissive={getPhaseColor(rung.phase, true)}
                emissiveIntensity={getEmissiveIntensity(rung.phase, rung.t) * 0.5}
                metalness={0.6}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[rung.pos.x - Math.cos(rung.rotation - Math.PI/2) * RADIUS, rung.pos.y, rung.pos.z - Math.sin(rung.rotation - Math.PI/2) * RADIUS]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshStandardMaterial
                color={getPhaseColor(rung.phase)}
                emissive={getPhaseColor(rung.phase, true)}
                emissiveIntensity={getEmissiveIntensity(rung.phase, rung.t) * 0.5}
                metalness={0.6}
                roughness={0.2}
              />
            </mesh>
          </group>
        );
      })}

      {/* --- DECORATIVE RINGS --- */}
      {[-15, -5, 5, 15].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.5, 0.02, 8, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
        </mesh>
      ))}
    </group>
  );
}

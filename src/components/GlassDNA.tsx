'use client';

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Configuration
const DNA_HEIGHT = 20;
const RUNG_COUNT = 28;
const RADIUS = 3.5;
const TWISTS = 2;

// Style: 'chrome', 'pearl', or 'hybrid'
const STYLE: 'chrome' | 'pearl' | 'hybrid' = 'hybrid';

// Phase colors
const PHASE_COLORS = [
  new THREE.Color(0xE8A838), // Golden Amber - Define
  new THREE.Color(0x00ff88), // Green - Check
  new THREE.Color(0x9d4edd), // Purple - Generate
  new THREE.Color(0xff6b35), // Orange - Scale
];

// Custom DNA Curve class
class DNACurve extends THREE.Curve<THREE.Vector3> {
  offset: number;

  constructor(offset = 0) {
    super();
    this.offset = offset;
  }

  getPoint(t: number): THREE.Vector3 {
    const angle = t * Math.PI * 2 * TWISTS + this.offset;
    const x = Math.cos(angle) * RADIUS;
    const y = (t - 0.5) * DNA_HEIGHT;
    const z = Math.sin(angle) * RADIUS;
    return new THREE.Vector3(x, y, z);
  }
}

interface GlassDNAProps {
  onPhaseChange?: (phase: number | null) => void;
  activePhase?: number | null;
  rotationMultiplier?: number;
  highlightIntensity?: number;
  interactive?: boolean;
}

export default function GlassDNA({
  onPhaseChange,
  activePhase,
  rotationMultiplier = 1,
  highlightIntensity = 1,
  interactive = true
}: GlassDNAProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null);

  // Create curves
  const curve1 = useMemo(() => new DNACurve(0), []);
  const curve2 = useMemo(() => new DNACurve(Math.PI), []);

  // Create ribbon shape for extrusion
  const ribbonShape = useMemo(() => {
    const shape = new THREE.Shape();
    const width = 0.8;
    const thickness = 0.15;
    shape.moveTo(-width / 2, -thickness / 2);
    shape.lineTo(width / 2, -thickness / 2);
    shape.lineTo(width / 2, thickness / 2);
    shape.lineTo(-width / 2, thickness / 2);
    shape.lineTo(-width / 2, -thickness / 2);
    return shape;
  }, []);

  // Create extruded ribbon geometries
  const geometry1 = useMemo(() => {
    return new THREE.ExtrudeGeometry(ribbonShape, {
      steps: 150,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 4,
      extrudePath: curve1,
    });
  }, [ribbonShape, curve1]);

  const geometry2 = useMemo(() => {
    return new THREE.ExtrudeGeometry(ribbonShape, {
      steps: 150,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 4,
      extrudePath: curve2,
    });
  }, [ribbonShape, curve2]);

  // Generate rung data
  const rungs = useMemo(() => {
    const rungData = [];
    for (let i = 1; i < RUNG_COUNT - 1; i++) {
      const t = i / RUNG_COUNT;
      const p1 = curve1.getPoint(t);
      const p2 = curve2.getPoint(t);
      const center = p1.clone().add(p2).multiplyScalar(0.5);
      const distance = p1.distanceTo(p2);
      const direction = p2.clone().sub(p1).normalize();

      rungData.push({
        position: center,
        distance,
        direction,
        p1,
        p2,
        t,
        id: i,
      });
    }
    return rungData;
  }, [curve1, curve2]);

  // Rainbow Iridescent shader material - vivid holographic effect
  const iridescenceShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0xe8e8ec) }, // Light metallic base
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vUv = uv;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uBaseColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec3 viewDir = normalize(vViewPosition);
          vec3 normal = normalize(vNormal);

          // Rainbow fresnel effect - visible across more of surface
          float fresnel = 1.0 - abs(dot(viewDir, normal));
          fresnel = pow(fresnel, 1.3);

          // Secondary fresnel for intense edge glow
          float edgeFresnel = pow(1.0 - abs(dot(viewDir, normal)), 2.5);

          // Rainbow hue shifts based on angle, position, and time
          float hue1 = fract(fresnel * 1.5 + uTime * 0.06 + vUv.y * 0.6 + vUv.x * 0.4);
          float hue2 = fract(fresnel * 0.9 + uTime * 0.1 - vUv.y * 0.5);

          // Vivid rainbow iridescence colors
          vec3 rainbow1 = hsv2rgb(vec3(hue1, 0.85, 1.0));
          vec3 rainbow2 = hsv2rgb(vec3(hue2, 0.75, 0.95));
          vec3 iridescence = mix(rainbow1, rainbow2, 0.35);

          // Strong blend for visible rainbow effect
          vec3 finalColor = mix(uBaseColor, iridescence, fresnel * 0.9 + 0.2);

          // Intense rainbow edge glow
          vec3 edgeColor = hsv2rgb(vec3(fract(uTime * 0.08 + vUv.y * 0.8), 0.9, 1.0));
          finalColor += edgeColor * edgeFresnel * 0.5;

          // Bright specular highlights
          vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
          float specular = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 32.0);
          vec3 specColor = hsv2rgb(vec3(fract(uTime * 0.04), 0.4, 1.0));
          finalColor += specColor * specular * 0.8;

          // Add second specular for more shine
          vec3 lightDir2 = normalize(vec3(-0.5, 0.8, 0.5));
          float specular2 = pow(max(dot(reflect(-lightDir2, normal), viewDir), 0.0), 48.0);
          finalColor += vec3(1.0, 1.0, 1.0) * specular2 * 0.6;

          // Subtle ambient boost
          finalColor += uBaseColor * 0.12;

          // Slight tone mapping for richness
          finalColor = pow(finalColor, vec3(0.95));

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  }, []);

  // Strand material - pearl/white for hybrid, or style-specific
  const strandMaterial = useMemo(() => {
    // Use iridescent shader for holographic effect
    return iridescenceShader;
  }, [iridescenceShader]);

  // Update shader time uniform
  useFrame((state) => {
    if (iridescenceShader) {
      iridescenceShader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // Animation - continuous 360° rotation on Y axis, fixed position
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.15 * rotationMultiplier;
  });

  // Get phase based on t value
  const getPhase = (t: number): number => {
    if (t < 0.25) return 0;
    if (t < 0.5) return 1;
    if (t < 0.75) return 2;
    return 3;
  };

  const handlePointerOver = (phase: number) => {
    setHoveredPhase(phase);
    if (onPhaseChange) onPhaseChange(phase);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHoveredPhase(null);
    if (onPhaseChange) onPhaseChange(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <>
      {/* Background removed - using page's grainy aura background instead */}

      {/* DNA Group - upright with subtle tilt, spinning 360° */}
      <group ref={groupRef} rotation={[0.35, 0, 0]} position={[0, 0, 0]} scale={[1.4, 1.4, 1.4]}>
        {/* Lighting Setup - Enhanced for rainbow DNA visibility */}
        <ambientLight intensity={0.3} />

      {STYLE === 'pearl' ? (
        <>
          {/* Pearl style: Soft colored lights */}
          <pointLight position={[10, 10, 10]} intensity={8} color="#ff00ff" />
          <pointLight position={[-10, -10, 10]} intensity={8} color="#00ffff" />
          <pointLight position={[0, 15, 5]} intensity={5} color="#ffffff" />
          <pointLight position={[0, -15, 5]} intensity={4} color="#8844ff" />
          <directionalLight position={[0, 0, 15]} intensity={1} color="#ffffff" />
        </>
      ) : STYLE === 'hybrid' ? (
        <>
          {/* Hybrid style: Bright studio lighting for DNA visibility */}
          {/* Key light - strong front-right */}
          <directionalLight position={[5, 10, 8]} intensity={2.5} color="#ffffff" />
          {/* Fill light - left side */}
          <directionalLight position={[-8, 5, 10]} intensity={2.0} color="#ffffff" />
          {/* Rim light - back edge definition */}
          <pointLight position={[-5, 0, -10]} intensity={3} color="#ffffff" />
          {/* Top accent */}
          <pointLight position={[0, 15, 5]} intensity={4} color="#ffffff" />
          {/* Front fill - increased for better visibility */}
          <pointLight position={[0, 0, 20]} intensity={6} color="#ffffff" />
          {/* Bottom fill to reduce dark shadows */}
          <pointLight position={[0, -10, 10]} intensity={2} color="#ffffff" />
        </>
      ) : (
        <>
          {/* Chrome style: Moderate studio lights */}
          <spotLight
            position={[5, 20, 5]}
            angle={Math.PI / 4}
            penumbra={1}
            intensity={15}
            castShadow
            color="#ffffff"
          />
          <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-10, 10, 10]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[0, -10, 10]} intensity={1} color="#aaaaff" />
          <pointLight position={[0, 0, 20]} intensity={5} color="#ffffff" />
        </>
      )}

      {/* DNA Strand 1 - White/Pearl ribbon */}
      <mesh geometry={geometry1} castShadow receiveShadow>
        <primitive object={strandMaterial} attach="material" />
      </mesh>

      {/* DNA Strand 2 - White/Pearl ribbon */}
      <mesh geometry={geometry2} castShadow receiveShadow>
        <primitive object={strandMaterial} attach="material" />
      </mesh>

      {/* Rungs with chrome material */}
      {rungs.map((rung) => {
        const phase = getPhase(rung.t);
        const color = PHASE_COLORS[phase];
        // Check both external activePhase and hover state
        const isHighlighted = activePhase !== undefined && activePhase !== null
          ? activePhase === phase
          : hoveredPhase === phase;
        const currentIntensity = isHighlighted ? highlightIntensity : 1;

        const quaternion = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        quaternion.setFromUnitVectors(up, rung.direction);

        return (
          <group key={rung.id}>
            {/* Main rung cylinder */}
            <mesh
              position={rung.position}
              quaternion={quaternion}
              castShadow
              receiveShadow
              onPointerOver={interactive ? (e) => {
                e.stopPropagation();
                handlePointerOver(phase);
              } : undefined}
              onPointerOut={interactive ? handlePointerOut : undefined}
            >
              <cylinderGeometry args={[0.12, 0.12, rung.distance, 16]} />
              {/* High-shine metallic rungs */}
              <meshPhysicalMaterial
                color={isHighlighted ? color : 0x555560}
                metalness={0.98}
                roughness={0.12}
                clearcoat={0.6}
                clearcoatRoughness={0.15}
                emissive={isHighlighted ? color : 0x282830}
                emissiveIntensity={isHighlighted ? 0.5 * currentIntensity : 0.15}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Endpoint sphere 1 */}
            <mesh
              position={rung.p1}
              castShadow
              onPointerOver={interactive ? (e) => {
                e.stopPropagation();
                handlePointerOver(phase);
              } : undefined}
              onPointerOut={interactive ? handlePointerOut : undefined}
            >
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshPhysicalMaterial
                color={isHighlighted ? color : 0x606570}
                metalness={0.98}
                roughness={0.1}
                clearcoat={0.7}
                clearcoatRoughness={0.1}
                emissive={isHighlighted ? color : 0x252530}
                emissiveIntensity={isHighlighted ? 0.5 * currentIntensity : 0.12}
              />
            </mesh>

            {/* Endpoint sphere 2 */}
            <mesh
              position={rung.p2}
              castShadow
              onPointerOver={interactive ? (e) => {
                e.stopPropagation();
                handlePointerOver(phase);
              } : undefined}
              onPointerOut={interactive ? handlePointerOut : undefined}
            >
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshPhysicalMaterial
                color={isHighlighted ? color : 0x606570}
                metalness={0.98}
                roughness={0.1}
                clearcoat={0.7}
                clearcoatRoughness={0.1}
                emissive={isHighlighted ? color : 0x252530}
                emissiveIntensity={isHighlighted ? 0.5 * currentIntensity : 0.12}
              />
            </mesh>
          </group>
        );
      })}

      {/* Floating particles */}
      <ChromeParticles count={40} />

      {/* Decorative rings */}
      {[-8, 0, 8].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[5.5, 0.035, 12, 64]} />
          <meshPhysicalMaterial
            color={0x888890}
            metalness={0.85}
            roughness={0.38}
            clearcoat={0.1}
            clearcoatRoughness={0.45}
            emissive={0x333340}
            emissiveIntensity={0.1}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      </group>
    </>
  );
}

// Space horizon gradient background with stars
function MeshGradientBackground() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Custom shader for space horizon gradient with twinkling stars
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vPosition;

        // Hash function for star positions
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        // Star field function
        float stars(vec2 uv, float density, float size) {
          vec2 grid = floor(uv * density);
          vec2 f = fract(uv * density);

          float star = 0.0;
          float h = hash(grid);

          if (h > 0.97) {
            vec2 center = vec2(hash(grid + 1.0), hash(grid + 2.0));
            float d = length(f - center);
            star = smoothstep(size, 0.0, d);
          }

          return star;
        }

        void main() {
          // Use spherical mapping - vPosition.y gives us vertical position
          float t = (vPosition.y / 60.0) + 0.5; // Normalize to 0-1, flipped for correct orientation
          t = 1.0 - t; // Flip so horizon is at bottom

          // Space horizon gradient colors (from top to bottom)
          vec3 starryVoid = vec3(0.0, 0.0, 0.0);           // #000000 - top
          vec3 deepNavy = vec3(0.008, 0.004, 0.067);       // #020111
          vec3 richBlue = vec3(0.02, 0.102, 0.231);        // #051A3B
          vec3 lighterBlue = vec3(0.118, 0.341, 0.6);      // #1E5799
          vec3 horizonGlow = vec3(0.294, 0.612, 0.827);    // #4B9CD3
          vec3 brightEdge = vec3(1.0, 1.0, 1.0);           // #FFFFFF - bottom

          // Create gradient with proper color stops - more blue, less white
          vec3 color;
          if (t < 0.5) {
            color = mix(starryVoid, deepNavy, t / 0.5);
          } else if (t < 0.75) {
            color = mix(deepNavy, richBlue, (t - 0.5) / 0.25);
          } else if (t < 0.92) {
            color = mix(richBlue, lighterBlue, (t - 0.75) / 0.17);
          } else if (t < 0.98) {
            color = mix(lighterBlue, horizonGlow, (t - 0.92) / 0.06);
          } else {
            color = mix(horizonGlow, brightEdge, (t - 0.98) / 0.02);
          }

          // Add stars only in the upper portion (where it's dark)
          if (t < 0.7) {
            // Create UV for star field from sphere position
            vec2 starUV = vec2(atan(vPosition.x, vPosition.z) / 6.28318 + 0.5, t);

            // Multiple star layers with different densities
            float twinkle1 = sin(uTime * 2.0) * 0.3 + 0.7;
            float twinkle2 = sin(uTime * 3.0 + 1.0) * 0.3 + 0.7;
            float twinkle3 = sin(uTime * 1.5 + 2.0) * 0.3 + 0.7;

            float starField = 0.0;
            starField += stars(starUV, 80.0, 0.15) * twinkle1 * 0.8;  // Small stars
            starField += stars(starUV + 100.0, 50.0, 0.2) * twinkle2 * 0.6;  // Medium stars
            starField += stars(starUV + 200.0, 30.0, 0.25) * twinkle3 * 0.9; // Larger stars

            // Fade stars out near the horizon
            float starFade = smoothstep(0.7, 0.3, t);
            color += vec3(starField * starFade);
          }

          // Add subtle fog overlay near horizon - reduced
          if (t > 0.85) {
            float fog = smoothstep(0.85, 1.0, t) * 0.05;
            color = mix(color, vec3(1.0), fog);
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
  }, []);

  useFrame((state) => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[60, 64, 64]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
}

// Chrome particles
function ChromeParticles({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const distance = 10 + Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 30;
      temp.push({
        position: new THREE.Vector3(
          Math.cos(angle) * distance,
          y,
          Math.sin(angle) * distance
        ),
        speed: 0.15 + Math.random() * 0.3,
        offset: Math.random() * Math.PI * 2,
        scale: 0.08 + Math.random() * 0.12,
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const matrix = new THREE.Matrix4();

    particles.forEach((particle, i) => {
      const x = particle.position.x + Math.sin(time * particle.speed + particle.offset) * 2;
      const y = particle.position.y + Math.cos(time * particle.speed * 0.5) * 1.5;
      const z = particle.position.z + Math.cos(time * particle.speed + particle.offset) * 2;

      matrix.makeTranslation(x, y, z);
      matrix.scale(new THREE.Vector3(particle.scale, particle.scale, particle.scale));
      meshRef.current!.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshPhysicalMaterial
        color={0x555566}
        metalness={0.1}
        roughness={0.6}
        clearcoat={0}
        emissive={0x111118}
        emissiveIntensity={0.05}
        transparent
        opacity={0.5}
      />
    </instancedMesh>
  );
}

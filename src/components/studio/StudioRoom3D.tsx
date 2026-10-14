'use client';

import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Mesh, MeshBasicMaterial, type MeshStandardMaterial } from 'three';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Bounds, Center, Edges, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { playSound, primeSounds } from '@/lib/ui-sounds';

// The baked Blender studio room (scripts/blender/studio_room.py + bake_export.py)
// as a reusable 3D scene. Clickable zones (monitors / laptop / art, exported by
// scripts/blender/hotspots.py) take any action; `pins` place UI next to a zone
// (e.g. brainstormed ideas on the monitors). Drag to rotate within the cutaway,
// scroll / pinch to zoom.

export type ZoneId = 'monitors' | 'laptop' | 'art';
type Zone = { min: [number, number, number]; max: [number, number, number] };

export interface Spot {
  label: string;
  onSelect: () => void;
  /** Keep the zone outlined (e.g. the step to do next). */
  highlight?: boolean;
}

const BONE = '#F2EFE8';
const BLUE = '#0047FF';
const MONO = "'VCR OSD Mono', monospace";

function Zones({
  url,
  spots,
  pins,
  onReady,
}: {
  url: string;
  spots: Partial<Record<ZoneId, Spot>>;
  pins?: Partial<Record<ZoneId, ReactNode>>;
  onReady?: () => void;
}) {
  const [zones, setZones] = useState<Record<string, Zone>>({});
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : {}))
      .then((z) => {
        if (!live) return;
        setZones(z);
        if (Object.keys(z).length) onReady?.();
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per room
  }, [url]);
  useEffect(() => {
    document.body.style.cursor = hover ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hover]);
  return (
    <>
      {Object.entries(zones).map(([id, z]) => {
        const spot = spots[id as ZoneId];
        const pin = pins?.[id as ZoneId];
        if (!spot && !pin) return null;
        const size = z.max.map((v, i) => v - z.min[i]) as [number, number, number];
        const pos = z.max.map((v, i) => (v + z.min[i]) / 2) as [number, number, number];
        const on = hover === id || !!spot?.highlight;
        return (
          <mesh
            key={id}
            position={pos}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              if (!spot) return;
              e.stopPropagation();
              setHover(id);
              playSound('hover');
            }}
            onPointerOut={() => setHover((h) => (h === id ? null : h))}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (!spot || e.delta > 4) return; // a drag to rotate, not a click
              e.stopPropagation();
              playSound('transition');
              spot.onSelect();
            }}
          >
            <boxGeometry args={size} />
            <meshBasicMaterial
              color={BLUE}
              transparent
              opacity={on && spot ? 0.08 : 0}
              depthWrite={false}
            />
            {on && spot && <Edges color={BLUE} lineWidth={2} />}
            {spot && (on || spot.highlight) && (
              <Html center position={[0, size[1] / 2 + 0.12, 0]} style={{ pointerEvents: 'none' }}>
                <span
                  className="whitespace-nowrap px-2 py-[3px] text-[11px] uppercase tracking-[0.14em] text-white"
                  style={{ fontFamily: MONO, background: BLUE }}
                >
                  {spot.label}
                </span>
              </Html>
            )}
            {pin && (
              // anchored at the zone's top-right corner, extending right/down over the wall
              <Html position={[size[0] / 2, size[1] / 2 + 0.25, 0]} zIndexRange={[20, 0]}>
                {pin}
              </Html>
            )}
          </mesh>
        );
      })}
    </>
  );
}

function Room({
  url,
  hotspots,
  spots,
  pins,
  onReady,
}: {
  url: string;
  hotspots: string;
  spots: Partial<Record<ZoneId, Spot>>;
  pins?: Partial<Record<ZoneId, ReactNode>>;
  onReady?: () => void;
}) {
  const { scene } = useGLTF(url);
  // baked lighting: show the texture as-is (no scene lights, no tone mapping)
  useMemo(() => {
    scene.traverse((o) => {
      if (o instanceof Mesh) {
        const map = (o.material as MeshStandardMaterial).map;
        o.material = new MeshBasicMaterial({ map, toneMapped: false });
      }
    });
  }, [scene]);
  return (
    <Center>
      <primitive object={scene} />
      <Zones url={hotspots} spots={spots} pins={pins} onReady={onReady} />
    </Center>
  );
}

export default function StudioRoom3D({
  spots,
  pins,
  azimuthDeg = -45,
  model = '/worlds/studio/3d/blender/studio.gltf',
  hotspots = '/worlds/studio/3d/blender/hotspots.json',
  className = 'relative h-screen w-full',
  onReady,
}: {
  spots: Partial<Record<ZoneId, Spot>>;
  pins?: Partial<Record<ZoneId, ReactNode>>;
  azimuthDeg?: number;
  model?: string;
  hotspots?: string;
  className?: string;
  /** The room and its clickable zones are on screen (pins can render). */
  onReady?: () => void;
}) {
  useEffect(() => primeSounds(), []);
  const az = (azimuthDeg * Math.PI) / 180;
  const r = 6;
  return (
    <div className={className} style={{ background: BONE }}>
      <Canvas
        orthographic
        camera={{ position: [r * Math.sin(az), r * 0.82, r * Math.cos(az)], zoom: 110 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[BONE]} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.15}>
            <Room url={model} hotspots={hotspots} spots={spots} pins={pins} onReady={onReady} />
          </Bounds>
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          minAzimuthAngle={az - Math.PI / 4}
          maxAzimuthAngle={az + Math.PI / 4}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.4}
          minZoom={70}
          maxZoom={260}
        />
      </Canvas>
    </div>
  );
}

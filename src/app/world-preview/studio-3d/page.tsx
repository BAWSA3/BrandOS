'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Mesh, MeshBasicMaterial, type MeshStandardMaterial } from 'three';
import { useRouter, useSearchParams } from 'next/navigation';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Bounds, Center, Edges, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { playSound, primeSounds } from '@/lib/ui-sounds';

// 3D test of the studio room. Default: the room modelled in Blender
// (scripts/blender/studio_room.py) with Cycles lighting baked into one texture
// (bake_export.py), shown unlit so it looks like the render. Drag to rotate (limited to the
// open sides of the cutaway), scroll/pinch to zoom.
//   /world-preview/studio-3d            ?az=<deg> starting angle (default -45: the original render's view)
//   &theme=<id> once that theme is baked (see THEME_DIRS)
// Clickable: invisible zones over the monitors / laptop / art (exported from
// Blender by scripts/blender/hotspots.py) mirror the title-screen menu.

// geometry .bin + texture files (no blob: URLs, CSP-safe); ?model= picks a conversion
// Blender-baked rooms: the base studio + the six level-unlocked themes (src/lib/studio-themes.ts)
// Theme bakes (signal-orange, deep-navy, ultraviolet, blueprint-lab, japan, terminal-night) are
// paused; add each id here once its files exist in public/worlds/studio/3d/<id>/.
const THEME_DIRS: string[] = [];
const MODELS: Record<string, string> = {
  blender: '/worlds/studio/3d/blender/studio.gltf',
  ...Object.fromEntries(THEME_DIRS.map((t) => [t, `/worlds/studio/3d/${t}/studio.gltf`])),
  meshy: '/worlds/studio/3d/base-3.gltf',
  hunyuan: '/worlds/studio/3d/hunyuan.gltf',
};
// ?model=hunyuan / meshy: the earlier AI image->3D conversions, for comparison
const DEFAULT_MODEL = 'blender';
const BAKED = new Set(['blender', ...THEME_DIRS]);
const hotspotsFor = (key: string) =>
  BAKED.has(key)
    ? `/worlds/studio/3d/${key === 'blender' ? 'blender' : key}/hotspots.json`
    : undefined;
const BONE = '#F2EFE8';
const BLUE = '#0047FF';

type Zone = { min: [number, number, number]; max: [number, number, number] };
const HOTSPOTS: Record<string, { label: string; href: string }> = {
  monitors: { label: 'Enter dashboard', href: '/world-preview/dashboard' },
  laptop: { label: 'Run a fresh scan', href: '/' },
  art: { label: 'Your station', href: '/station/jbawsa' },
};

function Hotspots({ url }: { url: string }) {
  const router = useRouter();
  const [zones, setZones] = useState<Record<string, Zone>>({});
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : {}))
      .then((z) => live && setZones(z))
      .catch(() => {});
    return () => {
      live = false;
    };
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
        const spot = HOTSPOTS[id];
        if (!spot) return null;
        const size = z.max.map((v, i) => v - z.min[i]) as [number, number, number];
        const pos = z.max.map((v, i) => (v + z.min[i]) / 2) as [number, number, number];
        const on = hover === id;
        return (
          <mesh
            key={id}
            position={pos}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHover(id);
              playSound('hover');
            }}
            onPointerOut={() => setHover((h) => (h === id ? null : h))}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (e.delta > 4) return; // that was a drag to rotate
              e.stopPropagation();
              playSound('transition');
              router.push(spot.href);
            }}
          >
            <boxGeometry args={size} />
            <meshBasicMaterial
              color={BLUE}
              transparent
              opacity={on ? 0.08 : 0}
              depthWrite={false}
            />
            {on && <Edges color={BLUE} lineWidth={2} />}
            {on && (
              <Html center position={[0, size[1] / 2 + 0.12, 0]} style={{ pointerEvents: 'none' }}>
                <span
                  className="whitespace-nowrap px-2 py-[3px] text-[11px] uppercase tracking-[0.14em] text-white"
                  style={{ fontFamily: "'VCR OSD Mono', monospace", background: BLUE }}
                >
                  {spot.label} ↗
                </span>
              </Html>
            )}
          </mesh>
        );
      })}
    </>
  );
}

function Room({ url, baked, hotspots }: { url: string; baked: boolean; hotspots?: string }) {
  const { scene } = useGLTF(url);
  // baked lighting: show the texture as-is (no scene lights, no tone mapping)
  useMemo(() => {
    if (!baked) return;
    scene.traverse((o) => {
      if (o instanceof Mesh) {
        const map = (o.material as MeshStandardMaterial).map;
        o.material = new MeshBasicMaterial({ map, toneMapped: false });
      }
    });
  }, [scene, baked]);
  return (
    <Center>
      <primitive object={scene} />
      {hotspots && <Hotspots url={hotspots} />}
    </Center>
  );
}

function Viewer() {
  const q = useSearchParams();
  // ?theme=japan (etc.) or ?model=hunyuan; default the base Blender studio
  const want = q.get('theme') ?? q.get('model');
  const key = want && MODELS[want] ? want : DEFAULT_MODEL;
  const url = MODELS[key];
  useEffect(() => primeSounds(), []);
  const az = ((Number(q.get('az') ?? -45) || 0) * Math.PI) / 180;
  const r = 6;
  return (
    <main className="relative h-screen w-full" style={{ background: BONE }}>
      <Canvas
        orthographic
        camera={{ position: [r * Math.sin(az), r * 0.82, r * Math.cos(az)], zoom: 110 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[BONE]} />
        <hemisphereLight args={['#ffffff', '#d9d2c4', 1.6]} />
        <directionalLight position={[4, 8, 5]} intensity={1.4} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.15}>
            <Room url={url} baked={BAKED.has(key)} hotspots={hotspotsFor(key)} />
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
      <div
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.16em]"
        style={{ fontFamily: "'VCR OSD Mono', monospace", color: '#6B6B70' }}
      >
        Drag to rotate · click the screens, laptop or art
      </div>
    </main>
  );
}

export default function Studio3DPage() {
  return (
    <Suspense>
      <Viewer />
    </Suspense>
  );
}

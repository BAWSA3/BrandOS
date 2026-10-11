'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei';

// 3D test of the studio room (image -> 3D via Higgsfield/Meshy), to judge
// whether a rotatable room is worth building. Drag to rotate (limited to the
// open sides of the cutaway), scroll/pinch to zoom.
//   /world-preview/studio-3d            ?az=<deg> starting angle (default -45: the original render's view)

// geometry .bin + texture files (no blob: URLs, CSP-safe); ?model= picks a conversion
const MODELS: Record<string, string> = {
  meshy: '/worlds/studio/3d/base-3.gltf',
  hunyuan: '/worlds/studio/3d/hunyuan.gltf',
};
// Hunyuan3D v3 (cleaner surfaces, 4K texture) is the pick; ?model=meshy for comparison
const DEFAULT_MODEL = 'hunyuan';
const BONE = '#F2EFE8';

function Room({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

function Viewer() {
  const q = useSearchParams();
  const url = MODELS[q.get('model') ?? DEFAULT_MODEL] ?? MODELS[DEFAULT_MODEL];
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
            <Room url={url} />
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
        Drag to rotate · scroll to zoom
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

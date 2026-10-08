'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import StudioView from '@/components/studio/StudioView';
import { clampStage } from '@/lib/studio-stages';

// Sign-in-free preview of the studio home at any stage and archetype:
//   /world-preview/studio?stage=0..3&archetype=BUILD.EXE&handle=jbawsa
// archetype=none shows the "scan first" state. For review only.

function Preview() {
  const q = useSearchParams();
  const rawArchetype = q.get('archetype') ?? 'BUILD.EXE';
  const archetype = rawArchetype.toLowerCase() === 'none' ? null : rawArchetype.toUpperCase();
  return (
    <StudioView
      key={`${archetype}-${q.get('stage')}`}
      handle={q.get('handle') ?? 'jbawsa'}
      archetype={archetype}
      stage={clampStage(Number(q.get('stage') ?? 0) || 0)}
    />
  );
}

export default function StudioPreviewPage() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}

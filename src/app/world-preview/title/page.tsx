'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import TitleScreen from '@/components/title/TitleScreen';
import { clampStage } from '@/lib/studio-stages';

// Sign-in-free preview of the title screen (design review):
//   /world-preview/title?stage=0..3&archetype=BUILD.EXE&handle=jbawsa
// Day/night follows your clock; override it in Settings.

function Preview() {
  const q = useSearchParams();
  return (
    <TitleScreen
      key={`${q.get('archetype')}-${q.get('stage')}`}
      handle={q.get('handle') ?? 'jbawsa'}
      archetype={(q.get('archetype') ?? 'BUILD.EXE').toUpperCase()}
      stage={clampStage(Number(q.get('stage') ?? 1) || 0)}
      stationNumber={2}
      lastSaved="2h ago"
      continueHref="/world-preview/dashboard"
      rescanHref="/"
      stationHref="/station/jbawsa"
    />
  );
}

export default function TitlePreviewPage() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}

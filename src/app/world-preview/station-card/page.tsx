'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import StationCard from '@/components/StationCard';

// Sign-in-free preview of the post-scan station card (design review):
//   /world-preview/station-card?archetype=BUILD.EXE&handle=jbawsa&score=72
// The Day / Night toggle + Save Image controls are under the card.

function Preview() {
  const q = useSearchParams();
  return (
    <main className="min-h-screen bg-[#F2EFE8] px-4 py-10">
      <StationCard
        archetype={(q.get('archetype') ?? 'BUILD.EXE').toUpperCase()}
        username={q.get('handle') ?? 'jbawsa'}
        score={Number(q.get('score') ?? 72) || 72}
      />
    </main>
  );
}

export default function StationCardPreviewPage() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}

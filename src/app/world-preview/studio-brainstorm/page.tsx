'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BrainstormStudio from '@/components/studio/BrainstormStudio';

// Preview of the studio brainstorm with sample data (no sign-in, no API):
//   /world-preview/studio-brainstorm?s=<suggestion index>
const POST = {
  id: 'sample',
  excerpt:
    '99% of founders suck at building brands. so, i built the tool i wish i had. introducing BrandOS dashboards: the ultimate workstation for tracking, growing, and scaling your brand.',
  fit: 92,
};
const SUGGESTIONS = [
  'Add a visual or screenshot, since this format begs for one',
  'Close with a direct CTA instead of trailing off',
  'Follow up with a short case study showing a real score jump',
];
const IDEAS = [
  {
    title: 'Before / after brand score teardown',
    hook: 'Open on the jump itself: the old score next to the new one, then promise the 3 changes behind it',
    format: 'Single post + 2 screenshots',
    why: 'Shows the dashboard working on a real account, which is the proof your launch post asked people to trust',
  },
  {
    title: 'Live rescan, narrated',
    hook: 'Start mid-scan: what you expect the score to be, then reveal it',
    format: '30s screen recording',
    why: 'You build in public; letting people watch the tool judge you is on-brand and visual',
  },
  {
    title: 'The 3 posts that moved my score',
    hook: 'Lead with the post that hurt your score most, and why',
    format: 'Thread, 4 posts',
    why: 'Turns the post breakdown into a repeatable series, a format your audience already engages with',
  },
  {
    title: 'Ask: drop your handle, I score it live',
    hook: 'A direct invitation with one example score in the first line',
    format: 'Post + reply-chain',
    why: 'Acts on the CTA suggestion and feeds brands the creator data BrandOS is for',
  },
];

function Preview() {
  const q = useSearchParams();
  return (
    <BrainstormStudio
      mode="demo"
      post={POST}
      suggestions={SUGGESTIONS}
      initialIndex={Number(q.get('s')) || 0}
      demoIdeas={IDEAS}
    />
  );
}

export default function StudioBrainstormPreview() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}

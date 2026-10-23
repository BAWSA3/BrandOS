'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CopywriterChat from '@/components/dashboard/CopywriterChat';
import { isColorway } from '@/lib/colorways';

// Preview of the copywriter chat with a canned reply (no sign-in, no API):
//   /world-preview/write?c=<bone|night|klein|paper>
const REPLY = `Option 1
shipped dashboards this week.

your brand score, every post scored for fit, and what to post next. all in one place.

the tool i wish i had when i started.
---
Option 2
99% of creators can't tell you what their brand is.

so we built a dashboard that tells you. score, archetype, best posts, next moves.

try it on your own handle 👇
---
Option 3
most "personal brand" advice is vibes.

BrandOS dashboards are receipts: every post scored, every week tracked.

Option 2 fits your launch voice best: short lines, a number up top, a direct ask.`;

function Preview() {
  const c = useSearchParams().get('c');
  return (
    <CopywriterChat handle="bawsaxbt" colorway={isColorway(c) ? c : 'bone'} demoReply={REPLY} />
  );
}

export default function WritePreview() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}

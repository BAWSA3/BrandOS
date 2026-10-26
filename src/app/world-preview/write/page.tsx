'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CopywriterChat from '@/components/dashboard/CopywriterChat';
import { isColorway } from '@/lib/colorways';

// Preview of the copywriter chat with a canned reply (no sign-in, no API):
//   /world-preview/write?c=<bone|night|klein|paper>[&f=email]
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

const EMAIL_REPLY = `Subject: a dune dashboard thread, from someone who uses yours daily
Subject: @dune x @bawsaxbt: the onchain thread i keep getting asked for
Subject: 6 posts on dune, for builders who don't write sql
Preview: a sponsored thread idea for dune, plus where it would land.

hey [name],

i open dune most mornings before i post. [what you noticed about the brand: e.g. the new dashboard templates] is the thing my followers keep asking me how to use.

the idea: a 6-post thread walking builders through one real dashboard, start to finish, in plain english. it's the format that does best for me: breakdowns of tools people already half-know.

my audience is crypto builders and founders, [follower count] on X, [average views per thread] per thread.

open to a quick call this week, or i can send the thread outline first?

bawsa

Fill in the brackets with real numbers before sending. The opener is the strongest part.`;

function Preview() {
  const params = useSearchParams();
  const c = params.get('c');
  const email = params.get('f') === 'email';
  return (
    <CopywriterChat
      handle="bawsaxbt"
      colorway={isColorway(c) ? c : 'bone'}
      demoReply={email ? EMAIL_REPLY : REPLY}
      initialFormat={email ? 'email' : 'x-post'}
    />
  );
}

export default function WritePreview() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}

import { notFound, redirect } from 'next/navigation';
import { after } from 'next/server';
import { captureFunnelEvent } from '@/lib/funnel-events';
import { getCurrentUser } from '@/lib/auth';
import { indexOpenFor } from '@/lib/index-rules';
import { getEntry, isFresh, latestRead } from '@/lib/creator-index';
import { adoptPublicScan } from '@/lib/adopt-scan';
import JoinForm from './JoinForm';

// /index/join (rewritten here): sign in with X → reuse the brand read (or
// refresh it if it's over a week old) → pick niches + one line for brands →
// your Index number + share card. Members come back here to edit or leave.
export const dynamic = 'force-dynamic';

export default async function JoinIndexPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!indexOpenFor(user)) notFound();
  if (!user) redirect('/signup?next=/index/join');
  const x = user.platformConnections.find((pc) => pc.platform === 'x');
  // a homepage scan of their own handle becomes the account's first read (no new scan)
  if (x) await adoptPublicScan(user, x);
  const [entry, read] = await Promise.all([getEntry(user.id), latestRead(user.id)]);
  // the funnel: someone not (or no longer) listed opened the join form
  if (!entry?.listed) {
    const supabaseId = user.supabaseId;
    after(() => captureFunnelEvent(supabaseId, 'index_join_started', { rejoin: !!entry }));
  }
  return (
    <JoinForm
      handle={x?.platformUsername.replace(/^@/, '') ?? null}
      read={
        read
          ? { score: read.score, archetype: read.archetype, fresh: isFresh(read.scannedAt) }
          : null
      }
      entry={
        entry
          ? { number: entry.number, niches: entry.niches, blurb: entry.blurb, listed: entry.listed }
          : null
      }
    />
  );
}

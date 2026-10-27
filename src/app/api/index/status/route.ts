import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { indexOpenForUser } from '@/lib/early-access';
import { getEntry, ownReservation } from '@/lib/creator-index';

/**
 * GET /api/index/status — is the Creator Index open for this visitor, and are
 * they a member? Lets client pages (the homepage scan, /@handle) show or hide
 * "Join the Index" without a build-time flag. Reads only; no request input.
 */
export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!(await indexOpenForUser(user))) return NextResponse.json({ open: false });
  const entry = user ? await getEntry(user.id) : null;
  // the signed-in account's OWN reserved number only (never anyone else's)
  const reserved = user && !entry ? await ownReservation(user) : null;
  return NextResponse.json(
    {
      open: true,
      signedIn: !!user,
      member: entry ? { number: entry.number, listed: entry.listed } : null,
      reserved,
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { indexOpenFor } from '@/lib/index-rules';
import { getEntry } from '@/lib/creator-index';

/**
 * GET /api/index/status — is the Creator Index open for this visitor, and are
 * they a member? Lets client pages (the homepage scan, /@handle) show or hide
 * "Join the Index" without a build-time flag. Reads only; no request input.
 */
export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!indexOpenFor(user)) return NextResponse.json({ open: false });
  const entry = user ? await getEntry(user.id) : null;
  return NextResponse.json(
    {
      open: true,
      signedIn: !!user,
      member: entry ? { number: entry.number, listed: entry.listed } : null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

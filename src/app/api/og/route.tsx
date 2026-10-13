import { NextRequest } from 'next/server';
import { getPublicScan } from '@/lib/public-scan';
import { editorialImage } from '@/lib/og/editorial';

// Link-preview image for /scan/<handle> and /card/<handle>, in the shared
// Editorial design (src/lib/og/editorial.tsx). Scores come from our own record
// of the handle's latest scan, never from the URL (old s/a/d/c/g/sc/n params
// are ignored), so a shared link can't show a fake score. Never-scanned
// handles get an invite card. Cached at the edge so unfurls don't hit the DB.

const CACHE = {
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
};

export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get('u') || '').replace(/^@/, '').toLowerCase();
  const valid = /^[a-z0-9_]{1,30}$/.test(raw);
  const scan = valid ? await getPublicScan(raw) : null;
  if (!scan) return editorialImage({ kind: 'invite', handle: valid ? raw : null }, CACHE);
  return editorialImage(
    {
      kind: 'score',
      handle: scan.handle,
      score: scan.score,
      archetype: scan.archetype,
      phases: scan.phases,
    },
    CACHE
  );
}

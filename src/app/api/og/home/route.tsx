import { fieldMessageImage, SITE_CARD } from '@/lib/og/editorial';

// Link-preview image: the site default (every page without its own card).
// Static, so cached hard at the edge.
export async function GET() {
  return fieldMessageImage(SITE_CARD, {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  });
}

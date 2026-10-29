import { fieldMessageImage, INVITE_CARD } from '@/lib/og/editorial';

// Link-preview image: invite links (/i/CODE). Never shows the code: previews get cached and forwarded.
// Static, so cached hard at the edge.
export async function GET() {
  return fieldMessageImage(INVITE_CARD, {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  });
}

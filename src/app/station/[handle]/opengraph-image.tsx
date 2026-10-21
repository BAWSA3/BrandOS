import { getReservationByHandle } from '@/lib/reservations';
import { editorialImage, OG_SIZE } from '@/lib/og/editorial';

// X / link-preview image for /station/[handle], in the shared Editorial design
// (src/lib/og/editorial.tsx): the reserved station number, handle, archetype
// tag and the archetype's photoreal 3D station; unreserved handles get the
// "Claim" card with the three-station lineup.
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'A BrandOS brand station';
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  // a link preview must never fail: on a lookup error, show the unclaimed card
  const r = await getReservationByHandle(handle).catch(() => null);
  const shown = (r?.handle ?? handle).replace(/^@/, '').toLowerCase().slice(0, 30);
  return r
    ? editorialImage({
        kind: 'station',
        handle: shown,
        number: String(r.number).padStart(4, '0'),
        archetype: r.archetype ?? null,
      })
    : editorialImage({ kind: 'unclaimed', handle: shown });
}

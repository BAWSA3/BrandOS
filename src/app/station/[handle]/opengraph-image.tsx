import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getReservationByHandle } from '@/lib/reservations';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

// X / link-preview image for /station/[handle]: the reserved archetype's
// photoreal 3D station (Blender renders, pre-composited on the bone canvas in
// public/worlds/stations/og/), plus the station number and status. Handles
// without a reservation get a lineup of three stations. Literal paths under
// process.cwd() so Next's file tracing bundles the fonts and art.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'A reserved BrandOS brand station';
export const revalidate = 300;

const SLUGS = new Set([
  'arc',
  'build-exe',
  'entropy',
  'foresight',
  'freq',
  'null',
  'relay',
  'source',
]);
// One literal path per file so Next's file tracing bundles every image.
const ART: Record<string, () => Promise<Buffer>> = {
  arc: () =>
    readFile(
      join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'station3d-arc-504x630.png')
    ),
  'build-exe': () =>
    readFile(
      join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'station3d-build-exe-504x630.png')
    ),
  entropy: () =>
    readFile(
      join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'station3d-entropy-504x630.png')
    ),
  foresight: () =>
    readFile(
      join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'station3d-foresight-504x630.png')
    ),
  freq: () =>
    readFile(
      join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'station3d-freq-504x630.png')
    ),
  null: () =>
    readFile(
      join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'station3d-null-504x630.png')
    ),
  relay: () =>
    readFile(
      join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'station3d-relay-504x630.png')
    ),
  source: () =>
    readFile(
      join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'station3d-source-504x630.png')
    ),
  lineup: () =>
    readFile(
      join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'station3d-lineup-504x630.png')
    ),
};
const readArt = (slug: string | null) => (ART[slug ?? 'lineup'] ?? ART.lineup)();
/** 'BUILD.EXE' -> 'build-exe' when there's 3D art for it. */
function slugFor(archetype: string | null | undefined): string | null {
  const s = (archetype ?? '').trim().toLowerCase().replace(/\./g, '-');
  return SLUGS.has(s) ? s : null;
}

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  // a link preview must never fail: on a lookup error, show the unreserved card
  const r = await getReservationByHandle(handle).catch(() => null);
  const slug = slugFor(r?.archetype);
  const [neueBit, vcr, art] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'fonts', 'PPNeueBit-Bold.otf')),
    readFile(join(process.cwd(), 'public', 'fonts', 'VCR_OSD_MONO_1.001.ttf')),
    readArt(slug),
  ]);
  const artSrc = `data:image/png;base64,${art.toString('base64')}`;
  const name = r ? getArchetypeInfo(r.archetype ?? '')?.name : null;
  const no = r ? String(r.number).padStart(4, '0') : null;
  const shown = r?.handle ?? handle.replace(/^@/, '');

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', background: '#F2F0EF' }}>
      <div
        style={{ position: 'relative', width: 504, height: 630, display: 'flex', marginLeft: 48 }}
      >
        <img src={artSrc} width={504} height={630} alt="" />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: 56,
          paddingRight: 64,
        }}
      >
        <div style={{ display: 'flex' }}>
          <div
            style={{
              fontFamily: 'VCR',
              fontSize: 22,
              letterSpacing: 4,
              color: '#FFFFFF',
              background: '#0A84FF',
              padding: '6px 12px',
            }}
          >
            {r ? 'RESERVED' : 'BRANDOS'}
          </div>
        </div>
        <div
          style={{
            fontFamily: 'NeueBit',
            fontSize: 120,
            color: '#1D1D1F',
            marginTop: 24,
            lineHeight: 1,
          }}
        >
          {r ? `#${no}` : 'Brand station'}
        </div>
        <div style={{ fontFamily: 'VCR', fontSize: 30, color: '#1D1D1F', marginTop: 16 }}>
          {`@${shown}`}
        </div>
        {name && (
          <div style={{ fontFamily: 'NeueBit', fontSize: 48, color: '#0A84FF', marginTop: 8 }}>
            {name}
          </div>
        )}
        <div
          style={{
            fontFamily: 'VCR',
            fontSize: 20,
            letterSpacing: 3,
            color: '#6E6E73',
            marginTop: 28,
          }}
        >
          OPENING SOON · MYBRANDOS.APP
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'NeueBit', data: neueBit, style: 'normal', weight: 700 },
        { name: 'VCR', data: vcr, style: 'normal', weight: 400 },
      ],
    }
  );
}

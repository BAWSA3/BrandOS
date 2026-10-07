import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getReservationByHandle } from '@/lib/reservations';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

// X / link-preview image for /station/[handle]: the reserved plot with the
// handle on the sign, plus the station number and status. Literal paths under
// process.cwd() so Next's file tracing bundles the fonts and art.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'A reserved BrandOS brand station';
export const revalidate = 300;

// Sign face on the 504x630 pre-scaled day plot (from the measured percentages).
const SIGN = { left: 181, top: 318, width: 153, height: 77 };

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [r, neueBit, vcr, plot] = await Promise.all([
    getReservationByHandle(handle),
    readFile(join(process.cwd(), 'public', 'fonts', 'PPNeueBit-Bold.otf')),
    readFile(join(process.cwd(), 'public', 'fonts', 'VCR_OSD_MONO_1.001.ttf')),
    readFile(join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'plot-day-504x630.png')),
  ]);
  const plotSrc = `data:image/png;base64,${plot.toString('base64')}`;
  const name = r ? getArchetypeInfo(r.archetype ?? '')?.name : null;
  const no = r ? String(r.number).padStart(4, '0') : null;
  const shown = r?.handle ?? handle.replace(/^@/, '');
  const handleSize = Math.min(
    30,
    Math.floor((SIGN.width * 0.88) / (Math.max(shown.length + 1, 6) * 0.56))
  );

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', background: '#E8E8ED' }}>
      <div
        style={{ position: 'relative', width: 504, height: 630, display: 'flex', marginLeft: 48 }}
      >
        <img src={plotSrc} width={504} height={630} alt="" />
        {r && (
          <div
            style={{
              position: 'absolute',
              left: SIGN.left,
              top: SIGN.top,
              width: SIGN.width,
              height: SIGN.height,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontFamily: 'NeueBit', fontSize: handleSize, color: '#1D1D1F' }}>
              {`@${shown}`}
            </div>
            <div style={{ fontFamily: 'VCR', fontSize: 11, color: '#0A84FF', marginTop: 2 }}>
              {`STATION #${no}`}
            </div>
          </div>
        )}
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

import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import prisma from '@/lib/db';
import { indexEnabled } from '@/lib/index-rules';
import { fonts, wordmark } from '@/lib/og/editorial';

// Link preview for /index and a member's share link (/index?m=handle), in the
// Editorial system (bone, hairline header, huge grotesk figure, Klein): "No.
// 0042" with the member's handle and archetype. Everything shown comes from
// our own IndexEntry row (only the handle is read from the URL), and only for
// listed members; anything else gets the generic Index card.

const BLUE = '#0047FF';
const BONE = '#F2EFE8';
const INK = '#0E0E0E';
const MUTED = '#6B6B6B';
const CACHE = {
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
};

export async function GET(request: NextRequest) {
  if (!indexEnabled()) return new Response('Not found', { status: 404 });
  const raw = request.nextUrl.searchParams.get('h') ?? '';
  const handle = /^[A-Za-z0-9_]{1,15}$/.test(raw) ? raw.toLowerCase() : null;
  const [f, wm, entry, members] = await Promise.all([
    fonts(),
    wordmark(),
    handle
      ? prisma.indexEntry
          .findFirst({
            where: { handle, listed: true },
            select: { number: true, displayHandle: true, archetype: true, niches: true },
          })
          .catch(() => null)
      : Promise.resolve(null),
    prisma.indexEntry.count({ where: { listed: true } }).catch(() => 0),
  ]);
  const micro = { fontFamily: 'VCR', fontSize: 18, letterSpacing: 3, color: MUTED };

  return new ImageResponse(
    <div
      style={{ width: 1200, height: 630, display: 'flex', background: BONE, position: 'relative' }}
    >
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 52,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- satori */}
        <img
          src={`data:image/png;base64,${wm.toString('base64')}`}
          width={120}
          height={24}
          alt="BrandOS"
        />
        <div style={{ display: 'flex', ...micro }}>THE CREATOR INDEX</div>
        <div style={{ display: 'flex', ...micro }}>MYBRANDOS.APP/INDEX</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 88,
          height: 1,
          background: 'rgba(14,14,14,0.18)',
          display: 'flex',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 56px 52px',
          width: 1200,
        }}
      >
        {entry ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <span
                style={{
                  fontFamily: 'Grotesk',
                  fontSize: 72,
                  color: INK,
                  marginRight: 18,
                  marginBottom: 22,
                  letterSpacing: -2,
                }}
              >
                No.
              </span>
              <span
                style={{
                  fontFamily: 'Grotesk',
                  fontSize: 260,
                  lineHeight: 0.8,
                  letterSpacing: -12,
                  color: BLUE,
                }}
              >
                {String(entry.number).padStart(4, '0')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 34 }}>
              <span
                style={{
                  fontFamily: 'Grotesk',
                  fontSize: 44,
                  color: INK,
                  letterSpacing: -1,
                  marginRight: 20,
                }}
              >
                {`@${entry.displayHandle}`}
              </span>
              {entry.archetype && (
                <span
                  style={{
                    display: 'flex',
                    background: BLUE,
                    color: '#FFFFFF',
                    fontFamily: 'VCR',
                    fontSize: 20,
                    letterSpacing: 2,
                    padding: '6px 12px',
                  }}
                >
                  {entry.archetype.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', ...micro, marginTop: 22, color: INK }}>
              {entry.niches.length
                ? entry.niches.join('  /  ').toUpperCase()
                : 'IN THE BRANDOS CREATOR INDEX'}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Grotesk',
                fontSize: 132,
                lineHeight: 0.9,
                letterSpacing: -6,
                color: INK,
              }}
            >
              <span>The Creator</span>
              <span style={{ color: BLUE }}>Index.</span>
            </div>
            <div style={{ display: 'flex', ...micro, marginTop: 30, color: INK }}>
              {members > 0
                ? `${members} CREATORS WITH A REAL BRAND READ  /  GET YOUR NUMBER`
                : 'CREATORS WITH A REAL BRAND READ  /  GET YOUR NUMBER'}
            </div>
          </>
        )}
      </div>
    </div>,
    { width: 1200, height: 630, fonts: f, headers: CACHE }
  );
}

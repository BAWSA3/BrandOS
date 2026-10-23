import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { botCheckEnabled, cachedBotCheck, cleanBotHandle } from '@/lib/bot-check';
import { fonts, wordmark } from '@/lib/og/editorial';

// Link preview for /bots and /bots?h=handle, in the Editorial system (bone,
// hairline header, huge grotesk figure, Klein). The figure comes only from our
// own stored check (never from the URL) and this route never runs a check, so
// unfurls cost nothing; an unchecked handle gets the question.

const BLUE = '#0047FF';
const BONE = '#F2EFE8';
const INK = '#0E0E0E';
const MUTED = '#6B6B6B';
const CACHE = {
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
};

export async function GET(request: NextRequest) {
  if (!botCheckEnabled()) return new Response('Not found', { status: 404 });
  const handle = cleanBotHandle(request.nextUrl.searchParams.get('h'));
  const [f, wm, rec] = await Promise.all([
    fonts(),
    wordmark(),
    handle ? cachedBotCheck(handle) : Promise.resolve(null),
  ]);
  const pct = rec?.followers.pctReal ?? null;
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
        <div style={{ display: 'flex', ...micro }}>BOT CHECK</div>
        <div style={{ display: 'flex', ...micro }}>MYBRANDOS.APP/BOTS</div>
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
        {rec && pct !== null ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <span
                style={{
                  fontFamily: 'Grotesk',
                  fontSize: 260,
                  lineHeight: 0.8,
                  letterSpacing: -12,
                  color: BLUE,
                }}
              >
                {`${pct}%`}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'Grotesk',
                fontSize: 44,
                color: INK,
                marginTop: 30,
                letterSpacing: -1,
              }}
            >
              {`of @${rec.handle}'s newest ${rec.followers.sampled} followers look real`}
            </div>
            <div style={{ display: 'flex', ...micro, marginTop: 22, color: INK }}>
              HOW MANY BOTS FOLLOW YOU?
            </div>
          </>
        ) : (
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
            <span>how many bots</span>
            <span style={{ color: BLUE }}>follow you?</span>
          </div>
        )}
      </div>
    </div>,
    { width: 1200, height: 630, fonts: f, headers: CACHE }
  );
}

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getPublicScan } from '@/lib/public-scan';

// Link-preview image for /scan/<handle> and /card/<handle>. Scores come from
// our own record of the handle's latest scan, never from the URL (the old
// s/a/d/c/g/sc/n params are ignored), so a shared link can't show a fake
// score. Handles that were never scanned get a neutral "get your score" card.
// Node runtime (Prisma); cached at the edge so link unfurls don't hit the DB.

const CACHE = {
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const raw = (searchParams.get('u') || '').replace(/^@/, '').toLowerCase();
  const scan = raw ? await getPublicScan(raw) : null;
  if (!scan) return neutralCard(/^[a-z0-9_]{1,30}$/.test(raw) ? raw : null);

  const username = scan.handle;
  const score = scan.score;
  const archetype = scan.archetype || 'Unknown';
  const define = scan.phases?.define ?? 0;
  const check = scan.phases?.check ?? 0;
  const generate = scan.phases?.generate ?? 0;
  const scale = scan.phases?.scale ?? 0;
  const displayName = scan.name;

  const scoreColor =
    score >= 80 ? '#10B981' : score >= 60 ? '#0047FF' : score >= 40 ? '#F59E0B' : '#EF4444';

  // Drawn bars: the default OG font has no block glyphs (█░ rendered as boxes).
  function renderBar(value: number, color: string) {
    const pct = Math.max(0, Math.min(100, value));
    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '10px',
          background: 'rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', width: `${pct}%`, height: '10px', background: color }} />
      </div>
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 56px',
        fontFamily: 'monospace',
        position: 'relative',
      }}
    >
      {/* Scanline overlay effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)',
          display: 'flex',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: '#0047FF', fontSize: '14px', letterSpacing: '0.15em' }}>
            BRANDOS v2.0
          </div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>//</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', letterSpacing: '0.1em' }}>
            BRAND DNA SCAN RESULTS
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '0.1em' }}>
          mybrandos.app
        </div>
      </div>

      {/* Separator */}
      <div
        style={{
          color: 'rgba(255,255,255,0.15)',
          fontSize: '12px',
          marginBottom: '32px',
          display: 'flex',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            height: '1px',
            background: 'rgba(255,255,255,0.15)',
            marginTop: '8px',
          }}
        />
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: '48px', flex: 1 }}>
        {/* Left: Score + Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '400px' }}>
          {/* Username */}
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '14px',
              letterSpacing: '0.1em',
              marginBottom: '4px',
              display: 'flex',
            }}
          >
            {'> scanning @'}
            {username}
          </div>
          <div
            style={{
              color: '#fff',
              fontSize: '28px',
              fontWeight: 600,
              marginBottom: '24px',
              display: 'flex',
            }}
          >
            {displayName}
          </div>

          {/* Score circle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '60px',
                border: `4px solid ${scoreColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <div
                style={{ color: scoreColor, fontSize: '42px', fontWeight: 700, display: 'flex' }}
              >
                {score}
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  display: 'flex',
                }}
              >
                SCORE
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  display: 'flex',
                }}
              >
                ARCHETYPE
              </div>
              <div
                style={{
                  color: '#0047FF',
                  fontSize: '20px',
                  fontWeight: 600,
                  display: 'flex',
                  textTransform: 'uppercase' as const,
                }}
              >
                {archetype}
              </div>
            </div>
          </div>

          {/* Tier badge */}
          <div
            style={{
              display: 'flex',
              padding: '8px 16px',
              background: `${scoreColor}20`,
              border: `1px solid ${scoreColor}40`,
              borderRadius: '4px',
              // Satori rejects width: 'fit-content' (it emptied every image);
              // align-self: flex-start shrinks the box to its text instead.
              alignSelf: 'flex-start',
            }}
          >
            <span style={{ color: scoreColor, fontSize: '12px', letterSpacing: '0.12em' }}>
              {score >= 80
                ? 'ELITE'
                : score >= 70
                  ? 'STRONG'
                  : score >= 60
                    ? 'SOLID'
                    : score >= 50
                      ? 'BUILDING'
                      : 'EMERGING'}
            </span>
          </div>
        </div>

        {/* Right: Phase breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '12px',
              letterSpacing: '0.12em',
              marginBottom: '8px',
              display: 'flex',
            }}
          >
            PHASE BREAKDOWN
          </div>

          {[
            { label: 'DEFINE', score: define, color: '#E8A838' },
            { label: 'CHECK', score: check, color: '#10B981' },
            { label: 'GENERATE', score: generate, color: '#9D4EDD' },
            { label: 'SCALE', score: scale, color: '#0047FF' },
          ].map((phase) => (
            <div key={phase.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  color: phase.color,
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  width: '90px',
                  display: 'flex',
                }}
              >
                {phase.label}
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  paddingRight: '24px',
                }}
              >
                {renderBar(phase.score, phase.color)}
              </div>
              <div
                style={{
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  width: '40px',
                  textAlign: 'right',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                {phase.score}
              </div>
            </div>
          ))}

          {/* CTA */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              padding: '12px 20px',
              background: '#0047FF',
              borderRadius: '4px',
              // Satori rejects width: 'fit-content' (it emptied every image);
              // align-self: flex-start shrinks the box to its text instead.
              alignSelf: 'flex-start',
            }}
          >
            <span style={{ color: '#fff', fontSize: '13px', letterSpacing: '0.12em' }}>
              GET YOUR SCORE → mybrandos.app
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            color: 'rgba(255,255,255,0.2)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            display: 'flex',
          }}
        >
          {'// powered by AI brand intelligence'}
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            display: 'flex',
          }}
        >
          scan yours free at mybrandos.app
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: CACHE }
  );
}

/** Never-scanned (or invalid) handle: an honest invite instead of a 0/100 card. */
function neutralCard(handle: string | null) {
  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 72px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ display: 'flex', color: '#0047FF', fontSize: '18px', letterSpacing: '0.18em' }}>
        BRANDOS
      </div>
      <div
        style={{
          display: 'flex',
          color: '#FFFFFF',
          fontSize: '64px',
          marginTop: '24px',
          lineHeight: 1.05,
        }}
      >
        What&apos;s your brand score?
      </div>
      {handle && (
        <div
          style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '26px',
            marginTop: '20px',
          }}
        >
          {`@${handle} hasn't been scanned yet`}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignSelf: 'flex-start',
          marginTop: '48px',
          padding: '14px 22px',
          background: '#0047FF',
          color: '#FFFFFF',
          fontSize: '18px',
          letterSpacing: '0.12em',
        }}
      >
        SCAN YOURS FREE → mybrandos.app
      </div>
    </div>,
    { width: 1200, height: 630, headers: CACHE }
  );
}

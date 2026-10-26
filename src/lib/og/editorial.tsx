import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cloudsDataUrl } from '@/lib/og/dither';
import { FIELD_DENSITY, fieldMetrics } from '@/lib/field/system';

/**
 * Server-only. The one link-preview design (Direction A, "Editorial", approved
 * 2026-10-13): hairline header with micro labels, a huge grotesk figure, the
 * archetype tag, and the Brand Pass on the right (the person's X photo; a blank
 * pass for handles not scanned yet). Every shared link (scan, card, /@handle,
 * homepage) renders through here so they read as one system. Stations were
 * removed 2026-10-22.
 *
 * Score and invite cards sit on the field (approved 2026-10-26): the homepage's
 * Direction 03 dither (seed 11, no signal cell) with a bold Helvetica-style figure (TeX Gyre Heros)
 * and labels on Klein chips. The homepage card stays on bone.
 */

const BLUE = '#0047FF';
const BONE = '#F2EFE8';
const INK = '#0E0E0E';
const MUTED = '#6B6B6B';
const ON_FIELD_MUTED = 'rgba(255,255,255,0.75)';
export const OG_SIZE = { width: 1200, height: 630 };

/** The hero wordmark (brand tokens: the logo is never typed). */
export const wordmark = (mode: 'day' | 'white' = 'day') =>
  readFile(join(process.cwd(), 'public', 'brand', `wordmark-${mode}-480.png`));

/** The homepage field at card size, painted once per instance (it never changes). */
let fieldUrl: string | null = null;
function field(): string {
  if (!fieldUrl) {
    const m = fieldMetrics(OG_SIZE.width, OG_SIZE.height);
    fieldUrl = cloudsDataUrl({
      ...OG_SIZE,
      seed: 11,
      density: FIELD_DENSITY,
      cell: m.cell,
      grid: m.grid,
    });
  }
  return fieldUrl;
}

export async function fonts() {
  const [grotesk, display, vcr] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'fonts', 'Helvetica.ttf')),
    readFile(join(process.cwd(), 'public', 'fonts', 'TeXGyreHeros-Bold.otf')),
    readFile(join(process.cwd(), 'public', 'fonts', 'VCR_OSD_MONO_1.001.ttf')),
  ]);
  return [
    { name: 'Grotesk', data: grotesk, style: 'normal' as const, weight: 400 as const },
    // TeX Gyre Heros Bold (GUST Font License): a free Helvetica clone, for the bold figure and handle on field cards.
    { name: 'Display', data: display, style: 'normal' as const, weight: 700 as const },
    { name: 'VCR', data: vcr, style: 'normal' as const, weight: 400 as const },
  ];
}

/** A label on the field: a Klein chip so it reads over the dots (homepage style). */
const Chip = ({ children, size = 18 }: { children: string; size?: number }) => (
  <div
    style={{
      display: 'flex',
      background: BLUE,
      color: '#FFFFFF',
      fontFamily: 'VCR',
      fontSize: size,
      letterSpacing: 3,
      padding: '4px 9px',
    }}
  >
    {children}
  </div>
);

const Micro = ({
  children,
  color = MUTED,
  size = 18,
}: {
  children: string;
  color?: string;
  size?: number;
}) => (
  <div style={{ display: 'flex', fontFamily: 'VCR', fontSize: size, letterSpacing: 3, color }}>
    {children}
  </div>
);

export type EditorialCard =
  | {
      kind: 'score';
      handle: string;
      score: number;
      archetype: string | null;
      phases: { define: number; check: number; generate: number; scale: number } | null;
      /** Brand Pass on the right (approved P1): X avatar and taste line. */
      avatarUrl?: string | null;
      taste?: string | null;
    }
  | { kind: 'invite'; handle: string | null }
  | { kind: 'home' };

const LABEL: Record<EditorialCard['kind'], string> = {
  score: 'BRAND SCORE',
  invite: 'BRAND SCORE',
  home: 'BRAND INTELLIGENCE',
};

/**
 * The person's X avatar as a data URL, or null. Fetched here (not by the
 * renderer) so it's host-restricted and time-boxed: only X's image CDN, 3s,
 * <= 2MB. Any failure leaves a blank portrait.
 */
async function loadAvatar(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const u = new URL(url.replace('_normal', '_400x400'));
    if (u.protocol !== 'https:' || u.hostname !== 'pbs.twimg.com') return null;
    const res = await fetch(u, { signal: AbortSignal.timeout(3000) });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/^image\/(jpeg|png|webp)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 2_000_000) return null;
    return `data:${type.split(';')[0]};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

/** The simplified Brand Pass for previews (big portrait, handle, stamp, score). */
function Pass({
  handle,
  archetype,
  taste,
  score,
  portrait,
  onField = false,
}: {
  handle: string;
  archetype: string | null;
  taste: string | null;
  score: number | null;
  portrait: string | null;
  onField?: boolean;
}) {
  const s = 430 / 420;
  const code = `BOS-${handle.toUpperCase().slice(0, 12)}`;
  const rows: [string, string][] = [
    ['BRAND', `@${handle}`],
    ['ARCHETYPE', archetype ?? '—'],
    ...(taste ? ([['TASTE', taste]] as [string, string][]) : []),
    ['SCORE', `${score ?? '?'} / 100`],
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 430,
        background: '#ECE9E1',
        borderRadius: 16 * s,
        padding: `${26 * s}px ${26 * s}px ${22 * s}px`,
        boxShadow: `0 22px 50px rgba(0,0,0,${onField ? 0.38 : 0.28})`,
        transform: 'rotate(4deg)',
        color: INK,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{ fontFamily: 'Grotesk', fontSize: 40 * s, letterSpacing: -1, lineHeight: 1 }}
          >
            BRAND PASS
          </span>
          <span
            style={{
              fontFamily: 'VCR',
              fontSize: 12 * s,
              letterSpacing: 2,
              color: MUTED,
              marginTop: 6 * s,
            }}
          >
            {`CARD CODE: ${code}`}
          </span>
        </div>
        {archetype && (
          <div
            style={{
              display: 'flex',
              width: 70 * s,
              height: 70 * s,
              borderRadius: 35 * s,
              border: `${3 * s}px solid ${BLUE}`,
              alignItems: 'center',
              justifyContent: 'center',
              color: BLUE,
              fontFamily: 'VCR',
              fontSize: (archetype.length > 6 ? 11 : 15) * s,
              transform: 'rotate(-12deg)',
            }}
          >
            {archetype}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', marginTop: 18 * s }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 168 * s }}>
          <div
            style={{
              display: 'flex',
              width: 168 * s,
              height: 210 * s,
              background: '#D9D5CB',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {portrait ? (
              <img src={portrait} width={168 * s} height={210 * s} style={{ objectFit: 'cover' }} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Grotesk',
                  fontSize: 96 * s,
                  color: INK,
                  opacity: 0.25,
                }}
              >
                {(handle[0] ?? '?').toUpperCase()}
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              background: BLUE,
              color: '#FFFFFF',
              fontFamily: 'VCR',
              fontSize: 13 * s,
              letterSpacing: 2,
              padding: `${6 * s}px 0`,
              marginTop: 8 * s,
            }}
          >
            {'* BRANDOS *'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 18 * s, flex: 1 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', marginBottom: 11 * s }}>
              <span style={{ fontFamily: 'VCR', fontSize: 11 * s, letterSpacing: 2, color: MUTED }}>
                {k}
              </span>
              <span
                style={{
                  fontFamily: 'Grotesk',
                  fontSize: (v.length > 16 ? 16 : 19) * s,
                  lineHeight: 1.15,
                  marginTop: 2 * s,
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 14 * s,
        }}
      >
        <div style={{ display: 'flex' }}>
          {Array.from({ length: 34 }, (_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                width: (i * 7 + handle.length) % 3 === 0 ? 4 * s : 1.6 * s,
                height: 30 * s,
                background: INK,
                marginRight: 2 * s,
              }}
            />
          ))}
        </div>
        <span style={{ fontFamily: 'VCR', fontSize: 11 * s, color: MUTED, letterSpacing: 2 }}>
          MYBRANDOS.APP
        </span>
      </div>
    </div>
  );
}

/** Handle size that fits the left column (long handles step down). */
const handleSize = (h: string) => (h.length > 15 ? 26 : h.length > 11 ? 30 : 34);

export async function editorialImage(card: EditorialCard, headers?: Record<string, string>) {
  // Score + invite cards sit on the field; the homepage card keeps the bone canvas.
  const onField = card.kind !== 'home';
  const [f, avatar, wm] = await Promise.all([
    fonts(),
    card.kind === 'score' ? loadAvatar(card.avatarUrl) : Promise.resolve(null),
    wordmark(onField ? 'white' : 'day'),
  ]);

  const figure = card.kind === 'score' ? String(card.score) : card.kind === 'invite' ? '?' : null;
  const handle =
    card.kind === 'home' || (card.kind === 'invite' && !card.handle) ? null : card.handle;
  const tag = card.kind === 'score' && card.archetype ? card.archetype : null;
  const note =
    card.kind === 'invite'
      ? 'NOT SCANNED YET · SCAN FREE'
      : card.kind === 'home'
        ? 'SCAN YOUR X FREE'
        : null;
  const phases = card.kind === 'score' ? card.phases : null;
  const logo = `data:image/png;base64,${wm.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        background: onField ? BLUE : BONE,
        position: 'relative',
      }}
    >
      {onField && (
        // eslint-disable-next-line @next/next/no-img-element -- satori
        <img
          src={field()}
          width={1200}
          height={630}
          alt=""
          style={{ position: 'absolute', left: 0, top: 0 }}
        />
      )}

      {/* header: micro labels (on Klein chips over the field, on a hairline on bone) */}
      <div
        style={{
          position: 'absolute',
          left: onField ? 44 : 56,
          right: onField ? 44 : 56,
          top: onField ? 36 : 52,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {onField ? (
          <div style={{ display: 'flex', background: BLUE, padding: '6px 8px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori */}
            <img src={logo} width={120} height={24} alt="BrandOS" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- satori
          <img src={logo} width={120} height={24} alt="BrandOS" />
        )}
        {onField ? <Chip>{LABEL[card.kind]}</Chip> : <Micro>{LABEL[card.kind]}</Micro>}
        {onField ? <Chip>MYBRANDOS.APP</Chip> : <Micro>MYBRANDOS.APP</Micro>}
      </div>
      {!onField && (
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
      )}

      {/* left column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingLeft: onField ? 44 : 52,
          paddingBottom: onField ? 40 : 46,
          width: 700,
        }}
      >
        {card.kind === 'home' ? (
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
            <span>Your brand,</span>
            <span style={{ color: BLUE }}>scored.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <span
              style={{
                fontFamily: 'Display',
                fontWeight: 700,
                fontSize: 330,
                lineHeight: 0.76,
                letterSpacing: -21,
                color: '#FFFFFF',
              }}
            >
              {figure}
            </span>
            <div style={{ display: 'flex', marginLeft: 14, marginBottom: 14 }}>
              <Chip size={22}>/100</Chip>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', marginTop: onField ? 28 : 30 }}>
          {handle && (
            <span
              style={{
                display: 'flex',
                fontFamily: onField ? 'Display' : 'Grotesk',
                fontWeight: onField ? 700 : 400,
                fontSize: handleSize(handle),
                letterSpacing: onField ? -1 : 0,
                color: onField ? '#FFFFFF' : INK,
                background: onField ? BLUE : 'transparent',
                padding: onField ? '0 8px 2px' : 0,
                marginRight: onField ? 12 : 18,
              }}
            >
              @{handle}
            </span>
          )}
          {tag && (
            <span
              style={{
                display: 'flex',
                background: onField ? '#FFFFFF' : BLUE,
                color: onField ? BLUE : '#FFFFFF',
                fontFamily: 'VCR',
                fontSize: 20,
                letterSpacing: 3,
                padding: '7px 12px',
              }}
            >
              {tag}
            </span>
          )}
          {note && (onField ? <Chip>{note}</Chip> : <Micro>{note}</Micro>)}
        </div>

        {phases && (
          <div
            style={{
              display: 'flex',
              marginTop: 22,
              background: BLUE,
              padding: '10px 8px 12px',
            }}
          >
            {(
              [
                ['DEFINE', phases.define],
                ['CHECK', phases.check],
                ['GENERATE', phases.generate],
                ['SCALE', phases.scale],
              ] as [string, number][]
            ).map(([k, v], i) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 124,
                  marginRight: i < 3 ? 22 : 0,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Micro size={14} color={ON_FIELD_MUTED}>
                    {k}
                  </Micro>
                  <Micro color="#FFFFFF" size={14}>
                    {String(v)}
                  </Micro>
                </div>
                <div
                  style={{
                    display: 'flex',
                    height: 4,
                    background: 'rgba(255,255,255,0.25)',
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: `${Math.max(0, Math.min(100, v))}%`,
                      background: '#FFFFFF',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* right: the person's Brand Pass (P1); a blank pass for handles not scanned yet */}
      <div style={{ position: 'absolute', right: 64, top: 124, display: 'flex' }}>
        {card.kind === 'score' ? (
          <Pass
            handle={card.handle}
            archetype={card.archetype}
            taste={card.taste ?? null}
            score={card.score}
            portrait={avatar}
            onField
          />
        ) : (
          <Pass
            handle={handle ?? 'you'}
            archetype={null}
            taste={null}
            score={null}
            portrait={null}
            onField={onField}
          />
        )}
      </div>
    </div>,
    { ...OG_SIZE, fonts: f, headers }
  );
}

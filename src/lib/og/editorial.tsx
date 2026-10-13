import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Server-only. The one link-preview design (Direction A, "Editorial", approved
 * 2026-10-13): bone canvas, hairline header with micro labels, a huge grotesk
 * figure, a Klein-blue archetype tag, and the photoreal 3D station on the
 * right. Every shared link (station, scan, card, homepage) renders through
 * here so they read as one system.
 *
 * Art: public/worlds/stations/og/editorial-<slug>.png (transparent, 520px
 * tall) + editorial-lineup.png. One literal path per file so Next's file
 * tracing bundles them all.
 */

const BLUE = '#0047FF';
const BONE = '#F2F0EF';
const INK = '#0E0E0E';
const MUTED = '#6B6B6B';
export const OG_SIZE = { width: 1200, height: 630 };

const ART: Record<string, () => Promise<Buffer>> = {
  arc: () =>
    readFile(join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'editorial-arc.png')),
  'build-exe': () =>
    readFile(join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'editorial-build-exe.png')),
  entropy: () =>
    readFile(join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'editorial-entropy.png')),
  foresight: () =>
    readFile(join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'editorial-foresight.png')),
  freq: () =>
    readFile(join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'editorial-freq.png')),
  null: () =>
    readFile(join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'editorial-null.png')),
  relay: () =>
    readFile(join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'editorial-relay.png')),
  source: () =>
    readFile(join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'editorial-source.png')),
  lineup: () =>
    readFile(join(process.cwd(), 'public', 'worlds', 'stations', 'og', 'editorial-lineup.png')),
};

/** 'BUILD.EXE' -> 'build-exe' when there's 3D art for it. */
export function artSlug(archetype: string | null | undefined): string | null {
  const s = (archetype ?? '').trim().toLowerCase().replace(/\./g, '-');
  return s && s !== 'lineup' && ART[s] ? s : null;
}

async function fonts() {
  const [grotesk, vcr] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'fonts', 'Helvetica.ttf')),
    readFile(join(process.cwd(), 'public', 'fonts', 'VCR_OSD_MONO_1.001.ttf')),
  ]);
  return [
    { name: 'Grotesk', data: grotesk, style: 'normal' as const, weight: 400 as const },
    { name: 'VCR', data: vcr, style: 'normal' as const, weight: 400 as const },
  ];
}

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
  | { kind: 'station'; handle: string; number: string; archetype: string | null }
  | { kind: 'unclaimed'; handle: string }
  | {
      kind: 'score';
      handle: string;
      score: number;
      archetype: string | null;
      phases: { define: number; check: number; generate: number; scale: number } | null;
    }
  | { kind: 'invite'; handle: string | null }
  | { kind: 'home' };

const LABEL: Record<EditorialCard['kind'], string> = {
  station: 'STATION RESERVED',
  unclaimed: 'BRAND STATION',
  score: 'BRAND SCORE',
  invite: 'BRAND SCORE',
  home: 'BRAND INTELLIGENCE',
};

/** Handle size that fits the left column (long handles step down). */
const handleSize = (h: string) => (h.length > 15 ? 26 : h.length > 11 ? 30 : 34);

export async function editorialImage(card: EditorialCard, headers?: Record<string, string>) {
  const slug = card.kind === 'station' || card.kind === 'score' ? artSlug(card.archetype) : null;
  const [art, f] = await Promise.all([(slug ? ART[slug] : ART.lineup)(), fonts()]);
  const artSrc = `data:image/png;base64,${art.toString('base64')}`;
  const lineup = !slug;

  const figure =
    card.kind === 'station'
      ? `#${card.number}`
      : card.kind === 'score'
        ? String(card.score)
        : card.kind === 'invite'
          ? '?'
          : card.kind === 'unclaimed'
            ? 'Claim'
            : null;
  const handle =
    card.kind === 'home' || (card.kind === 'invite' && !card.handle) ? null : card.handle;
  const tag =
    (card.kind === 'station' || card.kind === 'score') && card.archetype ? card.archetype : null;
  const note =
    card.kind === 'unclaimed'
      ? 'NOT CLAIMED YET'
      : card.kind === 'invite'
        ? 'NOT SCANNED YET · SCAN FREE'
        : card.kind === 'home'
          ? 'SCAN YOUR X FREE · GET YOUR STATION'
          : null;
  const phases = card.kind === 'score' ? card.phases : null;

  return new ImageResponse(
    <div
      style={{ width: 1200, height: 630, display: 'flex', background: BONE, position: 'relative' }}
    >
      {/* header: micro labels on a hairline */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 52,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Micro color={INK}>BRANDOS</Micro>
        <Micro>{LABEL[card.kind]}</Micro>
        <Micro>MYBRANDOS.APP</Micro>
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

      {/* left column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingLeft: 52,
          paddingBottom: 46,
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
                fontFamily: 'Grotesk',
                // '#0000' is wider than a score: sized so any station number clears the art
                fontSize: card.kind === 'unclaimed' ? 210 : card.kind === 'station' ? 200 : 300,
                lineHeight: 0.8,
                letterSpacing: -14,
                color: card.kind === 'invite' ? BLUE : INK,
              }}
            >
              {figure}
            </span>
            {(card.kind === 'score' || card.kind === 'invite') && (
              <span
                style={{
                  fontFamily: 'VCR',
                  fontSize: 26,
                  color: MUTED,
                  marginLeft: 12,
                  marginBottom: 18,
                }}
              >
                /100
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 30 }}>
          {handle && (
            <span
              style={{
                fontFamily: 'Grotesk',
                fontSize: handleSize(handle),
                color: INK,
                marginRight: 18,
              }}
            >
              @{handle}
            </span>
          )}
          {tag && (
            <span
              style={{
                display: 'flex',
                background: BLUE,
                color: '#FFFFFF',
                fontFamily: 'VCR',
                fontSize: 20,
                letterSpacing: 3,
                padding: '7px 12px',
              }}
            >
              {tag}
            </span>
          )}
          {note && <Micro>{note}</Micro>}
        </div>

        {phases && (
          <div style={{ display: 'flex', marginTop: 26 }}>
            {(
              [
                ['DEFINE', phases.define],
                ['CHECK', phases.check],
                ['GENERATE', phases.generate],
                ['SCALE', phases.scale],
              ] as [string, number][]
            ).map(([k, v]) => (
              <div
                key={k}
                style={{ display: 'flex', flexDirection: 'column', width: 130, marginRight: 22 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Micro size={14}>{k}</Micro>
                  <Micro color={INK} size={14}>
                    {String(v)}
                  </Micro>
                </div>
                <div
                  style={{
                    display: 'flex',
                    height: 4,
                    background: 'rgba(14,14,14,0.1)',
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: `${Math.max(0, Math.min(100, v))}%`,
                      background: INK,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* right: the photoreal station (or the three-station lineup) */}
      {lineup ? (
        <img
          src={artSrc}
          width={480}
          height={540}
          style={{ position: 'absolute', right: 30, bottom: 0 }}
        />
      ) : (
        <img src={artSrc} height={500} style={{ position: 'absolute', right: 70, bottom: 18 }} />
      )}
    </div>,
    { ...OG_SIZE, fonts: f, headers }
  );
}

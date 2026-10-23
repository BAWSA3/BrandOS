import type { Metadata } from 'next';
import DitherField from '@/components/field/DitherField';
import MetaStrip from '@/components/field/MetaStrip';
import { FIELD_FONTS } from '@/components/field/fieldFonts';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import { avatarSrc } from '@/lib/field/avatar';
import { clouds } from '@/lib/field/dither';
import { ditherPng, pngDataUrl } from '@/lib/og/dither';

// Direction 02 foundations (docs/BRAND-WORLD.md): the field, the metadata strip,
// a member photo, a product moment and a share image from the server dither.
// Sample data only; nothing here is on a live page yet.

export const metadata: Metadata = { title: 'The field · BrandOS preview', robots: 'noindex' };

const BONE = '#F2EFE8';
const INK = '#0E0E0E';
const VCR = "'VCR OSD Mono', monospace";
// Small text on the field sits on a Klein chip so it stays readable over dense dots.
const chip = { background: 'var(--field)', padding: '3px 6px' } as const;

const label = (t: string, color = '#6B6862') => (
  <div
    style={{
      fontFamily: VCR,
      fontSize: 11,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color,
    }}
  >
    {t}
  </div>
);

export default function FieldPreview() {
  const og = ditherPng(clouds(23, 0.4), {
    width: 1200,
    height: 630,
    cell: 6,
    grid: 150,
    signalCell: [5, 1],
  });

  return (
    <main
      className={FIELD_FONTS.plexVariable}
      style={{ background: BONE, color: INK, minHeight: '100vh', paddingBottom: 80 }}
    >
      <section style={{ position: 'relative', minHeight: 'clamp(460px, 64vw, 680px)' }}>
        <DitherField sampler="clouds" seed={11} grid="auto" signalCell={[5, 1]} />
        <div
          style={{
            position: 'relative',
            minHeight: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 32,
            padding: 'clamp(18px, 3.5vw, 40px)',
            color: '#fff',
            fontFamily: FIELD_FONTS.plex,
            fontSize: 13,
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
          >
            <span style={chip}>brandos / the index</span>
            <span style={chip}>field 01 / 51°30′n 0°7′w</span>
          </div>
          <div>
            <span style={{ ...chip, display: 'inline-block' }}>
              {label('The record of creator reputation', '#fff')}
            </span>
            <h1
              style={{
                fontFamily: DASH_FONTS.big,
                fontWeight: 600,
                fontSize: 'clamp(52px, 10.5vw, 160px)',
                lineHeight: 0.9,
                letterSpacing: '-0.045em',
                margin: '12px 0 0',
                maxWidth: '11ch',
              }}
            >
              Reputation, on the record.
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(15px, 1.6vw, 19px)',
              lineHeight: 1.45,
              alignSelf: 'flex-start',
              background: 'var(--field)',
              padding: '6px 10px 6px 0',
            }}
          >
            the index opens nov 2.
            <br />
            claim your number.
          </p>
        </div>
      </section>
      <MetaStrip
        items={[
          'DOC — 02  //  THE INDEX',
          '№(0001)',
          'ENTRY No. 0042',
          'CLASS 03 / BUILD.EXE',
          'SCORE 76/100',
          'ENTERED 2 NOV 2026',
          'FOUNDING 100',
          'MYBRANDOS.APP',
        ]}
      />

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 16px 0' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {[
            {
              name: 'Members',
              note: 'A profile photo through /api/avatar, dithered. Initials if there is none.',
              field: (
                <DitherField
                  sampler="image"
                  src={avatarSrc('galileowilson')}
                  fallbackText="GW"
                  ariaLabel="@galileowilson, dithered"
                />
              ),
            },
            {
              name: 'Nature',
              note: 'Procedural clouds with the grid and the one coral cell.',
              field: (
                <DitherField sampler="clouds" seed={112} cell={4} grid={64} signalCell={[1, 2]} />
              ),
            },
            {
              name: 'Product moments',
              note: 'A score through the same dither.',
              field: <DitherField sampler="number" text="76" cell={4} ariaLabel="Score 76" />,
            },
          ].map((s) => (
            <figure key={s.name} style={{ margin: 0, minWidth: 0 }}>
              <div style={{ position: 'relative', aspectRatio: '4 / 5', maxWidth: '100%' }}>
                {s.field}
              </div>
              <figcaption
                style={{ display: 'grid', gap: 6, paddingTop: 12, fontSize: 14, color: '#4A4741' }}
              >
                {label(s.name, '#0047FF')}
                <span>{s.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div style={{ marginTop: 56 }}>
          {label(`Share image · server dither · 1200×630 · ${Math.round(og.length / 1024)} KB`)}
          {/* eslint-disable-next-line @next/next/no-img-element -- a generated data URL */}
          <img
            src={pngDataUrl(og)}
            alt="A dithered cloud field with a white grid and one coral cell, rendered on the server"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 1200,
              height: 'auto',
              marginTop: 12,
            }}
          />
        </div>
      </section>
    </main>
  );
}

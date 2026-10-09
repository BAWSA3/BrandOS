'use client';

import Link from 'next/link';
import {
  BIG_FONTS,
  MONO_FONTS,
  PASS_FONTS,
  type FontOption,
} from '@/components/dashboard/dashFonts';

// Font review for the dashboard's three type roles, matched against the
// references. Each candidate is set as it would appear in a tile. Open the
// dashboard with a choice via the links (or use the switcher there).

const C = {
  canvas: '#0B0B0C',
  tile: '#161618',
  rule: 'rgba(231,231,228,0.08)',
  ink: '#E7E7E4',
  muted: '#8A8A86',
  blue: '#0047FF',
  bone: '#ECE9E1',
};

function Section({
  code,
  title,
  note,
  children,
}: {
  code: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-3 border-b pb-3" style={{ borderColor: C.rule }}>
        <span
          className="text-[12px]"
          style={{ color: C.blue, fontFamily: 'ui-monospace, monospace' }}
        >
          {code}
        </span>
        <h2 className="text-[20px] font-semibold">{title}</h2>
        <span className="text-[13px]" style={{ color: C.muted }}>
          {note}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function MonoSpecimen({ f, i }: { f: FontOption; i: number }) {
  return (
    <div
      className="p-5"
      style={{ background: C.tile, border: `1px solid ${C.rule}`, fontFamily: f.family }}
    >
      <div
        className="flex justify-between text-[11px] uppercase tracking-[0.14em]"
        style={{ color: C.muted }}
      >
        <span>Today&apos;s focus</span>
        <span>A{i + 1}</span>
      </div>
      <div className="mt-6 flex items-end gap-2">
        <span className="text-[56px] leading-none">72</span>
        <span className="pb-1 text-[13px]" style={{ color: C.muted }}>
          / 100
        </span>
      </div>
      <div className="mt-4 text-[13px] uppercase leading-[1.3]">Aesthetic-usability effect</div>
      <div className="mt-3 flex gap-4 text-[11px]" style={{ color: C.muted }}>
        <span>FOLLOWERS 4,812</span>
        <span>7D +2.4%</span>
      </div>
      <div className="mt-3 text-[11px]" style={{ color: C.blue }}>
        {f.label}
      </div>
    </div>
  );
}

function BigSpecimen({ f, i }: { f: FontOption; i: number }) {
  return (
    <div className="p-5" style={{ background: C.tile, border: `1px solid ${C.rule}` }}>
      <div
        className="flex justify-between text-[11px] uppercase tracking-[0.14em]"
        style={{ color: C.muted, fontFamily: 'ui-monospace, monospace' }}
      >
        <span>Brand score</span>
        <span>B{i + 1}</span>
      </div>
      <div
        className="mt-4 leading-none"
        style={{ fontFamily: f.family, fontSize: 84, fontWeight: 500, letterSpacing: '-0.03em' }}
      >
        +18.4%
      </div>
      <div className="mt-3 text-[30px]" style={{ fontFamily: f.family, fontWeight: 500 }}>
        Find your taste
      </div>
      <div
        className="mt-3 text-[11px]"
        style={{ color: C.blue, fontFamily: 'ui-monospace, monospace' }}
      >
        {f.label}
      </div>
    </div>
  );
}

function PassSpecimen({ f, i }: { f: FontOption; i: number }) {
  return (
    <div className="p-5" style={{ background: C.tile, border: `1px solid ${C.rule}` }}>
      <div
        className="rounded-[8px] p-4"
        style={{ background: C.bone, color: '#141414', fontFamily: f.family }}
      >
        <div className="flex justify-between">
          <span className="text-[26px] font-bold leading-none">PASS CARD</span>
          <span className="text-[11px]">C{i + 1}</span>
        </div>
        <div className="mt-1 text-[10px] opacity-70">CARD CODE: BOS-0002-JBAWSA</div>
        <div className="mt-4 space-y-1 text-[15px]">
          <div>
            <b>Brand:</b> @jbawsa
          </div>
          <div>
            <b>Style:</b> BUILD.EXE
          </div>
          <div>
            <b>Type:</b> Builder pass
          </div>
        </div>
      </div>
      <div
        className="mt-3 text-[11px]"
        style={{ color: C.blue, fontFamily: 'ui-monospace, monospace' }}
      >
        {f.label}
      </div>
    </div>
  );
}

export default function FontsPreviewPage() {
  return (
    <main
      className="min-h-screen px-5 pb-16 pt-8 md:px-10"
      style={{ background: C.canvas, color: C.ink }}
    >
      <div className="mx-auto max-w-[1280px]">
        <div
          className="text-[11px] uppercase tracking-[0.14em]"
          style={{ color: C.muted, fontFamily: 'ui-monospace, monospace' }}
        >
          BrandOS / Dashboard / Font review
        </div>
        <h1 className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.03em]">
          Pick one per row.
        </h1>
        <p className="mt-3 max-w-[620px] text-[14px]" style={{ color: C.muted }}>
          Tell me the codes (e.g. A2, B1, C2), or try combinations live on the{' '}
          <Link href="/world-preview/dashboard" className="underline" style={{ color: C.ink }}>
            dashboard preview
          </Link>{' '}
          with the switcher in the corner.
        </p>

        <Section code="A" title="Labels + data" note="Ref 1: squared technical mono">
          {MONO_FONTS.map((f, i) => (
            <MonoSpecimen key={f.key} f={f} i={i} />
          ))}
        </Section>
        <Section
          code="B"
          title="Big numbers + headings"
          note="Ref 2: tight grotesk (or ref 1's mono numerals)"
        >
          {BIG_FONTS.map((f, i) => (
            <BigSpecimen key={f.key} f={f} i={i} />
          ))}
        </Section>
        <Section code="C" title="Brand Pass" note="Ref 3: typewriter">
          {PASS_FONTS.map((f, i) => (
            <PassSpecimen key={f.key} f={f} i={i} />
          ))}
        </Section>
      </div>
    </main>
  );
}

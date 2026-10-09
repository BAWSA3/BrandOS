'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Inter_Tight } from 'next/font/google';
import StationStage from '@/components/studio/StationStage';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { STAGE_HEADLINES, STUDIO_STEPS, type StageNumber } from '@/lib/studio-stages';
import type { Mode } from '@/components/StationCard';

// The studio home (docs/specs/ONBOARDING-BUILDING-GAME.md): the user's station
// on the right, the three build steps on the left, one clear next step.
// Swiss-editorial frame (grey canvas, big grotesk, micro-labels, hairlines)
// with Klein blue as the only accent.

const display = Inter_Tight({ subsets: ['latin'], weight: ['500', '700', '800'] });

const C = {
  canvas: '#E7E7E4',
  ink: '#0E0E0E',
  muted: '#6B6B6B',
  rule: 'rgba(14,14,14,0.16)',
  blue: '#0047FF',
};
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

export interface StudioViewProps {
  handle: string | null;
  archetype: string | null;
  stage: StageNumber;
  /** Where each step's screen lives; null while that step isn't built yet. */
  stepHrefs?: Partial<Record<1 | 2 | 3, string | null>>;
}

function Micro({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[11px] uppercase tracking-[0.14em] ${className}`} style={{ fontFamily: MONO, color: C.muted }}>
      {children}
    </div>
  );
}

export default function StudioView({ handle, archetype, stage, stepHrefs = {} }: StudioViewProps) {
  const [mode, setMode] = useState<Mode>('day');
  const info = archetype ? getArchetypeInfo(archetype) : null;
  const next = STUDIO_STEPS.find((s) => s.stage === stage + 1) ?? null;
  const nextHref = next ? stepHrefs[next.stage] ?? null : null;

  return (
    <main className={`${display.className} min-h-screen`} style={{ background: C.canvas, color: C.ink }}>
      <div className="mx-auto flex min-h-screen max-w-[1320px] flex-col px-5 pb-8 pt-6 md:px-10">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 border-b pb-4" style={{ borderColor: C.rule }}>
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-3 gap-[2px]" aria-hidden>
              {[1, 0, 1, 0, 1, 0, 1, 0, 1].map((on, i) => (
                <span key={i} className="h-[5px] w-[5px]" style={{ background: on ? C.blue : 'transparent' }} />
              ))}
            </div>
            <Micro>BrandOS / Studio</Micro>
          </div>
          <div className="flex items-center gap-5">
            {handle && <Micro className="hidden sm:block">@{handle}</Micro>}
            <Link href="/dashboard" className="text-[13px] font-medium underline-offset-4 hover:underline">
              Dashboard
            </Link>
          </div>
        </header>

        <div className="grid flex-1 gap-10 pt-8 md:grid-cols-[1fr_minmax(0,520px)] md:gap-14 md:pt-12">
          {/* Left: where you are, what's next */}
          <section className="flex flex-col">
            <Micro>
              Stage {stage} / 3{info ? ` · ${info.name}` : ''}
            </Micro>
            <h1
              className="mt-3 font-extrabold leading-[0.92]"
              style={{ fontSize: 'clamp(44px, 7.2vw, 104px)', letterSpacing: '-0.045em' }}
            >
              {archetype ? STAGE_HEADLINES[stage] : 'Your plot is waiting.'}
            </h1>
            <p className="mt-5 max-w-[460px] text-[17px] leading-[1.45]" style={{ color: C.muted }}>
              {!archetype
                ? 'Scan your X handle to get your blueprint. Your station is built from it, floor by floor.'
                : stage === 3
                  ? 'Your station matches its blueprint. Keep posting on brand to keep the lights on.'
                  : 'Every step you take on your brand builds a floor. Three steps to a finished station.'}
            </p>

            {/* The three steps */}
            <ol className="mt-10 border-t" style={{ borderColor: C.rule }}>
              {STUDIO_STEPS.map((s) => {
                const built = stage >= s.stage;
                const isNext = s.stage === stage + 1 && !!archetype;
                return (
                  <li
                    key={s.stage}
                    className="grid grid-cols-[44px_1fr_auto] items-baseline gap-3 border-b py-4"
                    style={{ borderColor: C.rule, opacity: built || isNext ? 1 : 0.45 }}
                  >
                    <span className="text-[13px] tabular-nums" style={{ fontFamily: MONO, color: isNext ? C.blue : C.muted }}>
                      0{s.stage}
                    </span>
                    <div>
                      <div className="text-[20px] font-bold leading-tight tracking-[-0.02em]">{s.verb}</div>
                      <div className="mt-1 text-[14px]" style={{ color: C.muted }}>
                        {s.line}
                      </div>
                    </div>
                    <Micro className={built ? '' : isNext ? '!text-[#0047FF]' : ''}>
                      {built ? `${s.name} built` : isNext ? 'Next' : s.name}
                    </Micro>
                  </li>
                );
              })}
            </ol>

            {/* One clear next step */}
            <div className="mt-8">
              {!archetype ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 px-6 py-4 text-[15px] font-bold text-white"
                  style={{ background: C.blue }}
                >
                  Scan your X handle <span aria-hidden>→</span>
                </Link>
              ) : next ? (
                nextHref ? (
                  <Link
                    href={nextHref}
                    className="inline-flex items-center gap-3 px-6 py-4 text-[15px] font-bold text-white"
                    style={{ background: C.blue }}
                  >
                    {next.verb} <span aria-hidden>→</span>
                  </Link>
                ) : (
                  <div className="flex flex-wrap items-center gap-4">
                    <span
                      className="inline-flex cursor-not-allowed items-center gap-3 px-6 py-4 text-[15px] font-bold text-white"
                      style={{ background: C.blue, opacity: 0.4 }}
                      aria-disabled
                    >
                      {next.verb} <span aria-hidden>→</span>
                    </span>
                    <Micro>Opens soon</Micro>
                  </div>
                )
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 px-6 py-4 text-[15px] font-bold text-white"
                  style={{ background: C.blue }}
                >
                  Open your dashboard <span aria-hidden>→</span>
                </Link>
              )}
            </div>
          </section>

          {/* Right: the station (first on phones: it's the hero) */}
          <section className="order-first flex flex-col md:order-none">
            <div className="flex items-center justify-between pb-3">
              <Micro>{handle ? `Station of @${handle}` : 'Your station'}</Micro>
              <div className="flex gap-1" role="group" aria-label="Time of day">
                {(['day', 'night'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className="px-2 py-1 text-[11px] uppercase tracking-[0.14em]"
                    style={{
                      fontFamily: MONO,
                      color: mode === m ? '#fff' : C.muted,
                      background: mode === m ? C.ink : 'transparent',
                    }}
                    aria-pressed={mode === m}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-hidden border" style={{ borderColor: C.rule }}>
              <StationStage archetype={archetype} stage={stage} mode={mode} />
            </div>
            <div className="mt-3 flex justify-between">
              <Micro>{stage === 3 ? 'Blueprint complete' : `${stage} of 3 floors built`}</Micro>
              <Micro>{info?.tagline ?? ''}</Micro>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

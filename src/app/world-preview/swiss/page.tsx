import { Inter_Tight } from 'next/font/google';

// Preview of the Swiss-editorial direction (2026-10-06): Swiss editorial as
// the frame (huge cropped grotesk, grey canvas, micro-labels, hairlines,
// asymmetric grid), Klein blue as the single accent, the pixel stations and
// VCR-mono labels as the imagery/texture. Not linked from the app; for review
// before rolling the system out surface by surface.

const display = Inter_Tight({ subsets: ['latin'] });

const C = {
  canvas: '#E7E7E4',
  ink: '#0E0E0E',
  muted: '#6B6B6B',
  rule: 'rgba(14,14,14,0.18)',
  blue: '#0047FF',
};
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

function Micro({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[11px] leading-[1.35] ${className}`} style={{ color: C.muted }}>
      {children}
    </div>
  );
}

export default function SwissPreview() {
  return (
    <main
      className={`${display.className} relative min-h-screen overflow-hidden`}
      style={{ background: C.canvas, color: C.ink }}
    >
      {/* Giant faint wordmark behind everything, cropped off the right edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none font-extrabold leading-none"
        style={{
          right: '-6vw',
          top: '18vh',
          fontSize: '46vw',
          letterSpacing: '-0.08em',
          color: '#DEDEDA',
        }}
      >
        OS
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 pb-5 pt-20 md:px-10 md:pb-8 md:pt-16">
        {/* Top bar */}
        <header className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-8">
            <div>
              <div className="grid w-fit grid-cols-3 gap-[2px]" aria-hidden>
                {[1, 0, 1, 0, 1, 0, 1, 0, 1].map((on, i) => (
                  <span
                    key={i}
                    className="h-[5px] w-[5px]"
                    style={{ background: on ? C.blue : 'transparent' }}
                  />
                ))}
              </div>
              <div className="mt-2 text-[14px] font-semibold tracking-[-0.02em]">BrandOS</div>
            </div>
            <Micro className="hidden md:block">
              Brand intelligence
              <br />
              for creators
            </Micro>
          </div>
          <Micro className="max-w-[170px] text-right">
            Drop your X handle. Get your score, your archetype, and the brand station you&apos;re
            building.
          </Micro>
        </header>

        {/* Headline field */}
        <section className="relative mt-10 flex-1 md:mt-6">
          <h1
            className="font-extrabold"
            style={{
              fontSize: 'clamp(56px, 9.6vw, 156px)',
              lineHeight: 0.86,
              letterSpacing: '-0.06em',
            }}
          >
            <span className="block md:pl-[20%]">Drop your</span>
            <span className="block md:pl-[6%]">handle.</span>
            <span className="block md:pl-[38%]">See what</span>
            <span className="block md:pl-[14%]">you&apos;re known</span>
            <span className="block md:pl-[56%]">for.</span>
          </h1>

          {/* Klein-blue card overlapping the type (the one loud element) */}
          <div
            className="relative z-10 mt-8 w-full p-5 text-white md:absolute md:mt-0 md:w-[300px]"
            style={{ background: C.blue, left: undefined }}
          >
            <div
              className="flex items-center justify-between text-[11px]"
              style={{ fontFamily: MONO }}
            >
              <span>BRANDOS ▪ SCAN</span>
              <span>001</span>
            </div>
            <p className="mt-6 text-[17px] font-semibold leading-[1.15] tracking-[-0.02em]">
              Your score, your archetype, and the station you&apos;re building.
            </p>
            <div
              className="mt-6 flex items-center border-b border-white/60 pb-2 text-[16px]"
              style={{ fontFamily: MONO }}
            >
              <span className="opacity-70">@</span>
              <span className="ml-1 opacity-60">username</span>
            </div>
            <div className="mt-6 flex items-center justify-between text-[13px] font-semibold">
              <span>Decode my brand</span>
              <span aria-hidden>↗</span>
            </div>
          </div>

          {/* Round black badge + label beside the card */}
          <div className="relative z-10 mt-4 flex items-center gap-3 md:absolute md:mt-0">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-white"
              style={{ background: C.ink }}
              aria-hidden
            >
              ↯
            </span>
            <span className="border-b text-[12px] font-medium" style={{ borderColor: C.ink }}>
              Free scan
            </span>
          </div>

          {/* The pixel station as the "photograph" */}
          <figure className="relative z-10 mt-8 w-[200px] md:absolute md:mt-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- preview */}
            <img
              src="/worlds/stations/build-exe-night.png"
              alt="A BUILD.EXE brand station at night"
              className="block w-full"
            />
            <figcaption className="mt-2 text-[10px]" style={{ fontFamily: MONO, color: C.muted }}>
              BUILD.EXE {'//'} STATION 0001
            </figcaption>
          </figure>
        </section>

        {/* Footer row */}
        <footer
          className="relative mt-10 grid grid-cols-2 gap-6 border-t pt-4 md:grid-cols-4"
          style={{ borderColor: C.rule }}
        >
          <div className="flex items-end gap-3">
            <div className="text-[11px] leading-tight" style={{ color: C.muted }}>
              Est.
            </div>
            <div className="text-[34px] font-semibold leading-none tracking-[-0.04em]">2026</div>
            <div className="text-[11px]" style={{ fontFamily: MONO, color: C.muted }}>
              {'//'}
            </div>
          </div>
          <Micro>
            Scan
            <br />
            Score
            <br />
            Station
          </Micro>
          <Micro className="hidden md:block">
            Taste
            <br />
            Brand kit
            <br />
            Build in public
          </Micro>
          <Micro className="md:text-right">
            X
            <br />
            Instagram
            <br />
            mybrandos.app
          </Micro>
        </footer>
      </div>

      {/* Vertical label on the right edge */}
      <div
        aria-hidden
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 text-[10px] tracking-[0.3em] md:block"
        style={{ writingMode: 'vertical-rl', fontFamily: MONO, color: C.muted }}
      >
        BRAND INTELLIGENCE // 2026
      </div>

      <style>{`
        @media (min-width: 768px) {
          main section > div:nth-of-type(1) { left: 40%; top: 26%; }
          main section > div:nth-of-type(2) { left: calc(40% + 316px); top: 22%; }
          main section > figure { right: 3%; top: 2%; }
        }
      `}</style>
    </main>
  );
}

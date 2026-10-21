'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AnimateNumber, AnimateText, ScrambleText } from 'motion-plus/react';
import { curtains, pixels } from 'motion-plus/curtains';

/**
 * Preview: the scan builds your station, a pixel-tile curtain wipes, then the
 * score is revealed as one moment. Uses the real Motion+ library
 * (ScrambleText, AnimateNumber, AnimateText, Curtains/pixels). Simulated data
 * for @jbawsa; the real flow would drive the phases from scan progress.
 */

const C = {
  canvas: '#E7E7E4',
  ink: '#0E0E0E',
  muted: '#6B6B6B',
  rule: 'rgba(14,14,14,0.18)',
  blue: '#0047FF',
};
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

const HANDLE = 'jbawsa';
const SCORE = 73;
const ARCHETYPE = 'BUILD.EXE';
const STATION = '/worlds/stations/swiss/build-exe-day.png';
const LED_BASE = '/worlds/stations/build-exe-day.png';

// Each phase builds one band of the station (fraction of height, bottom-up)
// and decodes one real finding.
const PHASES = [
  { key: 'DEFINE', built: 0.3, label: 'ARCHETYPE', finding: ARCHETYPE },
  { key: 'CHECK', built: 0.58, label: 'VOICE', finding: '71% CONSISTENT' },
  { key: 'GENERATE', built: 0.84, label: 'TONE', finding: 'AUTHORITATIVE' },
  { key: 'SCALE', built: 1, label: 'REACH', finding: '72/100 ENGAGEMENT' },
];
const PHASE_MS = 2600;

const PHASE_ROWS = [
  ['IDENTITY', 20],
  ['CONSISTENCY', 18],
  ['CONTENT', 17],
  ['GROWTH', 18],
] as const;

function Micro({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[11px] tracking-[0.12em] ${className}`} style={{ fontFamily: MONO }}>
      {children}
    </div>
  );
}

/** The station, built bottom-up to `built` (0-1) over a faint blueprint. */
function BuildingStation({ built, lit }: { built: number; lit: boolean }) {
  return (
    <div className="station-art relative mx-auto aspect-[597/746] w-full max-w-[420px]">
      {/* blueprint ghost of the finished station */}
      {/* eslint-disable-next-line @next/next/no-img-element -- preview art */}
      <img
        src={STATION}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0.12, filter: 'grayscale(1) contrast(1.4)' }}
      />
      {/* the real thing, revealed from the ground up in hard pixel steps */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(${(1 - built) * 100}% 0 0 0)`,
          transition: 'clip-path 1.6s steps(12, end)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- preview art */}
        <img
          src={STATION}
          alt={`${ARCHETYPE} brand station`}
          className="absolute inset-0 h-full w-full"
        />
        {/* screens power on at GENERATE (status-LED masks) */}
        {[0, 1, 2, 3].map((k) => (
          <div
            key={k}
            aria-hidden
            className={`station-led station-led-${k} absolute inset-0`}
            style={{
              display: lit ? 'block' : 'none',
              backgroundImage: `url(${LED_BASE})`,
              backgroundSize: '100% 100%',
              filter: 'brightness(1.5) saturate(1.6)',
              WebkitMaskImage: `url(/worlds/stations/masks/build-exe-day-led${k}.png)`,
              maskImage: `url(/worlds/stations/masks/build-exe-day-led${k}.png)`,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ScanReveal() {
  const [stage, setStage] = useState<'scan' | 'reveal'>('scan');
  const [phase, setPhase] = useState(-1); // index of the phase in progress
  const [beat, setBeat] = useState(0); // reveal choreography step
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const run = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStage('scan');
    setBeat(0);
    setPhase(-1);
    PHASES.forEach((_, i) => later(() => setPhase(i), 500 + i * PHASE_MS));
    later(
      () => {
        void curtains(
          () => {
            setStage('reveal');
            window.scrollTo(0, 0);
          },
          {
            effect: pixels({ size: 56, direction: 135, noise: 0.45 }),
            transition: [{ duration: 0.55 }, { duration: 0.6 }],
          }
        ).then(() => {
          setBeat(1); // the number
          later(() => setBeat(2), 1300); // archetype decodes
          later(() => setBeat(3), 2300); // the one-line meaning
          later(() => setBeat(4), 3300); // details + station + reserve
        });
      },
      500 + PHASES.length * PHASE_MS + 600
    );
  }, []);

  useEffect(() => {
    queueMicrotask(run);
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, [run]);

  const built = phase < 0 ? 0.04 : PHASES[phase].built;

  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: C.canvas, color: C.ink }}
    >
      <style>{`.motion-curtain{background:${C.blue}}`}</style>

      <div className="mx-auto max-w-[1280px] px-5 pb-32 pt-20 md:px-10 md:pt-16">
        <header className="flex items-start justify-between">
          <Micro className="text-[#6B6B6B]">
            BRANDOS ▪ {stage === 'scan' ? 'SCAN 001' : 'RESULT 001'}
          </Micro>
          <button
            onClick={run}
            className="border-b text-[12px] font-medium"
            style={{ borderColor: C.ink }}
          >
            Replay
          </button>
        </header>

        {stage === 'scan' ? (
          <section className="mt-8 grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <Micro className="text-[#6B6B6B]">SCANNING</Micro>
              <h1
                className="mt-2 font-extrabold"
                style={{
                  fontSize: 'clamp(52px, 8.5vw, 132px)',
                  lineHeight: 0.9,
                  letterSpacing: '-0.06em',
                }}
              >
                @{HANDLE}
              </h1>
              <ol className="mt-10 border-t" style={{ borderColor: C.rule }}>
                {PHASES.map((p, i) => {
                  const state = i < phase ? 'done' : i === phase ? 'active' : 'idle';
                  return (
                    <li
                      key={p.key}
                      className="grid grid-cols-[2.2rem_6.5rem_1fr] items-baseline gap-2 border-b py-3"
                      style={{
                        borderColor: C.rule,
                        opacity: state === 'idle' ? 0.35 : 1,
                        transition: 'opacity 0.3s',
                      }}
                    >
                      <Micro className="text-[#6B6B6B]">0{i + 1}</Micro>
                      <span className="text-[15px] font-semibold tracking-[-0.02em]">{p.key}</span>
                      <Micro className="truncate">
                        {state === 'idle' ? (
                          '—'
                        ) : (
                          <>
                            <span className="text-[#6B6B6B]">{p.label} ▸ </span>
                            <ScrambleText
                              active={state === 'active'}
                              duration={0.9}
                              style={{ color: state === 'done' ? C.ink : C.blue }}
                            >
                              {p.finding}
                            </ScrambleText>
                          </>
                        )}
                      </Micro>
                    </li>
                  );
                })}
              </ol>
            </div>
            <BuildingStation built={built} lit={phase >= 2} />
          </section>
        ) : (
          <section className="mt-6">
            <Micro className="text-[#6B6B6B]">@{HANDLE} ▪ BRAND SCORE</Micro>

            {/* 1. the number, alone */}
            <div
              className="font-extrabold leading-[0.8]"
              style={{ fontSize: 'clamp(180px, 34vw, 460px)', letterSpacing: '-0.075em' }}
            >
              <AnimateNumber
                transition={{ y: { type: 'spring', duration: 1.4, bounce: 0 } }}
                trend={1}
              >
                {beat >= 1 ? SCORE : 0}
              </AnimateNumber>
            </div>

            {/* 2. the archetype decodes */}
            <div
              className="mt-4 font-extrabold"
              style={{
                color: C.blue,
                fontSize: 'clamp(40px, 6vw, 84px)',
                letterSpacing: '-0.05em',
                lineHeight: 1,
                visibility: beat >= 2 ? 'visible' : 'hidden',
              }}
            >
              <ScrambleText active={beat < 2} duration={0.8}>
                {ARCHETYPE}
              </ScrambleText>
            </div>

            {/* 3. one sentence of meaning */}
            <div className="mt-5 min-h-[2.4em] max-w-[560px] text-[22px] font-medium leading-[1.2] tracking-[-0.02em] md:text-[26px]">
              {beat >= 3 && (
                // AnimateText splits into motion spans that inherit the
                // hidden -> visible labels from this parent, which staggers them.
                <motion.span
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                >
                  <AnimateText
                    type="word"
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                    }}
                  >
                    {"Higher than 72% of creators we've scanned."}
                  </AnimateText>
                </motion.span>
              )}
            </div>

            {/* 4. the details, then the station as the product */}
            {beat >= 4 && (
              <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1fr]">
                <motion.ol
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                  className="self-start border-t"
                  style={{ borderColor: C.rule }}
                >
                  {PHASE_ROWS.map(([label, value]) => (
                    <motion.li
                      key={label}
                      variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
                      className="flex items-baseline justify-between border-b py-3"
                      style={{ borderColor: C.rule }}
                    >
                      <Micro className="text-[#6B6B6B]">{label}</Micro>
                      <span className="text-[28px] font-semibold tracking-[-0.03em]">+{value}</span>
                    </motion.li>
                  ))}
                </motion.ol>
                <motion.figure
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <BuildingStation built={1} lit />
                  <figcaption className="mt-3 flex justify-between">
                    <Micro className="text-[#6B6B6B]">YOUR BRAND STATION</Micro>
                    <Micro className="text-[#6B6B6B]">{ARCHETYPE}</Micro>
                  </figcaption>
                </motion.figure>
              </div>
            )}
          </section>
        )}
      </div>

      {/* one primary action, in the thumb zone */}
      {stage === 'reveal' && beat >= 4 && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', duration: 0.6, bounce: 0.15 }}
          className="fixed inset-x-0 bottom-0 z-20 p-4 md:bottom-6 md:left-auto md:right-10 md:p-0"
        >
          <button
            className="flex w-full items-center justify-between px-5 py-4 text-[15px] font-semibold text-white md:w-[320px]"
            style={{ background: C.blue }}
          >
            Reserve your brand station
            <span aria-hidden>↗</span>
          </button>
        </motion.div>
      )}
    </main>
  );
}

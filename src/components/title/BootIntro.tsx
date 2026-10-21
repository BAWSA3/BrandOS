'use client';

import { useEffect, useRef, useState } from 'react';

// The title screen's startup: BIOS-style lines type in, a loading bar fills,
// then onDone hands over to the wordmark + PRESS START. ~1s, silent (no sound
// can play before the first click). The parent skips it on click/key.

const BLUE = '#0047FF';
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const CHARS_PER_MS = 0.34; // typing speed
const BAR = { from: 500, to: 900, cells: 20 };
const END = 1050;

type Line = { at: number; text: string; ok?: string };

export default function BootIntro({
  handle,
  stationNumber,
  ink,
  muted,
  onDone,
}: {
  handle?: string;
  stationNumber?: number | null;
  ink: string;
  muted: string;
  onDone: () => void;
}) {
  const [t, setT] = useState(0);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const el = now - t0;
      setT(el);
      if (el >= END) return done.current();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const station = stationNumber ? `#${String(stationNumber).padStart(4, '0')}` : '';
  const lines: Line[] = [
    { at: 0, text: 'BRANDOS BIOS v2.0  (C) 2026 BRANDOS' },
    { at: 110, text: 'TASTE ENGINE ..........', ok: 'OK' },
    { at: 210, text: 'MEMORY CHECK ..........', ok: 'OK' },
    { at: 310, text: 'AUDIO .................', ok: 'STANDBY' },
    {
      at: 410,
      text: `LOADING STATION ${station}${handle ? ` · @${handle.toUpperCase()}` : ''}`.trim(),
    },
  ];
  const pct = Math.max(0, Math.min(1, (t - BAR.from) / (BAR.to - BAR.from)));
  const lit = Math.round(pct * BAR.cells);
  // the last line that has started typing carries the cursor
  const current = t >= BAR.to ? -1 : lines.filter((l) => t >= l.at).length - 1;

  return (
    <div
      aria-hidden
      className="h-[15em] w-[min(560px,88vw)] text-left text-[12px] uppercase leading-[1.9] tracking-[0.08em] md:text-[13px]"
      style={{ fontFamily: MONO, color: muted }}
    >
      {lines.map((l, i) => {
        if (t < l.at) return null;
        const full = l.ok ? `${l.text} ${l.ok}` : l.text;
        const n = Math.floor((t - l.at) * CHARS_PER_MS);
        const shown = full.slice(0, n);
        const typedOk = l.ok && shown.length > l.text.length;
        return (
          <div key={i} className="whitespace-pre-wrap">
            <span style={{ color: i === 0 ? ink : undefined }}>
              {shown.slice(0, l.text.length)}
            </span>
            {typedOk && <span style={{ color: BLUE }}>{shown.slice(l.text.length)}</span>}
            {i === current && <Cursor />}
          </div>
        );
      })}
      {t >= BAR.from && (
        <div className="mt-2 flex items-center gap-3">
          <span className="flex gap-[3px]">
            {Array.from({ length: BAR.cells }, (_, i) => (
              <span
                key={i}
                className="inline-block h-[10px] w-[10px] md:w-[12px]"
                style={{ background: i < lit ? BLUE : 'currentColor', opacity: i < lit ? 1 : 0.18 }}
              />
            ))}
          </span>
          <span className="tabular-nums" style={{ color: ink }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
      )}
      {t >= BAR.to + 40 && (
        <div className="mt-2" style={{ color: BLUE }}>
          READY
          <Cursor />
        </div>
      )}
    </div>
  );
}

function Cursor() {
  return (
    <span
      className="ml-[2px] inline-block h-[0.9em] w-[0.55em] translate-y-[2px]"
      style={{ background: 'currentColor', animation: 'press-start-blink 0.6s steps(1) infinite' }}
    />
  );
}

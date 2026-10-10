'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { playSound } from '@/lib/ui-sounds';
import { levelFor, xpAtLevel, xpToNext, type XPGain } from '@/lib/xp';

// The retro XP bar across the top of the dashboard: LV badge, a segmented
// Klein-blue bar, and the XP earned since the last visit. On load the bar
// sits where the creator left off, then the new XP fills in block by block;
// crossing a level holds the full bar, flashes, plays the level-up sound and
// ticks the LV number (Motion+ AnimateNumber), then refills from empty.
// Reads the dashboard's theme vars (--d-*).

const BLUE = '#0047FF';
const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const SEGMENTS = 24;

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function XPBar({
  total,
  gains = [],
  booted,
  delayMs = 2600,
}: {
  /** XP total now (after `gains`). */
  total: number;
  /** XP earned since the last visit; animates in after `delayMs`. */
  gains?: XPGain[];
  booted: boolean;
  delayMs?: number;
}) {
  const reduce = useReducedMotion();
  const earned = gains.reduce((s, g) => s + g.xp, 0);
  const start = total - earned;
  const [shown, setShown] = useState(start);
  const [gainsOn, setGainsOn] = useState(0); // how many gain chips are visible
  const [flash, setFlash] = useState(false);
  const [filling, setFilling] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!booted || earned <= 0) return;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((r) => {
        timers.push(window.setTimeout(r, ms));
      });
    const tween = (from: number, to: number, ms: number) =>
      new Promise<void>((r) => {
        const t0 = performance.now();
        const step = (now: number) => {
          if (cancelled) return r();
          const p = Math.min(1, (now - t0) / ms);
          const e = 1 - Math.pow(1 - p, 3);
          setShown(from + (to - from) * e);
          if (p < 1) raf.current = requestAnimationFrame(step);
          else r();
        };
        raf.current = requestAnimationFrame(step);
      });
    const levelUp = async () => {
      setFlash(true);
      playSound('levelUp');
      await wait(reduce ? 1800 : 1400);
      if (!cancelled) setFlash(false);
    };

    (async () => {
      await wait(delayMs);
      if (cancelled) return;
      gains.forEach((_, i) => timers.push(window.setTimeout(() => setGainsOn(i + 1), i * 220)));
      if (reduce) {
        setShown(total);
        if (levelFor(total).level > levelFor(start).level) await levelUp();
        return;
      }
      setFilling(true);
      // fill to each level boundary crossed, hold + flash there, then carry on
      let from = start;
      let lv = levelFor(start).level;
      while (!cancelled && xpAtLevel(lv + 1) <= total) {
        const edge = xpAtLevel(lv + 1);
        await tween(from, edge, 900);
        if (cancelled) return;
        await levelUp();
        from = edge;
        lv++;
      }
      if (!cancelled) await tween(from, total, 1100);
      if (!cancelled) setFilling(false);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
      timers.forEach((t) => window.clearTimeout(t));
    };
    // replay only when the numbers change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted, total, earned, delayMs, reduce]);

  const { level, into, need } = levelFor(shown);
  // while the level-up flash holds, show the bar full at the old level
  const atEdge = flash && into < 1;
  const frac = atEdge ? 1 : into / need;
  // the counter reads full too ("1,750 / 1,750") until the bar refills
  const countInto = atEdge ? xpToNext(level - 1) : Math.round(into);
  const countNeed = atEdge ? xpToNext(level - 1) : need;
  const lit = booted ? Math.floor(frac * SEGMENTS + 1e-6) : 0;

  return (
    <section
      aria-label={`Level ${level}, ${Math.round(into)} of ${need} XP`}
      className="relative mt-3 border px-4 py-3"
      style={{ background: 'var(--d-tile)', borderColor: 'var(--d-rule)', fontFamily: MONO }}
    >
      <div className="flex items-center gap-3 md:gap-4">
        {/* LV badge */}
        <div
          className="flex shrink-0 items-baseline gap-1.5 px-2.5 py-1.5 text-white"
          style={{ background: BLUE }}
        >
          <span className="text-[10px] uppercase tracking-[0.14em] opacity-80">LV</span>
          <span className="text-[18px] leading-none tabular-nums">
            {reduce ? (
              pad2(level)
            ) : (
              <AnimateNumber format={{ minimumIntegerDigits: 2 }}>{level}</AnimateNumber>
            )}
          </span>
        </div>

        {/* segmented bar */}
        <div
          className="relative flex h-[18px] min-w-0 flex-1 gap-[3px]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={need}
          aria-valuenow={Math.round(into)}
        >
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const on = i < lit;
            const next = filling && i === lit;
            return (
              <span
                key={i}
                className="h-full flex-1"
                style={{
                  background: on ? BLUE : 'var(--d-track)',
                  opacity: next ? 0.55 : 1,
                  outline: flash ? `1px solid ${BLUE}` : 'none',
                  outlineOffset: 1,
                  // on boot the saved progress fills in left to right
                  transition:
                    reduce || filling || flash ? 'none' : `background 0.12s ease ${i * 22}ms`,
                  animation: flash
                    ? `xp-flash 0.4s ease-in-out ${i * 12}ms 3`
                    : next
                      ? 'xp-blink 0.5s steps(2, jump-none) infinite'
                      : undefined,
                }}
              />
            );
          })}
          {flash && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.3em] text-white">
              <span className="px-2 py-[1px]" style={{ background: BLUE }}>
                Level up
              </span>
            </span>
          )}
        </div>

        {/* XP count */}
        <div className="hidden shrink-0 text-[12px] uppercase tracking-[0.1em] tabular-nums sm:block">
          <span style={{ color: 'var(--d-ink)' }}>{countInto.toLocaleString()}</span>
          <span style={{ color: 'var(--d-muted)' }}> / {countNeed.toLocaleString()} XP</span>
        </div>
      </div>

      {/* earned since last visit + next level */}
      <div
        className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.14em]"
        style={{ color: 'var(--d-muted)' }}
      >
        <span className="tabular-nums sm:hidden" style={{ color: 'var(--d-ink)' }}>
          {countInto.toLocaleString()} / {countNeed.toLocaleString()} XP
        </span>
        {/* rendered as they arrive, so nothing holds empty space on phones */}
        {gainsOn > 0 && (
          <span style={{ color: 'var(--d-ink)', animation: 'xp-in 0.3s ease both' }}>
            Since last visit +{earned.toLocaleString()}
          </span>
        )}
        {gains.slice(0, gainsOn).map((g) => (
          <span key={g.label} style={{ animation: 'xp-in 0.3s ease both' }}>
            <span style={{ color: BLUE }}>+{g.xp}</span> {g.label}
          </span>
        ))}
        <span className="ml-auto tabular-nums">
          {atEdge
            ? `LV ${pad2(level)} reached`
            : `${Math.max(0, Math.ceil(need - into)).toLocaleString()} XP to LV ${pad2(level + 1)}`}
        </span>
      </div>
    </section>
  );
}

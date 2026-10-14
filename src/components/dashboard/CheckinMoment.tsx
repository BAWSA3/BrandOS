'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { levelFor, type XPGain } from '@/lib/xp';
import { playSound } from '@/lib/ui-sounds';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';

// The daily check-in moment (spec 2026-10-14). First dashboard entry of the
// user's day: ~6s, tap/key to skip.
//   1. takeover  dashboard dimmed; big level number; the bar fills with today's
//                XP (count-up ticks); a level-up beat if a level is crossed
//   2. card      today's gains + streak
//   3. settle    shrinks up toward the dashboard's XP bar, which stays
// Later visits the same day: a small "+N XP" toast if anything new was earned.
// The day comes from the server (the user's timezone); "played" is remembered
// per browser. Reduced motion: no takeover, just the toast.

const MONO = DASH_FONTS.mono;
const BIG = DASH_FONTS.big;
const BLUE = '#0047FF';
const KEY = 'brandos:checkin-day';

const T_CARD = 2700;
const T_SETTLE = 5200;
const T_DONE = 6050;
const EXIT_MS = 850;
/** Smooth ease-in-out for the exit; long ease-out for entrances. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_EXIT = [0.4, 0, 0.2, 1] as const;

function readPlayed(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function markPlayed(day: string) {
  try {
    window.localStorage.setItem(KEY, day);
  } catch {
    // storage unavailable: it may replay, which is harmless
  }
}

export default function CheckinMoment({
  total,
  today,
  sinceLast,
  day,
  streakDays,
  dark,
}: {
  total: number;
  today: { xp: number; gains: XPGain[] };
  /** XP since the previous visit (the toast on later visits). */
  sinceLast: XPGain[];
  day: string;
  streakDays: number;
  dark: boolean;
}) {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<'idle' | 'moment' | 'toast'>('idle');
  const [toast, setToast] = useState<XPGain[]>([]);
  const [phase, setPhase] = useState<'takeover' | 'card' | 'settle'>('takeover');
  const [shown, setShown] = useState(total - today.xp);
  const [leveled, setLeveled] = useState(false);
  const timers = useRef<number[]>([]);
  const decided = useRef(false);
  const raf = useRef(0);

  const start = total - today.xp;
  const from = levelFor(start);
  const to = levelFor(total);
  const crosses = to.level > from.level;
  const sinceXp = sinceLast.reduce((t, g) => t + g.xp, 0);

  // tap / key: jump to the end state and play the same exit, sooner
  const finish = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    cancelAnimationFrame(raf.current);
    setShown(total);
    setPhase('settle');
    timers.current = [window.setTimeout(() => setMode('idle'), EXIT_MS)];
  };

  // decide once on mount: the moment (first time today), a toast, or nothing
  useEffect(() => {
    if (decided.current) return; // effects can run twice in dev (StrictMode)
    decided.current = true;
    const played = readPlayed() === day;
    if (!played && today.xp > 0 && !reduce) {
      markPlayed(day);
      setMode('moment');
    } else {
      if (!played) markPlayed(day);
      const gains = played ? sinceLast : today.gains;
      if ((played ? sinceXp : today.xp) > 0) {
        setToast(gains);
        setMode('toast');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- decided once per mount
  }, []);

  // the moment's timeline
  useEffect(() => {
    if (mode !== 'moment') return;
    const t0 = performance.now();
    const FILL = 1800;
    let lastTick = 0;
    let crossed = false;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0 - 400) / FILL);
      if (k > 0) {
        const eased = 1 - Math.pow(1 - k, 3);
        const v = Math.round(start + today.xp * eased);
        setShown(v);
        if (now - lastTick > 110 && k < 1) {
          lastTick = now;
          playSound('hover');
        }
        if (crosses && !crossed && levelFor(v).level > from.level) {
          crossed = true;
          setLeveled(true);
          playSound('levelUp');
        }
      }
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    timers.current = [
      window.setTimeout(() => setPhase('card'), T_CARD),
      window.setTimeout(() => setPhase('settle'), T_SETTLE),
      window.setTimeout(() => setMode('idle'), T_DONE),
    ];
    const skip = () => finish();
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(raf.current);
      window.removeEventListener('keydown', skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one run per moment
  }, [mode]);

  // the toast hides itself
  useEffect(() => {
    if (mode !== 'toast') return;
    const t = window.setTimeout(() => setMode('idle'), 4200);
    return () => window.clearTimeout(t);
  }, [mode]);

  const lvl = levelFor(shown);
  const pct = Math.min(100, Math.round((lvl.into / lvl.need) * 100));
  const ink = dark ? '#F2EFE8' : '#0E0E0E';
  const muted = dark ? '#9A978F' : '#6B6862';
  const veil = dark ? 'rgba(11,13,16,0.94)' : 'rgba(242,239,232,0.95)';
  const panel = dark ? '#14171C' : '#FFFFFF';
  const dayLabel = (
    /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00Z`) : new Date()
  ).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(/^\d{4}/.test(day) ? { timeZone: 'UTC' } : {}),
  });
  const toastXp = toast.reduce((t, g) => t + g.xp, 0);

  return (
    <AnimatePresence>
      {mode === 'moment' && (
        <motion.div
          key="checkin"
          role="dialog"
          aria-label={`Daily check-in: +${today.xp} XP`}
          className="fixed inset-0 z-[70] flex cursor-pointer items-center justify-center px-4"
          style={{ background: veil, color: ink }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'settle' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={
            phase === 'settle'
              ? { duration: 0.6, delay: 0.2, ease: EASE_EXIT }
              : { duration: 0.45, ease: EASE_OUT }
          }
          onClick={phase === 'settle' ? undefined : finish}
        >
          <motion.div
            className="w-full max-w-[560px]"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={
              phase === 'settle'
                ? { scale: 0.55, y: '-38vh', opacity: 0 }
                : { scale: 1, y: 0, opacity: 1 }
            }
            transition={
              phase === 'settle'
                ? { duration: 0.7, delay: 0.12, ease: EASE_EXIT }
                : { duration: 0.6, ease: EASE_OUT }
            }
          >
            <div
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ fontFamily: MONO, color: muted }}
            >
              Daily check-in · {dayLabel}
            </div>

            {/* 1. level + bar */}
            <div className="mt-4 flex items-end justify-between gap-4">
              <div style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em' }}>
                <span className="text-[18px]" style={{ fontFamily: MONO, color: BLUE }}>
                  LV
                </span>
                <motion.span
                  key={lvl.level}
                  className="ml-2 inline-block text-[112px] leading-[0.85] md:text-[148px]"
                  style={{ color: leveled ? BLUE : ink }}
                  initial={leveled ? { scale: 1.25 } : false}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.45, duration: 0.6 }}
                >
                  {String(lvl.level).padStart(2, '0')}
                </motion.span>
              </div>
              <div className="pb-3 text-right" style={{ fontFamily: MONO }}>
                <div className="text-[28px] md:text-[34px]" style={{ color: BLUE }}>
                  +{Math.max(0, shown - start)}
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em]" style={{ color: muted }}>
                  XP today
                </div>
              </div>
            </div>
            <div
              className="mt-4 h-[10px] w-full overflow-hidden"
              style={{ background: dark ? 'rgba(242,239,232,0.12)' : 'rgba(14,14,14,0.08)' }}
            >
              <div
                className="h-full"
                style={{ width: `${pct}%`, background: BLUE, transition: 'width 80ms linear' }}
              />
            </div>
            <div
              className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, color: muted }}
            >
              <span>
                {lvl.into.toLocaleString()} / {lvl.need.toLocaleString()} XP
              </span>
              <span>
                {(lvl.need - lvl.into).toLocaleString()} to LV{' '}
                {String(lvl.level + 1).padStart(2, '0')}
              </span>
            </div>

            {/* reserved row: the badge appears without moving anything */}
            <div className="mt-4 h-[28px]">
              {crosses && (
                <motion.div
                  className="inline-block px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white"
                  style={{ fontFamily: MONO, background: BLUE }}
                  initial={false}
                  animate={
                    leveled ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 8, scale: 0.96 }
                  }
                  transition={{ duration: 0.45, ease: EASE_OUT }}
                >
                  Level up · LV {String(from.level).padStart(2, '0')} → LV{' '}
                  {String(to.level).padStart(2, '0')}
                </motion.div>
              )}
            </div>

            {/* 2. today's gains + streak: always laid out, so it glides in without a jump */}
            <motion.div
              className="mt-4 rounded-[10px] border p-5"
              style={{
                background: panel,
                borderColor: dark ? 'rgba(242,239,232,0.14)' : 'rgba(14,14,14,0.12)',
              }}
              initial={false}
              animate={
                phase === 'card'
                  ? { opacity: 1, y: 0, scale: 1 }
                  : phase === 'settle'
                    ? { opacity: 0, y: 12, scale: 0.99 }
                    : { opacity: 0, y: 22, scale: 0.98 }
              }
              transition={
                phase === 'settle'
                  ? { duration: 0.28, ease: EASE_EXIT }
                  : { duration: 0.65, ease: EASE_OUT }
              }
              aria-hidden={phase === 'takeover'}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ fontFamily: MONO, color: muted }}
                >
                  Today
                </span>
                {streakDays > 1 && (
                  <span
                    className="text-[10px] uppercase tracking-[0.14em]"
                    style={{ fontFamily: MONO, color: BLUE }}
                  >
                    {streakDays}-day streak
                  </span>
                )}
              </div>
              <ul className="mt-3 space-y-2">
                {today.gains.map((g, i) => (
                  <motion.li
                    key={g.label}
                    className="flex justify-between text-[15px]"
                    initial={false}
                    animate={phase === 'card' ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
                    transition={{
                      duration: 0.4,
                      delay: phase === 'card' ? 0.18 + i * 0.07 : 0,
                      ease: EASE_OUT,
                    }}
                  >
                    <span>{g.label}</span>
                    <span style={{ fontFamily: MONO, color: BLUE }}>+{g.xp}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <div
              className="mt-5 text-center text-[10px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, color: muted }}
            >
              Tap to continue
            </div>
          </motion.div>
        </motion.div>
      )}

      {mode === 'toast' && (
        <motion.div
          key="toast"
          role="status"
          className="fixed bottom-5 right-5 z-[70] rounded-[8px] px-4 py-3 text-white shadow-lg"
          style={{ background: BLUE, fontFamily: MONO }}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={() => setMode('idle')}
        >
          <div className="text-[16px]">+{toastXp} XP</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] opacity-85">
            {toast.map((g) => g.label).join(' · ')}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

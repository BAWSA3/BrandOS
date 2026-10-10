'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimateNumber, Cursor, ScrambleText, useCursorState } from 'motion-plus/react';

// Motion+ building blocks for the dashboard (docs/MOTION-PLUS-PLAYBOOK.md).
// Headline: numbers roll up as the dashboard boots. Supporting: labels decode,
// the stat strip ticks, the taste line types, and (desktop) a magnetic cursor.
// Everything shows its final state straight away under reduced motion.

const BLUE = '#0047FF';
const ROLL = { type: 'spring' as const, duration: 1.4, bounce: 0 };

/** False on the first paint, true a beat later: the cue for boot animations. */
export function useBoot(delayMs = 120): boolean {
  const reduce = useReducedMotion();
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setBooted(true), reduce ? 0 : delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs, reduce]);
  return booted;
}

/** A number that rolls up from 0 to its value once booted (odometer style). */
export function RollNumber({
  value,
  booted,
  delay = 0,
  prefix,
  suffix,
  decimals,
  grouping = false,
}: {
  value: number;
  booted: boolean;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  grouping?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimateNumber
      transition={{ y: { ...ROLL, delay }, opacity: { duration: 0.2, delay } }}
      trend={1}
      prefix={prefix}
      suffix={suffix}
      format={{
        useGrouping: grouping,
        ...(decimals !== undefined
          ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
          : {}),
      }}
    >
      {booted || reduce ? value : 0}
    </AnimateNumber>
  );
}

/** A mono label that decodes (scrambles, then resolves) as the dashboard boots. */
export function ScrambleLabel({ children, booted }: { children: string; booted: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <ScrambleText
      active={booted}
      duration={0.7}
      interval={0.04}
      chars="ABCDEFGHJKLMNPRSTUVWXYZ0123456789/#▪"
    >
      {children}
    </ScrambleText>
  );
}

function CursorLabel() {
  const { zone } = useCursorState();
  if (zone !== 'open') return null;
  return (
    <span
      className="whitespace-nowrap border px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
      style={{
        fontFamily: "'VCR OSD Mono', monospace",
        background: '#FFFFFF',
        color: BLUE,
        borderColor: BLUE,
      }}
    >
      Open ↗
    </span>
  );
}

/**
 * Desktop-only magnetic cursor: a small Klein-blue pixel that morphs around
 * buttons and links, and shows "OPEN ↗" over tiles marked
 * data-cursor-zone="open". Off on touch devices and under reduced motion.
 */
export function DashCursor() {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  if (!fine || reduce) return null;
  return (
    <Cursor
      magnetic={{ morph: true, padding: 4, snap: 0.6 }}
      style={{
        backgroundColor: 'rgba(0,71,255,0.22)',
        border: `1px solid ${BLUE}`,
        borderRadius: 0,
      }}
    >
      <CursorLabel />
    </Cursor>
  );
}

/**
 * Panel hover: a counter that bumps each time the cursor enters a panel
 * (desktop, motion allowed). Panels key small one-shot animations on it, so
 * each entry replays them once; 0 means "never hovered".
 */
export const TileHoverCtx = createContext(0);
export const useTileHover = () => useContext(TileHoverCtx);

/** True on devices with a precise pointer (mouse/trackpad), false on touch. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return fine;
}

/** Four thin corner brackets that ease in on hover: a quiet "lock-on". */
export function CornerBrackets({ active, color }: { active: boolean; color: string }) {
  const arm = 10;
  const corners: React.CSSProperties[] = [
    { top: 6, left: 6, borderTop: '1.5px solid', borderLeft: '1.5px solid' },
    { top: 6, right: 6, borderTop: '1.5px solid', borderRight: '1.5px solid' },
    { bottom: 6, left: 6, borderBottom: '1.5px solid', borderLeft: '1.5px solid' },
    { bottom: 6, right: 6, borderBottom: '1.5px solid', borderRight: '1.5px solid' },
  ];
  return (
    <>
      {corners.map((c, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            ...c,
            width: arm,
            height: arm,
            borderColor: color,
            opacity: active ? 1 : 0,
            transform: active ? 'scale(1)' : 'scale(1.6)',
            transition: 'opacity 0.22s ease-out, transform 0.28s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      ))}
    </>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import {
  nextMoves,
  pickIndex,
  type FounderFor,
  type Move,
  type MoveInput,
  type Persona,
} from '@/lib/next-move';
import { Btn, ButtonLink, DISPLAY, Label, Panel, VCR } from './ui';
import InfoTip, { TIPS } from './InfoTip';

/**
 * Today (dashboard v2): a calm screen with one move drawn from the member's
 * own record; everything else is one tap away. The first open asks one
 * question (creator / founder / builder; founders get one more tap: you or
 * your company). The answer lives on this device for now (no migration).
 *
 * Motion+ headline: the number behind the move rolls up in Klein.
 * Psychology: remove the blank page, choice reduction, open loops (gently).
 */

const PERSONAS: { id: Persona; name: string; line: string }[] = [
  { id: 'creator', name: 'Creator', line: 'You make things people follow.' },
  { id: 'founder', name: 'Founder', line: 'You run a company and you are its voice.' },
  { id: 'builder', name: 'Builder', line: 'You ship in public and explain how.' },
];

// --- this-device answers (useSyncExternalStore keeps SSR and the first paint in step) ---
const KEY = {
  persona: 'brandos:persona',
  founderFor: 'brandos:founder-for',
  later: 'brandos:later',
};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function subscribe(l: () => void) {
  listeners.add(l);
  window.addEventListener('storage', l);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', l);
  };
}
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, v: string | null) {
  try {
    if (v === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, v);
  } catch {
    // storage blocked: the answer holds for this visit only
  }
  emit();
}
const SSR = '__ssr__';
function useStored(key: string): string | null | typeof SSR {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => SSR
  );
}

function RollStat({ value, suffix }: { value: number; suffix: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(value), reduce ? 0 : 320);
    return () => window.clearTimeout(t);
  }, [reduce, value]);
  return (
    <AnimateNumber
      className="text-[48px] leading-none md:text-[64px]"
      style={{
        fontFamily: DISPLAY,
        fontWeight: 500,
        letterSpacing: '-0.04em',
        color: 'var(--v-signal-text)',
      }}
      suffix={suffix}
      format={{ maximumFractionDigits: 1 }}
      transition={reduce ? { duration: 0 } : { type: 'spring', duration: 1.1, bounce: 0 }}
    >
      {shown}
    </AnimateNumber>
  );
}

const FALLBACK: Move = {
  id: 'fallback',
  kind: 'build',
  title: "Post about what you're working on today.",
  why: 'Your record fills in as you post. One honest post about the work beats a perfect one next week.',
  stat: null,
  source: 'A first move',
  action: { label: 'Start writing', href: '/dashboard/write' },
};

export default function Today({
  name,
  dayLabel,
  day,
  input,
  scoreLine,
  openIdeas,
  brandQuery,
  accountPersona = null,
}: {
  name: string | null;
  /** e.g. "Tuesday 27 Oct 2026" in the member's timezone */
  dayLabel: string;
  /** YYYY-MM-DD, keys the day's pick and "Later" */
  day: string;
  input: MoveInput;
  scoreLine: { value: number; delta: number | null; since: string | null } | null;
  openIdeas: number;
  /** "brand=<id>" or "" so links stay on the brand in view */
  brandQuery: string;
  /** the account's answer (migration 052), so a new device doesn't ask again */
  accountPersona?: Persona | null;
}) {
  useEffect(() => {
    if (accountPersona && !read(KEY.persona)) write(KEY.persona, accountPersona);
  }, [accountPersona]);
  const reduce = useReducedMotion();
  const personaRaw = useStored(KEY.persona);
  const founderRaw = useStored(KEY.founderFor);
  const laterRaw = useStored(KEY.later);
  const [shift, setShift] = useState(0);
  const [askFounder, setAskFounder] = useState(false);

  const ready = personaRaw !== SSR;
  const persona = (PERSONAS.some((p) => p.id === personaRaw) ? personaRaw : null) as Persona | null;
  const founderFor = (
    founderRaw === 'me' || founderRaw === 'company' ? founderRaw : null
  ) as FounderFor | null;
  const asking = ready && (!persona || askFounder || (persona === 'founder' && !founderFor));

  const moves = useMemo(() => {
    const all = nextMoves(input, persona, founderFor);
    return all.length ? all : [FALLBACK];
  }, [input, persona, founderFor]);
  const laterId =
    typeof laterRaw === 'string' && laterRaw.startsWith(`${day}:`)
      ? laterRaw.slice(day.length + 1)
      : null;
  const order = useMemo(() => {
    const start = pickIndex(moves.length, day);
    const rotated = [...moves.slice(start), ...moves.slice(0, start)];
    return laterId
      ? [...rotated.filter((m) => m.id !== laterId), ...rotated.filter((m) => m.id === laterId)]
      : rotated;
  }, [moves, day, laterId]);
  const move = order[shift % order.length];
  const brandHref = `/dashboard?view=brand${brandQuery ? `&${brandQuery}` : ''}`;
  const playbookHref = `/dashboard?view=playbook${brandQuery ? `&${brandQuery}` : ''}`;

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col px-4 pb-10 pt-6 md:px-10 md:pt-16">
      <Label tone="head-muted">{dayLabel}</Label>
      <div className="min-h-[520px]">
        {!ready ? null : (
          <AnimatePresence mode="wait" initial={false}>
            {asking ? (
              <motion.div
                key={askFounder || persona === 'founder' ? 'ask-founder' : 'ask'}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="mt-6"
              >
                {persona === 'founder' && !founderFor ? (
                  <>
                    <h1
                      className="text-[36px] leading-[1.04] md:text-[56px]"
                      style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.04em' }}
                    >
                      Is this for you
                      <br />
                      <span style={{ color: 'var(--v-head-muted)' }}>or your company?</span>
                    </h1>
                    <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {(
                        [
                          ['me', 'For me', 'My own name, my own voice.'],
                          ['company', 'For my company', 'The company speaks; I write for it.'],
                        ] as const
                      ).map(([id, title, line]) => (
                        <Choice
                          key={id}
                          title={title}
                          line={line}
                          onPick={() => {
                            write(KEY.founderFor, id);
                            setAskFounder(false);
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => write(KEY.persona, null)}
                      className="v2-focus mt-4 min-h-[44px] text-[14px] underline-offset-2 hover:underline"
                      style={{ color: 'var(--v-head-muted)' }}
                    >
                      ← Back
                    </button>
                  </>
                ) : (
                  <>
                    <h1
                      className="text-[36px] leading-[1.04] md:text-[56px]"
                      style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.04em' }}
                    >
                      Welcome in{name ? `, ${name}` : ''}.
                      <br />
                      <span style={{ color: 'var(--v-head-muted)' }}>Which one are you?</span>
                    </h1>
                    <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
                      {PERSONAS.map((p) => (
                        <Choice
                          key={p.id}
                          title={p.name}
                          line={p.line}
                          selected={persona === p.id}
                          onPick={() => {
                            write(KEY.persona, p.id);
                            // follows the account to other devices (052); best effort
                            void fetch('/api/me/preferences', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ persona: p.id }),
                            }).catch(() => null);
                            if (p.id !== 'founder') write(KEY.founderFor, null);
                            setAskFounder(false);
                            setShift(0);
                          }}
                        />
                      ))}
                    </div>
                    <p className="mt-4 text-[14px]" style={{ color: 'var(--v-head-muted)' }}>
                      One tap. It changes the moves and examples, nothing else. You can change it at
                      the bottom of this page.
                    </p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={`move-${move.id}`}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
                className="mt-3"
              >
                <p className="text-[18px]" style={{ color: 'var(--v-head-muted)' }}>
                  {name ? `${name}, one` : 'One'} move today.
                </p>
                <Panel className="mt-5 p-6 md:p-10" style={{ borderRadius: 24 }}>
                  <Label>
                    Today&apos;s move
                    <InfoTip label="today's move">{TIPS.move}</InfoTip>
                  </Label>
                  <h1
                    className="mt-4 text-[30px] leading-[1.06] md:text-[52px]"
                    style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.04em' }}
                  >
                    {move.title}
                  </h1>
                  {move.stat && (
                    <div className="mt-6 flex items-baseline gap-3">
                      <RollStat value={move.stat.value} suffix={move.stat.suffix} />
                      <span className="text-[15px]" style={{ color: 'var(--v-muted)' }}>
                        {move.stat.label}
                      </span>
                    </div>
                  )}
                  <p className="mt-4 max-w-[620px] text-[17px] leading-[1.55]">{move.why}</p>
                  <Label className="mt-5">{move.source}</Label>
                  <div className="mt-8 flex flex-wrap items-center gap-2">
                    <ButtonLink
                      href={move.action.href}
                      kind="primary"
                      className="w-full px-6 text-[15px] md:w-auto"
                    >
                      {move.action.label} →
                    </ButtonLink>
                    {order.length > 1 && (
                      <Btn kind="quiet" onClick={() => setShift((n) => n + 1)}>
                        Show another
                      </Btn>
                    )}
                    {order.length > 1 && (
                      <Btn
                        kind="quiet"
                        onClick={() => {
                          write(KEY.later, `${day}:${move.id}`);
                          setShift(0);
                        }}
                      >
                        Later
                      </Btn>
                    )}
                  </div>
                </Panel>

                {/* Open loops, gently: a count, never a red badge */}
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {openIdeas > 0 && (
                    <Loop href={`${brandHref}#ideas`}>
                      {openIdeas} {openIdeas === 1 ? 'idea' : 'ideas'} half-built
                      <span style={{ color: 'var(--v-muted)' }}> · on your board</span>
                    </Loop>
                  )}
                  {scoreLine && (
                    <Loop href={playbookHref}>
                      Score {scoreLine.value}
                      <span style={{ color: 'var(--v-muted)' }}>
                        {scoreLine.delta
                          ? ` · ${scoreLine.delta > 0 ? 'up' : 'down'} ${Math.abs(scoreLine.delta)}${scoreLine.since ? ` since ${scoreLine.since}` : ''}`
                          : ' · your brand'}
                      </span>
                    </Loop>
                  )}
                </div>
                <p className="mt-8 text-[13px]" style={{ color: 'var(--v-head-muted)' }}>
                  Moves for a {persona}
                  {persona === 'founder' && founderFor
                    ? founderFor === 'company'
                      ? ' (writing for the company)'
                      : ' (writing as yourself)'
                    : ''}
                  .{' '}
                  <button
                    type="button"
                    onClick={() => {
                      write(KEY.persona, null);
                      write(KEY.founderFor, null);
                    }}
                    className="v2-focus underline underline-offset-2"
                    style={{ fontFamily: VCR, fontSize: 11, letterSpacing: '0.1em' }}
                  >
                    CHANGE
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function Choice({
  title,
  line,
  selected,
  onPick,
}: {
  title: string;
  line: string;
  selected?: boolean;
  onPick: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      whileTap={reduce ? undefined : { scale: 0.98 }}
      onClick={onPick}
      className="v2-focus min-h-[88px] p-5 text-left"
      style={{
        background: 'var(--v-surface)',
        color: 'var(--v-ink)',
        borderRadius: 18,
        boxShadow: selected ? 'inset 0 0 0 2px var(--v-signal)' : 'inset 0 0 0 1px var(--v-rule)',
      }}
    >
      <div
        className="text-[22px]"
        style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.02em' }}
      >
        {title}
      </div>
      <div className="mt-1 text-[14px]" style={{ color: 'var(--v-muted)' }}>
        {line}
      </div>
    </motion.button>
  );
}

function Loop({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="v2-focus v2-press flex min-h-[56px] items-center justify-between px-5 text-[15px]"
      style={{
        borderRadius: 16,
        boxShadow: 'inset 0 0 0 1px var(--v-rule)',
        background: 'var(--v-surface)',
        color: 'var(--v-ink)',
      }}
    >
      <span>{children}</span>
      <span aria-hidden style={{ color: 'var(--v-muted)' }}>
        →
      </span>
    </Link>
  );
}

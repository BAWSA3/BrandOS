'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import {
  LOCAL_DONE_KEY,
  STEP_LABEL,
  walkthroughSteps,
  type WalkStep,
  type WalkthroughInput,
} from '@/lib/walkthrough';
import type { Persona } from '@/lib/user-preferences';
import { Btn, DISPLAY, Label, VCR } from './ui';

/**
 * The first-run walkthrough (docs/FIRST-RUN-WALKTHROUGH-SPEC.md): a full-screen
 * reveal of the member's own playbook, one step at a time, ending in Write.
 * Shown once per account (migration 052; this-device storage until then).
 * Skip is always there.
 *
 * Motion+ headline: the score rolls up in Klein. Each step's own words arrive
 * word by word; the plain sentence under them fades in after. Reduced motion:
 * cross-fades only, the number appears without rolling.
 */

const PERSONAS: { id: Persona; name: string; line: string }[] = [
  { id: 'creator', name: 'Creator', line: 'You make things people follow.' },
  { id: 'founder', name: 'Founder', line: 'You run a company and you are its voice.' },
  { id: 'builder', name: 'Builder', line: 'You ship in public and explain how.' },
];
const PERSONA_KEY = 'brandos:persona'; // shared with Today's "Which one are you?"

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLocal(key: string, v: string) {
  try {
    window.localStorage.setItem(key, v);
  } catch {
    // storage blocked: the account save still applies
  }
}
function save(body: Record<string, unknown>) {
  // keepalive: the save survives the jump to Write
  return fetch('/api/me/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => null);
}

export default function Walkthrough({
  data,
  persona: accountPersona,
  saved,
  name,
  preview = false,
  startAt,
}: {
  data: WalkthroughInput;
  /** the account's answer (052); null = not answered or not saved yet */
  persona: Persona | null;
  /** false before migration 052: "seen" falls back to this device */
  saved: boolean;
  name: string | null;
  /** sample-data harness: always shows, saves nothing */
  preview?: boolean;
  /** harness only: open at this step (0 = persona, 1..n = steps, n+1 = hand-off) */
  startAt?: number;
}) {
  const reduce = useReducedMotion();
  // null until mounted: device storage decides whether to show (pre-052) and the persona
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [persona, setPersona] = useState<Persona | null>(accountPersona);
  // 0 = persona (skipped when known), 1..n = steps, n+1 = hand-off
  const [i, setI] = useState(startAt ?? (accountPersona ? 1 : 0));
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!preview) {
      if (!saved && readLocal(LOCAL_DONE_KEY)) setOpen(false);
      const local = readLocal(PERSONA_KEY) as Persona | null;
      if (!accountPersona && local && PERSONAS.some((p) => p.id === local)) {
        // answered on Today before: skip the question, carry the answer to the account
        setPersona(local);
        setI((v) => (v === 0 ? 1 : v));
        if (saved) void save({ persona: local });
      }
      if (accountPersona && !readLocal(PERSONA_KEY)) writeLocal(PERSONA_KEY, accountPersona);
    }
    setReady(true);
  }, [accountPersona, preview, saved]);

  const steps = useMemo(() => walkthroughSteps(data), [data]);
  const askPersona = !persona;

  // move focus to each new screen so keyboard and screen readers follow
  useEffect(() => {
    panel.current?.focus();
  }, [i]);

  const finish = useCallback(() => {
    if (!preview) {
      writeLocal(LOCAL_DONE_KEY, new Date().toISOString());
      void save({ walkthroughDone: true });
    }
    setOpen(false);
  }, [preview]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    document.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', esc);
    };
  }, [open, finish]);

  if (!ready || !open) return null;

  const n = steps.length;
  const step: WalkStep | null = i >= 1 && i <= n ? steps[i - 1] : null;
  const next = () => setI((v) => Math.min(v + 1, n + 1));
  const back = () => setI((v) => Math.max(v - 1, askPersona ? 0 : 1));

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col overflow-y-auto"
      style={{ background: 'var(--v-canvas)', color: 'var(--v-head)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Your first look at BrandOS"
    >
      <div className="mx-auto flex w-full max-w-[760px] items-center justify-between px-4 pt-5 md:px-10 md:pt-8">
        <Label tone="head-muted">
          {i === 0 ? 'Welcome in' : step ? STEP_LABEL[step.kind] : 'Your next post'}
        </Label>
        <button
          type="button"
          onClick={finish}
          className="v2-focus min-h-[44px] px-2 text-[14px] underline-offset-2 hover:underline"
          style={{ color: 'var(--v-head-muted)', fontFamily: DISPLAY }}
        >
          Skip
        </button>
      </div>

      <div
        ref={panel}
        tabIndex={-1}
        className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center px-4 py-8 outline-none md:px-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: reduce ? 0.12 : 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            {i === 0 && (
              <PersonaStep
                name={name}
                onPick={(p) => {
                  setPersona(p);
                  if (!preview) {
                    writeLocal(PERSONA_KEY, p);
                    void save({ persona: p });
                  }
                  setI(1);
                }}
              />
            )}
            {step && <StepBody step={step} handle={data.handle} />}
            {i === n + 1 && <HandOff />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-3 px-4 pb-8 md:px-10 md:pb-10"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <Dots count={n} at={i} />
        <div className="flex items-center gap-2">
          {i > (askPersona ? 0 : 1) && (
            <Btn kind="quiet" onClick={back}>
              Back
            </Btn>
          )}
          {step && (
            <Btn kind="primary" onClick={next}>
              {i === n ? 'Last thing →' : 'Next →'}
            </Btn>
          )}
          {i === n + 1 && (
            <>
              <Btn kind="quiet" onClick={finish}>
                Later
              </Btn>
              <Link
                href={preview ? '#' : '/dashboard/write'}
                onClick={(e) => {
                  if (preview) e.preventDefault();
                  finish();
                }}
                className="v2-focus v2-press inline-flex min-h-[44px] items-center justify-center px-5 text-[14px] leading-none md:min-h-[40px]"
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 500,
                  borderRadius: 999,
                  background: 'var(--v-signal)',
                  color: 'var(--v-on-signal)',
                }}
              >
                Write my next post →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Words({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{text}</>;
  return (
    <>
      {text.split(' ').map((w, k) => (
        <motion.span
          key={k}
          className="inline-block"
          initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: delay + k * 0.035, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}
          {' '}
        </motion.span>
      ))}
    </>
  );
}

function Plain({
  children,
  delay,
  small = false,
}: {
  children: string;
  delay: number;
  /** a side note (what a brand term means), quieter than the main line */
  small?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reduce ? 0 : delay, duration: reduce ? 0 : 0.4 }}
      className={
        small
          ? 'mt-3 max-w-[520px] text-[14px] leading-[1.5]'
          : 'mt-6 max-w-[560px] text-[17px] leading-[1.5] md:text-[19px]'
      }
      style={{ color: 'var(--v-head-muted)' }}
    >
      {children}
    </motion.p>
  );
}

const BIG = 'text-[30px] leading-[1.12] md:text-[44px]';
const BIG_STYLE = { fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.03em' } as const;

function ScoreRoll({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(value), reduce ? 0 : 260);
    return () => window.clearTimeout(t);
  }, [reduce, value]);
  return (
    <AnimateNumber
      className="text-[96px] leading-none md:text-[148px]"
      style={{
        fontFamily: DISPLAY,
        fontWeight: 500,
        letterSpacing: '-0.05em',
        color: 'var(--v-signal-text)',
      }}
      transition={reduce ? { duration: 0 } : { type: 'spring', duration: 1.3, bounce: 0 }}
    >
      {shown}
    </AnimateNumber>
  );
}

function StepBody({ step, handle }: { step: WalkStep; handle: string }) {
  if (step.kind === 'score') {
    return (
      <div>
        <div className="text-[15px]" style={{ color: 'var(--v-head-muted)' }}>
          @{handle}
        </div>
        <div className="mt-2 flex items-end gap-3">
          <ScoreRoll value={step.score} />
          <span className="pb-3 text-[18px] md:pb-5" style={{ color: 'var(--v-head-muted)' }}>
            / 100
          </span>
        </div>
        <Plain delay={0.9}>{step.body}</Plain>
        <div className="mt-6">
          <Plain small delay={1.3}>
            {step.term}
          </Plain>
          {step.classification && (
            <Plain small delay={1.5}>
              {`${step.classification} is your classification: the kind of creator your posts read as.`}
            </Plain>
          )}
        </div>
      </div>
    );
  }
  if (step.kind === 'known') {
    return (
      <div>
        <ul className="space-y-3">
          {step.lines.map((l, k) => (
            <li key={l} className={BIG} style={BIG_STYLE}>
              <Words text={l} delay={k * 0.35} />
            </li>
          ))}
        </ul>
        <Plain delay={0.5 + step.lines.length * 0.35}>{step.body}</Plain>
      </div>
    );
  }
  if (step.kind === 'working') {
    return (
      <div>
        <div className={BIG} style={BIG_STYLE}>
          <Words text={step.label} />
        </div>
        <div
          className="mt-3 text-[64px] leading-none md:text-[96px]"
          style={{ ...BIG_STYLE, color: 'var(--v-signal-text)' }}
        >
          {step.rate.toFixed(1)}%
        </div>
        <Plain delay={0.7}>{step.body}</Plain>
      </div>
    );
  }
  return (
    <div>
      {step.gap ? (
        <div className={BIG} style={BIG_STYLE}>
          <Words text={step.gap} />
        </div>
      ) : null}
      <Plain delay={step.gap ? 0.8 : 0}>{step.body}</Plain>
    </div>
  );
}

function PersonaStep({ name, onPick }: { name: string | null; onPick: (p: Persona) => void }) {
  return (
    <div>
      <h1 className="text-[36px] leading-[1.04] md:text-[56px]" style={BIG_STYLE}>
        Welcome in{name ? `, ${name}` : ''}.
        <br />
        <span style={{ color: 'var(--v-head-muted)' }}>Which one are you?</span>
      </h1>
      <p className="mt-4 text-[16px]" style={{ color: 'var(--v-head-muted)' }}>
        Then a one-minute look at what your posts say about you.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id)}
            className="v2-focus v2-press min-h-[88px] p-5 text-left"
            style={{
              background: 'var(--v-surface)',
              color: 'var(--v-ink)',
              borderRadius: 18,
              boxShadow: 'inset 0 0 0 1px var(--v-rule)',
            }}
          >
            <div className="text-[22px]" style={{ ...BIG_STYLE, letterSpacing: '-0.02em' }}>
              {p.name}
            </div>
            <div className="mt-1 text-[14px]" style={{ color: 'var(--v-muted)' }}>
              {p.line}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HandOff() {
  return (
    <div>
      <div className="text-[40px] leading-[1.04] md:text-[64px]" style={BIG_STYLE}>
        <Words text="Try it on your next post." />
      </div>
      <Plain delay={0.6}>
        {
          "Write it in BrandOS and it reads along as you type: whether it sounds like you, whether it's on what you're known for, and your score for the draft. It tells you what's off. You fix it, so it stays yours."
        }
      </Plain>
      <Plain delay={1}>{"When it's ready, one tap opens it in X."}</Plain>
    </div>
  );
}

function Dots({ count, at }: { count: number; at: number }) {
  if (at < 1 || at > count) return <span />;
  return (
    <div className="flex items-center gap-3" aria-label={`Step ${at} of ${count}`}>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: count }, (_, k) => (
          <span
            key={k}
            className="h-[6px] rounded-full transition-all duration-300"
            style={{
              width: k + 1 === at ? 22 : 6,
              background: k + 1 <= at ? 'var(--v-signal-text)' : 'var(--v-dot)',
            }}
          />
        ))}
      </div>
      <span style={{ fontFamily: VCR, fontSize: 11, color: 'var(--v-head-muted)' }}>
        {at} / {count}
      </span>
    </div>
  );
}

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { segments, type Lens, type Mark } from '@/lib/live-marks';
import { reveal, type Reveal } from './reveal';
import type { LiveState } from './types';
import InfoTip, { TIPS } from '@/components/dashboard-v2/InfoTip';

/**
 * The live composer's presentation: the marked draft plus the four surfaces
 * beside it (live score, playbook line, proof post, idea link). Props in,
 * pixels out: no fetching, no app state, only react + motion + motion-plus and
 * the pure mark helpers, so the preview harness, the writing room and a
 * Remotion composition (remotion-brandos) can all render it.
 *
 * Motion+ headline: the score rolls in Klein (AnimateNumber). Everything else
 * is opacity/transform only, so typing never triggers layout work; marks fade
 * in and fade out (a leaving mark lingers 320ms) instead of popping.
 * Lenses differ by underline style, not colour: Klein is the only signal.
 */

export const LENS: Record<
  Lens,
  { label: string; style: 'solid' | 'dashed' | 'dotted'; blurb: string }
> = {
  voice: { label: 'Voice', style: 'solid', blurb: 'sounds like you' },
  lane: { label: 'Lane', style: 'dashed', blurb: 'what you’re known for' },
  landing: { label: 'Landing', style: 'dotted', blurb: 'what has worked for you' },
};

// bone (Direction 02 reading surface) unless the host page sets the v2 tokens
const T = {
  ink: 'var(--v-ink, #141414)',
  muted: 'var(--v-muted, #6E6A62)',
  rule: 'var(--v-rule, rgba(20,20,20,0.10))',
  raised: 'var(--v-raised, #FBFAF6)',
  signal: 'var(--v-signal-text, #0047FF)',
  display: "var(--lc-display, 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif)",
  label: "'VCR OSD Mono', var(--font-jetbrains), ui-monospace, monospace",
};
const EASE = [0.22, 1, 0.36, 1] as const;

// `instant` (stills, screenshots, a frame-driven Remotion render): every
// transition snaps, exactly like reduced motion.
const Instant = createContext(false);
function useCalm(): boolean {
  const reduce = useReducedMotion();
  return useContext(Instant) || !!reduce;
}

const CSS = `
.lc-field{display:grid}
.lc-field>*{grid-area:1/1;margin:0;font:inherit;letter-spacing:inherit;line-height:inherit;padding:0;border:0;white-space:pre-wrap;overflow-wrap:break-word;word-break:normal}
.lc-under{color:transparent;pointer-events:none}
.lc-input{resize:none;overflow:hidden;background:transparent;outline:none!important;box-shadow:none!important;border-radius:0;color:inherit;caret-color:${T.signal};min-height:9.5em}
.lc-m{--o:1;text-decoration-line:underline;text-decoration-thickness:2px;text-underline-offset:5px;text-decoration-color:color-mix(in srgb, ${T.signal} calc(var(--o) * 100%), transparent);transition:text-decoration-color .38s cubic-bezier(.22,1,.36,1),background-color .25s;border-radius:3px;animation:lc-in .38s cubic-bezier(.22,1,.36,1)}
.lc-m.on{background:color-mix(in srgb, ${T.signal} 10%, transparent)}
.lc-m.out{--o:0!important}
.lc-voice{text-decoration-style:solid}.lc-lane{text-decoration-style:dashed}.lc-landing{text-decoration-style:dotted;text-decoration-thickness:3px}
@keyframes lc-in{from{text-decoration-color:transparent}}
.lc-panel:focus-within{box-shadow:inset 0 0 0 2px ${T.signal}!important}
.lc-caret{display:inline-block;width:2px;height:1.1em;margin-left:1px;vertical-align:-0.15em;background:${T.signal};animation:lc-blink 1.06s steps(1) infinite}
@keyframes lc-blink{50%{opacity:0}}
@media (prefers-reduced-motion: reduce){.lc-m{transition:none;animation:none}.lc-caret{animation:none}}
`;

/** Marks plus the ones that just left, kept 320ms so they can fade out. */
function useFadingMarks(marks: Mark[], text: string): (Mark & { leaving?: boolean })[] {
  const [ghosts, setGhosts] = useState<Mark[]>([]);
  const prev = useRef<Mark[]>([]);
  useEffect(() => {
    const ids = new Set(marks.map((m) => m.id));
    const left = prev.current.filter((m) => !ids.has(m.id));
    prev.current = marks;
    if (!left.length) return;
    setGhosts((g) => [...g.filter((x) => !ids.has(x.id)), ...left]);
    const t = setTimeout(() => setGhosts((g) => g.filter((x) => !left.includes(x))), 320);
    return () => clearTimeout(t);
  }, [marks]);
  const live = marks.map((m) => ({ ...m }));
  const extra = ghosts
    .filter((g) => g.end <= text.length && !marks.some((m) => g.start < m.end && g.end > m.start))
    .map((g) => ({ ...g, leaving: true }));
  return [...live, ...extra].sort((a, b) => a.start - b.start);
}

function MarkedField({
  text,
  marks,
  op,
  active,
  onChange,
  caret,
  placeholder,
}: {
  text: string;
  marks: Mark[];
  op: Record<Lens, number>;
  active: string | null;
  /** Editable when given; otherwise the draft renders as text with a caret (demo / film). */
  onChange?: (v: string) => void;
  caret?: boolean;
  placeholder?: string;
}) {
  const shown = useFadingMarks(marks, text);
  const editable = !!onChange;
  const runs = segments(text, shown).map((r, k) =>
    r.mark ? (
      <span
        key={`${r.mark.id}:${k}`}
        className={`lc-m lc-${r.mark.lens}${r.mark.id === active ? ' on' : ''}${(r.mark as { leaving?: boolean }).leaving ? ' out' : ''}`}
        // only the underline fades: the words themselves never dim
        style={{ '--o': op[r.mark.lens] } as CSSProperties}
      >
        {r.text}
      </span>
    ) : (
      <span key={k}>{r.text}</span>
    )
  );
  return (
    <div
      className="lc-field text-[18px] leading-[1.65] md:text-[19px]"
      style={{ fontFamily: T.display, color: T.ink }}
    >
      <div aria-hidden={editable} className={editable ? 'lc-under' : undefined}>
        {runs}
        {!editable && caret && <span className="lc-caret" />}
        {/* keeps the last line's height when the draft ends in a newline */}
        {'​'}
      </div>
      {editable && (
        <textarea
          className="lc-input"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Draft"
          maxLength={4000}
          placeholder={placeholder}
          spellCheck
        />
      )}
    </div>
  );
}

function Micro({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'signal' }) {
  return (
    <span
      className="text-[11px] uppercase tracking-[0.08em]"
      style={{ fontFamily: T.label, color: tone === 'signal' ? T.signal : T.muted }}
    >
      {children}
    </span>
  );
}

/** A surface that eases in and out with opacity + a short rise (no layout). */
function Surface({
  o,
  children,
  className = '',
  x = 0,
}: {
  o: number;
  children: ReactNode;
  className?: string;
  x?: number;
}) {
  const reduce = useCalm();
  return (
    <motion.div
      className={className}
      initial={false}
      // layout="position": when a surface above grows (a new note), this one
      // glides down on a transform instead of jumping
      layout={reduce ? false : 'position'}
      animate={{ opacity: o, y: o > 0.5 || reduce ? 0 : 6, x: o > 0.5 || reduce ? 0 : x }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 0.5, ease: EASE, layout: { duration: 0.4, ease: EASE } }
      }
      style={{ pointerEvents: o > 0.5 ? 'auto' : 'none', willChange: 'opacity, transform' }}
      aria-hidden={o < 0.5}
    >
      {children}
    </motion.div>
  );
}

function ScoreTile({ s, r, compact }: { s: LiveState; r: Reveal; compact?: boolean }) {
  const reduce = useCalm();
  // AnimateNumber only rolls on change: start at 0, then set the real value
  // (instant / reduced motion: start on it)
  const [shown, setShown] = useState(() => (reduce && r.score >= 0.5 ? (s.score ?? 0) : 0));
  useEffect(() => {
    if (s.score === null || r.score < 0.5) return;
    // next frame, so the roll starts from what's on screen
    const t = requestAnimationFrame(() => setShown(s.score ?? 0));
    return () => cancelAnimationFrame(t);
  }, [s.score, r.score]);
  return (
    <Surface o={r.score}>
      <div className={compact ? 'flex items-baseline gap-2' : ''}>
        <Micro tone={s.reading ? 'signal' : 'muted'}>{s.reading ? 'Reading…' : 'On-brand'}</Micro>
        {!compact && (
          <span style={{ color: T.muted }}>
            <InfoTip label="the draft score">{TIPS.liveScore}</InfoTip>
          </span>
        )}
        <div
          className={
            compact ? 'text-[34px] leading-none' : 'mt-1 text-[72px] leading-[0.95] md:text-[88px]'
          }
          style={{
            fontFamily: T.display,
            fontWeight: 500,
            letterSpacing: '-0.04em',
            color: T.signal,
          }}
        >
          {s.score === null ? (
            <span style={{ opacity: 0.25 }}>··</span>
          ) : (
            <AnimateNumber transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE }}>
              {shown}
            </AnimateNumber>
          )}
        </div>
      </div>
    </Surface>
  );
}

function Playbook({ s, r }: { s: LiveState; r: Reveal }) {
  const reduce = useCalm();
  if (!s.pillars.length) return null;
  return (
    <Surface o={r.playbook}>
      <Micro>Your playbook</Micro>
      <ul className="mt-2 space-y-1.5">
        {s.pillars.map((p, i) => {
          const lit = r.playbookLit && s.pillar === i;
          return (
            <li key={p} className="relative pl-3.5 text-[14px] leading-[1.4]">
              {lit && (
                <motion.span
                  layoutId="lc-lit"
                  className="absolute left-0 top-[3px] h-[calc(100%-6px)] w-[3px] rounded-full"
                  style={{ background: T.signal }}
                  transition={reduce ? { duration: 0 } : { duration: 0.45, ease: EASE }}
                />
              )}
              <span style={{ color: lit ? T.ink : T.muted, transition: 'color .4s' }}>{p}</span>
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}

function Proof({ s, r }: { s: LiveState; r: Reveal }) {
  return (
    <Surface o={s.proof ? r.proof : 0} x={14}>
      {s.proof && (
        <div
          className="rounded-[14px] p-4"
          style={{ background: T.raised, boxShadow: `inset 0 0 0 1px ${T.rule}` }}
        >
          <Micro>
            Proof · <span style={{ color: T.signal }}>{s.proof.lift}× your avg</span>
          </Micro>
          <p className="mt-2 text-[14px] leading-[1.5]" style={{ color: T.ink }}>
            “{s.proof.text}”
          </p>
        </div>
      )}
    </Surface>
  );
}

function Idea({ s, r, href }: { s: LiveState; r: Reveal; href?: (id: string) => string }) {
  return (
    <Surface o={s.idea ? r.idea : 0} x={14}>
      {s.idea && (
        <div>
          <Micro>From your board</Micro>
          {href ? (
            <a
              href={href(s.idea.id)}
              className="mt-1 block text-[14px] underline-offset-4 hover:underline"
              style={{ color: T.ink }}
            >
              {s.idea.text} →
            </a>
          ) : (
            <p className="mt-1 text-[14px]" style={{ color: T.ink }}>
              {s.idea.text} →
            </p>
          )}
        </div>
      )}
    </Surface>
  );
}

function Notes({
  s,
  r,
  setActive,
}: {
  s: LiveState;
  r: Reveal;
  setActive: (id: string | null) => void;
}) {
  const reduce = useCalm();
  const visible = s.marks.filter((m) => r.marks[m.lens] > 0.5);
  const lenses: Lens[] = s.landingReady ? ['voice', 'lane', 'landing'] : ['voice', 'lane'];
  const anyOn = lenses.some((l) => r.marks[l] > 0);
  return (
    <Surface o={anyOn ? 1 : 0}>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {lenses.map((l) => (
          <span
            key={l}
            className="inline-flex items-center gap-1.5"
            style={{ opacity: Math.max(0.35, r.marks[l]) }}
          >
            <span
              className="inline-block w-5"
              style={{ borderBottom: `${l === 'landing' ? 3 : 2}px ${LENS[l].style} ${T.signal}` }}
            />
            <Micro>{LENS[l].label}</Micro>
          </span>
        ))}
        <span style={{ color: T.muted }}>
          <InfoTip label="these marks">{TIPS.marks}</InfoTip>
        </span>
      </div>
      {!s.landingReady && (
        <p className="mt-2 text-[12px]" style={{ color: T.muted }}>
          Landing marks start once BrandOS has 10 of your posts
          {s.posts ? ` (it has ${s.posts})` : ''}.
        </p>
      )}
      <ul className="mt-3 space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((m) => (
            <motion.li
              key={m.id}
              layout={reduce ? false : 'position'}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                reduce
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, transition: { duration: 0.24 } }
              }
              transition={{ duration: 0.36, ease: EASE }}
              onMouseEnter={() => setActive(m.id)}
              onMouseLeave={() => setActive(null)}
              className="text-[14px] leading-[1.45]"
              style={{ color: T.ink }}
            >
              <span
                className="mr-2 inline-block w-4 align-middle"
                style={{
                  borderBottom: `${m.lens === 'landing' ? 3 : 2}px ${LENS[m.lens].style} ${T.signal}`,
                }}
              />
              {m.note}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Surface>
  );
}

export default function LiveComposerView({
  state,
  onChange,
  caret,
  placeholder = 'Half-formed is fine.',
  ideaHref,
  header,
  footer,
  instant = false,
}: {
  state: LiveState;
  /** Editable draft; omit for scripted playback. */
  onChange?: (v: string) => void;
  caret?: boolean;
  placeholder?: string;
  ideaHref?: (id: string) => string;
  /** Rendered above the draft inside the panel (labels, brand switch). */
  header?: ReactNode;
  /** Rendered under the draft inside the panel (format switch, counts). */
  footer?: ReactNode;
  /** Snap every transition (stills, screenshots, frame-driven renders). */
  instant?: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const r = reveal(state);
  const markOp = r.marks;
  return (
    <Instant.Provider value={instant}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px] md:gap-10">
        <style>
          {instant
            ? CSS + '.lc-m,.lc-caret{transition:none!important;animation:none!important}'
            : CSS}
        </style>
        <div className="min-w-0">
          <div
            className="lc-panel rounded-[20px] p-5 md:p-8"
            style={{ background: T.raised, boxShadow: `inset 0 0 0 1px ${T.rule}` }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">{header}</div>
              <div className="md:hidden">
                <ScoreTile s={state} r={r} compact />
              </div>
            </div>
            <MarkedField
              text={state.text}
              marks={state.marks}
              op={markOp}
              active={active}
              onChange={onChange}
              caret={caret}
              placeholder={placeholder}
            />
            {footer && (
              <div className="mt-3 border-t pt-4" style={{ borderColor: T.rule }}>
                {footer}
              </div>
            )}
          </div>
          {state.error && (
            <p role="status" className="mt-3 text-[13px]" style={{ color: T.muted }}>
              {state.error}
            </p>
          )}
        </div>
        <aside className="space-y-7 md:pt-2" aria-label="BrandOS reading">
          <div className="hidden md:block">
            <ScoreTile s={state} r={r} />
          </div>
          <Notes s={state} r={r} setActive={setActive} />
          <Playbook s={state} r={r} />
          <Proof s={state} r={r} />
          <Idea s={state} r={r} href={ideaHref} />
        </aside>
      </div>
    </Instant.Provider>
  );
}

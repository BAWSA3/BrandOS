'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { AnimateNumber, Carousel, Ticker, useCarousel, useCurtains } from 'motion-plus/react';
import { pixels } from 'motion-plus/curtains';
import {
  Button,
  DitherWipeProvider,
  FieldText,
  Panel,
  Stat,
  SYSTEM_FONTS,
} from '@/components/system';
import { Card as IndexEntryCard } from '@/app/creators/IndexBook';
import { CLASSES, classLabel, classify } from '@/lib/classifications';
import { EDITOR, LANDING } from '@/lib/landing-copy';
import type { LandingData } from '@/lib/landing-data';
import type { IndexCard } from '@/lib/creator-index';
import type { RecentRead } from '@/lib/landing-rules';
import {
  BONE,
  CORAL,
  ChapterRail,
  Decode,
  INK,
  KLEIN,
  LandingCursor,
  NearViewport,
  WipeIntoScan,
  useArrived,
} from './interaction';

/**
 * The homepage landing scroll under the hero (Direction 03, the field). Five
 * chapters on the field; long reading on bone panels. Every chapter has one
 * thing to touch:
 *   01 the problem       two accounts with the same follower count; "Show the reading"
 *   02 how it works      a pinned stepper: one specimen that becomes score → class → entry → seal
 *                        (stacked on phones and for reduced motion), then the eight classes
 *   03 your record       a Motion+ Carousel of real record tiles, charts drawn in dots
 *   04 the Index         entries running in a Ticker, the Founding card opened by a pixel curtain,
 *                        the FAQ
 *   05 the close         the scan again; a valid handle sends the field over the page into the scan
 * Motion vocabulary only (press, type, count, rule, cut, scramble, clip, curtains): no fades,
 * no blur, no glows. Reduced motion = final state. Copy: src/lib/landing-copy.ts.
 */

const MUTED = 'rgba(14,14,14,.62)';
const RULE = 'rgba(14,14,14,.14)';
const EASE = [0.16, 1, 0.3, 1] as const;

const micro: CSSProperties = {
  fontFamily: SYSTEM_FONTS.vcr,
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: MUTED,
};

function useWide(min = 900) {
  return useWideKnown(min) ?? false;
}

/** Like useWide, but null until measured (so a layout isn't mounted and then swapped). */
function useWideKnown(min = 900) {
  const [wide, setWide] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${min}px)`);
    const set = () => setWide(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, [min]);
  return wide;
}

// ── Small pieces ──────────────────────────────────────────────────────────────

/** A chapter label: VCR on a Klein backing, decoding on arrival. */
function ChapterLabel({ text, on }: { text: string; on: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: SYSTEM_FONTS.vcr,
        fontSize: 12,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        padding: '5px 9px',
        background: KLEIN,
        color: '#fff',
      }}
    >
      <Decode on={on} duration={0.6}>
        {text}
      </Decode>
    </span>
  );
}

/** A hairline that draws on from the left on arrival. */
function Rule({ on, color = RULE }: { on: boolean; color?: string }) {
  return (
    <div
      aria-hidden
      className="lc-rule"
      style={{
        height: 1,
        background: color,
        transformOrigin: 'left',
        transform: on ? 'scaleX(1)' : 'scaleX(0)',
      }}
    />
  );
}

/** A number that counts up once it's switched on. */
function Count({ value, on, suffix }: { value: number; on: boolean; suffix?: string }) {
  return <AnimateNumber suffix={suffix}>{on ? value : 0}</AnimateNumber>;
}

/** A number that counts with the scroll: `progress` 0..1 maps to 0..value. */
function ScrollCount({ value, progress }: { value: number; progress: MotionValue<number> }) {
  const at = (p: number) => Math.round(Math.max(0, Math.min(1, p)) * value);
  const [n, setN] = useState(() => at(progress.get()));
  useMotionValueEvent(progress, 'change', (p) => setN(at(p)));
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{n}</span>;
}

/** A link styled like the system Button. */
function LinkButton({
  href,
  variant = 'bone',
  children,
  disabled,
}: {
  href: string;
  variant?: 'bone' | 'signal';
  children: ReactNode;
  disabled?: boolean;
}) {
  const look: Record<string, CSSProperties> = {
    bone: { background: INK, color: BONE, border: `1px solid ${INK}` },
    signal: { background: CORAL, color: INK, border: `1px solid ${CORAL}` },
  };
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: SYSTEM_FONTS.plex,
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '13px 18px',
    textDecoration: 'none',
    ...look[variant],
    ...(disabled ? { opacity: 0.55, cursor: 'not-allowed' } : {}),
  };
  if (disabled) {
    return (
      <span aria-disabled="true" style={style}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className="sys-press sys-focus" style={style}>
      {children}
    </Link>
  );
}

/** One full-screen chapter on the field. */
function Chapter({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: (arrived: boolean) => ReactNode;
}) {
  const { ref, arrived } = useArrived<HTMLElement>(0.2);
  return (
    <section
      ref={ref}
      id={id}
      aria-label={label}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(64px, 12vh, 140px) clamp(16px, 3.5vw, 40px)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1180, width: '100%', margin: '0 auto' }}>
        <ChapterLabel text={label} on={arrived} />
        <div style={{ marginTop: 20 }}>{children(arrived)}</div>
      </div>
    </section>
  );
}

/** The editor's note: Bawsa's lowercase line, signed. */
function EditorNote({ text }: { text: string }) {
  return (
    <figure style={{ margin: 0 }}>
      <blockquote
        style={{
          margin: 0,
          fontFamily: SYSTEM_FONTS.plex,
          fontSize: 'clamp(17px, 2vw, 21px)',
          lineHeight: 1.5,
          color: INK,
        }}
      >
        “{text}”
      </blockquote>
      <figcaption style={{ ...micro, marginTop: 10 }}>— {EDITOR}</figcaption>
    </figure>
  );
}

/** The ✓ seal. */
function Seal({ size = 52 }: { size?: number }) {
  return (
    <div
      aria-label="Verified"
      role="img"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: KLEIN,
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
      }}
    >
      <svg viewBox="0 0 48 48" width={size / 2} fill="none" aria-hidden>
        <path
          d="M11 25 L20 34 L37 15"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * A bar drawn in dots: `value`/`max` of the dots are ink (or Klein), lit one
 * by one when `on` (a count, not a fade). The record's charts are dots, like the field.
 */
function DotBar({
  value,
  max = 100,
  dots = 24,
  on,
  color = KLEIN,
  delay = 0,
}: {
  value: number;
  max?: number;
  dots?: number;
  on: boolean;
  color?: string;
  delay?: number;
}) {
  const lit = Math.round((Math.max(0, Math.min(max, value)) / max) * dots);
  return (
    <div
      aria-hidden
      style={{ display: 'grid', gridTemplateColumns: `repeat(${dots}, 1fr)`, gap: 3 }}
    >
      {Array.from({ length: dots }, (_, i) => (
        <span
          key={i}
          className="lc-dot"
          style={{
            aspectRatio: '1',
            background: on && i < lit ? color : 'transparent',
            boxShadow: `inset 0 0 0 1px ${on && i < lit ? color : 'rgba(14,14,14,.18)'}`,
            transitionDelay: on ? `${delay + i * 22}ms` : '0ms',
          }}
        />
      ))}
    </div>
  );
}

/**
 * The same dot bar, filled by scrolling: `progress` (0..1) lights the dots one
 * by one as the reader scrolls, and empties them on the way back up. Each bar
 * starts a little after the one above it (`index`). Only this bar re-renders.
 */
function ScrollDotBar({
  value,
  progress,
  index = 0,
  dots = 28,
  color = KLEIN,
}: {
  value: number;
  progress: MotionValue<number>;
  index?: number;
  dots?: number;
  color?: string;
}) {
  const max = Math.round((Math.max(0, Math.min(100, value)) / 100) * dots);
  const local = (p: number) => Math.max(0, Math.min(1, (p - index * 0.12) / 0.64));
  const [lit, setLit] = useState(() => Math.round(local(progress.get()) * max));
  useMotionValueEvent(progress, 'change', (p) => setLit(Math.round(local(p) * max)));
  return (
    <div
      aria-hidden
      style={{ display: 'grid', gridTemplateColumns: `repeat(${dots}, 1fr)`, gap: 3 }}
    >
      {Array.from({ length: dots }, (_, i) => (
        <span
          key={i}
          style={{
            aspectRatio: '1',
            background: i < lit ? color : 'transparent',
            boxShadow: `inset 0 0 0 1px ${i < lit ? color : 'rgba(14,14,14,.18)'}`,
          }}
        />
      ))}
    </div>
  );
}

/** A line chart drawn as columns of dots (the follower line in the record). */
function DotChart({ series, on }: { series: number[]; on: boolean }) {
  const rows = 10;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const level = (v: number) =>
    Math.max(1, Math.round(((v - lo) / Math.max(1, hi - lo)) * (rows - 1)) + 1);
  return (
    <div
      aria-hidden
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${series.length}, 1fr)`,
        gap: 3,
        alignItems: 'end',
      }}
    >
      {series.map((v, x) => {
        const h = level(v);
        return (
          <div key={x} style={{ display: 'grid', gap: 3 }}>
            {Array.from({ length: rows }, (_, r) => {
              const y = rows - r;
              const top = y === h;
              const lit = on && y <= h;
              return (
                <span
                  key={r}
                  className="lc-dot"
                  style={{
                    aspectRatio: '1',
                    background: lit ? (top ? KLEIN : 'rgba(0,71,255,.28)') : 'transparent',
                    transitionDelay: on ? `${x * 26 + (rows - y) * 6}ms` : '0ms',
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── 01 · The problem: same follower count ─────────────────────────────────────

function SameFollowers() {
  const D = LANDING.problem.demo;
  const [shown, setShown] = useState(false);
  const reduce = useReducedMotion();
  return (
    <Panel label={D.label} meta={D.sampleNote} padding={24}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          border: `1px solid ${RULE}`,
        }}
      >
        {D.accounts.map((a, i) => (
          <div
            key={a.name}
            style={{
              padding: '18px 16px',
              borderLeft: i ? `1px solid ${RULE}` : 'none',
              minWidth: 0,
            }}
          >
            <div style={micro}>{a.name}</div>
            <div
              style={{
                fontFamily: SYSTEM_FONTS.display,
                fontWeight: 700,
                fontSize: 'clamp(34px, 4.4vw, 52px)',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                marginTop: 10,
              }}
            >
              {D.followers}
            </div>
            <div style={{ ...micro, marginTop: 6 }}>{D.followersLabel}</div>

            <AnimatePresence initial={false}>
              {shown && (
                <motion.div
                  key="read"
                  initial={reduce ? false : { height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={reduce ? undefined : { height: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: 16 }}>
                    <Rule on />
                    <div style={{ ...micro, marginTop: 14 }}>{D.scoreLabel}</div>
                    <div
                      style={{
                        fontFamily: SYSTEM_FONTS.display,
                        fontWeight: 700,
                        fontSize: 40,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        marginTop: 6,
                        color: KLEIN,
                      }}
                    >
                      <Count value={a.score} on suffix="/100" />
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: 12,
                        padding: '6px 9px',
                        background: KLEIN,
                        color: '#fff',
                        fontFamily: SYSTEM_FONTS.vcr,
                        fontSize: 12,
                        letterSpacing: '0.12em',
                      }}
                    >
                      <Decode duration={0.8}>{classLabel(a.archetype, '/')}</Decode>
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.5 }}>{a.note}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginTop: 16,
        }}
      >
        <Button aria-expanded={shown} onClick={() => setShown((s) => !s)}>
          <Decode hover>{shown ? D.hide : D.show}</Decode>
        </Button>
        {shown && (
          <span
            style={{
              fontFamily: SYSTEM_FONTS.display,
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: '-0.01em',
            }}
          >
            <Decode duration={0.7}>{D.verdict}</Decode>
          </span>
        )}
      </div>
    </Panel>
  );
}

// ── 02 · How it works: one specimen, four states ──────────────────────────────

type Ex = LandingData['example'];

function Specimen({
  step,
  ex,
  fill,
}: {
  step: number;
  ex: Ex;
  /** Scroll-linked fill for the phase bars (0..1); without it they fill once on arrival. */
  fill?: MotionValue<number>;
}) {
  const H = LANDING.how;
  const cls = classify(ex.archetype);
  const phases: [string, number][] = [
    ['Define', ex.phases.define],
    ['Check', ex.phases.check],
    ['Generate', ex.phases.generate],
    ['Scale', ex.phases.scale],
  ];
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const entry: IndexCard = {
    handle: ex.handle,
    number: 0,
    name: null,
    avatar: null,
    score: ex.score,
    archetype: ex.archetype,
    niches: ['Founder', 'Education'],
    blurb: 'building BrandOS. the branding guy in crypto.',
    featured: false,
    joinedAt: '',
  };
  return (
    <div className="lc-press" style={{ minHeight: 300 }}>
      {step === 0 && (
        <div>
          <div style={micro}>
            {LANDING.how.exampleLabel} · @{ex.handle}
          </div>
          <div
            style={{
              fontFamily: SYSTEM_FONTS.display,
              fontWeight: 700,
              fontSize: 'clamp(84px, 11vw, 132px)',
              letterSpacing: '-0.05em',
              lineHeight: 0.9,
              color: KLEIN,
              marginTop: 14,
            }}
          >
            {fill ? (
              <ScrollCount value={ex.score} progress={fill} />
            ) : (
              <Count value={ex.score} on={on} />
            )}
            <span
              style={{
                fontSize: '0.24em',
                color: MUTED,
                letterSpacing: 0,
                marginLeft: '0.35em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              /100
            </span>
          </div>
          <div style={{ display: 'grid', gap: 14, marginTop: 26 }}>
            {phases.map(([k, v], i) => (
              <div key={k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', ...micro }}>
                  <span>{k}</span>
                  <span style={{ color: INK }}>{v}</span>
                </div>
                <div style={{ marginTop: 7 }}>
                  {fill ? (
                    <ScrollDotBar value={v} progress={fill} index={i} dots={28} />
                  ) : (
                    <DotBar value={v} on={on} delay={i * 90} dots={28} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {step === 1 && (
        <div>
          <div style={micro}>{H.classOf}</div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 16,
              padding: '14px 18px',
              background: KLEIN,
              color: '#fff',
              fontFamily: SYSTEM_FONTS.vcr,
              fontSize: 'clamp(22px, 3vw, 34px)',
              letterSpacing: '0.1em',
            }}
          >
            <Decode duration={1}>{classLabel(ex.archetype, '/')}</Decode>
          </div>
          <p
            style={{
              margin: '20px 0 0',
              fontFamily: SYSTEM_FONTS.display,
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: '-0.02em',
            }}
          >
            {cls?.definition ?? 'Unclassified'}.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 4,
              marginTop: 26,
            }}
          >
            {CLASSES.map((c) => (
              <span
                key={c.code}
                style={{
                  height: 28,
                  background: cls?.code === c.code ? KLEIN : 'transparent',
                  boxShadow: `inset 0 0 0 1px ${cls?.code === c.code ? KLEIN : RULE}`,
                  fontFamily: SYSTEM_FONTS.plex,
                  fontSize: 11,
                  display: 'grid',
                  placeItems: 'center',
                  color: cls?.code === c.code ? '#fff' : MUTED,
                }}
              >
                {String(c.number).padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div style={{ maxWidth: 360 }}>
          <IndexEntryCard c={entry} sample />
        </div>
      )}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="lc-stamp">
              <Seal size={84} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: SYSTEM_FONTS.display,
                  fontWeight: 700,
                  fontSize: 34,
                  letterSpacing: '-0.03em',
                }}
              >
                Verified
              </div>
              <div style={micro}>{LANDING.how.steps[3].when}</div>
            </div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0' }}>
            {H.checks.map((c, i) => (
              <li
                key={c}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: '12px 0',
                  borderTop: `1px solid ${RULE}`,
                  fontSize: 17,
                }}
              >
                <span style={{ fontFamily: SYSTEM_FONTS.plex, color: KLEIN }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StepText({
  s,
  active,
  onSelect,
}: {
  s: (typeof LANDING.how.steps)[number];
  active: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'step' : undefined}
      className="sys-focus"
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        display: 'flex',
        gap: 16,
        width: '100%',
        padding: '18px 0 18px 16px',
        borderLeft: `3px solid ${active ? KLEIN : 'transparent'}`,
        cursor: onSelect ? 'pointer' : 'default',
      }}
    >
      <span
        style={{
          fontFamily: SYSTEM_FONTS.plex,
          color: active ? KLEIN : MUTED,
          minWidth: 24,
          paddingTop: 3,
        }}
      >
        {s.n}
      </span>
      <span style={{ display: 'block' }}>
        <span style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.015em',
              color: active ? INK : MUTED,
            }}
          >
            {s.title}
          </span>
          {'when' in s && s.when && <span style={micro}>{s.when}</span>}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 6,
            fontSize: 16,
            lineHeight: 1.55,
            color: active ? INK : MUTED,
          }}
        >
          {s.body}
        </span>
      </span>
    </button>
  );
}

/** Desktop: the chapter pins while scrolling walks the specimen through four states. */
function PinnedHow({ ex }: { ex: Ex }) {
  const H = LANDING.how;
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] });
  const [step, setStep] = useState(0);
  // The phase bars fill across the first step's scroll (and empty going back).
  // Fill while the section scrolls in: complete the moment it pins (panel fully on screen).
  const { scrollYProgress: arrive } = useScroll({
    target: track,
    offset: ['start end', 'start start'],
  });
  const fill = useTransform(arrive, [0.15, 1], [0, 1], { clamp: true });
  useMotionValueEvent(scrollYProgress, 'change', (p) =>
    setStep(Math.min(3, Math.max(0, Math.floor(p * 4 - 0.0001))))
  );
  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * ((i + 0.5) / 4), behavior: 'smooth' });
  };
  return (
    <div ref={track} style={{ height: '360vh', position: 'relative' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '0 clamp(16px, 3.5vw, 40px)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: 1180, width: '100%', margin: '0 auto' }}>
          <ChapterLabel text={H.label} on />
          <FieldText size="title" as="h2" style={{ maxWidth: 900, marginTop: 20 }}>
            {H.headline}
          </FieldText>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 16,
              marginTop: 28,
              alignItems: 'stretch',
            }}
          >
            <Panel padding={10}>
              {H.steps.map((s, i) => (
                <div key={s.n} style={{ borderTop: i ? `1px solid ${RULE}` : 'none' }}>
                  <StepText s={s} active={i === step} onSelect={() => goTo(i)} />
                </div>
              ))}
            </Panel>
            <Panel
              label={`${H.stepOf} ${String(step + 1).padStart(2, '0')} / 04 · ${H.specimen[step]}`}
              padding={28}
            >
              <Specimen key={step} step={step} ex={ex} fill={fill} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Phones and reduced motion: the same four states, stacked. */
function StackedHow({ ex, on }: { ex: Ex; on: boolean }) {
  const H = LANDING.how;
  const reduce = useReducedMotion();
  const reading = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: reading, offset: ['start 0.7', 'end end'] });
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {H.steps.map((s, i) => (
        <div key={s.n} ref={i === 0 ? reading : undefined}>
          <Panel padding={14}>
            <StepText s={s} active />
            {on && (
              <div style={{ padding: '4px 4px 8px' }}>
                <Specimen
                  step={i}
                  ex={ex}
                  fill={i === 0 && !reduce ? scrollYProgress : undefined}
                />
              </div>
            )}
          </Panel>
        </div>
      ))}
    </div>
  );
}

/** The eight classes: select one to read its definition (decoded). */
function ClassIndex() {
  const H = LANDING.how;
  const [sel, setSel] = useState(0);
  const c = CLASSES[sel];
  return (
    <Panel label={H.classesLabel} meta={H.classesHint} padding={24}>
      <div
        role="tablist"
        aria-label={H.classesLabel}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
      >
        {CLASSES.map((k, i) => (
          <button
            key={k.code}
            role="tab"
            aria-selected={i === sel}
            onClick={() => setSel(i)}
            onPointerEnter={() => setSel(i)}
            onFocus={() => setSel(i)}
            className="sys-press sys-focus"
            style={{
              fontFamily: SYSTEM_FONTS.plex,
              fontSize: 12,
              letterSpacing: '0.06em',
              padding: '8px 10px',
              border: `1px solid ${i === sel ? KLEIN : 'rgba(14,14,14,.3)'}`,
              background: i === sel ? KLEIN : 'transparent',
              color: i === sel ? '#fff' : INK,
              cursor: 'pointer',
            }}
          >
            {String(k.number).padStart(2, '0')} {k.code}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        aria-live="polite"
        style={{
          marginTop: 18,
          display: 'flex',
          gap: 16,
          alignItems: 'baseline',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ ...micro, color: KLEIN }}>CLASS {String(c.number).padStart(2, '0')}</span>
        <span
          style={{
            fontFamily: SYSTEM_FONTS.display,
            fontWeight: 600,
            fontSize: 'clamp(22px, 2.6vw, 30px)',
            letterSpacing: '-0.02em',
          }}
        >
          <Decode key={c.code} duration={0.6}>
            {`${c.definition}.`}
          </Decode>
        </span>
      </div>
    </Panel>
  );
}

// ── 02 · The scan: what a reading actually does ──────────────────────────────

/**
 * The scan log types itself as the reader scrolls (and un-types going back),
 * so the machine's steps read in order. Facts only: src/lib/brand-score.ts.
 */
function ScanLog({ ex }: { ex: Ex }) {
  const S = LANDING.scan;
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  // The log is short, so it types across most of a screen of scrolling: from its
  // top entering the bottom of the screen to its top reaching the upper quarter.
  const { scrollYProgress } = useScroll({ target: box, offset: ['start 0.85', 'start 0.25'] });
  const lines: { mark: string; text: string }[] = [
    { mark: '›', text: `${S.log.start} @${ex.handle}` },
    { mark: '✓', text: S.log.profile },
    { mark: '✓', text: S.log.posts },
    { mark: '✓', text: S.log.measured },
    { mark: '✓', text: S.log.formats },
    { mark: '✓', text: S.log.voice },
    { mark: '✓', text: S.log.phases },
    { mark: '✓', text: `${S.log.classified}: ${classLabel(ex.archetype, '/')}` },
    { mark: '✓', text: S.log.back },
  ];
  const total = lines.reduce((n, l) => n + l.text.length, 0);
  const at = (p: number) => Math.round(Math.max(0, Math.min(1, p)) * total);
  const [typed, setTyped] = useState(() => (reduce ? total : at(scrollYProgress.get())));
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (!reduce) setTyped(at(p));
  });
  const shown = reduce ? total : typed;
  let left = shown;
  return (
    <div ref={box}>
      <Panel label={S.logLabel} meta={`@${ex.handle}`} padding={24}>
        <div
          role="log"
          aria-label={S.logLabel}
          style={{
            fontFamily: SYSTEM_FONTS.plex,
            fontSize: 14,
            lineHeight: 1.75,
            color: INK,
            display: 'grid',
            gap: 2,
          }}
        >
          {lines.map((l, i) => {
            const n = Math.max(0, Math.min(l.text.length, left));
            left -= l.text.length;
            const done = n === l.text.length;
            const typing = n > 0 && !done;
            return (
              <div
                key={i}
                data-scan-line={n > 0 ? 'on' : 'off'}
                style={{ display: 'flex', gap: 10, minHeight: '1.75em' }}
              >
                <span style={{ color: KLEIN, width: '1ch', flexShrink: 0 }}>
                  {i === 0 ? (n > 0 ? l.mark : '') : done ? l.mark : ''}
                </span>
                <span style={{ minWidth: 0 }}>
                  {l.text.slice(0, n)}
                  {typing && (
                    <span
                      aria-hidden
                      style={{
                        display: 'inline-block',
                        width: '0.6em',
                        height: '1em',
                        background: KLEIN,
                        verticalAlign: '-0.15em',
                        marginLeft: 1,
                      }}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>
        {/* Screen readers get the whole log at once. */}
        <p style={srOnly}>{lines.map((l) => l.text).join('. ')}</p>
      </Panel>
    </div>
  );
}

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

/** The four phases: weight in dots, the question, and the detail on tap. */
function PhaseList({ on }: { on: boolean }) {
  const S = LANDING.scan;
  const wide = useWide(900);
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number>(-1);
  const [touched, setTouched] = useState(false);
  const current = touched ? open : wide ? 0 : -1;
  return (
    <Panel label={S.phasesLabel} meta={S.phasesHint} padding={24}>
      <div style={{ display: 'grid' }}>
        {S.phases.map((ph, i) => {
          const isOpen = current === i;
          return (
            <div key={ph.name} style={{ borderTop: i ? `1px solid ${RULE}` : 'none' }}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`phase-${i}`}
                onClick={() => {
                  setTouched(true);
                  setOpen(isOpen ? -1 : i);
                }}
                className="sys-focus"
                style={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  width: '100%',
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: '8px 16px',
                  padding: '14px 0',
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: SYSTEM_FONTS.display,
                      fontWeight: 700,
                      fontSize: 20,
                      letterSpacing: '-0.02em',
                      color: INK,
                    }}
                  >
                    {ph.name}
                  </span>
                  <span style={{ display: 'block', fontSize: 15, color: MUTED, marginTop: 2 }}>
                    {ph.question}
                  </span>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span style={{ ...micro, color: INK }}>{ph.weight}%</span>
                  <span style={{ display: 'block', ...micro, marginTop: 4 }} aria-hidden>
                    {isOpen ? '−' : '+'}
                  </span>
                </span>
                <span style={{ gridColumn: '1 / -1' }}>
                  {/* Weight as a share of the whole score: 20 squares, 5% each. */}
                  <DotBar value={ph.weight} max={100} dots={20} on={on} delay={i * 80} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.ul
                    id={`phase-${i}`}
                    key="d"
                    initial={reduce ? false : { height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={reduce ? undefined : { height: 0 }}
                    transition={{ duration: 0.32, ease: EASE }}
                    style={{ overflow: 'hidden', margin: 0, padding: 0, listStyle: 'none' }}
                  >
                    {ph.details.map((d) => (
                      <li
                        key={d}
                        style={{
                          display: 'flex',
                          gap: 10,
                          fontSize: 15,
                          lineHeight: 1.5,
                          color: INK,
                          padding: '0 0 8px',
                        }}
                      >
                        <span style={{ color: KLEIN, fontFamily: SYSTEM_FONTS.plex }}>·</span>
                        {d}
                      </li>
                    ))}
                    <li aria-hidden style={{ height: 8 }} />
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ListBlock({ label, items }: { label: string; items: readonly string[] }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={micro}>{label}</div>
      <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
        {items.map((t, i) => (
          <li
            key={t}
            style={{ display: 'flex', gap: 12, fontSize: 15, lineHeight: 1.5, color: INK }}
          >
            <span style={{ fontFamily: SYSTEM_FONTS.plex, color: KLEIN, fontSize: 13 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScanSection({ ex }: { ex: Ex }) {
  const S = LANDING.scan;
  const { ref, arrived } = useArrived<HTMLDivElement>(0.1);
  return (
    <div ref={ref} style={{ padding: 'clamp(64px, 12vh, 140px) clamp(16px, 3.5vw, 40px) 24px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <ChapterLabel text={S.label} on={arrived} />
        <FieldText size="title" as="h2" style={{ marginTop: 20, maxWidth: 900 }}>
          {S.headline}
        </FieldText>
        <div style={{ marginTop: 14 }}>
          <FieldText size="mono">{S.body}</FieldText>
        </div>
        <div
          style={{
            marginTop: 28,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <ScanLog ex={ex} />
          <PhaseList on={arrived} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Panel padding={24}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                gap: 28,
              }}
            >
              <ListBlock label={S.backLabel} items={S.back} />
              <ListBlock label={S.fairLabel} items={S.fair} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function HowChapter({ data }: { data: LandingData }) {
  const H = LANDING.how;
  // Wait until the width is known: mounting the phone layout first and swapping
  // it out made its scroll tracker throw (Motion: "Target ref is defined but not hydrated").
  const wide = useWideKnown(900);
  const reduce = useReducedMotion();
  const { ref, arrived } = useArrived<HTMLDivElement>(0.1);
  const pinned = !!wide && !reduce;
  return (
    <section id={H.id} aria-label={H.label}>
      <ScanSection ex={data.example} />
      {wide === null ? (
        <div ref={ref} style={{ minHeight: '100vh' }} />
      ) : pinned ? (
        <PinnedHow ex={data.example} />
      ) : (
        <div
          ref={ref}
          style={{ padding: 'clamp(64px, 12vh, 140px) clamp(16px, 3.5vw, 40px) 24px' }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <ChapterLabel text={H.label} on={arrived} />
            <FieldText size="title" as="h2" style={{ marginTop: 20 }}>
              {H.headline}
            </FieldText>
            <div style={{ marginTop: 24 }}>
              <StackedHow ex={data.example} on={arrived} />
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: '24px clamp(16px, 3.5vw, 40px) clamp(64px, 12vh, 140px)' }}>
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div style={{ gridColumn: 'span 2', minWidth: 0 }} className="lc-span2">
            <ClassIndex />
          </div>
          {data.brandsRead && (
            <Panel padding={24}>
              <Stat label={H.proofLabel} value={data.brandsRead} />
            </Panel>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 03 · Your record: a carousel of real tiles ────────────────────────────────

const SAMPLE_SERIES = Array.from({ length: 30 }, (_, i) =>
  Math.round(30_950 + i * 21 + Math.sin(i / 2.3) * 40 + (i > 22 ? (i - 22) * 38 : 0))
);

function Tile({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        width: wide ? 'min(78vw, 420px)' : 'min(72vw, 320px)',
        height: 300,
        boxSizing: 'border-box',
        background: BONE,
        color: INK,
        border: '1px solid rgba(14,14,14,.16)',
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', ...micro }}>
        <span>{title}</span>
        <span>{LANDING.record.sampleLabel}</span>
      </div>
      <div style={{ marginTop: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

function CarouselControls() {
  const { nextPage, prevPage, isNextActive, isPrevActive, currentPage, totalPages } = useCarousel();
  const R = LANDING.record;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontFamily: SYSTEM_FONTS.plex,
          fontSize: 12,
          color: '#fff',
          background: KLEIN,
          padding: '4px 8px',
        }}
      >
        {String(currentPage + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
      </span>
      {/* a Klein backing so a disabled arrow dims against flat blue, not the dots */}
      <span style={{ display: 'flex', gap: 8, background: KLEIN }}>
        <Button
          tone="field"
          variant="secondary"
          onClick={prevPage}
          disabled={!isPrevActive}
          aria-label={R.prev}
        >
          ←
        </Button>
        <Button tone="field" onClick={nextPage} disabled={!isNextActive} aria-label={R.next}>
          →
        </Button>
      </span>
    </div>
  );
}

function RecordCarousel({ on }: { on: boolean }) {
  const T = LANDING.record.tiles;
  const big: CSSProperties = {
    fontFamily: SYSTEM_FONTS.display,
    fontWeight: 700,
    fontSize: 46,
    letterSpacing: '-0.045em',
    lineHeight: 1,
  };
  const items = [
    <Tile key="score" title={T.score}>
      <div style={{ ...big, color: KLEIN }}>
        <Count value={72} on={on} />
        <span style={{ fontSize: 14, color: MUTED, letterSpacing: 0 }}>/100</span>
      </div>
      <div style={{ display: 'grid', gap: 10, marginTop: 'auto' }}>
        {(
          [
            ['Define', 78],
            ['Check', 71],
            ['Generate', 68],
            ['Scale', 69],
          ] as const
        ).map(([k, v], i) => (
          <div key={k}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', ...micro, fontSize: 10 }}
            >
              <span>{k}</span>
              <span style={{ color: INK }}>{v}</span>
            </div>
            <div style={{ marginTop: 5 }}>
              <DotBar value={v} on={on} dots={22} delay={i * 80} />
            </div>
          </div>
        ))}
      </div>
    </Tile>,
    <Tile key="growth" title={T.growth} wide>
      <div style={big}>
        <Count value={31_827} on={on} />
      </div>
      <div style={{ ...micro, marginTop: 6 }}>+421 this week</div>
      <div style={{ marginTop: 'auto' }}>
        <DotChart series={SAMPLE_SERIES} on={on} />
      </div>
    </Tile>,
    <Tile key="working" title={T.working}>
      {(
        [
          ['Threads', 3.4],
          ['Quote posts', 2.2],
          ['With media', 2.9],
          ['Text only', 1.4],
        ] as const
      ).map(([k, v], i) => (
        <div key={k} style={{ marginTop: i ? 14 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
            <span>{k}</span>
            <span style={{ fontFamily: SYSTEM_FONTS.plex }}>{v}%</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <DotBar
              value={v}
              max={4}
              on={on}
              dots={22}
              delay={i * 80}
              color={i === 0 ? KLEIN : INK}
            />
          </div>
        </div>
      ))}
      <div style={{ ...micro, marginTop: 'auto' }}>Best hour · 15:00 UTC</div>
    </Tile>,
    <Tile key="moves" title={T.moves}>
      {[
        'Post one 5-part thread on brand deals this week.',
        'Cut the “gm” posts: they pull your average down.',
        'Reply to the accounts that amplify you.',
      ].map((m, i) => (
        <div
          key={m}
          style={{
            display: 'flex',
            gap: 12,
            padding: '11px 0',
            borderTop: i ? `1px solid ${RULE}` : 'none',
            fontSize: 15,
            lineHeight: 1.45,
          }}
        >
          <span style={{ fontFamily: SYSTEM_FONTS.plex, color: KLEIN }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          {m}
        </div>
      ))}
    </Tile>,
    <Tile key="audience" title={T.audience}>
      <div style={{ display: 'flex', gap: 22 }}>
        <div>
          <div style={big}>
            <Count value={134} on={on} />
          </div>
          <div style={{ ...micro, marginTop: 6 }}>People engaged</div>
        </div>
        <div>
          <div style={big}>
            <Count value={38} on={on} suffix="%" />
          </div>
          <div style={{ ...micro, marginTop: 6 }}>Came back</div>
        </div>
      </div>
      <div
        aria-hidden
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 3,
          marginTop: 'auto',
        }}
      >
        {Array.from({ length: 48 }, (_, i) => (
          <span
            key={i}
            className="lc-dot"
            style={{
              aspectRatio: '1',
              background: on
                ? i % 5 === 0 || i % 7 === 0
                  ? KLEIN
                  : 'rgba(14,14,14,.82)'
                : 'transparent',
              boxShadow: 'inset 0 0 0 1px rgba(14,14,14,.18)',
              transitionDelay: on ? `${i * 12}ms` : '0ms',
            }}
          />
        ))}
      </div>
    </Tile>,
    <Tile key="competitors" title={T.competitors}>
      {(
        [
          ['You', 72, 2.6],
          ['Competitor A', 66, 1.9],
          ['Competitor B', 74, 3.1],
          ['Competitor C', 58, 1.2],
        ] as const
      ).map(([k, s, e], i) => (
        <div
          key={k}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: 16,
            padding: '11px 0',
            borderTop: i ? `1px solid ${RULE}` : 'none',
            fontSize: 15,
            fontWeight: i === 0 ? 600 : 400,
          }}
        >
          <span>{k}</span>
          <span style={{ fontFamily: SYSTEM_FONTS.plex, color: i === 0 ? KLEIN : INK }}>{s}</span>
          <span style={{ fontFamily: SYSTEM_FONTS.plex, color: MUTED }}>{e}%</span>
        </div>
      ))}
    </Tile>,
  ];
  return (
    <div>
      <Carousel items={items} gap={12} loop={false} snap="page" style={{ overflow: 'visible' }}>
        <CarouselControls />
      </Carousel>
    </div>
  );
}

// ── 04 · The Index: entries in a ticker, Founding behind a pixel curtain ──────

/**
 * Sample entries before the Index opens: one per class, all labelled "Sample entry".
 * The handle stays a placeholder on purpose: an invented handle could belong to a
 * real person, and we'd be showing them a fake score. The lines vary by class.
 */
const SAMPLE_LINES: [string[], string][] = [
  [['Research'], 'Explains new protocols the week they ship.'],
  [['Trading'], 'Calls the narrative before the chart moves.'],
  [['Founder', 'Infra & Dev'], 'Ships in public, every week.'],
  [['Community'], 'Three months in. Growing every week.'],
  [['Culture & Memes'], 'Introduces the right people to each other.'],
  [['Culture & Memes'], 'Runs the funniest spaces in the timeline.'],
  [['Memecoins'], 'Builds cults around coins that last.'],
  [['AI'], 'Ideas first. No face, no persona.'],
];
const SAMPLE_ENTRIES: IndexCard[] = CLASSES.map((c, i) => ({
  handle: 'yourhandle',
  number: [1042, 1107, 1128, 1203, 1316, 1364, 1512, 1590][i] ?? 1042,
  name: null,
  avatar: null,
  score: [81, 77, 74, 72, 69, 66, 63, 58][i] ?? null,
  archetype: c.code,
  niches: SAMPLE_LINES[i]?.[0] ?? [],
  blurb: SAMPLE_LINES[i]?.[1] ?? 'Your one line for brands.',
  featured: false,
  joinedAt: '',
}));

/** A recent read as a card: a public read, never an Index entry (no number). */
const readCard = (r: RecentRead): IndexCard => ({
  handle: r.handle,
  number: 0,
  name: r.name,
  avatar: r.avatar,
  score: r.score,
  archetype: r.archetype,
  niches: r.niches,
  blurb: r.blurb,
  featured: false,
  joinedAt: '',
});

function IndexRun({
  cards,
  sample,
  reads,
}: {
  cards: IndexCard[];
  sample: boolean;
  /** Read dates by handle: these cards are recent reads, not entries. */
  reads?: Map<string, string>;
}) {
  const reduce = useReducedMotion();
  const I = LANDING.index;
  const items = cards.map((c) => (
    <div key={`${c.handle}-${c.number}`} style={{ width: 312 }}>
      <IndexEntryCard
        c={c}
        sample={sample}
        read={
          reads?.has(c.handle)
            ? { date: reads.get(c.handle)!, label: I.recentRead, on: I.readOn }
            : undefined
        }
      />
    </div>
  ));
  if (reduce) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: 12,
        }}
      >
        {items.slice(0, 3)}
      </div>
    );
  }
  return <Ticker items={items} velocity={22} hoverFactor={0} gap={12} align="start" />;
}

/** The Founding card, sealed until it arrives, then opened by a Klein pixel curtain. */
function FoundingCard({ data }: { data: LandingData }) {
  const I = LANDING.index;
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [opened, setOpen] = useState(false);
  const [settled, setCounted] = useState(false);
  // reduced motion: open and counted from the start, no curtain
  const open = opened || !!reduce;
  const counted = settled || !!reduce;
  const [curtains] = useCurtains();
  const started = useRef(false);
  useEffect(() => {
    const el = box.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();
        void curtains(() => setOpen(true), {
          scope: el,
          effect: pixels({ size: 28, direction: 90, noise: 0.5 }),
          transition: [{ duration: 0.5 }, { duration: 0.55 }],
        }).then(() => setCounted(true));
      },
      { threshold: 0.55 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [curtains, reduce]);
  return (
    <div ref={box} className="lc-founding" style={{ position: 'relative' }}>
      {open ? (
        <Panel label={I.founding.label} meta={I.sealed.range} padding={26}>
          <h3
            style={{
              margin: 0,
              fontFamily: SYSTEM_FONTS.display,
              fontSize: 'clamp(30px, 3.4vw, 42px)',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1,
            }}
          >
            {I.founding.title}
          </h3>
          <p style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.6 }}>{I.founding.body}</p>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 16,
              marginTop: 22,
              flexWrap: 'wrap',
            }}
          >
            <Stat
              label={I.founding.seatsLabel}
              value={<Count value={data.seatsLeft} on={counted} />}
              unit="/100"
            />
            <LinkButton href="/pricing" variant="signal">
              <Decode hover>{`${I.founding.cta} →`}</Decode>
            </LinkButton>
          </div>
        </Panel>
      ) : (
        <div
          aria-label={I.founding.label}
          style={{
            minHeight: 300,
            background: KLEIN,
            border: '1px solid rgba(255,255,255,.9)',
            color: '#fff',
            padding: 26,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontFamily: SYSTEM_FONTS.vcr, fontSize: 12, letterSpacing: '0.16em' }}>
            {I.sealed.label.toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: SYSTEM_FONTS.display,
              fontWeight: 700,
              fontSize: 'clamp(40px, 5vw, 64px)',
              letterSpacing: '-0.04em',
            }}
          >
            {I.sealed.range}
          </span>
        </div>
      )}
    </div>
  );
}

function Faq() {
  const I = LANDING.index;
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  return (
    <Panel label={I.faqLabel} padding={24}>
      <div>
        {I.faq.map((f, i) => {
          const on = open === i;
          return (
            <div key={f.q} style={{ borderTop: i ? `1px solid ${RULE}` : 'none' }}>
              <button
                type="button"
                aria-expanded={on}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(on ? null : i)}
                className="sys-focus"
                style={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '15px 0',
                  fontSize: 17,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>{f.q}</span>
                <span
                  aria-hidden
                  style={{
                    fontFamily: SYSTEM_FONTS.plex,
                    color: KLEIN,
                    transform: on ? 'rotate(45deg)' : 'none',
                    transition: 'transform 220ms cubic-bezier(.16,1,.3,1)',
                  }}
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div
                    id={`faq-${i}`}
                    key="a"
                    initial={reduce ? false : { height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={reduce ? undefined : { height: 0 }}
                    transition={{ duration: 0.32, ease: EASE }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{ margin: 0, padding: '0 0 16px', fontSize: 16, lineHeight: 1.6 }}>
                      {f.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ── The scroll ────────────────────────────────────────────────────────────────

const grid2: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
  gap: 16,
  alignItems: 'start',
};

export default function LandingChapters({
  data,
  scanForm,
}: {
  data: LandingData;
  /** The hero's own scan form (same state, same submit), shown again at the close. */
  scanForm: ReactNode;
}) {
  const P = LANDING.problem;
  const R = LANDING.record;
  const I = LANDING.index;
  const C = LANDING.close;
  const chapters = [P, LANDING.how, R, I, C].map((c) => ({ id: c.id, label: c.label }));
  const live = data.index.open && data.index.recent.length > 0;
  // before the Index opens: real recent reads (3+), else the labelled samples
  const showReads = !live && data.index.reads.length >= 3;

  return (
    <DitherWipeProvider ms={360}>
      <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
        <style>{`
          @keyframes lc-press { from { transform: scale(1.04); } to { transform: scale(1); } }
          @keyframes lc-stamp { 0% { transform: scale(1.35); } 60% { transform: scale(.97); } 100% { transform: scale(1); } }
          .lc-press { animation: lc-press 380ms cubic-bezier(.16,1,.3,1); transform-origin: 50% 0; }
          .lc-stamp { animation: lc-stamp 460ms cubic-bezier(.16,1,.3,1); }
          .lc-rule { transition: transform 1000ms cubic-bezier(.65,0,.35,1); }
          .lc-dot { transition: background-color 0ms linear, box-shadow 0ms linear; }
          .lc-founding .motion-curtain { background: ${KLEIN}; }
          .lc-index-grid { display: grid; gap: 16px; margin-top: 24px; align-items: start; grid-template-columns: 1fr 1fr; grid-template-areas: 'info found' 'faq found'; }
          @media (max-width: 719px) { .lc-index-grid { grid-template-columns: 1fr; grid-template-areas: 'info' 'found' 'faq'; } }
          @media (max-width: 899px) { .lc-rail { display: none !important; } .lc-span2 { grid-column: auto !important; } }
          @media (prefers-reduced-motion: reduce) {
            .lc-press, .lc-stamp { animation: none; }
            .lc-rule { transition: none; transform: scaleX(1) !important; }
            .lc-dot { transition-delay: 0ms !important; }
          }
        `}</style>
        <LandingCursor />
        <ChapterRail chapters={chapters} />

        {/* 01: the problem */}
        <Chapter id={P.id} label={P.label}>
          {(on) => (
            <div style={grid2}>
              <div style={{ display: 'grid', gap: 20, minWidth: 0 }}>
                <FieldText size="title" as="h2">
                  {P.headline}
                </FieldText>
                <SameFollowers />
              </div>
              <Panel label={P.cantTellLabel} padding={24}>
                <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>{P.body}</p>
                <ol style={{ listStyle: 'none', padding: 0, margin: '20px 0 0' }}>
                  {P.cantTell.map((t, i) => (
                    <li key={t} style={{ padding: '12px 0 0' }}>
                      <Rule on={on} />
                      <div style={{ display: 'flex', gap: 14, paddingTop: 12 }}>
                        <span style={{ fontFamily: SYSTEM_FONTS.plex, color: KLEIN }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: 19, fontWeight: 600 }}>{t}</span>
                      </div>
                    </li>
                  ))}
                </ol>
                <div style={{ marginTop: 28 }}>
                  <EditorNote text={P.quote} />
                </div>
              </Panel>
            </div>
          )}
        </Chapter>

        {/* 02: how it works */}
        <HowChapter data={data} />

        {/* 03: what you get */}
        <Chapter id={R.id} label={R.label}>
          {(on) => (
            <div
              style={{
                ...grid2,
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <FieldText size="title" as="h2">
                  {R.headline}
                </FieldText>
                <Panel padding={24} style={{ marginTop: 24 }}>
                  <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>{R.body}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0' }}>
                    {R.items.map((t) => (
                      <li key={t} style={{ paddingTop: 12 }}>
                        <Rule on={on} />
                        <p style={{ margin: '12px 0 0', fontSize: 16, lineHeight: 1.5 }}>{t}</p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <NearViewport minHeight={360}>
                  <RecordCarousel on={on} />
                </NearViewport>
              </div>
            </div>
          )}
        </Chapter>

        {/* 04: the Index + Founding 100 */}
        <Chapter id={I.id} label={I.label}>
          {(on) => (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <FieldText size="title" as="h2">
                  {data.index.open ? I.headlineOpen : I.headlineBefore}
                </FieldText>
                <span
                  style={{
                    fontFamily: SYSTEM_FONTS.plex,
                    fontSize: 13,
                    background: KLEIN,
                    color: '#fff',
                    padding: '4px 8px',
                  }}
                >
                  {live
                    ? `${I.membersLabel}: ${data.index.members}`
                    : showReads
                      ? I.readsLabel
                      : I.tickerLabel}
                </span>
              </div>
              <div
                style={{ margin: '24px calc(-1 * clamp(16px, 3.5vw, 40px)) 0', overflow: 'hidden' }}
              >
                <NearViewport minHeight={220}>
                  {live ? (
                    <IndexRun cards={data.index.recent} sample={false} />
                  ) : showReads ? (
                    <IndexRun
                      cards={data.index.reads.map(readCard)}
                      sample={false}
                      reads={new Map(data.index.reads.map((r) => [r.handle, r.readAt]))}
                    />
                  ) : (
                    <IndexRun cards={SAMPLE_ENTRIES} sample />
                  )}
                </NearViewport>
              </div>
              {showReads && (
                <FieldText size="mono" style={{ marginTop: 12, fontSize: 12 }}>
                  {I.readsNote}
                </FieldText>
              )}
              <div className="lc-index-grid">
                <div style={{ gridArea: 'info', minWidth: 0 }}>
                  <Panel padding={24}>
                    <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>{I.body}</p>
                    <p style={{ margin: '10px 0 0', fontSize: 15, color: MUTED }}>{I.brands}</p>
                    {data.index.open && (
                      <div style={{ marginTop: 18 }}>
                        <Stat
                          label={I.membersLabel}
                          value={<Count value={data.index.members} on={on} />}
                        />
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 20,
                        flexWrap: 'wrap',
                      }}
                    >
                      <LinkButton href="/index" disabled={!data.index.open}>
                        {I.seeIndex} →
                      </LinkButton>
                      {!data.index.open && (
                        <span style={{ fontFamily: SYSTEM_FONTS.plex, fontSize: 13, color: MUTED }}>
                          {I.opensNote}
                        </span>
                      )}
                    </div>
                  </Panel>
                </div>
                {/* phones: the offer comes before the questions */}
                <div style={{ gridArea: 'found', minWidth: 0 }}>
                  <FoundingCard data={data} />
                </div>
                <div style={{ gridArea: 'faq', minWidth: 0 }}>
                  <Faq />
                </div>
              </div>
            </>
          )}
        </Chapter>

        {/* 05: the close, with the hero's own scan form */}
        <Chapter id={C.id} label={C.label}>
          {() => (
            <div style={{ ...grid2, alignItems: 'end' }}>
              <div style={{ minWidth: 0 }}>
                <FieldText size="display" as="h2">
                  {C.headline}
                </FieldText>
                <div style={{ marginTop: 18 }}>
                  <FieldText size="mono">{C.body}</FieldText>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <Panel label="Read your brand" meta="any public X account" padding={22}>
                  <WipeIntoScan>{scanForm}</WipeIntoScan>
                </Panel>
                <Panel padding={22}>
                  <EditorNote text={C.quote} />
                </Panel>
              </div>
            </div>
          )}
        </Chapter>
        <div style={{ height: 64 }} />
      </div>
    </DitherWipeProvider>
  );
}

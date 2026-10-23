'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { FieldText, Panel, Stat, SYSTEM_FONTS } from '@/components/system';
import { ScoreCard } from '@/components/dashboard/ScoreCardShare';
import { FollowersChart } from '@/components/growth/parts';
import { Card as IndexEntryCard } from '@/app/creators/IndexBook';
import { classLabel } from '@/lib/classifications';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { EDITOR, LANDING } from '@/lib/landing-copy';
import type { LandingData } from '@/lib/landing-data';
import type { IndexCard } from '@/lib/creator-index';

/**
 * The homepage landing scroll under the hero (Direction 03, the field). Five
 * full-screen chapters on the field; long reading on bone panels. Everything is
 * readable at rest. Motion only on arrival, once per chapter, from the system
 * vocabulary (docs/BRAND-WORLD.md): labels TYPE in, rules DRAW, numbers COUNT,
 * stamps PRESS. No fades. Reduced motion = final state. Copy: src/lib/landing-copy.ts.
 */

const BONE = '#F2EFE8';
const INK = '#0E0E0E';
const FIELD = '#0047FF';
const SIGNAL = '#FF4B2B';
const MUTED = 'rgba(14,14,14,.62)';
const RULE = 'rgba(14,14,14,.14)';

/** True once the element has been at least `threshold` on screen. */
function useArrived<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const reduce = useReducedMotion();
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return { ref, arrived: seen || !!reduce, reduce: !!reduce };
}

/** A VCR label that types in on arrival (width held, so nothing shifts). */
function TypedLabel({ text, on, field = true }: { text: string; on: boolean; field?: boolean }) {
  const [n, setN] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!on) return;
    if (reduce) return setN(text.length);
    const id = window.setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          window.clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, 28);
    return () => window.clearInterval(id);
  }, [on, reduce, text]);
  const shown = on ? text.slice(0, n) + ' '.repeat(Math.max(0, text.length - n)) : text;
  return (
    <span
      aria-label={text}
      style={{
        display: 'inline-block',
        fontFamily: SYSTEM_FONTS.vcr,
        fontSize: 12,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        whiteSpace: 'pre',
        padding: field ? '5px 9px' : 0,
        background: field ? FIELD : 'transparent',
        color: field ? '#fff' : MUTED,
      }}
    >
      <span aria-hidden>{shown}</span>
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

/** A number that counts up once on arrival (the chapter's one Motion+ moment). */
function Count({ value, on }: { value: number; on: boolean }) {
  return <AnimateNumber>{on ? value : 0}</AnimateNumber>;
}

/** A link styled like the system Button. */
function LinkButton({
  href,
  variant = 'field',
  children,
  disabled,
}: {
  href: string;
  variant?: 'field' | 'bone' | 'signal';
  children: ReactNode;
  disabled?: boolean;
}) {
  const look: Record<string, CSSProperties> = {
    field: { background: '#fff', color: INK, border: '1px solid #fff' },
    bone: { background: INK, color: BONE, border: `1px solid ${INK}` },
    signal: { background: SIGNAL, color: INK, border: `1px solid ${SIGNAL}` },
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
    padding: '12px 18px',
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
    <Link href={href} className="sys-press" style={style}>
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
        gap: 28,
        padding: 'clamp(56px, 10vh, 120px) clamp(16px, 3.5vw, 40px)',
        boxSizing: 'border-box',
        scrollMarginTop: 0,
      }}
    >
      <div style={{ maxWidth: 1180, width: '100%', margin: '0 auto' }}>
        <TypedLabel text={label} on={arrived} />
        <div style={{ marginTop: 18 }}>{children(arrived)}</div>
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
          fontSize: 'clamp(17px, 2vw, 22px)',
          lineHeight: 1.45,
          color: INK,
        }}
      >
        “{text}”
      </blockquote>
      <figcaption
        style={{
          marginTop: 10,
          fontFamily: SYSTEM_FONTS.vcr,
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: MUTED,
        }}
      >
        — {EDITOR}
      </figcaption>
    </figure>
  );
}

/** The class code stamp: pressed in on arrival (112% → 100%, no overshoot). */
function ClassStamp({ archetype, on }: { archetype: string | null; on: boolean }) {
  return (
    <div
      className={on ? 'lc-press' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: FIELD,
        color: '#fff',
        fontFamily: SYSTEM_FONTS.vcr,
        fontSize: 15,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {classLabel(archetype, '/')}
    </div>
  );
}

/** The ✓ seal (Certification), pressed in on arrival. */
function Seal({ on }: { on: boolean }) {
  return (
    <div
      aria-label="Verified"
      className={on ? 'lc-press' : undefined}
      style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: FIELD,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <svg viewBox="0 0 48 48" width="26" fill="none" aria-hidden>
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

/** The real score card, scaled to fit its column (it is drawn at 540px). */
function ScaledScoreCard({ d, roll }: { d: LandingData['example']; roll: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.min(420, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const info = d.archetype ? getArchetypeInfo(d.archetype) : null;
  const k = w / 540;
  return (
    <div ref={box} style={{ width: '100%' }}>
      <div style={{ width: w, height: w, overflow: 'hidden' }}>
        <div style={{ width: 540, height: 540, transform: `scale(${k})`, transformOrigin: '0 0' }}>
          <ScoreCard
            roll={roll}
            d={{
              handle: d.handle,
              avatarUrl: null,
              score: d.score,
              delta: null,
              history: [],
              phases: [
                { key: 'Define', value: d.phases.define },
                { key: 'Check', value: d.phases.check },
                { key: 'Generate', value: d.phases.generate },
                { key: 'Scale', value: d.phases.scale },
              ],
              archetype: d.archetype
                ? { name: info?.name ?? d.archetype, tagline: info?.tagline }
                : null,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Sample entries shown before the Index opens (labelled "Sample entry").
const SAMPLE_ENTRIES: IndexCard[] = [
  {
    handle: 'jbawsa',
    number: 0,
    name: null,
    avatar: null,
    score: 72,
    archetype: 'ARC',
    niches: ['Founder', 'Education'],
    blurb: 'building BrandOS. the branding guy in crypto.',
    featured: false,
    joinedAt: '',
  },
  {
    handle: 'yourhandle',
    number: 42,
    name: null,
    avatar: null,
    score: null,
    archetype: null,
    niches: [],
    blurb: 'Your one line for brands.',
    featured: false,
    joinedAt: '',
  },
];

// A sample 30-day follower line for the "your record" slice (labelled "Sample record").
const SAMPLE_SERIES = Array.from({ length: 30 }, (_, i) => ({
  day: new Date(Date.UTC(2026, 8, 23 + i)).toISOString().slice(0, 10),
  followers: Math.round(30_950 + i * 21 + Math.sin(i / 2.3) * 40 + (i > 22 ? (i - 22) * 38 : 0)),
}));

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
  const H = LANDING.how;
  const R = LANDING.record;
  const I = LANDING.index;
  const C = LANDING.close;
  const ex = data.example;

  return (
    <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
      <style>{`
        @keyframes lc-press { from { transform: scale(1.12); } to { transform: scale(1); } }
        .lc-press { animation: lc-press 420ms cubic-bezier(.16,1,.3,1); }
        .lc-rule { transition: transform 1000ms cubic-bezier(.65,0,.35,1); }
        @media (prefers-reduced-motion: reduce) {
          .lc-press { animation: none; }
          .lc-rule { transition: none; transform: scaleX(1) !important; }
        }
      `}</style>

      {/* 01: the problem */}
      <Chapter id={P.id} label={P.label}>
        {(on) => (
          <div style={grid2}>
            <FieldText size="title" as="h2">
              {P.headline}
            </FieldText>
            <Panel label={P.cantTellLabel} padding={24}>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>{P.body}</p>
              <ol style={{ listStyle: 'none', padding: 0, margin: '20px 0 0' }}>
                {P.cantTell.map((t, i) => (
                  <li key={t} style={{ padding: '12px 0 0' }}>
                    <Rule on={on} />
                    <div style={{ display: 'flex', gap: 14, paddingTop: 12 }}>
                      <span style={{ fontFamily: SYSTEM_FONTS.plex, color: FIELD }}>
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
      <Chapter id={H.id} label={H.label}>
        {(on) => (
          <>
            <FieldText size="title" as="h2" style={{ maxWidth: 900 }}>
              {H.headline}
            </FieldText>
            <div style={{ ...grid2, marginTop: 28 }}>
              <Panel padding={24}>
                <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {H.steps.map((s, i) => (
                    <li key={s.n} style={{ paddingTop: i ? 18 : 0 }}>
                      {i > 0 && <Rule on={on} />}
                      <div style={{ display: 'flex', gap: 14, paddingTop: i ? 18 : 0 }}>
                        <span style={{ fontFamily: SYSTEM_FONTS.plex, color: FIELD, minWidth: 24 }}>
                          {s.n}
                        </span>
                        <div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{s.title}</h3>
                            {'when' in s && s.when && (
                              <span
                                style={{
                                  fontFamily: SYSTEM_FONTS.vcr,
                                  fontSize: 11,
                                  letterSpacing: '0.14em',
                                  textTransform: 'uppercase',
                                  color: MUTED,
                                }}
                              >
                                {s.when}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '6px 0 0', fontSize: 16, lineHeight: 1.55 }}>
                            {s.body}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel label={H.exampleLabel} meta={`@${ex.handle}`} padding={24}>
                <ScaledScoreCard d={ex} roll={on} />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginTop: 18,
                    flexWrap: 'wrap',
                  }}
                >
                  <ClassStamp archetype={ex.archetype} on={on} />
                  <Seal on={on} />
                </div>
                {data.brandsRead && (
                  <div style={{ marginTop: 22 }}>
                    <Rule on={on} />
                    <div style={{ marginTop: 16 }}>
                      <Stat label={H.proofLabel} value={data.brandsRead} />
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </>
        )}
      </Chapter>

      {/* 03: what you get */}
      <Chapter id={R.id} label={R.label}>
        {(on) => (
          <div style={grid2}>
            <div>
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
            <Panel label={R.sampleLabel} meta="@jbawsa" padding={24}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Stat label="Followers" value={<Count value={31_827} on={on} />} />
                <Stat label="Engagement" value="2.6" unit="%" />
              </div>
              <div style={{ marginTop: 18 }}>
                <FollowersChart series={SAMPLE_SERIES} />
              </div>
              <div style={{ marginTop: 18 }}>
                <Rule on={on} />
                <p
                  style={{
                    margin: '14px 0 0',
                    fontFamily: SYSTEM_FONTS.vcr,
                    fontSize: 11,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: MUTED,
                  }}
                >
                  Next move
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 16 }}>
                  Post one 5-part thread on brand deals this week.
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontFamily: SYSTEM_FONTS.plex,
                    fontSize: 12,
                    color: MUTED,
                  }}
                >
                  threads earn 3.4% for you vs 1.4% text-only
                </p>
              </div>
            </Panel>
          </div>
        )}
      </Chapter>

      {/* 04: the Index + Founding 100 */}
      <Chapter id={I.id} label={I.label}>
        {(on) => (
          <>
            <FieldText size="title" as="h2">
              {data.index.open ? I.headlineOpen : I.headlineBefore}
            </FieldText>
            <div style={{ ...grid2, marginTop: 28 }}>
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
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                    gap: 12,
                    marginTop: 20,
                  }}
                >
                  {(data.index.open && data.index.recent.length
                    ? data.index.recent
                    : SAMPLE_ENTRIES
                  ).map((c) => (
                    <IndexEntryCard
                      key={c.handle}
                      c={c}
                      sample={!(data.index.open && data.index.recent.length)}
                    />
                  ))}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 20,
                    flexWrap: 'wrap',
                  }}
                >
                  <LinkButton href="/index" variant="bone" disabled={!data.index.open}>
                    {I.seeIndex} →
                  </LinkButton>
                  {!data.index.open && (
                    <span style={{ fontFamily: SYSTEM_FONTS.plex, fontSize: 13, color: MUTED }}>
                      {I.opensNote}
                    </span>
                  )}
                </div>
              </Panel>

              <div style={{ display: 'grid', gap: 16 }}>
                <Panel label={I.founding.label} padding={24}>
                  <h3
                    style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em' }}
                  >
                    {I.founding.title}
                  </h3>
                  <p style={{ margin: '12px 0 0', fontSize: 16, lineHeight: 1.6 }}>
                    {I.founding.body}
                  </p>
                  <div style={{ marginTop: 18 }}>
                    <Stat
                      label={I.founding.seatsLabel}
                      value={<Count value={data.seatsLeft} on={on} />}
                      unit="/100"
                    />
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <LinkButton href="/pricing" variant="signal">
                      {I.founding.cta} →
                    </LinkButton>
                  </div>
                </Panel>

                <Panel label={I.faqLabel} padding={24}>
                  <dl style={{ margin: 0 }}>
                    {I.faq.map((f, i) => (
                      <div key={f.q} style={{ paddingTop: i ? 14 : 0 }}>
                        {i > 0 && <Rule on={on} />}
                        <dt style={{ fontWeight: 600, fontSize: 16, paddingTop: i ? 14 : 0 }}>
                          {f.q}
                        </dt>
                        <dd
                          style={{ margin: '4px 0 0', fontSize: 15, lineHeight: 1.55, color: INK }}
                        >
                          {f.a}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Panel>
              </div>
            </div>
          </>
        )}
      </Chapter>

      {/* 05: the close, with the hero's own scan form */}
      <Chapter id={C.id} label={C.label}>
        {() => (
          <div style={{ ...grid2, alignItems: 'end' }}>
            <div>
              <FieldText size="display" as="h2">
                {C.headline}
              </FieldText>
              <div style={{ marginTop: 18 }}>
                <FieldText size="mono">{C.body}</FieldText>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <Panel label="Read your brand" meta="any public X account" padding={22}>
                {scanForm}
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
  );
}

'use client';

import Link from 'next/link';
import Wordmark from '@/components/Wordmark';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import { RollNumber, useBoot } from '@/components/dashboard/dashMotion';
import type { BrandCard } from '@/lib/public-brand';
import { PUBLIC_TOKENS, wordmarkFor, type Colorway } from '@/lib/colorways';

// The public brand page (mybrandos.app/@handle): the BrandOS read of one
// handle, then "Compare your brand to @handle". Signed out: type your handle
// -> we scan it -> side by side -> create your account. Signed in: compare
// any handle (prefilled with yours).

const MONO = DASH_FONTS.mono;
const BIG = DASH_FONTS.big;
const BLUE = '#0047FF';
// Tokens come from the creator's skin (PUBLIC_TOKENS, set on <main>).
const C = {
  bg: 'var(--p-bg)',
  panel: 'var(--p-panel)',
  ink: 'var(--p-ink)',
  muted: 'var(--p-muted)',
  rule: 'var(--p-rule)',
  track: 'var(--p-track)',
  head: 'var(--p-head)',
  headMuted: 'var(--p-head-muted)',
};
const PHASES = [
  ['define', 'Define'],
  ['check', 'Check'],
  ['generate', 'Generate'],
  ['scale', 'Scale'],
] as const;
type PhaseKey = (typeof PHASES)[number][0];

interface Compare {
  me: BrandCard;
  them: BrandCard;
  gaps: string[];
}

function Micro({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="text-[10px] uppercase tracking-[0.14em]"
      style={{ fontFamily: MONO, color: color ?? C.muted }}
    >
      {children}
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="mt-1.5 h-[3px] w-full overflow-hidden rounded-[2px]"
      style={{ background: C.track }}
    >
      <div className="h-full rounded-[2px]" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function weakest(p: Record<PhaseKey, number>): PhaseKey {
  return PHASES.reduce((w, [k]) => (p[k] < p[w] ? k : w), 'define' as PhaseKey);
}

function List({ items, mark, numbered }: { items: string[]; mark?: string; numbered?: boolean }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((t, i) => (
        <li key={i} className="grid grid-cols-[22px_1fr] gap-1.5 text-[14px] leading-relaxed">
          <span className="pt-[3px] text-[11px]" style={{ fontFamily: MONO, color: BLUE }}>
            {numbered ? String(i + 1).padStart(2, '0') : mark}
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function BrandRead({ card }: { card: BrandCard }) {
  const booted = useBoot();
  const weak = card.phases ? weakest(card.phases as Record<PhaseKey, number>) : null;
  return (
    <section
      className="rounded-[12px] border p-5 md:p-8"
      style={{ background: C.panel, borderColor: C.rule, color: C.ink }}
    >
      <div className="flex items-center justify-between gap-3">
        <Micro>Brand read · @{card.handle}</Micro>
        {card.influence && (
          <span
            className="rounded-[3px] border px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
            style={{ fontFamily: MONO, color: BLUE, borderColor: BLUE }}
          >
            {card.influence}
          </span>
        )}
      </div>
      <div className="mt-5 grid grid-cols-[auto_1fr] items-end gap-5">
        <div
          className="text-[80px] leading-[0.82] md:text-[120px]"
          style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em', color: BLUE }}
        >
          <RollNumber value={card.score} booted={booted} />
          <span className="ml-1 text-[16px] tracking-normal" style={{ color: C.muted }}>
            /100
          </span>
        </div>
        <div>
          {card.archetype && (
            <div
              className="text-[24px] leading-tight md:text-[32px]"
              style={{ fontFamily: BIG, fontWeight: 500 }}
            >
              {card.archetype.name}
            </div>
          )}
          {card.archetype?.tagline && (
            <div className="mt-1 text-[14px]" style={{ color: C.muted }}>
              {card.archetype.tagline}
            </div>
          )}
        </div>
      </div>
      {card.summary && (
        <p className="mt-5 max-w-[68ch] text-[15px] leading-relaxed">{card.summary}</p>
      )}

      {card.phases && (
        <div className="mt-6 border-t pt-5" style={{ borderColor: C.rule }}>
          <Micro>Brand phases</Micro>
          <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {PHASES.map(([k, label]) => {
              const v = (card.phases as Record<PhaseKey, number>)[k];
              const isWeak = k === weak;
              return (
                <div key={k}>
                  <div
                    className="flex justify-between text-[11px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: MONO, color: isWeak ? BLUE : C.ink }}
                  >
                    <span>
                      {label}
                      {isWeak ? ' · weakest' : ''}
                    </span>
                    <span>{v}</span>
                  </div>
                  <Bar value={v} color={isWeak ? BLUE : C.ink} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {card.pillars.length > 0 && (
        <div className="mt-6 border-t pt-5" style={{ borderColor: C.rule }}>
          <Micro>Content pillars</Micro>
          <div className="mt-3 flex flex-wrap gap-2">
            {card.pillars.map((p) => (
              <span
                key={p}
                className="rounded-full border px-3 py-1 text-[13px]"
                style={{ borderColor: C.rule }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        className="mt-6 grid grid-cols-1 gap-6 border-t pt-5 md:grid-cols-3"
        style={{ borderColor: C.rule }}
      >
        {card.strengths.length > 0 && (
          <div>
            <Micro>What&apos;s working</Micro>
            <List items={card.strengths} mark="✓" />
          </div>
        )}
        {card.improvements.length > 0 && (
          <div>
            <Micro>Holding it back</Micro>
            <List items={card.improvements} mark="~" />
          </div>
        )}
        {card.nextMoves.length > 0 && (
          <div>
            <Micro color={BLUE}>Next moves</Micro>
            <List items={card.nextMoves} numbered />
          </div>
        )}
      </div>
    </section>
  );
}

function CompareView({ data, signedIn }: { data: Compare; signedIn: boolean }) {
  const { me, them } = data;
  const lead = me.score === them.score ? null : me.score > them.score ? 'me' : 'them';
  return (
    <div
      className="mt-6 rounded-[12px] border p-5 md:p-8"
      style={{ background: C.panel, borderColor: C.rule, color: C.ink }}
    >
      <Micro>You vs @{them.handle}</Micro>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {[me, them].map((c, i) => (
          <div key={c.handle}>
            <div className="text-[12px]" style={{ fontFamily: MONO, color: C.muted }}>
              {i === 0 ? `You · @${c.handle}` : `@${c.handle}`}
            </div>
            <div
              className="mt-1 text-[56px] leading-[0.9] md:text-[72px]"
              style={{
                fontFamily: BIG,
                fontWeight: 500,
                letterSpacing: '-0.04em',
                color: (i === 0 ? 'me' : 'them') === lead ? BLUE : C.ink,
              }}
            >
              {c.score}
            </div>
            <div className="mt-1 text-[14px]" style={{ fontFamily: BIG, fontWeight: 500 }}>
              {c.archetype?.name ?? '—'}
            </div>
          </div>
        ))}
      </div>

      {me.phases && them.phases && (
        <div className="mt-6 border-t pt-5" style={{ borderColor: C.rule }}>
          <Micro>Phase by phase</Micro>
          <div className="mt-3 space-y-4">
            {PHASES.map(([k, label]) => {
              const a = (me.phases as Record<PhaseKey, number>)[k];
              const b = (them.phases as Record<PhaseKey, number>)[k];
              const who = a === b ? 'Even' : a > b ? 'You lead' : `@${them.handle} leads`;
              return (
                <div key={k}>
                  <div
                    className="flex justify-between text-[11px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: MONO }}
                  >
                    <span>{label}</span>
                    <span style={{ color: a > b ? BLUE : C.muted }}>
                      {a} vs {b} · {who}
                    </span>
                  </div>
                  <Bar value={a} color={BLUE} />
                  <Bar value={b} color={C.ink} />
                </div>
              );
            })}
          </div>
          <div
            className="mt-3 flex gap-4 text-[10px] uppercase tracking-[0.14em]"
            style={{ fontFamily: MONO, color: C.muted }}
          >
            <span>
              <span style={{ color: BLUE }}>■</span> You
            </span>
            <span>■ @{them.handle}</span>
          </div>
        </div>
      )}

      {data.gaps.length > 0 && (
        <div className="mt-6 border-l-2 pl-4" style={{ borderColor: BLUE }}>
          <Micro color={BLUE}>What @{them.handle} does that you don&apos;t</Micro>
          <List items={data.gaps} numbered />
        </div>
      )}

      <div className="mt-8 rounded-[10px] p-5 text-white md:p-6" style={{ background: BLUE }}>
        {signedIn ? (
          <>
            <div className="text-[22px] leading-tight" style={{ fontFamily: BIG, fontWeight: 500 }}>
              Close the gap from your dashboard.
            </div>
            <Link
              href="/dashboard"
              className="mt-4 inline-block bg-white px-4 py-3 text-[11px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, color: BLUE }}
            >
              Open my dashboard →
            </Link>
          </>
        ) : (
          <>
            <div
              className="text-[22px] leading-tight md:text-[26px]"
              style={{ fontFamily: BIG, fontWeight: 500 }}
            >
              See your full dashboard.
            </div>
            <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed opacity-90">
              Create your BrandOS account to open your dashboard (score history, every post
              analyzed, your next moves) and use BrandOS inside Claude and ChatGPT.
            </p>
            <Link
              href="/signup?next=/dashboard"
              className="mt-4 inline-block bg-white px-4 py-3 text-[11px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, color: BLUE }}
            >
              Create your account →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PublicBrand({
  handle,
  valid,
  initial,
  viewer,
  skin = 'bone',
}: {
  handle: string;
  valid: boolean;
  /** The creator's dashboard skin (Bone for handles without an account). */
  skin?: Colorway;
  initial: BrandCard | null;
  /** null: signed out */
  viewer: { handle: string | null } | null;
}) {
  const reduce = useReducedMotion();
  const [card, setCard] = useState<BrandCard | null>(initial);
  const [loadError, setLoadError] = useState<string | null>(
    valid ? null : 'That is not a valid X handle.'
  );
  const [mine, setMine] = useState(viewer?.handle ?? '');
  const [busy, setBusy] = useState(false);
  const [cmpError, setCmpError] = useState<string | null>(null);
  const [cmp, setCmp] = useState<Compare | null>(null);

  // scan on open: no public read under 7 days old yet
  useEffect(() => {
    if (initial || !valid) return;
    let live = true;
    void (async () => {
      try {
        const res = await fetch('/api/public-brand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle }),
        });
        const body = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok || !body.card)
          setLoadError(body.error ?? 'The scan failed. Try again shortly.');
        else setCard(body.card);
      } catch {
        if (live) setLoadError('The scan failed. Check your connection and try again.');
      }
    })();
    return () => {
      live = false;
    };
  }, [handle, initial, valid]);

  const compare = async (e: React.FormEvent) => {
    e.preventDefault();
    const me = mine.trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9_]{1,15}$/.test(me)) {
      setCmpError('Enter your X handle, like @yourname.');
      return;
    }
    setBusy(true);
    setCmpError(null);
    try {
      const res = await fetch('/api/brand-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ me, them: handle }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.me)
        setCmpError(body.error ?? 'The comparison failed. Try again shortly.');
      else {
        setCmp(body as Compare);
        try {
          window.localStorage.setItem('brandos:pending-handle', me);
        } catch {
          // storage unavailable: nothing to remember
        }
      }
    } catch {
      setCmpError('The comparison failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="min-h-screen px-4 pb-16 pt-6 md:px-8"
      style={{ ...PUBLIC_TOKENS[skin], background: C.bg, color: C.head } as React.CSSProperties}
    >
      <div className="mx-auto w-full max-w-[920px]">
        <header className="flex items-center justify-between">
          <Wordmark height={26} mode={wordmarkFor(skin)} />
          <Link
            href={viewer ? '/dashboard' : '/signup?next=/dashboard'}
            className="text-[11px] uppercase tracking-[0.14em] hover:underline"
            style={{ fontFamily: MONO }}
          >
            {viewer ? 'My dashboard →' : 'Sign in'}
          </Link>
        </header>

        <h1
          className="mt-10 text-[44px] leading-[0.95] md:text-[72px]"
          style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.03em' }}
        >
          @{handle}
        </h1>
        <div className="mt-2">
          <Micro color={C.headMuted}>BrandOS brand dashboard · public read</Micro>
        </div>

        <div className="mt-8">
          {card ? (
            <BrandRead card={card} />
          ) : (
            <div
              className="rounded-[12px] border px-5 py-16 text-center"
              style={{ background: C.panel, borderColor: C.rule, color: C.ink }}
            >
              <Micro color={loadError ? C.ink : BLUE}>
                {loadError ?? `Reading @${handle}'s brand… about 20 seconds`}
              </Micro>
            </div>
          )}
        </div>

        {card && (
          <section
            className="mt-8 rounded-[12px] p-5 text-white md:p-8"
            style={{ background: BLUE, border: '1px solid var(--p-cta-edge)' }}
          >
            <div
              className="text-[28px] leading-[1.05] md:text-[40px]"
              style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.02em' }}
            >
              Compare your brand to @{card.handle}
            </div>
            <p className="mt-2 text-[14px] opacity-90">
              {viewer
                ? 'Pick a handle to compare (yours is filled in).'
                : 'Enter your X handle. We scan it and put you side by side. No account needed yet.'}
            </p>
            <form onSubmit={compare} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 items-center bg-white px-3" style={{ color: C.ink }}>
                <span className="text-[16px]" style={{ color: C.muted }}>
                  @
                </span>
                <input
                  value={mine}
                  onChange={(e) => setMine(e.target.value.replace(/^@/, ''))}
                  placeholder="yourhandle"
                  maxLength={16}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-transparent px-1 py-3 text-[16px] outline-none"
                  aria-label="Your X handle"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="bg-[#0E0E0E] px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-white disabled:opacity-60"
                style={{ fontFamily: MONO }}
              >
                {busy ? 'Scanning…' : 'Compare →'}
              </button>
            </form>
            {cmpError && (
              <div className="mt-3 text-[13px]" role="alert">
                {cmpError}
              </div>
            )}
          </section>
        )}

        <AnimatePresence>
          {cmp && (
            <motion.div
              key={`${cmp.me.handle}-${cmp.them.handle}`}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <CompareView data={cmp} signedIn={!!viewer} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

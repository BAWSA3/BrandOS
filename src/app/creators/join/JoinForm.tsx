'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import { BLURB_MAX, formatNumber, MAX_NICHES, NICHES } from '@/lib/index-rules';
import { classLabel, recordDate } from '@/lib/classifications';

// Join (or edit) your Creator Index entry, in the institution's voice
// (docs/BRAND-WORLD.md). The headline motion is the Press: the entry number is
// stamped in Klein (112% → 100%, a soft ring outward, no overshoot), then the
// record lines type in. Nothing fades in.

const MONO = DASH_FONTS.mono;
const BIG = DASH_FONTS.big;
const C = {
  bg: '#F2EFE8',
  panel: '#FAF8F3',
  ink: '#0E0E0E',
  muted: '#6B6862',
  rule: 'rgba(14,14,14,0.12)',
  blue: '#0047FF',
};
const APP = 'https://mybrandos.app';

function Micro({ children, color = C.muted }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em]" style={{ fontFamily: MONO, color }}>
      {children}
    </div>
  );
}

type Entry = { number: number; niches: string[]; blurb: string; listed: boolean };

// Shown while a first-ever brand read runs (it reads their posts and scores
// them, ~30-60s), so the wait reads as the reveal it is, not a stuck button.
const SCAN_STEPS = [
  'Reading your latest posts…',
  'Finding what you post about…',
  'Scoring your brand…',
  'Classifying your brand…',
  'Preparing your entry…',
];

export default function JoinForm({
  handle,
  read,
  entry,
  reserved = null,
  preview = null,
}: {
  handle: string | null;
  read: { score: number; archetype: string; fresh: boolean } | null;
  entry: Entry | null;
  /** The account's own reserved number (migration 045), shown until they claim it. */
  reserved?: number | null;
  /** /world-preview only: open on the entry-confirmed screen. */
  preview?: { number: number; joinedAt: string; archetype: string | null } | null;
}) {
  const claim = !entry && reserved != null;
  const reduce = useReducedMotion();
  const [niches, setNiches] = useState<string[]>(entry?.niches ?? []);
  const [blurb, setBlurb] = useState(entry?.blurb ?? '');
  const [listMe, setListMe] = useState(true);
  const [busy, setBusy] = useState<null | 'scan' | 'join' | 'leave'>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<number | null>(preview?.number ?? null);
  const [entered, setEntered] = useState<{ at: string; archetype: string | null } | null>(
    preview ? { at: preview.joinedAt, archetype: preview.archetype } : null
  );
  const [listed, setListed] = useState(entry?.listed ?? false);
  const [step, setStep] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // walk through the scan steps while a first brand read runs
  useEffect(() => {
    if (busy !== 'scan') return;
    setStep(0);
    const t = window.setInterval(
      () => setStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1)),
      9000
    );
    return () => window.clearInterval(t);
  }, [busy]);

  if (!handle) {
    return (
      <Shell>
        <h1
          className="text-[40px] leading-[0.95] md:text-[64px]"
          style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em' }}
        >
          Connect X to join.
        </h1>
        <p className="mt-4 text-[16px]" style={{ color: C.muted }}>
          Every Index entry is a real X account with a BrandOS reading. Connect yours from your
          dashboard, then come back.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block px-6 py-3.5 text-[12px] uppercase tracking-[0.14em] text-white"
          style={{ fontFamily: MONO, background: C.blue }}
        >
          Go to your dashboard →
        </Link>
      </Shell>
    );
  }

  const toggle = (n: string) =>
    setNiches((cur) =>
      cur.includes(n) ? cur.filter((x) => x !== n) : cur.length >= MAX_NICHES ? cur : [...cur, n]
    );

  const post = () =>
    fetch('/api/index/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niches, blurb }),
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listMe) {
      setError('Tick "List me" to join. You can leave any time.');
      return;
    }
    if (niches.length === 0) {
      setError('Pick at least one niche.');
      return;
    }
    if (!blurb.trim()) {
      setError('Write one line for brands.');
      return;
    }
    setError(null);
    setBusy('join');
    try {
      // An old read joins right away and is refreshed in the background.
      // Only a first-ever read has to run before the number is assigned.
      let res = await post();
      let body = await res.json().catch(() => ({}));
      if (res.status === 409 && body.needsScan) {
        setBusy('scan');
        const scan = await fetch('/api/dashboard/rescan', { method: 'POST' });
        setBusy('join');
        if (!scan.ok) {
          setError("We couldn't read your brand right now. Try again in a minute.");
          return;
        }
        res = await post();
        body = await res.json().catch(() => ({}));
      }
      if (!res.ok || typeof body.number !== 'number') {
        setError(body.error ?? 'Something went wrong. Try again.');
        return;
      }
      setListed(true);
      setRefreshing(body.refreshing === true);
      setEntered({
        at: typeof body.joinedAt === 'string' ? body.joinedAt : new Date().toISOString(),
        archetype: typeof body.archetype === 'string' ? body.archetype : (read?.archetype ?? null),
      });
      setJoined(body.number);
    } catch {
      setError('Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  const setVisibility = async (next: boolean) => {
    setBusy('leave');
    setError(null);
    try {
      const res = await fetch('/api/index/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listed: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setError(body.error ?? 'Something went wrong.');
      else setListed(next);
    } finally {
      setBusy(null);
    }
  };

  if (joined !== null) {
    const shareUrl = `${APP}/index?m=${handle}`;
    const text = `i'm entry ${formatNumber(joined)} in the BrandOS Creator Index.\n\nbrands browse it free. creators, claim your number ↓`;
    const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    return (
      <Shell>
        <Micro color={C.blue}>Entry confirmed</Micro>
        <Press reduce={!!reduce}>
          <div
            className="flex items-baseline gap-3"
            style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.045em' }}
          >
            <span className="text-[40px] md:text-[56px]">No.</span>
            <span className="text-[96px] leading-none md:text-[160px]" style={{ color: C.blue }}>
              {String(joined).padStart(4, '0')}
            </span>
          </div>
        </Press>
        <div className="mt-5 space-y-1.5">
          <TypeLine
            text={`ENTERED ${recordDate(entered?.at ?? new Date())}`}
            start={480}
            reduce={!!reduce}
            color={C.ink}
          />
          <TypeLine
            text={classLabel(entered?.archetype, '/')}
            start={480 + 22 * 30}
            reduce={!!reduce}
            color={C.blue}
          />
        </div>
        <p className="mt-6 text-[17px]">
          @{handle} is entered in the BrandOS Creator Index as {formatNumber(joined)}.
        </p>
        {refreshing && (
          <p className="mt-2 text-[14px]" style={{ color: C.muted }}>
            Your reading is being refreshed. The entry updates when it completes.
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={intent}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 text-[12px] uppercase tracking-[0.14em] text-white"
            style={{ fontFamily: MONO, background: C.blue }}
          >
            Share your entry on X →
          </a>
          <Link
            href={`/index?m=${handle}`}
            className="border px-6 py-3.5 text-[12px] uppercase tracking-[0.14em]"
            style={{ fontFamily: MONO, borderColor: C.ink }}
          >
            See the Index
          </Link>
        </div>
        <p className="mt-8 max-w-[520px] text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Founding Members (Pro, $29/mo for life) are Featured at the top of the Index and see which
          brand teams viewed their entry.{' '}
          <Link href="/pricing" style={{ color: C.blue }}>
            Become a Founding Member →
          </Link>
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <Micro color={claim ? C.blue : C.muted}>
        {entry
          ? `Entry ${formatNumber(entry.number)} / Edit`
          : claim
            ? 'Number reserved'
            : 'Join the Index'}
      </Micro>
      <h1
        className="mt-3 text-[40px] leading-[0.95] md:text-[64px]"
        style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em' }}
      >
        {entry ? 'Your entry.' : claim ? `${formatNumber(reserved)} is yours.` : 'Get your number.'}
      </h1>
      {claim && (
        <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed" style={{ color: C.ink }}>
          Held for you since you joined the list. Claim it below. Unclaimed numbers are released on
          3 Dec 2026.
        </p>
      )}
      <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed" style={{ color: C.muted }}>
        Brands browse the Index to find creators by their reading, not their follower count. Your
        entry shows @{handle}
        {read
          ? `, your score (${read.score}) and classification (${classLabel(read.archetype)})`
          : ' and your reading'}
        , plus what you write below.
        {read && !read.fresh
          ? ' Your reading is over a week old; it is refreshed right after you join.'
          : ''}
      </p>

      <form onSubmit={submit} className="mt-10 space-y-8">
        <fieldset>
          <legend>
            <Micro>Your niches / pick up to {MAX_NICHES}</Micro>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {NICHES.map((n) => {
              const on = niches.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(n)}
                  className="border px-3 py-2 text-[12px] uppercase tracking-[0.1em]"
                  style={{
                    fontFamily: MONO,
                    borderColor: on ? C.blue : C.rule,
                    background: on ? C.blue : 'transparent',
                    color: on ? '#FFFFFF' : C.ink,
                    opacity: !on && niches.length >= MAX_NICHES ? 0.4 : 1,
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="block">
          <div className="flex items-center justify-between">
            <Micro>One line for brands</Micro>
            <Micro color={blurb.length > BLURB_MAX ? '#B42318' : C.muted}>
              {blurb.length}/{BLURB_MAX}
            </Micro>
          </div>
          <input
            value={blurb}
            onChange={(e) => setBlurb(e.target.value.replace(/[\r\n]+/g, ' '))}
            maxLength={BLURB_MAX}
            placeholder="I break down DeFi launches for 30k builders, every weekday."
            className="mt-3 w-full border bg-transparent px-4 py-3.5 text-[16px] outline-none"
            style={{ borderColor: C.rule, color: C.ink, background: C.panel }}
          />
        </label>

        <label className="flex items-start gap-3 text-[14px]">
          <input
            type="checkbox"
            checked={listMe}
            onChange={(e) => setListMe(e.target.checked)}
            className="mt-1"
          />
          <span>
            List me in the public BrandOS Creator Index. Anyone can see my entry (and, on Pro, my
            score history and best posts on my page). I can leave any time.
          </span>
        </label>

        {error && (
          <p className="text-[14px]" style={{ color: '#B42318' }}>
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy !== null}
            className="px-6 py-3.5 text-[12px] uppercase tracking-[0.14em] text-white disabled:opacity-60"
            style={{ fontFamily: MONO, background: C.blue }}
          >
            {busy === 'scan'
              ? SCAN_STEPS[step]
              : busy === 'join'
                ? 'Saving…'
                : entry
                  ? 'Save and list me'
                  : 'Join the Index →'}
          </button>
          {entry && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setVisibility(!listed)}
              className="text-[11px] uppercase tracking-[0.14em] underline-offset-4 hover:underline"
              style={{ fontFamily: MONO, color: C.muted }}
            >
              {listed ? 'Leave the Index (hide my entry)' : 'Hidden / list me again'}
            </button>
          )}
        </div>
      </form>
    </Shell>
  );
}

/**
 * The Press: the stamp that confirms an entry. Arrives at 112% and settles to
 * 100% (ease-out, no overshoot) while a thin Klein ring presses outward and
 * thins away. Reduced motion: the final state, no ring.
 */
function Press({ children, reduce }: { children: React.ReactNode; reduce: boolean }) {
  if (reduce) return <div className="mt-4">{children}</div>;
  return (
    <div className="relative mt-4 inline-block">
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-[-6px]"
        style={{ border: `2px solid ${C.blue}` }}
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.08, opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
      />
      <motion.div
        style={{ transformOrigin: 'left center' }}
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * A record line typed in VCR, ~30ms a character. The line's width is held
 * (no-break spaces) so nothing shifts while it types.
 */
function TypeLine({
  text,
  start,
  reduce,
  color,
}: {
  text: string;
  start: number;
  reduce: boolean;
  color: string;
}) {
  const [n, setN] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    let tick: number | undefined;
    const begin = window.setTimeout(() => {
      tick = window.setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length) window.clearInterval(tick);
      }, 30);
    }, start);
    return () => {
      window.clearTimeout(begin);
      if (tick) window.clearInterval(tick);
    };
  }, [text, start, reduce]);
  return (
    <div
      className="text-[12px] tracking-[0.18em]"
      style={{ fontFamily: MONO, color, whiteSpace: 'pre' }}
      aria-label={text}
    >
      <span aria-hidden>
        {text.slice(0, n)}
        {'\u00a0'.repeat(text.length - n)}
      </span>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen" style={{ background: C.bg, color: C.ink }}>
      <div className="mx-auto max-w-[880px] px-4 pb-20 pt-6 md:px-10 md:pt-10">
        <div
          className="flex items-center justify-between border-b pb-3"
          style={{ borderColor: C.rule }}
        >
          <Link href="/index">
            <Micro color={C.ink}>← The Creator Index</Micro>
          </Link>
          <Micro>BrandOS</Micro>
        </div>
        <div className="pt-12 md:pt-16">{children}</div>
      </div>
    </main>
  );
}

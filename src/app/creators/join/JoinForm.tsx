'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import { BLURB_MAX, formatNumber, MAX_NICHES, NICHES } from '@/lib/index-rules';

// Join (or edit) your Creator Index entry. The headline motion is the number
// arriving: it rolls up in Klein when you join (Motion+ AnimateNumber).

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
  'Naming your archetype…',
  'Getting your number ready…',
];

export default function JoinForm({
  handle,
  read,
  entry,
}: {
  handle: string | null;
  read: { score: number; archetype: string; fresh: boolean } | null;
  entry: Entry | null;
}) {
  const reduce = useReducedMotion();
  const [niches, setNiches] = useState<string[]>(entry?.niches ?? []);
  const [blurb, setBlurb] = useState(entry?.blurb ?? '');
  const [listMe, setListMe] = useState(true);
  const [busy, setBusy] = useState<null | 'scan' | 'join' | 'leave'>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<number | null>(null);
  const [listed, setListed] = useState(entry?.listed ?? false);
  const [shown, setShown] = useState(0);
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

  // the number rolls up from 0 once it's assigned
  useEffect(() => {
    if (joined === null) return;
    const t = window.setTimeout(() => setShown(joined), reduce ? 0 : 150);
    return () => window.clearTimeout(t);
  }, [joined, reduce]);

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
          Every Index entry is a real X account with a BrandOS brand read. Connect yours from your
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
    const text = `i'm ${formatNumber(joined)} in the BrandOS Creator Index.\n\nbrands browse it free. creators, get your number ↓`;
    const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    return (
      <Shell>
        <Micro color={C.blue}>You&apos;re in</Micro>
        <div
          className="mt-4 flex items-baseline gap-3"
          style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.045em' }}
        >
          <span className="text-[40px] md:text-[56px]">No.</span>
          <span className="text-[96px] leading-none md:text-[160px]" style={{ color: C.blue }}>
            <AnimateNumber format={{ minimumIntegerDigits: 4, useGrouping: false }}>
              {shown}
            </AnimateNumber>
          </span>
        </div>
        <p className="mt-4 text-[17px]">
          @{handle} is {formatNumber(joined)} in the BrandOS Creator Index.
        </p>
        {refreshing && (
          <p className="mt-2 text-[14px]" style={{ color: C.muted }}>
            We&apos;re refreshing your brand read in the background. Your card updates in a minute.
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
            Share your number on X →
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
          Founding members (Pro, $29 for life) are Featured at the top of the Index and see which
          brands viewed them.{' '}
          <Link href="/pricing" style={{ color: C.blue }}>
            Lock in founding →
          </Link>
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <Micro>{entry ? `${formatNumber(entry.number)} · edit your entry` : 'Join the Index'}</Micro>
      <h1
        className="mt-3 text-[40px] leading-[0.95] md:text-[64px]"
        style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em' }}
      >
        {entry ? 'Your entry.' : 'Get your number.'}
      </h1>
      <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed" style={{ color: C.muted }}>
        Brands browse the Index to find creators with a real brand read behind them. Your card shows
        @{handle}
        {read
          ? `, your score (${read.score}) and archetype (${read.archetype})`
          : ' and your brand read'}
        , plus what you tell them below.
        {read && !read.fresh
          ? ' Your read is over a week old, so we refresh it right after you join.'
          : ''}
      </p>

      <form onSubmit={submit} className="mt-10 space-y-8">
        <fieldset>
          <legend>
            <Micro>Your niches · pick up to {MAX_NICHES}</Micro>
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
            List me in the public BrandOS Creator Index. Anyone can see my card (and, on Pro, my
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
              {listed ? 'Leave the Index (hide my card)' : 'Hidden · list me again'}
            </button>
          )}
        </div>
      </form>
    </Shell>
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

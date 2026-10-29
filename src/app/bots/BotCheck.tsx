'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { BOT_RULES, SIGNAL_LABEL, type BotCheckView, type BotSignal } from '@/lib/bot-rules';

/**
 * "How many bots follow you?" — plays like the campaign video ("The Check"),
 * with HARD CUTS between scenes (no fades anywhere): the question → reading
 * (the loading state is part of the reveal: dots appear as followers are read)
 * → the follower count → every sampled follower checked one by one → % real
 * → who engages → sign up / Verified. Headline motion: AnimateNumber on the
 * counts (Motion+). Reduced motion jumps straight to the result.
 *
 * Copy is careful: "look like bots" (signals, not certainty), and always
 * "the newest N followers", never "your followers".
 */

const BIG = "'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'VCR OSD Mono', var(--font-jetbrains), monospace";
const C = {
  bone: '#F2EFE8',
  ink: '#0E0E0E',
  muted: '#6B6862',
  rule: 'rgba(14,14,14,0.22)',
  unread: 'rgba(14,14,14,0.12)',
  grey: '#A9A59C',
  blue: '#0047FF',
};

type Scene = 'input' | 'reading' | 'count' | 'dots';
type DotState = 'real' | 'suspicious' | 'bot';

const SECTION: Record<Scene, string> = {
  input: '01 / THE QUESTION',
  reading: '02 / READING',
  count: '03 / THE NUMBER',
  dots: '04 / WHO’S REAL',
};

const STEPS = [
  'READING THE NEWEST FOLLOWERS',
  'CHECKING PROFILE PHOTOS AND BIOS',
  'CHECKING ACCOUNT AGES',
  'CHECKING WHO THEY FOLLOW',
  'READING WHO REPLIES AND REPOSTS',
  'ALMOST THERE',
];

/** Deterministic shuffle so the dot pattern is stable per handle (never the real order). */
function seeded(handle: string) {
  let h = 2166136261;
  for (const ch of handle.toLowerCase()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function dotStates(v: BotCheckView): DotState[] {
  const f = v.followers;
  const out: DotState[] = [
    ...Array<DotState>(f.real).fill('real'),
    ...Array<DotState>(f.suspicious).fill('suspicious'),
    ...Array<DotState>(f.bot).fill('bot'),
  ];
  const r = seeded(v.handle);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export default function BotCheck({ initialHandle }: { initialHandle: string | null }) {
  const reduce = useReducedMotion();
  const [input, setInput] = useState(initialHandle ? `@${initialHandle}` : '');
  const [scene, setScene] = useState<Scene>('input');
  const [handle, setHandle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BotCheckView | null>(null);
  const [step, setStep] = useState(0);
  const [read, setRead] = useState(0); // dots shown while reading
  const [count, setCount] = useState(0); // AnimateNumber targets (set after mount)
  const [checked, setChecked] = useState(0); // dots checked in the sweep
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState(0); // 0 sweep, 1 % real, 2 engagers, 3 CTA
  const run = useRef(0);

  const start = useCallback(
    async (raw: string) => {
      const h = raw.trim().replace(/^@/, '');
      if (!/^[A-Za-z0-9_]{1,15}$/.test(h)) {
        setError('Enter an X handle, like @jbawsa.');
        return;
      }
      const id = ++run.current;
      const live = () => id === run.current;
      setError(null);
      setHandle(h);
      setData(null);
      setRead(0);
      setStep(0);
      setCount(0);
      setChecked(0);
      setPct(0);
      setStage(0);
      setScene('reading');
      window.history.replaceState(null, '', `/bots?h=${encodeURIComponent(h)}`);

      const begun = Date.now();
      let res: Response;
      try {
        res = await fetch('/api/bot-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle: h }),
        });
      } catch {
        if (live()) {
          setScene('input');
          setError('Couldn’t reach BrandOS. Check your connection and try again.');
        }
        return;
      }
      const body = (await res.json().catch(() => ({}))) as BotCheckView & { error?: string };
      if (!live()) return;
      if (!res.ok) {
        setScene('input');
        setError(body.error || 'The check failed. Try again shortly.');
        return;
      }
      setData(body);

      if (reduce) {
        setCount(body.followerCount);
        setChecked(body.followers.sampled);
        setPct(body.followers.pctReal ?? 0);
        setStage(3);
        setScene('dots');
        return;
      }
      // let the reading scene breathe even when the result was cached
      const wait = Math.max(0, 2600 - (Date.now() - begun));
      if (wait) await sleep(wait);
      if (!live()) return;
      setScene('count');
      await sleep(60);
      setCount(body.followerCount);
      await sleep(2300);
      if (!live()) return;
      setScene('dots');
      const n = body.followers.sampled;
      const sweep = Math.min(3400, Math.max(1200, n * 16));
      const t0 = performance.now();
      await new Promise<void>((done) => {
        const tick = () => {
          if (!live()) return done();
          const k = Math.min(n, Math.round(((performance.now() - t0) / sweep) * n));
          setChecked(k);
          if (k >= n) done();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      if (!live()) return;
      setStage(1);
      await sleep(60);
      setPct(body.followers.pctReal ?? 0);
      await sleep(1300);
      if (!live()) return;
      setStage(2);
      await sleep(1100);
      if (live()) setStage(3);
    },
    [reduce]
  );

  // reading scene: ticker + dots appearing as followers are read
  useEffect(() => {
    if (scene !== 'reading') return;
    const a = window.setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 1500);
    const b = window.setInterval(() => setRead((r) => Math.min(BOT_RULES.maxFollowers, r + 3)), 45);
    return () => {
      window.clearInterval(a);
      window.clearInterval(b);
    };
  }, [scene]);

  // shared link: run the handle in the URL once
  const auto = useRef(false);
  useEffect(() => {
    if (initialHandle && !auto.current) {
      auto.current = true;
      const t = window.setTimeout(() => void start(initialHandle), 0);
      return () => window.clearTimeout(t);
    }
  }, [initialHandle, start]);

  const dots = useMemo(() => (data ? dotStates(data) : []), [data]);

  return (
    <main
      className="relative flex min-h-[100svh] flex-col"
      style={{ background: C.bone, color: C.ink, fontFamily: BIG }}
    >
      <Frame section={SECTION[scene]} />

      <div className="mx-auto flex w-full max-w-[880px] flex-1 flex-col justify-center px-4 py-24 md:px-8">
        {scene === 'input' && (
          <InputScene
            value={input}
            onChange={setInput}
            onSubmit={() => void start(input)}
            error={error}
          />
        )}

        {scene === 'reading' && handle && (
          <section className="flex flex-col items-center text-center">
            <Mono color={C.blue}>{STEPS[step]}</Mono>
            <div
              className="mt-6 text-[56px] leading-none md:text-[104px]"
              style={{ letterSpacing: '-0.04em', fontWeight: 600 }}
            >
              @{handle}
            </div>
            <DotGrid total={BOT_RULES.maxFollowers} shown={read} className="mt-12" />
          </section>
        )}

        {scene === 'count' && data && (
          <section className="flex flex-col items-center text-center">
            <AnimateNumber
              className="text-[84px] leading-none md:text-[200px]"
              style={{ fontFamily: BIG, fontWeight: 600, letterSpacing: '-0.05em' }}
              format={{ useGrouping: true }}
              transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            >
              {count}
            </AnimateNumber>
            <div className="mt-6">
              <Mono>FOLLOWERS</Mono>
            </div>
            <div className="mt-3 text-[18px] md:text-[22px]" style={{ color: C.muted }}>
              How many of them are real?
            </div>
          </section>
        )}

        {scene === 'dots' && data && (
          <ResultScene
            data={data}
            dots={dots}
            checked={checked}
            pct={pct}
            stage={stage}
            onAgain={() => {
              run.current++;
              setInput('');
              setScene('input');
              window.history.replaceState(null, '', '/bots');
            }}
          />
        )}
      </div>
    </main>
  );
}

function Mono({ children, color = C.ink }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="text-[11px] uppercase tracking-[0.28em] md:text-[12px]"
      style={{ fontFamily: MONO, color }}
    >
      {children}
    </div>
  );
}

/** The editorial frame from the video: hairline rules + corner micro-labels. */
function Frame({ section }: { section: string }) {
  const lbl = 'text-[10px] uppercase tracking-[0.3em] md:text-[11px]';
  return (
    <div className="pointer-events-none absolute inset-0 px-4 py-5 md:px-10 md:py-8" aria-hidden>
      <div className="flex h-full flex-col justify-between">
        <div>
          <div style={{ height: 1, background: C.rule }} />
          <div
            className={`mt-3 flex justify-between ${lbl}`}
            style={{ fontFamily: MONO, color: C.muted }}
          >
            <Link href="/" className="pointer-events-auto">
              BRANDOS
            </Link>
            <span>BOT CHECK</span>
          </div>
        </div>
        <div>
          <div
            className={`mb-3 flex justify-between ${lbl}`}
            style={{ fontFamily: MONO, color: C.muted }}
          >
            <span>{section}</span>
            <span>MYBRANDOS.APP</span>
          </div>
          <div style={{ height: 1, background: C.rule }} />
        </div>
      </div>
    </div>
  );
}

function InputScene({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  return (
    <section className="flex flex-col">
      <h1
        className="text-[56px] leading-[0.92] md:text-[120px]"
        style={{ letterSpacing: '-0.05em', fontWeight: 600 }}
      >
        how many bots
        <br />
        <span style={{ color: C.blue }}>follow you?</span>
      </h1>
      <form
        className="mt-10 flex flex-col gap-3 md:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="sr-only" htmlFor="bot-handle">
          X handle
        </label>
        <input
          id="bot-handle"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 40))}
          placeholder="@yourhandle"
          className="h-16 flex-1 border-2 bg-transparent px-5 text-[24px] outline-none md:text-[28px]"
          style={{
            background: 'transparent',
            borderColor: C.ink,
            caretColor: C.blue,
            fontFamily: BIG,
            color: C.ink,
            borderRadius: 0,
          }}
        />
        <button
          type="submit"
          className="h-16 px-8 text-[13px] uppercase tracking-[0.24em] text-white"
          style={{ background: C.blue, fontFamily: MONO, borderRadius: 0 }}
        >
          Check
        </button>
      </form>
      {error && (
        <p className="mt-4 text-[16px]" style={{ color: '#B42318' }} role="alert">
          {error}
        </p>
      )}
      <p className="mt-6 max-w-[560px] text-[16px] leading-relaxed" style={{ color: C.muted }}>
        Free for any public X account. BrandOS reads the newest {BOT_RULES.maxFollowers} followers
        and the people who reply and repost, and shows how many look real.
      </p>
    </section>
  );
}

function DotGrid({
  total,
  shown,
  states,
  checked = 0,
  className = '',
}: {
  total: number;
  shown: number;
  states?: DotState[];
  checked?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid w-full max-w-[600px] justify-center gap-[6px] ${className}`}
      style={{ gridTemplateColumns: 'repeat(auto-fill, 10px)' }}
      aria-hidden
    >
      {Array.from({ length: total }, (_, i) => {
        if (i >= shown) return <span key={i} style={{ width: 10, height: 10 }} />;
        const s = states && i < checked ? states[i] : null;
        const style: React.CSSProperties =
          s === 'real'
            ? { background: C.blue }
            : s === 'suspicious'
              ? { background: C.grey }
              : s === 'bot'
                ? { border: `2px solid ${C.ink}` }
                : { background: C.unread };
        return <span key={i} style={{ width: 10, height: 10, borderRadius: 999, ...style }} />;
      })}
    </div>
  );
}

function ResultScene({
  data,
  dots,
  checked,
  pct,
  stage,
  onAgain,
}: {
  data: BotCheckView;
  dots: DotState[];
  checked: number;
  pct: number;
  stage: number;
  onAgain: () => void;
}) {
  const f = data.followers;
  const e = data.engagers;
  const h = data.handle;
  const share = `https://x.com/intent/post?text=${encodeURIComponent(
    `I checked @${h}: ${f.pctReal}% of the newest ${f.sampled} followers look real.\n\nHow many bots follow you?`
  )}&url=${encodeURIComponent(`https://mybrandos.app/bots?h=${h}`)}`;
  const topReasons = (r?: Partial<Record<BotSignal, number>>) =>
    Object.entries(r ?? {})
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .slice(0, 3) as [BotSignal, number][];

  return (
    <section className="flex flex-col">
      <Mono>
        @{h} / NEWEST {f.sampled} FOLLOWERS
      </Mono>
      <DotGrid
        total={f.sampled}
        shown={f.sampled}
        states={dots}
        checked={checked}
        className="mt-6 !justify-start"
      />
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px]" style={{ color: C.muted }}>
        <Legend dot={{ background: C.blue }} label="looks real" />
        <Legend dot={{ background: C.grey }} label="suspicious" />
        <Legend dot={{ border: `2px solid ${C.ink}` }} label="looks like a bot" />
      </div>

      {stage >= 1 && (
        <div className="mt-10">
          <div className="flex items-baseline gap-3">
            <AnimateNumber
              className="text-[96px] leading-none md:text-[160px]"
              style={{ fontFamily: BIG, fontWeight: 600, letterSpacing: '-0.05em', color: C.blue }}
              suffix="%"
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {pct}
            </AnimateNumber>
          </div>
          <p
            className="mt-3 text-[20px] leading-snug md:text-[26px]"
            style={{ letterSpacing: '-0.01em' }}
          >
            of @{h}’s newest {f.sampled} followers look real.
            <span style={{ color: C.muted }}>
              {' '}
              {f.bot} look like bots, {f.suspicious} look suspicious.
            </span>
          </p>
        </div>
      )}

      {stage >= 2 && (
        <div className="mt-10 border-t pt-6" style={{ borderColor: C.rule }}>
          <Mono>WHO ENGAGES</Mono>
          {e && e.sampled > 0 ? (
            <p className="mt-3 text-[20px] leading-snug md:text-[24px]">
              Of the {e.sampled} people who reply to and repost @{h}’s best recent posts,{' '}
              <span style={{ color: C.blue }}>{e.pctReal}% look real</span>.
              {data.notable.length > 0 && (
                <span style={{ color: C.muted }}>
                  {' '}
                  Including{' '}
                  {data.notable
                    .slice(0, 3)
                    .map((n) => `@${n.handle}`)
                    .join(', ')}
                  .
                </span>
              )}
            </p>
          ) : (
            <p className="mt-3 text-[18px]" style={{ color: C.muted }}>
              No replies or reposts in the last 30 days to read.
            </p>
          )}
        </div>
      )}

      {stage >= 3 && (
        <div className="mt-10 border-t pt-6" style={{ borderColor: C.rule }}>
          {data.viewer === 'owner' && data.flagged ? (
            <Flagged flagged={data.flagged} />
          ) : data.viewer === 'member' ? (
            <div>
              <Mono>WHY ACCOUNTS WERE FLAGGED</Mono>
              <ul className="mt-3 text-[16px]" style={{ color: C.muted }}>
                {topReasons(f.reasons).map(([k, n]) => (
                  <li key={k}>
                    {SIGNAL_LABEL[k]}: {n}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[15px]" style={{ color: C.muted }}>
                Only @{h} can see which accounts, signed in with that X account.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            {data.viewer === 'public' && (
              <a
                href={`/signup?next=${encodeURIComponent(`/bots?h=${h}`)}`}
                className="flex h-14 items-center justify-center px-7 text-[13px] uppercase tracking-[0.22em] text-white"
                style={{ background: C.blue, fontFamily: MONO }}
              >
                See which accounts
              </a>
            )}
            <a
              href="/pricing"
              className="flex h-14 items-center justify-center border-2 px-7 text-[13px] uppercase tracking-[0.22em]"
              style={{ borderColor: C.ink, fontFamily: MONO }}
            >
              Get BrandOS Verified
            </a>
            <a
              href={share}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center px-5 text-[13px] uppercase tracking-[0.22em]"
              style={{ fontFamily: MONO, color: C.blue }}
            >
              Share the result
            </a>
          </div>
          {data.viewer === 'public' && (
            <p className="mt-3 text-[14px]" style={{ color: C.muted }}>
              Free account. If it’s your handle, sign in with X to see which accounts were flagged
              and why.
            </p>
          )}
          <p className="mt-8 text-[13px] leading-relaxed" style={{ color: C.muted }}>
            Read from public profile signals (photo, bio, account age, activity, who they follow).
            Signals, not certainty. Checked{' '}
            {new Date(data.checkedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            .{' '}
            <button type="button" className="underline" onClick={onAgain}>
              Check another account
            </button>
          </p>
        </div>
      )}
    </section>
  );
}

function Legend({ dot, label }: { dot: React.CSSProperties; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span style={{ width: 10, height: 10, borderRadius: 999, display: 'inline-block', ...dot }} />
      {label}
    </span>
  );
}

function Flagged({ flagged }: { flagged: NonNullable<BotCheckView['flagged']> }) {
  const all = [...flagged.followers, ...flagged.engagers];
  return (
    <div>
      <Mono>ACCOUNTS THAT LOOK OFF ({all.length})</Mono>
      {all.length === 0 ? (
        <p className="mt-3 text-[16px]" style={{ color: C.muted }}>
          Nothing flagged. Clean.
        </p>
      ) : (
        <ul className="mt-3 max-h-[320px] overflow-auto text-[15px]">
          {all.map((a) => (
            <li
              key={a.handle}
              className="flex flex-wrap gap-x-3 border-b py-2"
              style={{ borderColor: C.rule }}
            >
              <a href={`https://x.com/${a.handle}`} target="_blank" rel="noopener noreferrer">
                @{a.handle}
              </a>
              <span
                style={{
                  color: a.verdict === 'bot' ? C.ink : C.muted,
                  fontFamily: MONO,
                  fontSize: 11,
                }}
              >
                {a.verdict === 'bot' ? 'LOOKS LIKE A BOT' : 'SUSPICIOUS'}
              </span>
              <span style={{ color: C.muted }}>
                {a.signals.map((s) => SIGNAL_LABEL[s]).join(', ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

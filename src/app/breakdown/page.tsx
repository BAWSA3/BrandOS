'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// "Get The Full Breakdown": the one step after a homepage scan. The visitor
// leaves an email and /api/breakdown sends their full scan breakdown, which
// also secures an early-access spot for BrandOS Dashboards.

const MONO = "'VCR OSD Mono', var(--font-jetbrains), monospace";
const BLUE = '#0047FF';
const HANDLE_RE = /^[A-Za-z0-9_]{1,30}$/;

function BreakdownForm() {
  const params = useSearchParams();
  const raw = (params.get('handle') ?? '').replace(/^@/, '');
  const handle = HANDLE_RE.test(raw) ? raw : null;
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending' || !handle) return;
    setState('sending');
    setMessage('');
    try {
      const res = await fetch('/api/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, handle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('error');
        setMessage(
          res.status === 429
            ? 'Too many tries. Wait a minute and try again.'
            : data.error || 'Something went wrong. Try again.'
        );
        return;
      }
      setState('done');
    } catch {
      setState('error');
      setMessage('Something went wrong. Try again.');
    }
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-16"
      style={{ background: '#F2EFE8', color: '#111' }}
    >
      <div className="w-full max-w-[440px]">
        <div
          className="text-[11px] tracking-[0.18em] text-black/50 uppercase"
          style={{ fontFamily: MONO }}
        >
          {'// brandos'}
          {handle ? ` · @${handle}` : ''}
        </div>

        {state === 'done' ? (
          <>
            <h1 className="mt-4 text-[34px] leading-[1.05] font-semibold tracking-[-0.02em]">
              Check your inbox.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-black/70">
              Your full breakdown is on its way to <b className="text-black">{email}</b>.
              You&apos;ve also secured an early access spot for BrandOS Dashboards.
            </p>
            <p className="mt-3 text-[13px] text-black/50">
              Not there in a few minutes? Check spam or promotions.
            </p>
            <a
              href="/"
              className="mt-8 inline-block text-[12px] tracking-[0.14em] uppercase underline underline-offset-4"
              style={{ fontFamily: MONO, color: BLUE }}
            >
              ← Back to BrandOS
            </a>
          </>
        ) : !handle ? (
          <>
            <h1 className="mt-4 text-[34px] leading-[1.05] font-semibold tracking-[-0.02em]">
              Scan your brand first.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-black/70">
              Your full breakdown comes from your scan. It takes about a minute.
            </p>
            <a
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-[4px] px-6 py-3.5 text-[12px] tracking-[0.14em] text-white uppercase"
              style={{ fontFamily: MONO, background: BLUE }}
            >
              Scan my brand →
            </a>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-[34px] leading-[1.05] font-semibold tracking-[-0.02em]">
              Get your full breakdown.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-black/70">
              Your four phases, what&apos;s working, what to fix, and your next moves, sent to your
              inbox. Plus an early access spot for BrandOS Dashboards.
            </p>
            <form onSubmit={submit} className="mt-8">
              <label
                htmlFor="email"
                className="block text-[11px] tracking-[0.16em] text-black/50 uppercase"
                style={{ fontFamily: MONO }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-[4px] border border-black/15 bg-white px-4 py-3.5 text-[16px] outline-none focus:border-[#0047FF]"
              />
              <button
                type="submit"
                disabled={state === 'sending'}
                className="mt-3 w-full rounded-[4px] px-4 py-4 text-[13px] font-semibold tracking-[0.12em] text-white uppercase transition-colors disabled:opacity-60"
                style={{ fontFamily: MONO, background: BLUE }}
              >
                {state === 'sending' ? 'Sending…' : 'Send my breakdown →'}
              </button>
              {state === 'error' && (
                <p role="alert" className="mt-3 text-[13px] text-[#D70015]">
                  {message}
                </p>
              )}
              <p className="mt-4 text-[12px] text-black/45">
                We&apos;ll send your breakdown now, and email you again when Dashboards opens.
                Unsubscribe anytime.
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export default function BreakdownPage() {
  return (
    <Suspense>
      <BreakdownForm />
    </Suspense>
  );
}

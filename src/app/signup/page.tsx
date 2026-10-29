'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { TOS_VERSION } from '@/lib/tos';
import Wordmark from '@/components/Wordmark';
import { safeNextPath } from '@/lib/safe-input';
import {
  INVALID_CODE_MESSAGE,
  INVITE_ONLY_HOW,
  INVITE_ONLY_MESSAGE,
  typedCodePath,
} from '@/lib/early-access-rules';

// One screen for new AND returning users (decided 2026-10-22): Continue with X
// first (BrandOS reads your X), then Google, then a one-tap email link (no
// password). One checkbox confirms the age in the Terms (13+) and accepts the
// Terms; the buttons wait for it, so the tos param (recorded as tosAcceptedAt
// on the account) only ever rides a callback after that confirmation.
// Everyone lands on the dashboard.

const DISPLAY = "'Helvetica Custom', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const LABEL = "'VCR OSD Mono', var(--font-jetbrains), monospace";
const BLUE = '#0047FF';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

/** Plain-English versions of the auth errors people actually hit. */
function friendly(message: string): string {
  if (/rate limit|too many/i.test(message)) return 'Too many tries. Wait a minute and try again.';
  if (/invalid.*email|email.*invalid/i.test(message)) return 'That email doesn’t look right.';
  if (/not enabled|unsupported provider/i.test(message))
    return 'That sign-in option isn’t available right now. Try X or email.';
  return 'Something went wrong. Try again.';
}

/** "Last used" tag on the sign-in method that worked last time on this device. */
function LastUsed({ onBlue = false }: { onBlue?: boolean }) {
  return (
    <span
      className="ml-2 rounded-[3px] px-1.5 py-[2px] text-[9px] tracking-[0.12em]"
      style={{
        fontFamily: LABEL,
        background: onBlue ? '#FFFFFF' : BLUE,
        color: onBlue ? BLUE : '#FFFFFF',
      }}
    >
      Last used
    </span>
  );
}

export default function ContinuePage() {
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<null | 'x' | 'google' | 'email'>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  // the method that last worked on this device (cookie set by the callback)
  const [lastUsed, setLastUsed] = useState<null | 'x' | 'google' | 'email'>(null);
  // Age + Terms confirmation (Terms: 13+). Pre-checked on a device that has
  // signed in before, since that account already confirmed it.
  const [ageOk, setAgeOk] = useState(false);
  useEffect(() => {
    const v = document.cookie.match(/(?:^|; )bos_last_signin=(x|google|email)/)?.[1];
    const t = window.setTimeout(() => {
      setLastUsed((v as 'x' | 'google' | 'email') ?? null);
      if (v) setAgeOk(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const ref = params?.get('ref');
  const rawNext = params?.get('next');
  // same-origin relative paths only (no open redirect)
  const next = safeNextPath(rawNext, '/dashboard');
  // signing in from someone's public page to compare: say where they're going
  // back to (read after mount; the page is prerendered without the URL)
  const [compareWith, setCompareWith] = useState<string | null>(null);
  useEffect(() => {
    const target = safeNextPath(new URLSearchParams(window.location.search).get('next'), '');
    const handle = /^\/@([A-Za-z0-9_]{1,15})\?compare=1$/.exec(target)?.[1] ?? null;
    const t = window.setTimeout(() => setCompareWith(handle), 0);
    return () => window.clearTimeout(t);
  }, []);
  // early-access code: saved by /i/<code> (cookie) or typed here, which goes
  // through /i/<code> too (checked there, not used), so the auth callback
  // redeems it after sign-in. `required`: the callback turned a new account
  // away because BrandOS is invite-only (INVITE_ONLY) and there was no code.
  const [invite, setInvite] = useState<null | 'saved' | 'invalid' | 'required'>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('invite');
    const t = window.setTimeout(() => {
      const state = v === 'saved' || v === 'invalid' || v === 'required' ? v : null;
      setInvite(state);
      if (state === 'required' || state === 'invalid') setCodeOpen(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  function applyCode(e: React.FormEvent) {
    e.preventDefault();
    const path = typedCodePath(code);
    if (!path) {
      setCodeError(INVALID_CODE_MESSAGE);
      return;
    }
    window.location.assign(path);
  }
  const callbackUrl = (via: 'x' | 'google' | 'email') =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}&tos=${encodeURIComponent(TOS_VERSION)}&via=${via}`
      : '';

  async function oauth(provider: 'twitter' | 'google') {
    if (!ageOk) return;
    setError(null);
    setBusy(provider === 'twitter' ? 'x' : 'google');
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl(provider === 'twitter' ? 'x' : 'google') },
    });
    if (e) {
      setError(friendly(e.message));
      setBusy(null);
    }
  }

  async function emailLink(e: React.FormEvent) {
    e.preventDefault();
    if (!ageOk) return;
    setError(null);
    setBusy('email');
    // One-tap link: creates the account if new, signs in if returning.
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl('email'), shouldCreateUser: true },
    });
    setBusy(null);
    if (err) {
      setError(friendly(err.message));
      return;
    }
    setSent(true);
  }

  const btn =
    'w-full flex items-center justify-center gap-2 rounded-[6px] px-4 py-3.5 text-[12px] uppercase tracking-[0.14em] transition-colors disabled:opacity-60';

  if (sent) {
    return (
      <main className="min-h-screen bg-[#F2EFE8] text-[#0E0E0E] flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] text-center">
          <div className="flex justify-center">
            <Wordmark height={28} />
          </div>
          <h1
            className="mt-8 text-[34px] leading-[1.05]"
            style={{ fontFamily: DISPLAY, fontWeight: 500 }}
          >
            Check your email
          </h1>
          <p className="mt-3 text-[15px] leading-[1.55] text-[#333]">
            We sent a sign-in link to <strong>{email}</strong>. Tap it and you&apos;ll land on your
            dashboard.
          </p>
          <p className="mt-2 text-[13px] text-[#6B6862]">
            Nothing after a minute? Check spam, or{' '}
            <button
              type="button"
              className="underline hover:text-[#0E0E0E]"
              onClick={() => setSent(false)}
            >
              try again
            </button>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2EFE8] text-[#0E0E0E] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center">
          <Wordmark height={30} />
        </div>
        <h1
          className="mt-10 text-center text-[36px] leading-[1.02] md:text-[42px]"
          style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.03em' }}
        >
          Continue to your brand dashboard
        </h1>
        <p className="mt-3 text-center text-[14px] leading-[1.5] text-[#6B6862]">
          New here? This creates your account. Back again? It signs you in.
        </p>
        {compareWith && (
          <p
            className="mt-2 text-center text-[11px] uppercase tracking-[0.14em]"
            style={{ fontFamily: LABEL, color: BLUE }}
          >
            Then we compare you to @{compareWith}
          </p>
        )}
        {invite === 'saved' && (
          <p
            className="mt-2 text-center text-[11px] uppercase tracking-[0.14em]"
            style={{ fontFamily: LABEL, color: BLUE }}
          >
            Your early-access code is saved. Sign in with X to claim it.
          </p>
        )}
        {invite === 'required' && (
          <div
            className="mt-6 rounded-[6px] border border-[#0047FF]/30 bg-white px-4 py-3.5 text-center"
            role="alert"
          >
            <p className="text-[15px] leading-[1.45] text-[#0E0E0E]">{INVITE_ONLY_MESSAGE}</p>
            <p className="mt-1.5 text-[13px] text-[#6B6862]">
              {INVITE_ONLY_HOW}{' '}
              <Link href="/access#apply" className="underline hover:text-[#0E0E0E]">
                Apply for a code →
              </Link>
            </p>
          </div>
        )}
        {invite === 'invalid' && (
          <p className="mt-2 text-center text-[13px] text-[#6B6862]" role="alert">
            {INVALID_CODE_MESSAGE}
          </p>
        )}
        {ref && (
          <p
            className="mt-2 text-center text-[11px] uppercase tracking-[0.14em]"
            style={{ fontFamily: LABEL, color: BLUE }}
          >
            Invited via referral link
          </p>
        )}

        {error && (
          <div
            className="mt-6 rounded-[6px] border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <label className="mt-8 flex cursor-pointer items-start gap-2.5 text-[12px] leading-[1.5] text-[#3A3833]">
          <input
            type="checkbox"
            checked={ageOk}
            onChange={(e) => setAgeOk(e.target.checked)}
            className="mt-[2px] h-4 w-4 shrink-0 accent-[#0047FF]"
          />
          <span>
            I&apos;m 13 or older and I agree to the{' '}
            <Link href="/terms" target="_blank" className="underline hover:text-[#0E0E0E]">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" className="underline hover:text-[#0E0E0E]">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => oauth('twitter')}
            disabled={busy !== null || !ageOk}
            className={`${btn} bg-[#0047FF] text-white hover:bg-[#0035CC]`}
            style={{ fontFamily: LABEL }}
          >
            <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {busy === 'x' ? 'Opening X…' : 'Continue with X'}
            {lastUsed === 'x' && <LastUsed onBlue />}
          </button>
          <p className="text-center text-[11px] text-[#6B6862]">
            Recommended: BrandOS reads your brand from X.
          </p>

          <button
            type="button"
            onClick={() => oauth('google')}
            disabled={busy !== null || !ageOk}
            className={`${btn} border border-black/15 bg-white hover:border-[#0047FF]`}
            style={{ fontFamily: LABEL }}
          >
            <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
            {lastUsed === 'google' && <LastUsed />}
          </button>

          {emailOpen ? (
            <form onSubmit={emailLink} className="space-y-2.5 pt-1">
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email"
                className="w-full rounded-[6px] border border-black/15 bg-white px-3 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
              />
              <button
                type="submit"
                disabled={busy !== null || !ageOk}
                className={`${btn} bg-[#0E0E0E] text-white hover:bg-black`}
                style={{ fontFamily: LABEL }}
              >
                {busy === 'email' ? 'Sending…' : 'Email me a sign-in link'}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEmailOpen(true)}
              disabled={busy !== null}
              className="w-full py-2 text-center text-[11px] uppercase tracking-[0.14em] text-[#6B6862] hover:text-[#0E0E0E]"
              style={{ fontFamily: LABEL }}
            >
              Continue with email
              {lastUsed === 'email' && <LastUsed />}
            </button>
          )}
        </div>

        {invite !== 'saved' &&
          (codeOpen ? (
            <form onSubmit={applyCode} className="mt-6 space-y-2.5">
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeError(null);
                }}
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={24}
                placeholder="AU7K-2QX9"
                aria-label="Early-access code"
                className="w-full rounded-[6px] border border-black/15 bg-white px-3 py-3 text-center text-[15px] tracking-[0.14em] focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
              />
              {codeError && (
                <p className="text-center text-[13px] text-[#6B6862]" role="alert">
                  {codeError}
                </p>
              )}
              <button
                type="submit"
                disabled={!code.trim()}
                className={`${btn} border border-black/15 bg-white hover:border-[#0047FF]`}
                style={{ fontFamily: LABEL }}
              >
                Use code
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCodeOpen(true)}
              className="mt-4 w-full py-2 text-center text-[11px] uppercase tracking-[0.14em] text-[#6B6862] hover:text-[#0E0E0E]"
              style={{ fontFamily: LABEL }}
            >
              Have an early-access code?
            </button>
          ))}

      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import Wordmark from '@/components/Wordmark';

// Optional since 2026-10-22: old X-only accounts can add a backup login
// (Google, or email + password). Reached from the dashboard's nudge; "Skip
// for now" goes straight back. Every path lands on the dashboard.

const DISPLAY = "'Helvetica Custom', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const LABEL = "'VCR OSD Mono', 'JetBrains Mono', monospace";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

interface MigrateAccountClientProps {
  userId: string;
  xUsername: string | null;
  currentEmail: string | null;
  name: string | null;
}

function friendly(message: string): string {
  if (/manual linking/i.test(message))
    return 'Google backup isn’t switched on yet. Use email + password for now.';
  if (/password/i.test(message) && /short|least|weak/i.test(message))
    return 'Use at least 8 characters for your password.';
  if (/rate limit|too many/i.test(message)) return 'Too many tries. Wait a minute and try again.';
  return 'Something went wrong. Try again.';
}

export default function MigrateAccountClient({
  xUsername,
  currentEmail,
  name,
}: MigrateAccountClientProps) {
  const [step, setStep] = useState<'choose' | 'email' | 'done'>('choose');
  const [email, setEmail] = useState(currentEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const callback = () => `${window.location.origin}/api/auth/callback?next=/dashboard`;

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const changing = !currentEmail || email.trim().toLowerCase() !== currentEmail.toLowerCase();
      const { error: updateError } = await supabase.auth.updateUser(
        changing ? { email: email.trim(), password } : { password },
        { emailRedirectTo: callback() }
      );
      if (updateError) throw updateError;
      // The backup login is set (a new email still needs its confirmation tap).
      await fetch('/api/auth/complete-migration', { method: 'POST' });
      setConfirmSent(changing);
      setStep('done');
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : ''));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLink() {
    setLoading(true);
    setError(null);
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: callback() },
    });
    if (linkError) {
      setError(friendly(linkError.message));
      setLoading(false);
    }
  }

  const btn =
    'w-full flex items-center justify-center gap-2 rounded-[6px] px-4 py-3.5 text-[12px] uppercase tracking-[0.14em] transition-colors disabled:opacity-60';
  const input =
    'w-full rounded-[6px] border border-black/15 bg-white px-3 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0047FF]';

  return (
    <main className="min-h-screen bg-[#F2EFE8] text-[#0E0E0E] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center">
          <Wordmark height={28} />
        </div>

        {step === 'done' ? (
          <div className="mt-10 text-center">
            <h1
              className="text-[34px] leading-[1.05]"
              style={{ fontFamily: DISPLAY, fontWeight: 500 }}
            >
              You&apos;re all set
            </h1>
            <p className="mt-3 text-[15px] leading-[1.55] text-[#333]">
              {confirmSent ? (
                <>
                  We sent a confirmation link to <strong>{email}</strong>. Tap it to finish; it
                  brings you back to your dashboard.
                </>
              ) : (
                'Your backup login is saved. You can sign in with X or your email from now on.'
              )}
            </p>
            <Link
              href="/dashboard"
              className={`${btn} mt-8 bg-[#0047FF] text-white hover:bg-[#0035CC]`}
              style={{ fontFamily: LABEL }}
            >
              Go to my dashboard →
            </Link>
          </div>
        ) : (
          <>
            <h1
              className="mt-10 text-center text-[34px] leading-[1.05]"
              style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.03em' }}
            >
              Add a backup login
            </h1>
            <p className="mt-3 text-center text-[15px] leading-[1.55] text-[#333]">
              {name ? `${name.split(' ')[0]}, add` : 'Add'} a second way to sign in so you never get
              locked out. Your X{xUsername ? ` (@${xUsername})` : ''} stays connected.
            </p>

            {error && (
              <div
                className="mt-6 rounded-[6px] border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            {step === 'choose' ? (
              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLink}
                  disabled={loading}
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
                  Add Google
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  disabled={loading}
                  className={`${btn} bg-[#0E0E0E] text-white hover:bg-black`}
                  style={{ fontFamily: LABEL }}
                >
                  Add email + password
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailPassword} className="mt-8 space-y-3">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email"
                  className={input}
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (8+ characters)"
                  aria-label="Password"
                  className={input}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`${btn} bg-[#0047FF] text-white hover:bg-[#0035CC]`}
                  style={{ fontFamily: LABEL }}
                >
                  {loading ? 'Saving…' : 'Save backup login'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="w-full py-1 text-center text-[11px] uppercase tracking-[0.14em] text-[#6B6862] hover:text-[#0E0E0E]"
                  style={{ fontFamily: LABEL }}
                >
                  ← Back
                </button>
              </form>
            )}

            <Link
              href="/dashboard"
              className="mt-8 block text-center text-[11px] uppercase tracking-[0.14em] text-[#6B6862] hover:text-[#0E0E0E]"
              style={{ fontFamily: LABEL }}
            >
              Skip for now → dashboard
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { TOS_VERSION } from '@/lib/tos';
import Wordmark from '@/components/Wordmark';

// Brand tokens (2026-10-13): Helvetica display, VCR OSD Mono labels/buttons.
const DISPLAY = "'Helvetica Custom', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY = DISPLAY;
const LABEL = "'VCR OSD Mono', 'JetBrains Mono', monospace";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type AuthMethod = 'choose' | 'email';

export default function SignupPage() {
  const [method, setMethod] = useState<AuthMethod>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);

  const searchParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const ref = searchParams.get('ref');
  const rawNext = searchParams.get('next');
  // Only allow same-origin relative paths to prevent open-redirect.
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/home';
  // tos param rides the callback URL so the acknowledgment survives OAuth
  // redirects AND the email-confirmation link; the callback persists it.
  const callbackUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}&tos=${encodeURIComponent(TOS_VERSION)}`
      : '';

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setCheckEmail(true);
  }

  async function handleGoogleSignup() {
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  async function handleAppleSignup() {
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  async function handleXSignup() {
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-[#F2EFE8] text-[#0E0E0E] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="flex justify-center">
            <Wordmark height={30} />
          </div>
          <h1
            className="text-[32px] leading-tight"
            style={{ fontFamily: DISPLAY, fontWeight: 500 }}
          >
            Check your email
          </h1>
          <p className="text-[#6B6862] text-sm">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
            account, then connect your X handle from the dashboard.
          </p>
          <p className="text-[#6B6862] text-xs">
            Didn&apos;t get it? Check spam, or try again in a minute.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2EFE8] text-[#0E0E0E] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8" style={{ fontFamily: BODY }}>
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Wordmark height={34} />
          </div>
          <h1
            className="text-[32px] leading-tight tracking-tight"
            style={{ fontFamily: DISPLAY, fontWeight: 500 }}
          >
            Create your BrandOS account
          </h1>
          <p className="mt-2 text-[#6B6862] text-sm">
            Sign up, connect your X account, scan your brand.
          </p>
          {ref && <p className="mt-1 text-xs text-[#0047FF]">Invited via referral link</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="flex items-start gap-3 p-3 border border-black/10 bg-white/60 rounded-[8px] cursor-pointer hover:border-[#0047FF] transition-colors">
          <input
            type="checkbox"
            checked={tosAccepted}
            onChange={(e) => setTosAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#0047FF] cursor-pointer"
          />
          <span className="text-xs text-[#6B6862]">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="underline hover:text-[#0047FF]">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="underline hover:text-[#0047FF]">
              Privacy Policy
            </a>
            .
          </span>
        </label>

        {method === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignup}
              disabled={loading || !tosAccepted}
              className="w-full py-3 px-4 bg-white border border-black/15 text-[11px] uppercase tracking-[0.14em] rounded-[6px] hover:border-[#0047FF] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ fontFamily: LABEL }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              Continue with Google
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span
                  className="bg-[#F2EFE8] px-4 text-[10px] uppercase tracking-[0.14em] text-[#6B6862]"
                  style={{ fontFamily: LABEL }}
                >
                  or
                </span>
              </div>
            </div>

            <button
              onClick={() => setMethod('email')}
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0047FF] text-white text-[11px] uppercase tracking-[0.14em] rounded-[6px] hover:bg-[#0035CC] transition-colors disabled:opacity-50"
              style={{ fontFamily: LABEL }}
            >
              Sign up with email
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span
                  className="bg-[#F2EFE8] px-4 text-[10px] uppercase tracking-[0.14em] text-[#6B6862]"
                  style={{ fontFamily: LABEL }}
                >
                  already have X connected?
                </span>
              </div>
            </div>

            <button
              onClick={handleXSignup}
              disabled={loading || !tosAccepted}
              className="w-full py-3 px-4 bg-[#0E0E0E] text-white text-[11px] uppercase tracking-[0.14em] rounded-[6px] hover:bg-black transition-colors disabled:opacity-50"
              style={{ fontFamily: LABEL }}
            >
              Sign in with X (existing users)
            </button>
          </div>
        )}

        {method === 'email' && (
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label
                className="block mb-1 text-[10px] uppercase tracking-[0.14em] text-[#6B6862]"
                style={{ fontFamily: LABEL }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-black/15 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                className="block mb-1 text-[10px] uppercase tracking-[0.14em] text-[#6B6862]"
                style={{ fontFamily: LABEL }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 bg-white border border-black/15 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#0047FF]"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !tosAccepted}
              className="w-full py-3 px-4 bg-[#0047FF] text-white text-[11px] uppercase tracking-[0.14em] rounded-[6px] hover:bg-[#0035CC] transition-colors disabled:opacity-50"
              style={{ fontFamily: LABEL }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <button
              type="button"
              onClick={() => setMethod('choose')}
              className="w-full py-2 text-sm text-[#6B6862] hover:text-[#0E0E0E]"
            >
              Back to all options
            </button>
          </form>
        )}

        {!tosAccepted && (
          <p className="text-center text-xs text-[#6B6862]">Accept the terms above to continue.</p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface MigrateAccountClientProps {
  userId: string;
  xUsername: string | null;
  currentEmail: string | null;
  name: string | null;
}

export default function MigrateAccountClient({
  xUsername,
  currentEmail,
  name,
}: MigrateAccountClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<'choose' | 'email' | 'verifying' | 'done'>('choose');
  const [email, setEmail] = useState(currentEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (currentEmail && email === currentEmail) {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;

        await fetch('/api/auth/complete-migration', { method: 'POST' });
        setStep('done');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        const { error: updateError } = await supabase.auth.updateUser({
          email,
          password,
        });
        if (updateError) throw updateError;

        setStep('verifying');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLink() {
    setLoading(true);
    setError(null);
    try {
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      });
      if (linkError) throw linkError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google link failed');
      setLoading(false);
    }
  }

  async function handleAppleLink() {
    setLoading(true);
    setError(null);
    try {
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      });
      if (linkError) throw linkError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apple link failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            BrandOS leveled up
          </h1>
          <p className="mt-3 text-gray-600 text-sm leading-relaxed">
            Hey {name || `@${xUsername}`} — we&apos;ve added secure login methods.
            Add a primary credential to keep your account safe.
          </p>
          <p className="mt-1 text-gray-400 text-xs">
            Your X connection {xUsername ? `(@${xUsername})` : ''} stays linked.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setStep('email')}
              disabled={loading}
              className="w-full py-3 px-4 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Set up email + password
            </button>

            <button
              onClick={handleGoogleLink}
              disabled={loading}
              className="w-full py-3 px-4 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="you@example.com"
              />
              {currentEmail && (
                <p className="text-xs text-gray-400 mt-1">
                  Pre-filled from your X account. Change if needed.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save credentials'}
            </button>
            <button
              type="button"
              onClick={() => setStep('choose')}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Back
            </button>
          </form>
        )}

        {step === 'verifying' && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">
              Check your inbox for a verification email at <strong>{email}</strong>.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Once verified, come back and you&apos;ll be redirected to your dashboard.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-8">
            <p className="text-sm text-green-600 font-medium">
              Account secured. Redirecting to dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

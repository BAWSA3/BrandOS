'use client';

import { useState } from 'react';

interface MigrateAccountClientProps {
  userId: string;
  xUsername: string;
  currentEmail: string | null;
  name: string | null;
}

/**
 * Client component for the account migration flow.
 *
 * Legacy X-OAuth users must add a primary credential:
 * - Email + password
 * - Google OAuth
 * - Apple OAuth
 *
 * After completing migration, accountMigrationStatus updates to 'completed'
 * and user is redirected to /dashboard.
 *
 * TODO (Phase 1 follow-up):
 * - Wire up Supabase Auth email/password signup form
 * - Wire up Supabase Auth Google + Apple OAuth linkIdentity
 * - Email verification flow if email not already verified
 * - Handle edge case: user's X OAuth email conflicts with existing account
 */
export default function MigrateAccountClient({
  xUsername,
  currentEmail,
  name,
}: MigrateAccountClientProps) {
  const [step, setStep] = useState<'choose' | 'email' | 'verifying' | 'done'>('choose');

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
            Your X connection (@{xUsername}) stays linked.
          </p>
        </div>

        {step === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setStep('email')}
              className="w-full py-3 px-4 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Set up email + password
            </button>

            <button
              disabled
              className="w-full py-3 px-4 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
            >
              Continue with Google (coming soon)
            </button>

            <button
              disabled
              className="w-full py-3 px-4 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
            >
              Continue with Apple (coming soon)
            </button>
          </div>
        )}

        {step === 'email' && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setStep('verifying');
              // TODO: call Supabase Auth to set email + password
              // supabase.auth.updateUser({ email, password })
              // then update accountMigrationStatus via API
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                defaultValue={currentEmail || ''}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Save credentials
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
              Check your inbox for a verification email.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Once verified, you&apos;ll be redirected to your dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

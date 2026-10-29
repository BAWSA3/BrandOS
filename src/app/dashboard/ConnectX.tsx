'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Wordmark from '@/components/Wordmark';

const DISPLAY = "'Helvetica Custom', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const LABEL = "'VCR OSD Mono', var(--font-jetbrains), monospace";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

/**
 * Signed up with Google or email: one step left. Linking X attaches it to this
 * account; the auth callback then connects it and the dashboard fills in from
 * their homepage scan (or scans once).
 */
export default function ConnectX({ name }: { name: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.linkIdentity({
      provider: 'twitter',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard` },
    });
    if (e) {
      setError(
        /manual linking/i.test(e.message)
          ? 'Connecting X isn’t switched on yet. Sign out and continue with X instead.'
          : 'Couldn’t open X. Try again.'
      );
      setBusy(false);
    }
  };

  const signOutToX = async () => {
    await supabase.auth.signOut().catch(() => {});
    window.location.href = '/signup?next=/dashboard';
  };

  return (
    <main className="min-h-screen bg-[#F2EFE8] text-[#0E0E0E] flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        <div className="flex justify-center">
          <Wordmark height={28} />
        </div>
        <div
          className="mt-10 text-center text-[11px] uppercase tracking-[0.16em] text-[#0047FF]"
          style={{ fontFamily: LABEL }}
        >
          One step left
        </div>
        <h1
          className="mt-3 text-center text-[36px] leading-[1.02]"
          style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.03em' }}
        >
          Connect your X{name ? `, ${name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-3 text-center text-[15px] leading-[1.55] text-[#333]">
          BrandOS reads your public X posts to score your brand and track what&apos;s working. It
          never posts for you.
        </p>
        {error && (
          <div
            className="mt-6 rounded-[6px] border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={connect}
          disabled={busy}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#0047FF] px-4 py-3.5 text-[12px] uppercase tracking-[0.14em] text-white hover:bg-[#0035CC] disabled:opacity-60"
          style={{ fontFamily: LABEL }}
        >
          <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {busy ? 'Opening X…' : 'Connect X'}
        </button>
        <button
          type="button"
          onClick={signOutToX}
          className="mt-4 w-full text-center text-[11px] uppercase tracking-[0.14em] text-[#6B6862] hover:text-[#0E0E0E]"
          style={{ fontFamily: LABEL }}
        >
          Or sign out and continue with X
        </button>
      </div>
    </main>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * "Is this you? Claim it with X" on an unclaimed /station page.
 *
 * Claiming needs a signed-in user whose verified X connection matches the
 * handle (checked server-side in /api/stations/claim). Not signed in -> go
 * through Sign in with X and come back with ?claim=1, which retries the claim
 * automatically.
 */
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

export default function ClaimStation({ handle }: { handle: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<'idle' | 'claiming' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const auto = useRef(false);

  const signInUrl = `/signup?next=${encodeURIComponent(`/station/${handle}?claim=1`)}`;

  const claim = useCallback(async () => {
    setState('claiming');
    setMessage('');
    try {
      const res = await fetch('/api/stations/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = signInUrl;
        return;
      }
      if (!res.ok) {
        setState('error');
        setMessage(
          res.status === 429 ? 'Too many tries. Wait a minute.' : data.error || 'Could not claim.'
        );
        return;
      }
      router.replace(`/station/${handle}`);
      router.refresh();
    } catch {
      setState('error');
      setMessage('Could not claim right now.');
    }
  }, [handle, router, signInUrl]);

  useEffect(() => {
    if (params.get('claim') === '1' && !auto.current) {
      auto.current = true;
      queueMicrotask(claim);
    }
  }, [params, claim]);

  return (
    <div
      className="mt-4 w-full max-w-[480px] rounded-[8px] border border-black/10 bg-white/60 px-4 py-4 text-center"
      style={{ fontFamily: MONO }}
    >
      <div className="text-[11px] tracking-[0.15em] uppercase text-[#6E6E73]">
        Unclaimed · Is this you, @{handle}?
      </div>
      <button
        onClick={claim}
        disabled={state === 'claiming'}
        className="mt-3 w-full px-4 py-3 rounded-[6px] bg-[#1A1A1A] hover:bg-black text-white text-[12px] tracking-[0.15em] uppercase transition-colors disabled:opacity-50"
      >
        {state === 'claiming' ? 'Claiming...' : 'Claim it with X'}
      </button>
      {message && (
        <div className="mt-2 text-[11px] leading-relaxed text-[#FF3B30]">
          {message}{' '}
          {/sign in/i.test(message) && (
            <a href={signInUrl} className="underline text-[#0A84FF]">
              Sign in with X
            </a>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import ReservedSignCard from './ReservedSignCard';

/**
 * "Reserve your brand station" — the post-scan email capture. Adds the email
 * to the existing EmailSignup list (or marks an existing subscriber as
 * reserved) via /api/reserve-station. Nothing is emailed at signup.
 */

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

interface ReserveStationProps {
  username: string;
  archetype: string;
}

export default function ReserveStation({ username, archetype }: ReserveStationProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [station, setStation] = useState<{
    number: number;
    handle: string;
    archetype: string | null;
    foundingPriority: boolean;
  } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setMessage('');
    try {
      const res = await fetch('/api/reserve-station', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, archetype }),
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
      // The server only returns the station when this email reserved with this
      // handle; otherwise it's a plain "reserved" (see /api/reserve-station).
      setStation(
        typeof data.number === 'number' && typeof data.handle === 'string'
          ? {
              number: data.number,
              handle: data.handle,
              archetype: typeof data.archetype === 'string' ? data.archetype : null,
              foundingPriority: !!data.foundingPriority,
            }
          : null
      );
      setState('done');
    } catch {
      setState('error');
      setMessage('Something went wrong. Try again.');
    }
  };

  if (state === 'done') {
    if (station) {
      return (
        <div className="w-full mt-6">
          <div
            className="mb-3 text-center text-[11px] tracking-[0.15em] text-black/50 uppercase"
            style={{ fontFamily: MONO }}
          >
            {'// your plot is claimed'}
          </div>
          <ReservedSignCard
            handle={station.handle}
            number={station.number}
            archetype={station.archetype}
            foundingPriority={station.foundingPriority}
            shareUrl={`${window.location.origin}/station/${station.handle}`}
          />
        </div>
      );
    }
    return (
      <div
        className="w-full max-w-[480px] mx-auto mt-4 rounded-[8px] border border-black/10 bg-white/60 px-4 py-4 text-center"
        style={{ fontFamily: MONO }}
      >
        <div className="text-[13px] tracking-wider text-[#1D1D1F]">RESERVED ✓</div>
        <div className="mt-1 text-[11px] tracking-wide text-[#6E6E73]">
          We&apos;ll email you when the studio opens Oct 20.
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="w-full max-w-[480px] mx-auto mt-4">
        <button
          onClick={() => setOpen(true)}
          className="w-full px-4 py-3.5 rounded-[6px] bg-[#0A84FF] hover:bg-[#0070E0] text-white text-[12px] tracking-[0.15em] uppercase transition-colors"
          style={{ fontFamily: MONO }}
        >
          Reserve your brand station →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-[480px] mx-auto mt-4">
      <div className="flex gap-2">
        <input
          type="email"
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email to reserve your brand station"
          className="min-w-0 flex-1 px-3 py-3 rounded-[6px] border border-black/15 bg-white text-[16px] text-[#1D1D1F] outline-none focus:border-[#0A84FF]"
          style={{ fontFamily: MONO }}
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="shrink-0 px-4 py-3 rounded-[6px] bg-[#0A84FF] hover:bg-[#0070E0] text-white text-[12px] tracking-[0.15em] uppercase transition-colors disabled:opacity-50"
          style={{ fontFamily: MONO }}
        >
          {state === 'sending' ? '...' : 'Reserve'}
        </button>
      </div>
      {message && (
        <div className="mt-2 text-[11px] text-[#FF3B30]" style={{ fontFamily: MONO }}>
          {message}
        </div>
      )}
    </form>
  );
}

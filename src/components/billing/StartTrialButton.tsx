'use client';

import { useState } from 'react';
import { TRIAL_DAYS } from '@/lib/plans';

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";

/**
 * Starts the card-required Pro trial: POST /api/stripe/checkout → Stripe
 * Checkout. Signed-out visitors go to sign-up first and come back here.
 */
export default function StartTrialButton({
  signedIn,
  label = `Start my ${TRIAL_DAYS}-day free trial`,
  next = '/pricing',
  className = '',
  signal = false,
}: {
  signedIn: boolean;
  label?: string;
  /** Where sign-up returns to. */
  next?: string;
  className?: string;
  /** Direction 03: the coral "this one" look (visual only; checkout is unchanged). */
  signal?: boolean;
}) {
  const [state, setState] = useState<{ busy: boolean; note?: string }>({ busy: false });

  const start = async () => {
    if (!signedIn) {
      window.location.href = `/signup?next=${encodeURIComponent(next)}`;
      return;
    }
    setState({ busy: true });
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'PRO' }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (body.url) {
        window.location.href = body.url;
        return;
      }
      setState({
        busy: false,
        note:
          res.status === 503
            ? 'Trials open soon. Check back shortly.'
            : (body.error ?? 'Something went wrong. Try again.'),
      });
    } catch {
      setState({ busy: false, note: 'Something went wrong. Try again.' });
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={start}
        disabled={state.busy}
        className={
          signal
            ? 'w-full bg-[#FF4B2B] px-5 py-4 text-[12px] uppercase tracking-[0.16em] text-[#0E0E0E] transition-transform active:scale-[.97] disabled:opacity-60'
            : 'w-full bg-[#0047FF] px-5 py-4 text-[12px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#0035CC] disabled:opacity-60'
        }
        style={{ fontFamily: MONO }}
      >
        {state.busy ? 'Opening checkout…' : `${label} →`}
      </button>
      {state.note && (
        <p
          className="mt-2 text-center text-[12px]"
          style={{ color: 'var(--d-muted, #6B6B6B)' }}
          role="status"
        >
          {state.note}
        </p>
      )}
    </div>
  );
}

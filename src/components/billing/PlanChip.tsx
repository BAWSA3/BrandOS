'use client';

import { useEffect, useState } from 'react';

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";

/**
 * Trial badge in the dashboard top bar: "Trial · 5 days left". Click opens
 * Stripe's billing portal (cancel / card / invoices).
 */
export default function PlanChip({
  trialEndsAt,
  onCanvas = false,
}: {
  trialEndsAt: string;
  onCanvas?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  // days left, computed after mount (the clock isn't read during render)
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const t = window.setTimeout(
      () =>
        setDays(
          Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))
        ),
      0
    );
    return () => window.clearTimeout(t);
  }, [trialEndsAt]);
  const open = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as { url?: string };
      if (body.url) window.location.href = body.url;
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      title={`Your trial ends ${new Date(trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Manage billing`}
      className="mr-1 border px-2 py-1 text-[10px] uppercase tracking-[0.14em] disabled:opacity-60"
      style={{
        fontFamily: MONO,
        borderColor: onCanvas ? 'var(--d-head-muted)' : 'var(--d-rule)',
        color: onCanvas ? 'var(--d-head)' : 'var(--d-muted)',
      }}
    >
      Trial
      {days === null
        ? ''
        : days === 0
          ? ' · ends today'
          : ` · ${days} day${days === 1 ? '' : 's'} left`}
    </button>
  );
}

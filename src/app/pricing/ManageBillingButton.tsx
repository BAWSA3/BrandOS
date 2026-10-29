'use client';

import { useState } from 'react';

const MONO = "'VCR OSD Mono', var(--font-jetbrains), monospace";

/** Opens Stripe's billing portal (cancel, card, invoices). */
export default function ManageBillingButton() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const open = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (body.url) {
        window.location.href = body.url;
        return;
      }
      setNote(body.error ?? 'Could not open billing. Try again.');
    } catch {
      setNote('Could not open billing. Try again.');
    }
    setBusy(false);
  };
  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="mt-3 w-full border border-[#0E0E0E] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[#0E0E0E] hover:bg-[#F2EFE8] disabled:opacity-60"
        style={{ fontFamily: MONO }}
      >
        {busy ? 'Opening…' : 'Manage billing · cancel anytime'}
      </button>
      {note && <p className="mt-2 text-[12px] text-[#6B6862]">{note}</p>}
    </>
  );
}

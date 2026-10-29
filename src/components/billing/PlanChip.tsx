'use client';

import { useEffect, useState } from 'react';
import { proPrice, renewalTerms } from '@/lib/billing-terms';

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";

/** What the dashboard top bar says about the account's plan. */
export type PlanBadge =
  /** Launch window, no card yet: "Free until Dec 3 · Lock $29 →" (opens checkout). */
  | { kind: 'open'; until: string; spotsLeft: number; priceLocked?: boolean }
  /** Card on file during the launch window: "Founding #12 · first charge Dec 3". */
  | { kind: 'founding'; number: number | null; chargesAt: string }
  /** Card trial after the launch window: "Trial · 5 days left". */
  | { kind: 'trial'; endsAt: string };

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * Plan badge in the dashboard top bar. The open-access badge starts the
 * Founding checkout; the others open Stripe's billing portal (cancel / card /
 * invoices).
 */
export default function PlanChip({
  plan,
  onCanvas = false,
  v2 = false,
}: {
  plan: PlanBadge;
  onCanvas?: boolean;
  /** Dashboard v2 shell: rounded, full width in the side nav, --v-* colours. */
  v2?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  // trial days left, computed after mount (the clock isn't read during render)
  const [days, setDays] = useState<number | null>(null);
  const endsAt = plan.kind === 'trial' ? plan.endsAt : null;
  useEffect(() => {
    if (!endsAt) return;
    const t = window.setTimeout(
      () => setDays(Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000))),
      0
    );
    return () => window.clearTimeout(t);
  }, [endsAt]);

  const go = async () => {
    // The renewal terms must sit beside the subscribe button. The v2 side nav
    // shows them under the chip; the compact top-bar chip has no room, so it
    // goes to /pricing, where they sit next to the button.
    if (plan.kind === 'open' && !v2) {
      window.location.href = '/pricing';
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        plan.kind === 'open' ? '/api/stripe/checkout' : '/api/stripe/portal',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: plan.kind === 'open' ? JSON.stringify({ tier: 'PRO' }) : undefined,
        }
      );
      const body = (await res.json().catch(() => ({}))) as { url?: string };
      if (body.url) window.location.href = body.url;
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  };

  const label =
    plan.kind === 'open'
      ? plan.spotsLeft > 0
        ? `Free until ${shortDate(plan.until)} · Lock $29 for life →`
        : `Free until ${shortDate(plan.until)} · Keep Pro →`
      : plan.kind === 'founding'
        ? `${plan.number ? `Founding #${plan.number}` : 'Pro'} · first charge ${shortDate(plan.chargesAt)}`
        : `Trial${days === null ? '' : days === 0 ? ' · ends today' : ` · ${days} day${days === 1 ? '' : 's'} left`}`;
  const title =
    plan.kind === 'open'
      ? plan.spotsLeft > 0
        ? `${plan.spotsLeft} of 100 founding spots left: add a card to keep $29/mo for life. Nothing is charged until ${shortDate(plan.until)}.`
        : `Add a card to keep Pro after ${shortDate(plan.until)}.`
      : plan.kind === 'founding'
        ? `Nothing is charged until ${shortDate(plan.chargesAt)}. Manage billing`
        : `Your trial ends ${shortDate(plan.endsAt)}. Manage billing`;
  const accent = plan.kind === 'open';

  const terms =
    plan.kind === 'open' && v2
      ? renewalTerms(proPrice(plan.priceLocked ?? plan.spotsLeft > 0), {
          kind: 'on',
          date: shortDate(plan.until),
        })
      : null;

  const chip = (
    <button
      type="button"
      onClick={go}
      disabled={busy}
      title={title}
      className={
        v2
          ? 'v2-focus v2-press min-h-[40px] px-3 py-2 text-left text-[13px] leading-snug disabled:opacity-60'
          : 'mr-1 border px-2 py-1 text-[10px] uppercase tracking-[0.14em] disabled:opacity-60'
      }
      style={
        v2
          ? {
              borderRadius: 12,
              background: accent ? '#0047FF' : 'transparent',
              color: accent ? '#FFFFFF' : 'var(--v-head-muted)',
              boxShadow: accent ? 'none' : 'inset 0 0 0 1px var(--v-dot)',
            }
          : {
              fontFamily: MONO,
              borderColor: accent ? '#0047FF' : onCanvas ? 'var(--d-head-muted)' : 'var(--d-rule)',
              background: accent ? '#0047FF' : 'transparent',
              color: accent ? '#FFFFFF' : onCanvas ? 'var(--d-head)' : 'var(--d-muted)',
            }
      }
    >
      {busy ? (plan.kind === 'open' ? 'Opening checkout…' : 'Opening…') : label}
    </button>
  );
  if (!terms) return chip;
  return (
    <div className="flex flex-col gap-1.5">
      {chip}
      <p className="px-1 text-[11px] leading-snug" style={{ color: 'var(--v-head-muted)' }}>
        {terms}
      </p>
    </div>
  );
}

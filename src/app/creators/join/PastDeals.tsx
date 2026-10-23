'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import { BRAND_MAX, monthOf, type DealView } from '@/lib/index-deal-rules';

// "Worked with a brand before?" Optional, after joining the Creator Index
// (migration 046). Deals stay private to the member until the brand confirms
// them. Renders nothing when the member hasn't joined or the API is closed.
// The headline motion is a logged deal sliding into the list.

const MONO = DASH_FONTS.mono;
const C = {
  panel: '#FAF8F3',
  ink: '#0E0E0E',
  muted: '#6B6862',
  rule: 'rgba(14,14,14,0.12)',
  blue: '#0047FF',
  error: '#B42318',
};

const EMPTY = { brand: '', brandHandle: '', month: '', postUrl: '' };

const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export default function PastDeals() {
  const reduce = useReducedMotion();
  const [state, setState] = useState<{ deals: DealView[]; max: number } | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/index/deals')
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (b?.member) setState({ deals: b.deals ?? [], max: b.max ?? 10 });
      })
      .catch(() => {});
  }, []);

  if (!state) return null;
  const full = state.deals.length >= state.max;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/index/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.deal) {
        setError(body.error ?? 'That didn’t save. Try again.');
        return;
      }
      setState((s) => (s ? { ...s, deals: [body.deal, ...s.deals] } : s));
      setForm(EMPTY);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch('/api/index/deals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    if (res?.ok) setState((s) => (s ? { ...s, deals: s.deals.filter((d) => d.id !== id) } : s));
  }

  const field = 'mt-2 w-full border px-4 py-3 text-[15px] outline-none';
  const fieldStyle = { borderColor: C.rule, color: C.ink, background: C.panel };
  const label = 'text-[10px] uppercase tracking-[0.18em]';

  return (
    <section className="mt-12 border-t pt-8" style={{ borderColor: C.rule }}>
      <div className={label} style={{ fontFamily: MONO, color: C.muted }}>
        Optional · your track record
      </div>
      <h2
        className="mt-3 text-[24px] leading-tight md:text-[28px]"
        style={{ letterSpacing: '-0.02em' }}
      >
        Worked with a brand before?
      </h2>
      <p className="mt-2 max-w-[560px] text-[15px] leading-relaxed" style={{ color: C.muted }}>
        Log it here. It stays private to you. Next, the brand can confirm it, and confirmed deals
        show on your entry.
      </p>

      {state.deals.length > 0 && (
        <ul className="mt-6 divide-y border-y" style={{ borderColor: C.rule }}>
          <AnimatePresence initial={false}>
            {state.deals.map((d) => (
              <motion.li
                key={d.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="flex items-baseline justify-between gap-4 py-3"
                style={{ borderColor: C.rule }}
              >
                <div className="min-w-0">
                  <span className="text-[16px]">{d.brand}</span>
                  {d.brandHandle && (
                    <span className="ml-2 text-[13px]" style={{ color: C.muted }}>
                      @{d.brandHandle}
                    </span>
                  )}
                  <div className={`mt-1 ${label}`} style={{ fontFamily: MONO, color: C.muted }}>
                    {[
                      d.month && monthLabel(d.month),
                      d.confirmed ? 'Confirmed' : 'Not confirmed yet',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    {d.postUrl && (
                      <>
                        {' · '}
                        <a
                          href={d.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: C.blue }}
                        >
                          Post
                        </a>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  className="shrink-0 text-[11px] uppercase tracking-[0.14em] hover:underline"
                  style={{ fontFamily: MONO, color: C.muted }}
                  aria-label={`Remove ${d.brand}`}
                >
                  Remove
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {full ? (
        <p className="mt-6 text-[14px]" style={{ color: C.muted }}>
          That’s {state.max}, the most you can log.
        </p>
      ) : (
        <form onSubmit={add} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={label} style={{ fontFamily: MONO, color: C.muted }}>
              Brand
            </span>
            <input
              required
              maxLength={BRAND_MAX}
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="e.g. Phantom"
              className={field}
              style={fieldStyle}
            />
          </label>
          <label className="block">
            <span className={label} style={{ fontFamily: MONO, color: C.muted }}>
              Their X handle (optional)
            </span>
            <input
              maxLength={16}
              value={form.brandHandle}
              onChange={(e) => setForm({ ...form, brandHandle: e.target.value })}
              placeholder="@phantom"
              className={field}
              style={fieldStyle}
            />
          </label>
          <label className="block">
            <span className={label} style={{ fontFamily: MONO, color: C.muted }}>
              When (optional)
            </span>
            <input
              type="month"
              min="2015-01"
              max={monthOf(new Date())}
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              className={field}
              style={fieldStyle}
            />
          </label>
          <label className="block">
            <span className={label} style={{ fontFamily: MONO, color: C.muted }}>
              Link to the post (optional)
            </span>
            <input
              inputMode="url"
              value={form.postUrl}
              onChange={(e) => setForm({ ...form, postUrl: e.target.value })}
              placeholder="https://x.com/you/status/…"
              className={field}
              style={fieldStyle}
            />
          </label>
          {error && (
            <p className="text-[14px] md:col-span-2" style={{ color: C.error }}>
              {error}
            </p>
          )}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy || !form.brand.trim()}
              className="px-6 py-3.5 text-[12px] uppercase tracking-[0.14em] text-white disabled:opacity-60"
              style={{ fontFamily: MONO, background: C.blue }}
            >
              {busy ? 'Saving…' : 'Log this deal'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

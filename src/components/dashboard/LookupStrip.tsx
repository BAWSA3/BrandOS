'use client';

import { useEffect, useState } from 'react';
import { AnimateNumber } from 'motion-plus/react';

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BIG = "var(--dash-big, 'Inter Tight', sans-serif)";

export interface LookupSummary {
  week: { total: number; page: number; mcp: number; compare: number };
  today: number;
}

/**
 * "Looked up": how often the creator's brand was checked this week (public
 * page views, Claude/ChatGPT lookups, compares). Counts only, never who.
 * Empty state nudges them to share their page.
 */
export default function LookupStrip({ handle, data }: { handle: string; data: LookupSummary }) {
  const [shown, setShown] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(data.week.total), 300);
    return () => window.clearTimeout(t);
  }, [data.week.total]);
  const url = `mybrandos.app/@${handle}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked: the link is visible to copy by hand
    }
  };
  const parts = [
    data.week.page ? `${data.week.page} on your page` : null,
    data.week.mcp ? `${data.week.mcp} in Claude / ChatGPT` : null,
    data.week.compare ? `${data.week.compare} compare${data.week.compare === 1 ? '' : 's'}` : null,
  ].filter(Boolean) as string[];

  return (
    <section
      className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 border px-5 py-4"
      style={{ background: 'var(--d-tile)', borderColor: 'var(--d-rule)', color: 'var(--d-ink)' }}
      aria-label="How often your brand was looked up"
    >
      <div className="flex items-baseline gap-3">
        <span
          className="text-[40px] leading-none"
          style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.04em' }}
        >
          <AnimateNumber>{shown}</AnimateNumber>
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, color: 'var(--d-muted)' }}
        >
          Brand lookups · 7 days
        </span>
      </div>
      <div
        className="min-w-0 basis-full text-[13px] sm:flex-1 sm:basis-auto"
        style={{ color: 'var(--d-muted)' }}
      >
        {data.week.total > 0 ? (
          <>
            {parts.join(' · ')}
            {data.today > 0 && (
              <span
                className="ml-2 inline-block whitespace-nowrap border px-1.5 py-[1px] text-[10px] uppercase tracking-[0.14em]"
                style={{ fontFamily: MONO, borderColor: 'var(--d-rule)', color: 'var(--d-ink)' }}
              >
                +{data.today} today
              </span>
            )}
          </>
        ) : (
          'No lookups yet this week. Share your page so brands can find you.'
        )}
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 text-[10px] uppercase tracking-[0.14em] hover:underline"
        style={{ fontFamily: MONO, color: '#0047FF' }}
      >
        {copied ? 'Link copied ✓' : `${url} · copy ↗`}
      </button>
    </section>
  );
}

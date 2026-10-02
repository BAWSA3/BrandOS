'use client';

import Link from 'next/link';
import { useBrandStore, useHasHydrated } from '@/lib/store';
import { useBrandHydration, brandHasContent } from '@/hooks/useBrandHydration';
import ContentCalendar from '@/components/calendar/ContentCalendar';
import { MONO } from '@/components/dashboard/terminal-ui';

// Content Calendar page (consolidation step 6). The week grid + backlog need
// more width than the dashboard's single column, so the calendar lives on its
// own route under the same world shell.

export default function CalendarPageClient() {
  // Same readiness gate as the dashboard: persisted store + server hydration,
  // so the calendar never renders against a stale local brand id.
  const storeReady = useHasHydrated();
  const { isHydrated } = useBrandHydration();
  const { brands } = useBrandStore();

  const ready = storeReady && isHydrated;
  const hasBrand = brands.some(brandHasContent);

  return (
    <div className="min-h-screen p-6" style={{ color: 'var(--text-primary)' }}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <Link
            href="/dashboard"
            className="inline-block transition-opacity hover:opacity-70"
            style={{ fontFamily: MONO, fontSize: 12, color: 'var(--text-tertiary)' }}
          >
            ← cd /dashboard
          </Link>
          <h1
            className="mt-2"
            style={{ fontFamily: MONO, fontSize: 18, color: 'var(--text-primary)' }}
          >
            $ brand.calendar()
          </h1>
        </header>

        {!ready ? (
          <div className="flex items-center justify-center py-24">
            <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--text-tertiary)' }}>
              hydrating brand data...
            </span>
          </div>
        ) : !hasBrand ? (
          <div
            className="rounded-lg border p-10 text-center"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          >
            <p
              className="mb-4"
              style={{ fontFamily: MONO, fontSize: 13, color: 'var(--text-secondary)' }}
            >
              // no brand DNA found — the calendar plans content against your brand
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-5 py-2.5 text-sm transition-all hover:opacity-80"
              style={{
                fontFamily: MONO,
                letterSpacing: '0.08em',
                border: '1px solid var(--accent)',
                backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                color: 'var(--accent)',
                borderRadius: 2,
              }}
            >
              [ RUN brand.init() ]
            </Link>
          </div>
        ) : (
          <ContentCalendar />
        )}
      </div>
    </div>
  );
}

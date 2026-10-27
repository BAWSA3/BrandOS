'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import Wordmark from '@/components/Wordmark';
import { wordmarkFor, type Colorway } from '@/lib/colorways';
import { V_TOKENS } from './tokens';
import { DISPLAY, V2_CSS } from './ui';

/**
 * Dashboard v2 shell (behind DASHBOARD_V2): a quiet rail on desktop, a top bar
 * and thumb-reach tabs on phones, the member's finish as the ground. Each
 * slice adds its place here: Today, the Playbook (home; the calmed growth
 * view, "brand", opens from it until the ⌘K Brand view lands) and Write (the
 * copywriter, which no longer hides).
 */

export type V2Place = 'today' | 'playbook' | 'brand';

export interface StandingMini {
  level: number;
  /** progress into the level, 0–1 */
  progress: number;
  run: number;
}

export default function Shell({
  finish,
  place,
  brandId,
  standing,
  children,
}: {
  finish: Colorway;
  place: V2Place;
  /** the brand in view (kept across places), null = the member's default */
  brandId: string | null;
  standing: StandingMini | null;
  children: ReactNode;
}) {
  const q = brandId ? `brand=${encodeURIComponent(brandId)}` : '';
  const NAV: { place: V2Place | 'write'; name: string; href: string }[] = [
    { place: 'today', name: 'Today', href: `/dashboard${q ? `?${q}` : ''}` },
    { place: 'playbook', name: 'Playbook', href: `/dashboard?view=playbook${q ? `&${q}` : ''}` },
    { place: 'write', name: 'Write', href: '/dashboard/write' },
  ];

  return (
    <div
      data-finish={finish}
      className="min-h-screen"
      style={{
        ...(V_TOKENS[finish] as React.CSSProperties),
        background: 'var(--v-canvas)',
        color: 'var(--v-head)',
        fontFamily: DISPLAY,
      }}
    >
      <style>{V2_CSS}</style>
      <div className="md:flex">
        <nav
          aria-label="Dashboard"
          className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col px-5 pb-6 pt-7 md:flex"
          style={{ boxShadow: '1px 0 0 var(--v-dot)' }}
        >
          <Wordmark height={18} mode={wordmarkFor(finish)} href="/dashboard" />
          <ul className="mt-10 space-y-1">
            {NAV.map((n) => {
              const on = n.place === place || (n.place === 'playbook' && place === 'brand');
              return (
                <li key={n.place}>
                  <Link
                    href={n.href}
                    aria-current={on ? 'page' : undefined}
                    className="v2-focus v2-press flex h-[40px] items-center px-3 text-[15px]"
                    style={{
                      borderRadius: 12,
                      color: on ? 'var(--v-head)' : 'var(--v-head-muted)',
                      background: on ? 'var(--v-dot)' : 'transparent',
                    }}
                  >
                    {n.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex-1" />
          {standing && <StandingRail s={standing} />}
        </nav>

        <main className="min-w-0 flex-1 pb-[92px] md:pb-0">
          <div className="flex h-[56px] items-center justify-between px-4 md:hidden">
            <Wordmark height={15} mode={wordmarkFor(finish)} href="/dashboard" />
            {standing && (
              <span
                className="flex h-[36px] items-center px-3 text-[13px]"
                style={{ borderRadius: 999, boxShadow: 'inset 0 0 0 1px var(--v-dot)' }}
              >
                Level {standing.level}
                <span style={{ color: 'var(--v-head-muted)' }}>&nbsp;· {standing.run}d</span>
              </span>
            )}
          </div>
          {children}
        </main>
      </div>

      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 md:hidden"
        style={{ background: 'var(--v-canvas)', boxShadow: '0 -1px 0 var(--v-dot)' }}
      >
        {NAV.map((n) => {
          const on = n.place === place || (n.place === 'playbook' && place === 'brand');
          return (
            <Link
              key={n.place}
              href={n.href}
              aria-current={on ? 'page' : undefined}
              className="v2-focus flex h-[52px] flex-col items-center justify-center gap-1 text-[13px]"
              style={{ color: on ? 'var(--v-head)' : 'var(--v-head-muted)' }}
            >
              <span
                aria-hidden
                className="h-[5px] w-[5px]"
                style={{ borderRadius: 99, background: on ? 'var(--v-head)' : 'transparent' }}
              />
              {n.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function StandingRail({ s }: { s: StandingMini }) {
  return (
    <div aria-label={`Level ${s.level}, ${s.run}-day run`}>
      <div className="flex items-baseline justify-between text-[13px]">
        <span>Level {s.level}</span>
        <span style={{ color: 'var(--v-head-muted)' }}>
          {s.run > 0 ? `${s.run}-day run` : 'Run starts today'}
        </span>
      </div>
      <div
        className="mt-2 h-[4px] overflow-hidden"
        style={{ background: 'var(--v-dot)', borderRadius: 99 }}
      >
        <div
          className="h-full"
          style={{
            width: `${Math.round(Math.max(0.02, Math.min(1, s.progress)) * 100)}%`,
            background: 'var(--v-head)',
            borderRadius: 99,
          }}
        />
      </div>
    </div>
  );
}

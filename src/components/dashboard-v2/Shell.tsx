'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Wordmark from '@/components/Wordmark';
import {
  COLORWAYS,
  saveColorwayToAccount,
  wordmarkFor,
  writeLocalColorway,
  type Colorway,
} from '@/lib/colorways';
import CommandBar, { type Command } from './CommandBar';
import { V_TOKENS } from './tokens';
import { DISPLAY, V2_CSS, VCR } from './ui';

/**
 * Dashboard v2 shell (behind DASHBOARD_V2): a quiet rail on desktop, a top bar
 * and thumb-reach tabs on phones, the member's finish as the ground. Places:
 * Today, the Playbook (home) and Write (the copywriter). Everything secondary
 * (the Brand view with competitors and audience, the calendar, import,
 * brands, re-read, finishes) lives in ⌘K: Ctrl/⌘+K on desktop, the centre tab
 * on phones. `g` then t/p/w/b jumps, Linear-style.
 */

export type V2Place = 'today' | 'playbook' | 'brand';

export interface StandingMini {
  level: number;
  /** progress into the level, 0–1 */
  progress: number;
  run: number;
}

export default function Shell({
  finish: initialFinish,
  place,
  brandId,
  brands = [],
  standing,
  preview = false,
  focus = false,
  children,
}: {
  finish: Colorway;
  place: V2Place;
  /** the brand in view (kept across places), null = the member's default */
  brandId: string | null;
  /** the workspace's brands, for ⌘K (first = the member's own) */
  brands?: { id: string; handle: string; kind: string }[];
  standing: StandingMini | null;
  /** sample-data harness: no saves, no syncs */
  preview?: boolean;
  /** the writing room: no rail, no tabs, one way back (to the Playbook) */
  focus?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [finish, setFinish] = useState(initialFinish);
  const [cmd, setCmd] = useState(false);
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const g = useRef(false);

  const q = brandId ? `brand=${encodeURIComponent(brandId)}` : '';
  const href = useMemo(
    () => ({
      today: `/dashboard${q ? `?${q}` : ''}`,
      playbook: `/dashboard?view=playbook${q ? `&${q}` : ''}`,
      brand: `/dashboard?view=brand${q ? `&${q}` : ''}`,
      write: '/dashboard/write',
    }),
    [q]
  );
  const NAV: { place: V2Place | 'write'; name: string; href: string }[] = [
    { place: 'today', name: 'Today', href: href.today },
    { place: 'playbook', name: 'Playbook', href: href.playbook },
    { place: 'write', name: 'Write', href: href.write },
  ];
  const isOn = (p: V2Place | 'write') => p === place || (p === 'playbook' && place === 'brand');

  const say = useCallback((msg: string) => setToast({ id: Date.now(), msg }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const pickFinish = useCallback(
    async (c: Colorway) => {
      const before = finish;
      setFinish(c); // optimistic: the ground changes at once
      writeLocalColorway(c);
      const name = COLORWAYS.find((x) => x.id === c)?.name ?? c;
      if (preview) return say(`${name} finish.`);
      const ok = await saveColorwayToAccount(c);
      if (!ok) {
        setFinish(before);
        return say("Couldn't save the finish. Try again.");
      }
      say(`${name} finish, saved to your account.`);
      router.refresh(); // server-rendered parts (the brand view) pick it up
    },
    [finish, preview, router, say]
  );

  const own = brands[0];
  const current = brands.find((b) => b.id === brandId) ?? own;
  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => router.push(to);
    const viewOf = place === 'today' ? '' : `view=${place}&`;
    const list: Command[] = [
      { id: 'write', group: 'Make', label: 'Write a post', hint: 'G W', run: go(href.write) },
      {
        id: 'article',
        group: 'Make',
        label: 'Write an article',
        run: go(`${href.write}?mode=article`),
      },
      { id: 'score', group: 'Make', label: 'Score a draft', run: go(href.write) },
      { id: 'idea', group: 'Make', label: 'New idea on the board', run: go(`${href.brand}#ideas`) },
      { id: 'today', group: 'Go to', label: "Today's move", hint: 'G T', run: go(href.today) },
      { id: 'playbook', group: 'Go to', label: 'Playbook', hint: 'G P', run: go(href.playbook) },
      {
        id: 'brand',
        group: 'Go to',
        label: 'Brand view: growth, competitors, audience',
        hint: 'G B',
        run: go(href.brand),
      },
      { id: 'calendar', group: 'Go to', label: 'Calendar', run: go('/dashboard/calendar') },
      { id: 'import', group: 'Go to', label: 'Import', run: go('/dashboard/import') },
    ];
    for (const b of brands) {
      list.push({
        id: `brand-${b.id}`,
        group: 'Brands',
        label: `@${b.handle}`,
        hint: b.id === current?.id ? 'In view' : b.kind === 'brand' ? 'Brand' : 'Creator',
        run: go(`/dashboard?${viewOf}brand=${encodeURIComponent(b.id)}`),
      });
    }
    if (current) {
      list.push({
        id: 'reread',
        group: 'Brands',
        label: `Re-read @${current.handle} from X`,
        run: async () => {
          if (preview) return say(`Re-reading @${current.handle}…`);
          say(`Re-reading @${current.handle}…`);
          const res = await fetch(`/api/accounts/${encodeURIComponent(current.id)}/sync`, {
            method: 'POST',
          }).catch(() => null);
          if (!res?.ok) return say("Couldn't re-read just now. Try again in a minute.");
          say(`@${current.handle} is up to date.`);
          router.refresh();
        },
      });
    }
    list.push({ id: 'add', group: 'Brands', label: 'Add a brand', run: go(href.brand) });
    for (const c of COLORWAYS) {
      list.push({
        id: `finish-${c.id}`,
        group: 'Finish',
        label: `${c.name} finish`,
        hint: c.id === finish ? 'Current' : c.hint,
        swatch: c.id,
        run: () => void pickFinish(c.id),
      });
    }
    return list;
  }, [brands, current, finish, href, pickFinish, place, preview, router, say]);

  // ⌘K anywhere; "g" then a letter jumps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmd((v) => !v);
        return;
      }
      const t = e.target as HTMLElement | null;
      if (cmd || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (g.current) {
        g.current = false;
        const to = { t: href.today, p: href.playbook, w: href.write, b: href.brand }[e.key];
        if (to) router.push(to);
        return;
      }
      if (e.key === 'g') {
        g.current = true;
        window.setTimeout(() => (g.current = false), 900);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cmd, href, router]);

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
          className={`sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col px-5 pb-6 pt-7 ${focus ? '' : 'md:flex'}`}
          style={{ boxShadow: '1px 0 0 var(--v-dot)' }}
        >
          <Wordmark height={18} mode={wordmarkFor(finish)} href="/dashboard" />
          <ul className="mt-10 space-y-1">
            {NAV.map((n) => {
              const on = isOn(n.place);
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
          <button
            type="button"
            onClick={() => setCmd(true)}
            className="v2-focus v2-press mt-5 flex h-[40px] w-full items-center justify-between px-3 text-[13px]"
            style={{
              borderRadius: 12,
              boxShadow: 'inset 0 0 0 1px var(--v-dot)',
              color: 'var(--v-head-muted)',
            }}
          >
            Do anything
            <kbd
              className="inline-flex h-[20px] items-center px-1.5 text-[10px]"
              style={{
                fontFamily: VCR,
                borderRadius: 5,
                boxShadow: 'inset 0 0 0 1px currentColor',
                opacity: 0.8,
              }}
            >
              ⌘K
            </kbd>
          </button>
        </nav>

        <main className={`min-w-0 flex-1 ${focus ? '' : 'pb-[96px] md:pb-0'}`}>
          {focus ? (
            <div className="flex h-[56px] items-center justify-between px-3 md:px-8">
              <Link
                href={href.playbook}
                className="v2-focus v2-press flex min-h-[44px] items-center px-3 text-[14px]"
                style={{ borderRadius: 999, color: 'var(--v-head-muted)' }}
              >
                ← Playbook
              </Link>
              <button
                type="button"
                onClick={() => setCmd(true)}
                aria-label="Do anything"
                className="v2-focus v2-press flex min-h-[44px] items-center gap-2 px-3 text-[13px]"
                style={{
                  borderRadius: 999,
                  boxShadow: 'inset 0 0 0 1px var(--v-dot)',
                  color: 'var(--v-head-muted)',
                }}
              >
                <span style={{ fontFamily: VCR }}>⌘K</span>
              </button>
            </div>
          ) : (
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
          )}
          {children}
        </main>
      </div>

      <nav
        aria-label="Dashboard"
        className={`fixed inset-x-0 bottom-0 z-30 grid-cols-4 items-center px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 md:hidden ${focus ? 'hidden' : 'grid'}`}
        style={{ background: 'var(--v-canvas)', boxShadow: '0 -1px 0 var(--v-dot)' }}
      >
        {[NAV[0], NAV[1], null, NAV[2]].map((n) =>
          n ? (
            <Link
              key={n.place}
              href={n.href}
              aria-current={isOn(n.place) ? 'page' : undefined}
              className="v2-focus flex h-[52px] flex-col items-center justify-center gap-1 text-[13px]"
              style={{ color: isOn(n.place) ? 'var(--v-head)' : 'var(--v-head-muted)' }}
            >
              <span
                aria-hidden
                className="h-[5px] w-[5px]"
                style={{
                  borderRadius: 99,
                  background: isOn(n.place) ? 'var(--v-head)' : 'transparent',
                }}
              />
              {n.name}
            </Link>
          ) : (
            <div key="cmd" className="flex justify-center">
              <motion.button
                type="button"
                onClick={() => setCmd(true)}
                whileTap={reduce ? undefined : { scale: 0.94 }}
                aria-label="Do anything: brands, competitors, calendar, finishes"
                className="v2-focus flex h-[52px] w-[52px] items-center justify-center text-[20px]"
                style={{ borderRadius: 999, background: 'var(--v-cta)', color: 'var(--v-cta-ink)' }}
              >
                ⌘
              </motion.button>
            </div>
          )
        )}
      </nav>

      <CommandBar
        key={cmd ? 'open' : 'shut'}
        open={cmd}
        onClose={() => setCmd(false)}
        commands={commands}
      />

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[96px] z-[90] flex justify-center px-4 md:bottom-6"
      >
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: 4 }}
              transition={{ duration: 0.16 }}
              className="flex min-h-[44px] items-center px-5 text-[14px]"
              style={{
                background: 'var(--v-ink)',
                color: 'var(--v-surface)',
                borderRadius: 999,
                boxShadow: 'var(--v-shadow)',
              }}
            >
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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

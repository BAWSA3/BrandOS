'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import Wordmark from '@/components/Wordmark';
import { COLORWAYS, wordmarkFor, type Colorway } from '@/lib/colorways';
import { SCREENS, type Initial } from './initial';
import { V2, type Ctx } from './context';
import { BRANDS, RECORD, type Persona, type Screen } from './sample';
import { V_TOKENS } from './tokens';
import { DISPLAY, Kbd, VCR } from './ui';
import Today from './Today';
import Playbook from './Playbook';
import Canvas from './Canvas';
import Writing from './Writing';
import Frameworks from './Frameworks';
import Standing from './Standing';
import Press from './Press';
import CommandBar from './CommandBar';

/**
 * Dashboard v2: clickable mockup (Phase 1, for approval; sample data only,
 * no network). URL state so every screen can be linked and screenshotted:
 *   ?s=today|playbook|canvas|write|framework|standing|press
 *   &c=bone|night|klein|paper   finish
 *   &first=1                    first open: "which one are you?"
 *   &k=1                        command bar open
 *   &chrome=0                   hide the mockup bar (for screenshots)
 */

const NAV: { s: Screen; name: string; note?: string }[] = [
  { s: 'today', name: 'Today' },
  { s: 'playbook', name: 'Playbook' },
  { s: 'canvas', name: 'Canvas', note: '2 half-built' },
  { s: 'write', name: 'Writing room' },
  { s: 'framework', name: 'Frameworks' },
];

function StandingMini({ onClick }: { onClick: () => void }) {
  const s = RECORD.standing;
  return (
    <button
      type="button"
      onClick={onClick}
      className="v2-focus w-full text-left"
      aria-label={`Level ${s.level}, ${s.run}-day run. Open Standing`}
    >
      <div
        className="flex items-baseline justify-between text-[13px]"
        style={{ color: 'var(--v-head)' }}
      >
        <span>Level {s.level}</span>
        <span style={{ color: 'var(--v-head-muted)' }}>{s.run}-day run</span>
      </div>
      <div
        className="mt-2 h-[4px] overflow-hidden"
        style={{ background: 'var(--v-dot)', borderRadius: 99 }}
      >
        <div
          className="h-full"
          style={{
            width: `${(s.into / s.need) * 100}%`,
            background: 'var(--v-head)',
            borderRadius: 99,
          }}
        />
      </div>
    </button>
  );
}

export default function DashboardV2({ initial }: { initial: Initial }) {
  const reduce = useReducedMotion();
  const [screen, setScreen] = useState<Screen>(initial.s);
  const [finish, setFinishState] = useState<Colorway>(initial.c);
  const [persona, setPersonaState] = useState<Persona | null>(initial.first ? null : 'creator');
  const [brand, setBrand] = useState(BRANDS[0].handle);
  const [cmd, setCmd] = useState(initial.k);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [toastMsg, setToast] = useState<{ id: number; msg: string; undo?: () => void } | null>(
    null
  );
  const [earned, setEarned] = useState(0);
  const [first] = useState(initial.first);
  const gPending = useRef(false);

  // keep the URL in step (shareable screens), without a navigation
  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set('s', screen);
    u.searchParams.set('c', finish);
    if (cmd) u.searchParams.set('k', '1');
    else u.searchParams.delete('k');
    window.history.replaceState(null, '', u.toString());
  }, [screen, finish, cmd]);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    setBrandsOpen(false);
    window.scrollTo({ top: 0 });
  }, []);
  const toast = useCallback((msg: string, undo?: () => void) => {
    setToast({ id: Date.now(), msg, undo });
  }, []);
  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // ⌘K anywhere; "g" then a letter jumps (Linear-style)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmd((v) => !v);
        return;
      }
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, [contenteditable=true]') || cmd) return;
      if (gPending.current) {
        gPending.current = false;
        const map: Record<string, Screen> = {
          t: 'today',
          p: 'playbook',
          c: 'canvas',
          w: 'write',
          f: 'framework',
          r: 'press',
        };
        if (map[e.key]) go(map[e.key]);
        return;
      }
      if (e.key === 'g') {
        gPending.current = true;
        window.setTimeout(() => (gPending.current = false), 900);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cmd, go]);

  const ctx = useMemo<Ctx>(
    () => ({
      screen,
      go,
      persona,
      setPersona: setPersonaState,
      finish,
      setFinish: (c) => {
        setFinishState(c);
        toast(`${COLORWAYS.find((x) => x.id === c)?.name} finish. Saved to your account.`);
      },
      brand,
      setBrand,
      openCommand: () => setCmd(true),
      toast,
      earned,
      earn: (xp) => setEarned((v) => v + xp),
    }),
    [brand, earned, finish, go, persona, screen, toast]
  );

  const focusRoom = screen === 'write';
  const body = {
    today: <Today firstRun={first} />,
    playbook: <Playbook />,
    canvas: <Canvas />,
    write: <Writing />,
    framework: <Frameworks />,
    standing: <Standing />,
    press: <Press />,
  }[screen];

  return (
    <V2.Provider value={ctx}>
      <MotionConfig reducedMotion="user">
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
          <style>{`
            .v2-focus:focus-visible { outline: 2px solid var(--v-focus); outline-offset: 2px; }
            [data-finish] ::selection { background: var(--v-signal); color: var(--v-on-signal); }
          `}</style>

          {initial.chrome && (
            <div
              data-mock-chrome
              className="flex items-center gap-3 overflow-x-auto whitespace-nowrap px-4 py-2 text-[11px]"
              style={{
                background: '#0E0E0E',
                color: '#E7E7E4',
                fontFamily: VCR,
                letterSpacing: '0.1em',
              }}
            >
              <span style={{ color: '#9A9A95' }}>MOCKUP / SAMPLE DATA</span>
              {SCREENS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => go(s)}
                  className="v2-focus uppercase"
                  style={{ color: s === screen ? '#7C9DFF' : '#E7E7E4' }}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={() => (window.location.href = `?s=today&c=${finish}&first=1`)}
                className="v2-focus uppercase"
              >
                first run
              </button>
              <button type="button" onClick={() => setCmd(true)} className="v2-focus">
                ⌘K
              </button>
              <span style={{ color: '#9A9A95' }}>/</span>
              {COLORWAYS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFinishState(c.id)}
                  className="v2-focus uppercase"
                  style={{ color: c.id === finish ? '#7C9DFF' : '#E7E7E4' }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <div className="md:flex">
            {/* Desktop rail (hidden in the writing room: one idea, nothing else) */}
            {!focusRoom && (
              <nav
                aria-label="Dashboard"
                className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col px-5 pb-6 pt-7 md:flex"
                style={{ boxShadow: '1px 0 0 var(--v-dot)' }}
              >
                <Wordmark height={18} mode={wordmarkFor(finish)} href={null} />
                <div className="relative mt-7">
                  <button
                    type="button"
                    onClick={() => setBrandsOpen((v) => !v)}
                    aria-expanded={brandsOpen}
                    className="v2-focus flex h-[40px] w-full items-center justify-between px-3 text-[14px]"
                    style={{
                      borderRadius: 12,
                      background: 'var(--v-surface)',
                      color: 'var(--v-ink)',
                      boxShadow: 'inset 0 0 0 1px var(--v-rule)',
                    }}
                  >
                    @{brand}
                    <span aria-hidden style={{ color: 'var(--v-muted)' }}>
                      ▾
                    </span>
                  </button>
                  {brandsOpen && (
                    <div
                      className="absolute inset-x-0 top-[44px] z-30 p-1"
                      style={{
                        background: 'var(--v-surface)',
                        borderRadius: 12,
                        boxShadow: 'var(--v-shadow), inset 0 0 0 1px var(--v-rule)',
                      }}
                    >
                      {BRANDS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setBrand(b.handle);
                            setBrandsOpen(false);
                          }}
                          className="v2-focus flex h-[38px] w-full items-center justify-between px-3 text-[14px]"
                          style={{
                            borderRadius: 9,
                            color: 'var(--v-ink)',
                            background: b.handle === brand ? 'var(--v-soft)' : 'transparent',
                          }}
                        >
                          @{b.handle}
                          <span className="text-[11px]" style={{ color: 'var(--v-muted)' }}>
                            {b.kind}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <ul className="mt-8 space-y-1">
                  {NAV.map((n) => {
                    const on = screen === n.s;
                    return (
                      <li key={n.s}>
                        <button
                          type="button"
                          onClick={() => go(n.s)}
                          aria-current={on ? 'page' : undefined}
                          className="v2-focus relative flex h-[40px] w-full items-center justify-between px-3 text-left text-[15px]"
                          style={{
                            borderRadius: 12,
                            color: on ? 'var(--v-head)' : 'var(--v-head-muted)',
                          }}
                        >
                          {on && (
                            <motion.span
                              layoutId="rail-on"
                              className="absolute inset-0"
                              style={{ borderRadius: 12, background: 'var(--v-dot)' }}
                              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                            />
                          )}
                          <span className="relative">{n.name}</span>
                          {n.note && (
                            <span
                              className="relative text-[11px]"
                              style={{ color: 'var(--v-head-muted)' }}
                            >
                              {n.note}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex-1" />
                <StandingMini onClick={() => go('standing')} />
                <button
                  type="button"
                  onClick={() => setCmd(true)}
                  className="v2-focus mt-5 flex h-[40px] w-full items-center justify-between px-3 text-[13px]"
                  style={{
                    borderRadius: 12,
                    boxShadow: 'inset 0 0 0 1px var(--v-dot)',
                    color: 'var(--v-head-muted)',
                  }}
                >
                  Do anything
                  <Kbd>⌘K</Kbd>
                </button>
              </nav>
            )}

            <main className={`min-w-0 flex-1 ${focusRoom ? '' : 'pb-[96px] md:pb-0'}`}>
              {/* Phone top bar */}
              {!focusRoom && (
                <div className="flex h-[56px] items-center justify-between px-4 md:hidden">
                  <Wordmark height={15} mode={wordmarkFor(finish)} href={null} />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCmd(true)}
                      className="v2-focus flex h-[44px] items-center px-3 text-[13px]"
                      style={{
                        borderRadius: 999,
                        background: 'var(--v-surface)',
                        color: 'var(--v-ink)',
                        boxShadow: 'inset 0 0 0 1px var(--v-rule)',
                      }}
                    >
                      @{brand} ▾
                    </button>
                    <button
                      type="button"
                      onClick={() => go('standing')}
                      aria-label={`Level ${RECORD.standing.level}`}
                      className="v2-focus flex h-[44px] min-w-[44px] items-center justify-center text-[13px]"
                      style={{
                        borderRadius: 999,
                        boxShadow: 'inset 0 0 0 1px var(--v-dot)',
                        color: 'var(--v-head)',
                        fontFamily: VCR,
                      }}
                    >
                      L{RECORD.standing.level}
                    </button>
                  </div>
                </div>
              )}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={screen}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                  {body}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Phone tabs: four places + the command button in the thumb's reach */}
          {!focusRoom && (
            <nav
              aria-label="Dashboard"
              className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-center px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 md:hidden"
              style={{ background: 'var(--v-canvas)', boxShadow: '0 -1px 0 var(--v-dot)' }}
            >
              {(
                [
                  ['today', 'Today'],
                  ['playbook', 'Playbook'],
                  ['cmd', ''],
                  ['canvas', 'Canvas'],
                  ['write', 'Write'],
                ] as const
              ).map(([s, name]) =>
                s === 'cmd' ? (
                  <div key="cmd" className="flex justify-center">
                    <motion.button
                      type="button"
                      onClick={() => setCmd(true)}
                      whileTap={reduce ? undefined : { scale: 0.94 }}
                      aria-label="Command bar: new idea, workspaces, brands, finish"
                      className="v2-focus flex h-[56px] w-[56px] items-center justify-center text-[20px]"
                      style={{
                        borderRadius: 999,
                        background: 'var(--v-cta)',
                        color: 'var(--v-cta-ink)',
                      }}
                    >
                      +
                    </motion.button>
                  </div>
                ) : (
                  <button
                    key={s}
                    type="button"
                    onClick={() => go(s)}
                    aria-current={screen === s ? 'page' : undefined}
                    className="v2-focus flex h-[52px] flex-col items-center justify-center gap-1 text-[12px]"
                    style={{ color: screen === s ? 'var(--v-head)' : 'var(--v-head-muted)' }}
                  >
                    <span
                      aria-hidden
                      className="h-[5px] w-[5px]"
                      style={{
                        borderRadius: 99,
                        background: screen === s ? 'var(--v-head)' : 'transparent',
                      }}
                    />
                    {name}
                  </button>
                )
              )}
            </nav>
          )}

          <CommandBar key={cmd ? 'open' : 'shut'} open={cmd} onClose={() => setCmd(false)} />

          {/* Quiet confirmation + undo (no confirm dialogs) */}
          <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-[96px] z-[90] flex justify-center px-4 md:bottom-6"
          >
            <AnimatePresence>
              {toastMsg && (
                <motion.div
                  key={toastMsg.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: 4 }}
                  transition={{ duration: 0.16 }}
                  className="pointer-events-auto flex min-h-[48px] items-center gap-4 px-5 text-[14px]"
                  style={{
                    background: 'var(--v-ink)',
                    color: 'var(--v-surface)',
                    borderRadius: 999,
                    boxShadow: 'var(--v-shadow)',
                  }}
                >
                  {toastMsg.msg}
                  {toastMsg.undo && (
                    <button
                      type="button"
                      className="v2-focus underline underline-offset-2"
                      onClick={() => {
                        toastMsg.undo?.();
                        setToast(null);
                      }}
                    >
                      Undo
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </MotionConfig>
    </V2.Provider>
  );
}

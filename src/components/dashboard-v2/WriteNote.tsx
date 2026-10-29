'use client';

import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { WRITE_NOTES, WRITE_NOTE_SEEN_KEY } from '@/lib/walkthrough';
import { Btn, Label, Panel, VCR } from './ui';

/**
 * How Write works, once: shown above the live composer the first time a member
 * opens Write, unless the walkthrough's last step already showed it. Same four
 * lines as that step (WRITE_NOTES). "Got it" hides it for good on this device.
 * The server snapshot says "seen", so nothing flashes before hydration.
 */

const listeners = new Set<() => void>();
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function readSeen(): boolean {
  try {
    return window.localStorage.getItem(WRITE_NOTE_SEEN_KEY) !== null;
  } catch {
    return true; // storage blocked: don't nag every visit
  }
}
function markSeen() {
  try {
    window.localStorage.setItem(WRITE_NOTE_SEEN_KEY, '1');
  } catch {
    // storage blocked: hidden for this tab only
  }
  listeners.forEach((l) => l());
}

export default function WriteNote({ forceShow = false }: { forceShow?: boolean }) {
  const reduce = useReducedMotion();
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);
  const show = forceShow || !seen;
  return (
    <AnimatePresence initial={!reduce}>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -6 }}
          transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <Panel className="mt-6 p-5 md:mt-8 md:p-6" style={{ borderRadius: 20 }}>
            <div role="note" aria-label="How Write works">
              <Label tone="head-muted">How Write works</Label>
              <ol className="mt-3 space-y-2 text-[15px] leading-[1.5]">
                {WRITE_NOTES.map((n) => (
                  <li key={n.mark} className="flex items-start">
                    <span
                      className="mr-2 mt-[2px] inline-flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[11px]"
                      style={{
                        background: 'var(--v-signal)',
                        color: 'var(--v-on-signal)',
                        fontFamily: VCR,
                      }}
                      aria-hidden
                    >
                      {n.mark}
                    </span>
                    <span style={{ color: 'var(--v-head)' }}>{n.text}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4">
                <Btn kind="primary" onClick={markSeen}>
                  Got it
                </Btn>
              </div>
            </div>
          </Panel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { RoomFormat } from '@/lib/article';

/** Writing-room parts shared by the post/thread room and Article mode. */

const FORMATS: [RoomFormat, string][] = [
  ['x-post', 'Post'],
  ['thread', 'Thread'],
  ['article', 'Article'],
];

/** Post / Thread / Article: one calm room, three shapes. */
export function FormatSwitch({
  value,
  onChange,
}: {
  value: RoomFormat;
  onChange: (f: RoomFormat) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Format">
      {FORMATS.map(([id, name]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className="v2-focus min-h-[36px] px-3 text-[13px]"
          style={{
            borderRadius: 999,
            color: value === id ? 'var(--v-ink)' : 'var(--v-muted)',
            boxShadow: value === id ? 'inset 0 0 0 1px var(--v-ink)' : 'none',
          }}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

/** The reading beside the words (desktop) or as a sheet that peeks (phone). */
export function ReadingDock({
  side,
  peek,
  phone = true,
  children,
}: {
  side: boolean;
  /** the phone peek bar's text */
  peek: React.ReactNode;
  /** show the phone peek bar + sheet (off while there is nothing to read) */
  phone?: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const [sheet, setSheet] = useState(false);
  return (
    <>
      {side && (
        <aside
          className="sticky top-6 hidden h-fit w-[330px] shrink-0 p-6 md:mt-10 md:block"
          style={{
            background: 'var(--v-surface)',
            color: 'var(--v-ink)',
            borderRadius: 20,
            boxShadow: 'inset 0 0 0 1px var(--v-rule)',
          }}
        >
          {children}
        </aside>
      )}
      {phone && (
        <div className="contents md:hidden">
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="v2-focus fixed inset-x-0 bottom-0 z-30 flex min-h-[64px] items-center justify-between px-5"
            style={{
              background: 'var(--v-surface)',
              color: 'var(--v-ink)',
              boxShadow: '0 -1px 0 var(--v-rule)',
              borderRadius: '20px 20px 0 0',
            }}
          >
            <span className="text-[15px]">{peek}</span>
            <span aria-hidden style={{ color: 'var(--v-muted)' }}>
              ↑
            </span>
          </button>
          <AnimatePresence>
            {sheet && (
              <>
                <motion.div
                  key="scrim"
                  className="fixed inset-0 z-40"
                  style={{ background: 'var(--v-scrim)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSheet(false)}
                />
                <motion.div
                  key="sheet"
                  role="dialog"
                  aria-label="BrandOS reading"
                  className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto p-5 pb-8"
                  style={{
                    background: 'var(--v-surface)',
                    color: 'var(--v-ink)',
                    borderRadius: '22px 22px 0 0',
                  }}
                  initial={reduce ? false : { y: '100%' }}
                  animate={{ y: 0 }}
                  exit={reduce ? undefined : { y: '100%' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                >
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setSheet(false)}
                    className="v2-focus mx-auto mb-4 block h-[24px] w-[64px]"
                  >
                    <span
                      className="mx-auto block h-1 w-10"
                      style={{ background: 'var(--v-rule)', borderRadius: 4 }}
                    />
                  </button>
                  {children}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

/** A quiet confirmation that clears itself. */
export function useNote() {
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(null), 3500);
    return () => window.clearTimeout(t);
  }, [note]);
  const reduce = useReducedMotion();
  const view = (
    <AnimatePresence>
      {note && (
        <motion.div
          role="status"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0 }}
          className="fixed inset-x-0 bottom-[84px] z-[60] mx-auto w-fit max-w-[92vw] px-5 py-3 text-center text-[14px] md:bottom-6"
          style={{ background: 'var(--v-ink)', color: 'var(--v-surface)', borderRadius: 999 }}
        >
          {note}
        </motion.div>
      )}
    </AnimatePresence>
  );
  return { setNote, view };
}

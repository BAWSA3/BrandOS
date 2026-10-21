'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import ColorwayPicker from '@/components/settings/ColorwayPicker';
import { saveColorwayToAccount, writeLocalColorway, type Colorway } from '@/lib/colorways';
import { isSoundOn, onSoundSetting, setSoundOn } from '@/lib/ui-sounds';

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BLUE = '#0047FF';

/**
 * The dashboard's Settings button + panel (top bar): colorway (applies
 * instantly, saved to the account when `save`) and sound. Same settings as
 * the title screen's Settings.
 */
export default function DashSettings({
  colorway,
  onColorway,
  save,
  onCanvas = false,
}: {
  /** The button sits on the page canvas (v2 masthead), not in a tile. */
  onCanvas?: boolean;
  colorway: Colorway;
  onColorway: (c: Colorway) => void;
  /** Signed in: save the colorway to the account (previews: this device only). */
  save: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  // Panel is fixed to the viewport under the button, kept inside a 16px gutter.
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 0, right: 16 });
  const toggle = () => {
    const r = btn.current?.getBoundingClientRect();
    if (r) {
      const vw = window.innerWidth;
      const w = Math.min(340, vw - 32);
      setPos({ top: r.bottom + 10, right: Math.min(Math.max(16, vw - r.right), vw - w - 16) });
    }
    setOpen((o) => !o);
  };
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = window.setTimeout(() => setSound(isSoundOn()), 0);
    const off = onSoundSetting(setSound);
    return () => {
      window.clearTimeout(t);
      off();
    };
  }, []);

  // close on outside press / Escape
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const close = () => setOpen(false);
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const pick = (c: Colorway) => {
    if (c === colorway) return;
    onColorway(c);
    writeLocalColorway(c);
    setNote(null);
    if (save) saveColorwayToAccount(c).then((ok) => setNote(ok ? null : 'Not saved, try again'));
  };

  return (
    <div ref={box} className="relative mr-3">
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="border px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
        style={{
          borderColor: onCanvas ? 'var(--d-head-muted)' : open ? BLUE : 'var(--d-rule)',
          color: onCanvas ? 'var(--d-head)' : open ? BLUE : 'var(--d-muted)',
          fontFamily: MONO,
        }}
      >
        ⚙ Settings
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Settings"
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[70] w-[min(340px,calc(100vw-2rem))] border p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
            style={{
              top: pos.top,
              right: pos.right,
              background: 'var(--d-tile)',
              borderColor: 'var(--d-rule)',
              color: 'var(--d-ink)',
              fontFamily: MONO,
            }}
          >
            <div
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ color: 'var(--d-muted)' }}
            >
              Settings
            </div>
            <div className="mt-4 text-[12px] uppercase tracking-[0.1em]">Dashboard</div>
            <div className="mt-2">
              <ColorwayPicker
                value={colorway}
                onPick={pick}
                rule="var(--d-rule)"
                muted="var(--d-muted)"
              />
            </div>
            {note && (
              <div
                className="mt-1 text-right text-[10px] uppercase tracking-[0.1em]"
                style={{ color: 'var(--d-muted)' }}
              >
                {note}
              </div>
            )}
            <div className="mt-5 flex items-center justify-between text-[12px] uppercase tracking-[0.1em]">
              <span>Sound</span>
              <button
                type="button"
                onClick={() => setSoundOn(!sound)}
                aria-pressed={sound}
                style={{ color: BLUE }}
              >
                {sound ? 'On' : 'Off'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

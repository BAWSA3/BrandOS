'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { captureNode } from '@/lib/capture-node';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import type { BrandPassData } from '@/components/dashboard/BrandPass';

// "Share ↗" on the Brand Pass tile: download the pass as a PNG, post it to X,
// copy the brand page link, or (phones) the native share sheet with the image.
// The pass is found in the tile by [data-pass-card]. Remote avatars are
// swapped for same-origin copies (/api/image-proxy) while capturing, or the
// export would come out with a blank portrait.

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BLUE = '#0047FF';

/** Width the pass is exported at, whatever size it is on screen. */
const EXPORT_W = 440;

const capture = (card: HTMLElement) => captureNode(card, EXPORT_W);

export default function PassShare({ pass }: { pass: BrandPassData }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const link =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/@${encodeURIComponent(pass.handle)}`;
  const name = getArchetypeInfo(pass.archetype)?.name ?? pass.archetype;
  const file = `brandos-pass-${pass.handle}.png`;

  useEffect(() => {
    setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);
  // close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const flash = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(null), 2200);
  };
  const card = () =>
    root.current?.closest('section')?.querySelector<HTMLElement>('[data-pass-card]') ?? null;

  const download = async () => {
    const el = card();
    if (!el || busy) return;
    setBusy(true);
    try {
      const blob = await capture(el);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file;
      a.click();
      URL.revokeObjectURL(a.href);
      flash('Downloaded ✓');
    } catch (e) {
      console.error('[pass-share] export failed', e);
      flash('Download failed');
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const postToX = () => {
    const text = `my brand pass on BrandOS\n\n${name} · ${pass.score}/100\n\nsee the full read →`;
    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOpen(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      flash('Link copied ✓');
    } catch {
      flash(link);
    }
    setOpen(false);
  };

  const native = async () => {
    const el = card();
    if (!el || busy) return;
    setBusy(true);
    try {
      const blob = await capture(el);
      const f = new File([blob], file, { type: 'image/png' });
      const payload: ShareData = {
        title: 'My Brand Pass',
        text: `${name} · ${pass.score}/100`,
        url: link,
      };
      if (navigator.canShare?.({ files: [f] })) payload.files = [f];
      await navigator.share(payload);
    } catch {
      // cancelled or unsupported: nothing to report
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const items: { label: string; hint: string; run: () => void }[] = [
    { label: 'Download image', hint: 'PNG', run: download },
    { label: 'Post on X', hint: '↗', run: postToX },
    { label: 'Copy link', hint: '⧉', run: copy },
    ...(canNative ? [{ label: 'Share…', hint: '⇪', run: native }] : []),
  ];

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="uppercase hover:underline"
        style={{ color: note ? BLUE : undefined }}
      >
        {busy ? 'Exporting…' : (note ?? 'Share ↗')}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-20 w-[210px] border"
            style={{
              background: 'var(--d-tile)',
              borderColor: 'var(--d-rule)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
            }}
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: reduce ? 0 : 0.14 }}
          >
            {items.map((it) => (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                onClick={it.run}
                disabled={busy}
                className="flex w-full items-center justify-between border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-[#0047FF] hover:text-white disabled:opacity-50"
                style={{ borderColor: 'var(--d-rule)', fontFamily: MONO }}
              >
                <span className="text-[11px] uppercase tracking-[0.12em]">{it.label}</span>
                <span className="text-[11px] opacity-70">{it.hint}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

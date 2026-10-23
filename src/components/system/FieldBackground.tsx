'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { clouds, paintField, FIELD } from '@/lib/field/dither';
import { FIELD_DENSITY, driftOffset, fieldMetrics, signalCellFor } from '@/lib/field/system';

/**
 * The background of every screen (docs/BRAND-WORLD.md, Direction 03): the field
 * from the "Reputation on the record." loop. Klein, clouds as 1-bit white dots,
 * a white grid aligned to the viewport, at most one coral cell.
 *
 * Fixed and full-viewport, behind everything (z-index -1; give the page a
 * transparent background). One canvas, drawn once per viewport size; static by
 * default. `drift` (hero only) moves the sky very slowly on a seamless circle,
 * a few frames a second, and stops for reduced motion or a hidden tab.
 * First paint is flat Klein, so there's no white flash.
 *
 *   <FieldBackground />                      // static, coral cell auto-placed
 *   <FieldBackground signalCell="none" />
 *   <FieldBackground signalCell={[5, 1]} drift />
 */
type Props = {
  signalCell?: 'none' | 'auto' | [number, number];
  seed?: number;
  density?: number;
  /** Hero only: a very slow drift (period in seconds, default 60). */
  drift?: boolean;
  driftPeriod?: number;
  className?: string;
};

const DRIFT_FPS = 6;

export default function FieldBackground({
  signalCell = 'auto',
  seed = 11,
  density = FIELD_DENSITY,
  drift = false,
  driftPeriod = 60,
  className,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);
  const sig = Array.isArray(signalCell) ? signalCell.join(',') : signalCell;

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const g = c.getContext('2d');
    if (!g) return;
    const spec: 'none' | 'auto' | [number, number] =
      sig === 'none' || sig === 'auto' ? sig : (sig.split(',').map(Number) as [number, number]);

    let size = { w: 0, h: 0 };
    const paint = (offset: [number, number]) => {
      const { w, h } = size;
      if (!w || !h) return;
      const t0 = performance.now();
      const m = fieldMetrics(w, h);
      paintField(g, clouds(seed, density, offset), {
        width: w,
        height: h,
        cell: m.cell,
        grid: m.grid,
        signalCell: signalCellFor(spec, m),
      });
      c.dataset.drawMs = (performance.now() - t0).toFixed(1);
    };
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === size.w && h === size.h) return;
      size = { w, h };
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(drift ? driftOffset(performance.now() / 1000, driftPeriod) : [0, 0]);
      setDrawn(true);
    };

    resize();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(resize, 120);
    };
    window.addEventListener('resize', onResize);

    // The drift: a few frames a second, never for reduced motion or a hidden tab.
    let raf = 0;
    let last = 0;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || still.matches || now - last < 1000 / DRIFT_FPS) return;
      last = now;
      paint(driftOffset(now / 1000, driftPeriod));
    };
    if (drift) raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [seed, density, sig, drift, driftPeriod]);

  return (
    <div
      aria-hidden
      className={className}
      style={{ position: 'fixed', inset: 0, zIndex: -1, background: FIELD, pointerEvents: 'none' }}
    >
      <canvas
        ref={canvas}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          // flat 1-bit dots like the loop video: no glow (Direction 03)
          visibility: drawn ? 'visible' : 'hidden',
        }}
      />
    </div>
  );
}

/**
 * A screen on the field: an isolated wrapper (so the fixed field at z-index -1
 * shows through even when the page's <body> has its own background) plus the
 * field itself. Use this at the top of a page instead of placing
 * <FieldBackground /> by hand.
 *
 *   <FieldScreen signalCell="auto"> …page… </FieldScreen>
 */
export function FieldScreen({ children, ...field }: Props & { children: ReactNode }) {
  return (
    <div style={{ position: 'relative', isolation: 'isolate', minHeight: '100vh', color: '#fff' }}>
      <FieldBackground {...field} />
      {children}
    </div>
  );
}

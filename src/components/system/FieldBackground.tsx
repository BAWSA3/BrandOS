'use client';

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { clouds, paintField, FIELD } from '@/lib/field/dither';
import { FIELD_DENSITY, driftOffset, fieldMetrics, signalCellFor } from '@/lib/field/system';
import { predrawKey, predrawScript } from '@/lib/field/predraw';

/**
 * The background of every screen (docs/BRAND-WORLD.md, Direction 03): the field
 * from the "Reputation on the record." loop. Klein, clouds as 1-bit white dots,
 * a white grid aligned to the viewport, at most one coral cell.
 *
 * Fixed and full-viewport, behind everything (z-index -1; give the page a
 * transparent background). One canvas, drawn once per viewport size; static by
 * default. `drift` (hero only) moves the sky very slowly on a seamless circle,
 * a few frames a second, and stops for reduced motion or a hidden tab.
 * The server HTML carries a tiny inline script (src/lib/field/predraw.ts) that
 * paints the first frame while the page parses; on mount this adopts it rather
 * than drawing again. Without it, first paint is flat Klein (never white).
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
  const id = useId();
  const [drawn, setDrawn] = useState(false);
  const sig = Array.isArray(signalCell) ? signalCell.join(',') : signalCell;

  // Layout effect: the first frame lands before the browser paints.
  useLayoutEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const g = c.getContext('2d');
    if (!g) return;
    const spec = parseSignal(sig);

    let size = { w: 0, h: 0 };
    let first = true;
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
      const key = predrawKey(w, h, dpr, seed, density, spec);
      const adopt = first && !drift;
      first = false;
      const pre = (
        window as Window & { __fieldPredraw?: { canvas: HTMLCanvasElement; key: string } }
      ).__fieldPredraw;
      if (adopt && c.dataset.fieldKey === key) {
        // the inline script already drew this exact frame into this canvas
      } else if (adopt && pre?.key === key && pre.canvas !== c) {
        // drawn into another canvas (the homepage's loading screen): copy it
        c.width = pre.canvas.width;
        c.height = pre.canvas.height;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.drawImage(pre.canvas, 0, 0);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      } else {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        paint(drift ? driftOffset(performance.now() / 1000, driftPeriod) : [0, 0]);
      }
      c.dataset.fieldKey = key;
      const win = window as Window & { __fieldDrawMs?: number };
      win.__fieldDrawMs ??= Math.round(performance.now());
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
        id={id}
        // the inline script sizes, marks and shows it before hydration
        suppressHydrationWarning
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
      <script
        dangerouslySetInnerHTML={{
          __html: predrawScript({ id, seed, density, signal: parseSignal(sig) }),
        }}
      />
    </div>
  );
}

function parseSignal(sig: string): 'none' | 'auto' | [number, number] {
  return sig === 'none' || sig === 'auto' ? sig : (sig.split(',').map(Number) as [number, number]);
}

/**
 * The homepage's loading screen. The homepage is static and reads `?field=1` in
 * the browser, so this ships hidden and its script runs the switch itself:
 * when the field is on it paints the hero's first frame (seed 11, coral cell
 * auto) and shows it; FieldBackground copies that frame once the hero mounts.
 */
export function FieldPredraw({ env, appEnv }: { env: boolean; appEnv: string }) {
  const id = useId();
  return (
    <div
      aria-hidden
      suppressHydrationWarning
      style={{
        position: 'fixed',
        inset: 0,
        background: FIELD,
        display: 'none',
        pointerEvents: 'none',
      }}
    >
      <canvas
        id={id}
        suppressHydrationWarning
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: predrawScript({
            id,
            seed: 11,
            density: FIELD_DENSITY,
            signal: 'auto',
            gate: { env, appEnv },
          }),
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

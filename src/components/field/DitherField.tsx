'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { clouds, fromPixels, paintField, FIELD, type Luma } from '@/lib/field/dither';

/**
 * A world surface (docs/BRAND-WORLD.md, Direction 02): the field. Klein ground,
 * an image as 1-bit white dots, an optional white grid and one coral cell.
 *
 * Fills its parent (position it yourself). Draws once per size, never animates;
 * until the canvas is drawn the box shows `poster` (or plain Klein), so there's
 * no blank flash and no layout shift.
 *
 *   <DitherField sampler="clouds" seed={11} grid="auto" signalCell={[5, 1]} />
 *   <DitherField sampler="image" src={avatarSrc('jbawsa')} fallbackText="JB" />
 *   <DitherField sampler="number" text="76" />
 */

type Props = {
  sampler: 'clouds' | 'image' | 'number';
  /** clouds: noise seed (same seed, same sky). */
  seed?: number;
  /** clouds: 0.3 heavy … 0.6 sparse. */
  density?: number;
  /** image: a same-origin URL (use avatarSrc() for X photos). */
  src?: string;
  /** number: the text to dither; image: shown instead if the image fails. */
  text?: string;
  fallbackText?: string;
  /** Dot pitch in px. Default 5, or 4 under 600px wide. */
  cell?: number;
  /** Grid pitch in px, or 'auto' (about 7 columns, at least 70px). */
  grid?: number | 'auto';
  /** The one coral cell, in grid units [column, row]. */
  signalCell?: [number, number];
  /** Contrast for image/number samplers. */
  contrast?: number;
  poster?: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

const SAMPLE_W = 160;

function textLuma(text: string, aspect: number): Luma {
  const w = SAMPLE_W;
  const h = Math.max(1, Math.round(w / aspect));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.filter = `blur(${Math.max(2, Math.round(h / 60))}px)`;
  g.fillStyle = '#fff';
  const size = Math.min(h * 0.62, (w * 1.6) / Math.max(1, text.length));
  g.font = `700 ${Math.round(size)}px "Inter Tight", "Helvetica Neue", Helvetica, Arial, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h * 0.52);
  g.filter = 'none';
  return fromPixels(g.getImageData(0, 0, w, h).data, w, h, 1.1);
}

function imageLuma(img: HTMLImageElement, aspect: number, contrast: number): Luma {
  const w = SAMPLE_W;
  const h = Math.max(1, Math.round(w / aspect));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * s;
  const ih = img.naturalHeight * s;
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  return fromPixels(g.getImageData(0, 0, w, h).data, w, h, contrast);
}

export default function DitherField({
  sampler,
  seed = 11,
  density = 0.42,
  src,
  text,
  fallbackText,
  cell,
  grid,
  signalCell,
  contrast = 1.35,
  poster,
  ariaLabel,
  className,
  style,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | 'failed' | null>(null);
  const [drawn, setDrawn] = useState(false);
  // a stable key, so a new [x, y] array each render doesn't redraw
  const sig = signalCell ? `${signalCell[0]},${signalCell[1]}` : '';

  // Load the image once (same-origin, so its pixels are readable).
  useEffect(() => {
    if (sampler !== 'image' || !src) return;
    let alive = true;
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.decoding = 'async';
    el.onload = () => alive && setImg(el);
    el.onerror = () => alive && setImg('failed');
    el.src = src;
    return () => {
      alive = false;
    };
  }, [sampler, src]);

  useEffect(() => {
    const b = box.current;
    const c = canvas.current;
    if (!b || !c) return;
    if (sampler === 'image' && img === null && src) return; // wait for the photo

    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastKey = '';
    const draw = () => {
      const w = b.clientWidth;
      const h = b.clientHeight;
      if (!w || !h) return;
      const key = `${w}x${h}`;
      if (key === lastKey) return;
      lastKey = key;
      const aspect = w / h;
      let luma: Luma;
      if (sampler === 'clouds') luma = clouds(seed, density);
      else if (sampler === 'image' && img && img !== 'failed')
        luma = imageLuma(img, aspect, contrast);
      else luma = textLuma((sampler === 'number' ? text : fallbackText) ?? '', aspect);

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      const g = c.getContext('2d');
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pitch = cell ?? (w < 600 ? 4 : 5);
      const gridPx = grid === 'auto' ? Math.max(70, Math.round(w / 7)) : grid;
      const cellAt = sig ? (sig.split(',').map(Number) as [number, number]) : undefined;
      paintField(g, luma, { width: w, height: h, cell: pitch, grid: gridPx, signalCell: cellAt });
      setDrawn(true);
    };

    draw();
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(draw, 120);
    });
    ro.observe(b);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, [sampler, seed, density, img, src, text, fallbackText, cell, grid, sig, contrast]);

  return (
    <div
      ref={box}
      className={className}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: poster ? `${FIELD} url(${poster}) center / cover no-repeat` : FIELD,
        ...style,
      }}
    >
      <canvas
        ref={canvas}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          // the faint phosphor glow from the references
          filter: 'drop-shadow(0 0 1.1px rgba(255,255,255,.5))',
          visibility: drawn ? 'visible' : 'hidden',
        }}
      />
    </div>
  );
}

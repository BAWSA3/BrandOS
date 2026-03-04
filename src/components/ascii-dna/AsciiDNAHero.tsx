'use client';

import { useRef, useEffect, useCallback, useState, type ReactNode } from 'react';
import {
  createGrid,
  computeDNAGrid,
  applyMouseDisplacement,
  renderToCanvas,
  type DNACell,
  type DNAConfig,
  type MouseState,
} from './ascii-dna-engine';

export interface AsciiDNAHeroProps {
  backgroundColor?: string;
  textColor?: string;
  children?: ReactNode;
  className?: string;
}

// Tuning parameters
const FONT_SIZE = 14;
const FONT_FAMILY = "'VCR OSD Mono', 'Courier New', monospace";
const CHAR_W = FONT_SIZE * 0.6;
const CHAR_H = FONT_SIZE * 1.2;

const HELIX_FREQUENCY = 2.0;
const STRAND_WIDTH = 4;
const SCROLL_SPEED = 4; // chars per second
const RUNG_SPACING = 3;
const TEXT_SOURCE = 'YOUR BRAND IS YOUR STORY TELL IT ';

// Mouse displacement
const DISPLACEMENT_RADIUS = 6; // grid cells
const DISPLACEMENT_FORCE = 18; // max px
const SPRING_K = 8;
const DAMPING = 0.85;

export default function AsciiDNAHero({
  backgroundColor = '#2F54EB',
  textColor = '#ffffff',
  children,
  className = '',
}: AsciiDNAHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const gridRef = useRef<DNACell[][] | null>(null);
  const mouseRef = useRef<MouseState>({ x: -1000, y: -1000, active: false });
  const textOffsetRef = useRef(0);
  const lastTimeRef = useRef(0);
  const fontReadyRef = useRef(false);

  const [dimensions, setDimensions] = useState<{ cols: number; rows: number; width: number; height: number }>({
    cols: 120,
    rows: 50,
    width: 1440,
    height: 900,
  });

  // Resize observer — adapt grid to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const { width, height } = container.getBoundingClientRect();
      const cols = Math.max(30, Math.floor(width / CHAR_W));
      const rows = Math.max(10, Math.floor(height / CHAR_H));
      setDimensions({ cols, rows, width, height });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    measure();

    return () => ro.disconnect();
  }, []);

  // Reallocate grid when dimensions change
  useEffect(() => {
    gridRef.current = createGrid(dimensions.cols, dimensions.rows);
  }, [dimensions.cols, dimensions.rows]);

  // Wait for font to load
  useEffect(() => {
    document.fonts.ready.then(() => {
      fontReadyRef.current = true;
    });
  }, []);

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { ...mouseRef.current, active: false };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Set up canvas dimensions with retina support
    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = dimensions;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    };

    setupCanvas();

    const amplitude = Math.floor(dimensions.cols * 0.15);
    const centerCol = Math.floor(dimensions.cols / 2);

    const config: DNAConfig = {
      cols: dimensions.cols,
      rows: dimensions.rows,
      amplitude,
      frequency: HELIX_FREQUENCY,
      strandWidth: STRAND_WIDTH,
      textSource: TEXT_SOURCE,
      textOffset: 0,
      rungSpacing: RUNG_SPACING,
      centerCol,
    };

    // Render one static frame for reduced motion
    if (prefersReduced) {
      const grid = gridRef.current;
      if (!grid) return;
      config.textOffset = 0;
      computeDNAGrid(grid, config);
      renderToCanvas(ctx, grid, CHAR_W, CHAR_H, backgroundColor, textColor, dimensions.width, dimensions.height);
      return;
    }

    let visible = true;
    const handleVisibility = () => {
      visible = document.visibilityState === 'visible';
      if (visible) lastTimeRef.current = 0; // Reset to avoid dt spike
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!visible || !fontReadyRef.current) return;

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = now;
        return;
      }

      const dtMs = Math.min(now - lastTimeRef.current, 50); // Cap at 50ms to avoid spiral
      lastTimeRef.current = now;
      const dt = dtMs / 1000;

      const grid = gridRef.current;
      if (!grid) return;

      // Advance scrolling text
      textOffsetRef.current += SCROLL_SPEED * dt;
      config.textOffset = textOffsetRef.current;

      // Compute helix
      computeDNAGrid(grid, config);

      // Apply mouse displacement
      applyMouseDisplacement(
        grid,
        mouseRef.current,
        CHAR_W,
        CHAR_H,
        dt,
        DISPLACEMENT_RADIUS,
        DISPLACEMENT_FORCE,
        SPRING_K,
        DAMPING,
      );

      // Render
      renderToCanvas(ctx, grid, CHAR_W, CHAR_H, backgroundColor, textColor, dimensions.width, dimensions.height);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [dimensions, backgroundColor, textColor]);

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: backgroundColor,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'block',
        }}
        aria-hidden="true"
      />
      {children && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  generateInitialClouds,
  advanceClouds,
  computeScene,
  gridToHtml,
  type Cloud,
  type Season,
  type PathConfig,
  type GroundElement,
} from './ascii-sky-engine';

export interface AsciiSkyProps {
  cols?: number;
  rows?: number;
  cloudCount?: number;
  showHills?: boolean;
  fontSize?: string;
  fontFamily?: string;
  paused?: boolean;
  skyColorTop?: string;
  skyColorBottom?: string;
  cloudColor?: string;
  hillColor?: string;
  hillColorFar?: string;
  className?: string;
  season?: Season;
  path?: PathConfig;
  groundElements?: GroundElement[];
  timeOfDay?: number;
  onElementClick?: (elementId: string) => void;
  onElementHover?: (elementId: string | null) => void;
}

const TARGET_FPS = 20;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export default function AsciiSky({
  cols: propCols,
  rows: propRows,
  cloudCount = 6,
  showHills = true,
  fontSize = '13px',
  fontFamily = "'VCR OSD Mono', 'Courier New', monospace",
  paused = false,
  skyColorTop = '#1a5fb4',
  skyColorBottom = '#87CEEB',
  cloudColor = '#ffffff',
  hillColor = '#4a9e3f',
  hillColorFar = '#2d6b28',
  className = '',
  season,
  path,
  groundElements,
  timeOfDay,
  onElementClick,
  onElementHover,
}: AsciiSkyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const cloudsRef = useRef<Cloud[]>([]);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef(0);
  const timeRef = useRef(0);

  const [dimensions, setDimensions] = useState<{ cols: number; rows: number }>({
    cols: propCols ?? 120,
    rows: propRows ?? 35,
  });

  useEffect(() => {
    if (propCols && propRows) {
      setDimensions({ cols: propCols, rows: propRows });
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const { width, height } = container.getBoundingClientRect();
      const charW = parseFloat(fontSize) * 0.6;
      const charH = parseFloat(fontSize) * 1.2;
      const cols = Math.max(30, Math.floor(width / charW));
      const rows = Math.max(10, Math.floor(height / charH));
      setDimensions({ cols, rows });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    measure();

    return () => ro.disconnect();
  }, [propCols, propRows, fontSize]);

  useEffect(() => {
    cloudsRef.current = generateInitialClouds(dimensions.cols, dimensions.rows, cloudCount);
    timeRef.current = 0;
  }, [dimensions.cols, dimensions.rows, cloudCount]);

  const renderFrame = useCallback(() => {
    const pre = preRef.current;
    if (!pre) return;

    const grid = computeScene({
      cols: dimensions.cols,
      rows: dimensions.rows,
      clouds: cloudsRef.current,
      showHills,
      skyColorTop,
      skyColorBottom,
      cloudColor,
      hillColor,
      hillColorFar,
      time: timeRef.current,
      season,
      path,
      groundElements,
      timeOfDay,
    });

    pre.innerHTML = gridToHtml(grid);
  }, [dimensions, showHills, skyColorTop, skyColorBottom, cloudColor, hillColor, hillColorFar, season, path, groundElements, timeOfDay]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderFrame();

    if (paused || prefersReduced) return;

    let visible = true;
    const handleVisibility = () => {
      visible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!visible) return;

      const elapsed = now - lastFrameRef.current;
      if (elapsed < FRAME_INTERVAL) return;

      lastFrameRef.current = now - (elapsed % FRAME_INTERVAL);

      const dt = FRAME_INTERVAL / 1000;
      timeRef.current += dt;

      cloudsRef.current = advanceClouds(cloudsRef.current, dt, dimensions.cols);
      renderFrame();
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [paused, renderFrame, dimensions.cols]);

  // Interactive element event delegation
  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-element]');
      if (target && onElementClick) {
        onElementClick((target as HTMLElement).dataset.element!);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-element]');
      if (onElementHover) {
        onElementHover(target ? (target as HTMLElement).dataset.element! : null);
      }
    };

    pre.addEventListener('click', handleClick);
    pre.addEventListener('mouseover', handleMouseOver);

    return () => {
      pre.removeEventListener('click', handleClick);
      pre.removeEventListener('mouseover', handleMouseOver);
    };
  }, [onElementClick, onElementHover]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <pre
        ref={preRef}
        style={{
          fontFamily,
          fontSize,
          lineHeight: 1.2,
          margin: 0,
          padding: 0,
          whiteSpace: 'pre',
          fontVariantLigatures: 'none',
          overflow: 'hidden',
          background: skyColorBottom,
          width: '100%',
          height: '100%',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        aria-hidden="true"
      />
    </div>
  );
}

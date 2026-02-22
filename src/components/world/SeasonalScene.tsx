'use client';

import { useMemo } from 'react';
import AsciiSky from '../ascii-sky/AsciiSky';
import {
  SEASON_PALETTES,
  generateSeasonElements,
  type Season,
  type GroundElement,
  type PathConfig,
} from '../ascii-sky/ascii-sky-engine';

interface SeasonalSceneProps {
  season: Season;
  growth: number; // 0-1, drives how many elements are visible
  width?: string;
  height?: string;
  fontSize?: string;
  showPath?: boolean;
  onElementClick?: (elementId: string) => void;
  onElementHover?: (elementId: string | null) => void;
  className?: string;
  dimmed?: boolean;
}

const SEASON_LABELS: Record<Season, { label: string; phase: string }> = {
  spring: { label: 'SPRING', phase: 'DEFINE' },
  summer: { label: 'SUMMER', phase: 'CHECK' },
  autumn: { label: 'AUTUMN', phase: 'GENERATE' },
  winter: { label: 'WINTER', phase: 'SCALE' },
};

export default function SeasonalScene({
  season,
  growth,
  width = '100%',
  height = '100%',
  fontSize = '11px',
  showPath = true,
  onElementClick,
  onElementHover,
  className = '',
  dimmed = false,
}: SeasonalSceneProps) {
  const palette = SEASON_PALETTES[season];

  const groundElements = useMemo<GroundElement[]>(() => {
    const all = generateSeasonElements(season, 60, 25, 0.5);
    const visibleCount = Math.ceil(all.length * growth);
    return all.slice(0, visibleCount).map(el => ({
      ...el,
      growth: Math.min(1, growth * 1.5),
    }));
  }, [season, growth]);

  const pathConfig = useMemo<PathConfig | undefined>(() => {
    if (!showPath) return undefined;
    return {
      enabled: true,
      amplitude: 0.35,
      color: palette.pathColor,
      borderColor: palette.pathBorder,
    };
  }, [showPath, palette]);

  return (
    <div
      className={`relative ${className}`}
      style={{
        width,
        height,
        opacity: dimmed ? 0.4 : 1,
        transition: 'opacity 0.6s ease',
        filter: dimmed ? 'saturate(0.3)' : 'none',
      }}
    >
      <AsciiSky
        cloudCount={season === 'winter' ? 2 : 5}
        showHills
        skyColorTop={palette.skyTop}
        skyColorBottom={palette.skyBottom}
        cloudColor={palette.cloudColor}
        hillColor={palette.hillColor}
        hillColorFar={palette.hillColorFar}
        fontSize={fontSize}
        season={season}
        path={pathConfig}
        groundElements={groundElements}
        onElementClick={onElementClick}
        onElementHover={onElementHover}
      />

      {/* Season label overlay */}
      <div
        className="absolute bottom-2 left-3 pointer-events-none"
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.15em',
          color: palette.groundAccent,
          opacity: 0.6,
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        }}
      >
        {SEASON_LABELS[season].phase}
      </div>
    </div>
  );
}

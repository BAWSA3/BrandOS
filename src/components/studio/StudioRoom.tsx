'use client';

import { useState } from 'react';
import { studioArt, type StudioThemeId } from '@/lib/studio-themes';
import type { StationReaction } from '@/components/studio/StationStage';
import type { Mode } from '@/components/StationCard';

/**
 * The creator's studio room (isometric 3D render, background cut out so it
 * sits on both the bone day and dark night title screens). Stage 0-3 shows the
 * base studio being furnished (empty room -> desk -> workstation -> full room);
 * once complete, the chosen theme replaces it. Changing stage or theme
 * crossfades. Reactions mirror StationStage: power = a soft brighten, blueprint
 * = monochrome Klein blue ("under the hood").
 */
export default function StudioRoom({
  stage,
  theme = 'base',
  mode = 'day',
  reaction = null,
}: {
  stage: number;
  theme?: StudioThemeId;
  mode?: Mode;
  reaction?: StationReaction;
}) {
  const src = studioArt(stage, theme);
  // keep the previous image under the new one while it fades in
  const [layers, setLayers] = useState<string[]>([src]);
  if (layers[layers.length - 1] !== src) setLayers((l) => [...l.slice(-1), src]);

  const filter =
    reaction === 'blueprint'
      ? 'grayscale(1) sepia(1) hue-rotate(190deg) saturate(3.2) brightness(1.02)'
      : mode === 'night'
        ? 'brightness(0.92) saturate(1.05)'
        : 'none';

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: '1000 / 1250' }}>
      {layers.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- pre-sized transparent render
        <img
          key={s}
          src={s}
          alt={i === layers.length - 1 ? 'Your studio' : ''}
          aria-hidden={i !== layers.length - 1}
          draggable={false}
          className="studio-room-layer absolute inset-0 h-full w-full object-contain"
          style={{
            filter,
            transition: 'filter 0.5s ease',
            animation:
              i === layers.length - 1 && layers.length > 1
                ? 'boot-fade-in 0.6s ease both'
                : reaction === 'power'
                  ? 'studio-power 0.9s ease both'
                  : undefined,
          }}
        />
      ))}
    </div>
  );
}

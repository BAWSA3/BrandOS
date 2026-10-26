'use client';

import { COLORWAYS, COLORWAY_SWATCH, type Colorway } from '@/lib/colorways';

const BLUE = '#0047FF';

/**
 * Settings → Dashboard: one mini dashboard (the dashboard layout) per colorway.
 * Used on the title screen's Settings and the dashboard's own Settings panel.
 */
export default function ColorwayPicker({
  value,
  onPick,
  rule,
  muted,
}: {
  value: Colorway;
  onPick: (c: Colorway) => void;
  /** Outline + label colours of the surface the picker sits on. */
  rule: string;
  muted: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Dashboard colorway">
      {COLORWAYS.map((c) => {
        const sw = COLORWAY_SWATCH[c.id];
        const on = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            title={c.hint}
            onClick={() => onPick(c.id)}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className="grid h-[46px] w-full grid-cols-[5fr_4fr_3fr] grid-rows-2 gap-[3px] p-[4px]"
              style={{
                background: sw.canvas,
                outline: on ? `2px solid ${BLUE}` : `1px solid ${rule}`,
                outlineOffset: on ? 2 : 0,
              }}
            >
              <span
                className="row-span-2"
                style={{ background: sw.tile, border: `1px solid ${sw.edge}` }}
              />
              <span
                style={{
                  background: BLUE,
                  border: `1px solid ${c.id === 'klein' ? 'rgba(255,255,255,0.7)' : BLUE}`,
                }}
              />
              <span style={{ background: sw.tile, border: `1px solid ${sw.edge}` }} />
              <span
                className="col-span-2"
                style={{ background: sw.tile, border: `1px solid ${sw.edge}` }}
              />
            </span>
            <span
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ color: on ? BLUE : muted }}
            >
              {c.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

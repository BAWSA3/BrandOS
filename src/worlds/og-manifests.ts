import type { WorldOgConfig } from './types';
import terminalOs from './terminal-os/manifest';

// Flat static map for the edge-runtime OG route.
// next/og (Satori) can't `dynamic()`-import at request time, so we inline the
// per-world OG config here. Keep this file free of React components, audio,
// and scene imports — it must stay tiny for the edge bundle.
export const OG_WORLDS: Record<string, WorldOgConfig> = {
  'terminal-os': terminalOs.og,
};

export const DEFAULT_OG_WORLD: WorldOgConfig = terminalOs.og;

export function resolveOgWorld(id?: string | null): WorldOgConfig {
  if (!id) return DEFAULT_OG_WORLD;
  return OG_WORLDS[id] ?? DEFAULT_OG_WORLD;
}

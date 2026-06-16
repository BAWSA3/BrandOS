import terminalOs from './terminal-os/manifest';
import type { WorldManifest } from './types';
import { DEFAULT_WORLD, DEFAULT_WORLD_ID } from './fallback';

export const WORLDS = {
  'terminal-os': terminalOs,
} as const satisfies Record<string, WorldManifest>;

export type RegisteredWorldId = keyof typeof WORLDS;

export { DEFAULT_WORLD, DEFAULT_WORLD_ID };

export function resolveWorld(id?: string | null): WorldManifest {
  if (!id) return DEFAULT_WORLD;
  return (WORLDS as Record<string, WorldManifest>)[id] ?? DEFAULT_WORLD;
}

export function isPremiumWorld(id: string): boolean {
  const world = (WORLDS as Record<string, WorldManifest>)[id];
  return world?.tier === 'premium';
}

export function listWorlds(): WorldManifest[] {
  return Object.values(WORLDS);
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function resolveCustomWorld(
  base: WorldManifest,
  overrides: DeepPartial<WorldManifest> | Record<string, unknown>,
): WorldManifest {
  return deepMerge(base as unknown as Record<string, unknown>, overrides as Record<string, unknown>) as unknown as WorldManifest;
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key in source) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result;
}

'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { WorldSceneProps } from '@/worlds/types';

// Client-only scene registry. Each entry dynamically imports the world's
// scene component so it's lazy-loaded per world. Manifests live on the server
// (RSC-serializable) and only carry static config; this map is the bridge.
//
// Adding a world = one new line here + one new manifest folder.
export const WORLD_SCENES: Record<string, ComponentType<WorldSceneProps>> = {
  'terminal-os': dynamic(() => import('@/worlds/terminal-os/scene'), { ssr: false }),
};

export function getWorldScene(id: string): ComponentType<WorldSceneProps> | null {
  return WORLD_SCENES[id] ?? null;
}

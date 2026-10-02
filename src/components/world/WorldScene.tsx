'use client';

import { useWorld } from './WorldProvider';
import StaticFallback from './StaticFallback';
import { getWorldScene } from './scenes';

interface WorldSceneWrapperProps {
  intensity?: number;
}

export default function WorldScene({ intensity = 1 }: WorldSceneWrapperProps) {
  const { world, reducedMotion } = useWorld();

  if (reducedMotion) {
    return <StaticFallback world={world} />;
  }

  const Scene = getWorldScene(world.id);
  if (!Scene) {
    return <StaticFallback world={world} />;
  }

  // Scene comes from the module-level WORLD_SCENES map (scenes.ts), so its
  // identity is stable across renders — nothing is created during render.
  // eslint-disable-next-line react-hooks/static-components
  return <Scene intensity={intensity} />;
}

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

  return <Scene intensity={intensity} />;
}

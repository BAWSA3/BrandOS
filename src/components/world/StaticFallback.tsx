'use client';

import type { WorldManifest } from '@/worlds/types';

interface StaticFallbackProps {
  world: WorldManifest;
  className?: string;
}

export default function StaticFallback({ world, className = '' }: StaticFallbackProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 ${className}`}
      style={{ background: world.background.staticFallback }}
    />
  );
}

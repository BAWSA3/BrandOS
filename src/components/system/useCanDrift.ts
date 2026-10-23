'use client';

import { useEffect, useState } from 'react';

/**
 * Should the hero's field drift on this device? Only when motion is welcome and
 * the device has headroom: more than 4 cores and (where the browser reports it)
 * more than 4 GB of memory. The drift redraws the viewport a few times a second;
 * on low-end phones the field stays still. FieldBackground already pauses it
 * for a hidden tab. False until mounted, so the first paint is always still.
 */
export function useCanDrift(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency ?? 0;
    const mem = nav.deviceMemory;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setOk(!still && cores > 4 && (mem === undefined || mem > 4));
  }, []);
  return ok;
}

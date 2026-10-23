'use client';

import { useEffect, useState } from 'react';

/**
 * Is the Creator Index open for this visitor (and are they in it)? Asked from
 * the server so it follows INDEX_ENABLED without a rebuild; null until known,
 * so "Join the Index" CTAs stay hidden while closed.
 */
export interface IndexStatus {
  open: boolean;
  signedIn?: boolean;
  member?: { number: number; listed: boolean } | null;
}

export function useIndexStatus(): IndexStatus | null {
  const [status, setStatus] = useState<IndexStatus | null>(null);
  useEffect(() => {
    let live = true;
    fetch('/api/index/status')
      .then((r) => (r.ok ? r.json() : { open: false }))
      .then((s: IndexStatus) => live && setStatus(s))
      .catch(() => live && setStatus({ open: false }));
    return () => {
      live = false;
    };
  }, []);
  return status;
}

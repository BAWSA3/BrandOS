'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import RescanOverlay from '@/components/dashboard/RescanOverlay';

// "Rescan" on the main menu lands on /dashboard?rescan=1: run the scan right
// away with the same overlay as the dashboard's Rescan button, then refresh
// the page's server data (new score, history, XP) and drop the query so a
// reload doesn't scan again. Works for accounts with no scan yet, too.

export default function RescanOnLoad({ handle }: { handle: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [scan, setScan] = useState<{ status: 'running' | 'done' | 'error'; error?: string } | null>(
    null
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // forget the trigger first so a reload doesn't scan again. History API, not
    // router.replace: a router navigation would re-render the page without
    // ?rescan and unmount this component mid-scan.
    window.history.replaceState(null, '', '/dashboard');
    setScan({ status: 'running' });
    void (async () => {
      try {
        const res = await fetch('/api/dashboard/rescan', { method: 'POST' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || typeof body.score !== 'number') {
          setScan({
            status: 'error',
            error:
              res.status === 429 && !body.error
                ? 'Too many scans right now. Try again in a minute.'
                : body.error,
          });
          return;
        }
        setScan({ status: 'done' });
        await new Promise((r) => window.setTimeout(r, 700));
        setScan(null);
        router.refresh();
      } catch {
        setScan({ status: 'error', error: 'Scan failed. Check your connection and try again.' });
      }
    })();
  }, [router]);

  return (
    <AnimatePresence>
      {scan && (
        <RescanOverlay
          key="rescan-on-load"
          handle={handle}
          status={scan.status}
          error={scan.error}
          onClose={() => setScan(null)}
        />
      )}
    </AnimatePresence>
  );
}

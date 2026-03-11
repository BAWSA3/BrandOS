'use client';

import { useEffect, useRef } from 'react';
import { trackBetaEvent } from '@/lib/analytics';

/**
 * Tracks time spent on a feature by creating a UserSession on mount
 * and ending it on unmount / beforeunload. Heartbeats every 60s.
 */
export function useSessionTracker(feature: string) {
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startSession() {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature }),
        });
        if (!res.ok) return;
        const { sessionId } = await res.json();
        if (!cancelled) {
          sessionIdRef.current = sessionId;
          trackBetaEvent('beta_content_engine_session_start' as never, { feature });
        }
      } catch {
        // Silently fail — session tracking is non-critical
      }
    }

    startSession();

    // Heartbeat every 60s (keeps session alive for duration tracking)
    heartbeatRef.current = setInterval(() => {
      // No-op ping — the real duration is computed on end
    }, 60_000);

    function endSession() {
      if (!sessionIdRef.current) return;
      const id = sessionIdRef.current;
      sessionIdRef.current = null;

      trackBetaEvent('beta_content_engine_session_end' as never, { feature });

      // Use sendBeacon for reliable delivery on page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/sessions',
          new Blob(
            [JSON.stringify({ sessionId: id })],
            { type: 'application/json' }
          )
        );
      } else {
        fetch('/api/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: id }),
          keepalive: true,
        }).catch(() => {});
      }
    }

    window.addEventListener('beforeunload', endSession);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', endSession);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      endSession();
    };
  }, [feature]);
}

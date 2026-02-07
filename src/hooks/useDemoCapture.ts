'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBrandStore } from '@/lib/store';
import {
  captureViewport,
  captureElement,
  type CapturedScreenshot,
} from '@/lib/screenshot';
import {
  saveScreenshot,
  saveSession,
  getSessionScreenshots,
} from '@/lib/screenshot/storage';
import { getMomentById, JOURNEY_MOMENTS } from '@/lib/screenshot/moments';

export interface UseDemoCaptureReturn {
  isActive: boolean;
  sessionId: string | null;
  currentMoment: string | null;
  captureCount: number;
  startSession: () => string;
  endSession: () => void;
  capture: (momentId: string, element?: HTMLElement | null) => Promise<CapturedScreenshot | null>;
  captureById: (momentId: string, elementId: string) => Promise<CapturedScreenshot | null>;
  setMoment: (momentId: string | null) => void;
  getCaptures: () => Promise<CapturedScreenshot[]>;
}

/**
 * Hook for demo mode screenshot capture
 * Automatically activates when ?demo=true is in the URL
 */
export function useDemoCapture(): UseDemoCaptureReturn {
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === 'true';

  const {
    demoMode,
    startDemoSession,
    endDemoSession,
    setDemoMoment,
    recordDemoCapture,
  } = useBrandStore();

  const sessionInitialized = useRef(false);

  // Auto-start session when demo=true param is present
  useEffect(() => {
    if (isDemoParam && !demoMode.isActive && !sessionInitialized.current) {
      sessionInitialized.current = true;
      const sessionId = startDemoSession();
      console.log('[DemoCapture] Auto-started session:', sessionId);

      // Save session to IndexedDB
      saveSession({
        id: sessionId,
        startedAt: Date.now(),
        captureCount: 0,
      });
    }
  }, [isDemoParam, demoMode.isActive, startDemoSession]);

  // Clean up session ref when component unmounts
  useEffect(() => {
    return () => {
      sessionInitialized.current = false;
    };
  }, []);

  const startSession = useCallback((): string => {
    const sessionId = startDemoSession();
    console.log('[DemoCapture] Started session:', sessionId);

    saveSession({
      id: sessionId,
      startedAt: Date.now(),
      captureCount: 0,
    });

    return sessionId;
  }, [startDemoSession]);

  const endSession = useCallback(() => {
    if (demoMode.sessionId) {
      // Update session with completion time
      saveSession({
        id: demoMode.sessionId,
        startedAt: Date.now() - 60000, // Approximate
        completedAt: Date.now(),
        captureCount: demoMode.captureCount,
      });
    }
    endDemoSession();
    sessionInitialized.current = false;
    console.log('[DemoCapture] Ended session');
  }, [demoMode.sessionId, demoMode.captureCount, endDemoSession]);

  const capture = useCallback(
    async (momentId: string, element?: HTMLElement | null): Promise<CapturedScreenshot | null> => {
      if (!demoMode.isActive || !demoMode.sessionId) {
        console.warn('[DemoCapture] Cannot capture - demo mode not active');
        return null;
      }

      const moment = getMomentById(momentId);
      if (!moment) {
        console.warn('[DemoCapture] Unknown moment:', momentId);
        return null;
      }

      console.log(`[DemoCapture] Capturing: ${moment.label}`);
      setDemoMoment(momentId);

      try {
        let screenshot: CapturedScreenshot | null;

        if (element) {
          screenshot = await captureElement(element, momentId, demoMode.sessionId);
        } else {
          screenshot = await captureViewport(momentId, demoMode.sessionId);
        }

        if (screenshot) {
          await saveScreenshot(screenshot);
          recordDemoCapture(momentId, moment.label);
          console.log(`[DemoCapture] Saved: ${moment.label}`);
        }

        return screenshot;
      } catch (error) {
        console.error('[DemoCapture] Capture failed:', error);
        return null;
      }
    },
    [demoMode.isActive, demoMode.sessionId, setDemoMoment, recordDemoCapture]
  );

  const captureById = useCallback(
    async (momentId: string, elementId: string): Promise<CapturedScreenshot | null> => {
      const element = document.getElementById(elementId);
      return capture(momentId, element as HTMLElement | null);
    },
    [capture]
  );

  const setMoment = useCallback(
    (momentId: string | null) => {
      setDemoMoment(momentId);
    },
    [setDemoMoment]
  );

  const getCaptures = useCallback(async (): Promise<CapturedScreenshot[]> => {
    if (!demoMode.sessionId) return [];
    return getSessionScreenshots(demoMode.sessionId);
  }, [demoMode.sessionId]);

  return {
    isActive: demoMode.isActive,
    sessionId: demoMode.sessionId,
    currentMoment: demoMode.currentMoment,
    captureCount: demoMode.captureCount,
    startSession,
    endSession,
    capture,
    captureById,
    setMoment,
    getCaptures,
  };
}

/**
 * Get all available journey moments
 */
export function useJourneyMoments() {
  return JOURNEY_MOMENTS;
}

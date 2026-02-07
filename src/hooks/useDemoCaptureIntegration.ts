'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDemoCapture } from './useDemoCapture';

type FlowState = 'input' | 'journey' | 'walkthrough' | 'reveal' | 'signup' | 'insufficient_data';

/**
 * Integration hook for X Brand Score journey capture triggers
 * Automatically captures screenshots at key journey moments
 */
export function useXBrandScoreDemoCapture({
  flowState,
  currentPhase,
  username,
  isValidating,
}: {
  flowState: FlowState;
  currentPhase: number;
  username: string;
  isValidating: boolean;
}) {
  const { isActive, capture, setMoment, sessionId } = useDemoCapture();
  const capturedMoments = useRef<Set<string>>(new Set());
  const prevFlowState = useRef<FlowState | null>(null);
  const prevPhase = useRef<number>(0);

  // Reset captured moments when session changes
  useEffect(() => {
    if (sessionId) {
      capturedMoments.current.clear();
    }
  }, [sessionId]);

  // Capture landing state on initial load
  useEffect(() => {
    if (!isActive) return;
    if (flowState === 'input' && !capturedMoments.current.has('score:landing')) {
      // Small delay to ensure component is rendered
      const timer = setTimeout(() => {
        capture('score:landing');
        capturedMoments.current.add('score:landing');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, flowState, capture]);

  // Capture when username is entered (before submit)
  useEffect(() => {
    if (!isActive) return;
    if (
      flowState === 'input' &&
      username.trim().length > 0 &&
      !isValidating &&
      !capturedMoments.current.has('score:input')
    ) {
      // Wait a moment after typing stops
      const timer = setTimeout(() => {
        if (username.trim().length > 0) {
          capture('score:input');
          capturedMoments.current.add('score:input');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive, flowState, username, isValidating, capture]);

  // Capture phase transitions during journey
  useEffect(() => {
    if (!isActive || flowState !== 'journey') return;

    const phaseToMoment: Record<number, string> = {
      1: 'score:analysis:define',
      2: 'score:analysis:check',
      3: 'score:analysis:generate',
      4: 'score:analysis:scale',
    };

    const momentId = phaseToMoment[currentPhase];
    if (momentId && !capturedMoments.current.has(momentId) && currentPhase !== prevPhase.current) {
      setMoment(momentId);
      // Capture midway through the phase for best visual
      const timer = setTimeout(() => {
        capture(momentId);
        capturedMoments.current.add(momentId);
      }, 2000); // Wait for phase animation to progress
      prevPhase.current = currentPhase;
      return () => clearTimeout(timer);
    }
  }, [isActive, flowState, currentPhase, capture, setMoment]);

  // Capture flow state transitions
  useEffect(() => {
    if (!isActive) return;
    if (flowState === prevFlowState.current) return;

    const transitionCaptures: Partial<Record<FlowState, string>> = {
      reveal: 'score:reveal',
    };

    const momentId = transitionCaptures[flowState];
    if (momentId && !capturedMoments.current.has(momentId)) {
      setMoment(momentId);
      // Wait for reveal animation
      const delay = flowState === 'reveal' ? 3000 : 1500;
      const timer = setTimeout(() => {
        capture(momentId);
        capturedMoments.current.add(momentId);
      }, delay);
      prevFlowState.current = flowState;
      return () => clearTimeout(timer);
    }

    prevFlowState.current = flowState;
  }, [isActive, flowState, capture, setMoment]);

  // Manual capture function for specific elements
  const captureElement = useCallback(
    async (momentId: string, element?: HTMLElement | null) => {
      if (!isActive) return;
      if (capturedMoments.current.has(momentId)) return;

      await capture(momentId, element);
      capturedMoments.current.add(momentId);
    },
    [isActive, capture]
  );

  // Capture dashboard when it appears
  const captureDashboard = useCallback(() => {
    if (!isActive) return;
    if (capturedMoments.current.has('score:dashboard')) return;

    setMoment('score:dashboard');
    const timer = setTimeout(() => {
      const dashboardEl = document.getElementById('brandos-dashboard-capture');
      capture('score:dashboard', dashboardEl);
      capturedMoments.current.add('score:dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [isActive, capture, setMoment]);

  return {
    isActive,
    captureElement,
    captureDashboard,
  };
}

/**
 * Integration hook for DNA Walkthrough capture triggers
 */
export function useDNAWalkthroughDemoCapture({
  activeSection,
}: {
  activeSection: number;
}) {
  const { isActive, capture, setMoment, sessionId } = useDemoCapture();
  const capturedSections = useRef<Set<number>>(new Set());

  // Reset when session changes
  useEffect(() => {
    if (sessionId) {
      capturedSections.current.clear();
    }
  }, [sessionId]);

  // Capture when section becomes active
  useEffect(() => {
    // Section names mapped to moment IDs
    const sectionMoments: Record<number, string> = {
      0: 'score:walkthrough:score',
      1: 'score:walkthrough:identity',
      2: 'score:walkthrough:tone',
      3: 'score:walkthrough:archetype',
      4: 'score:walkthrough:keywords',
      5: 'score:walkthrough:content',
    };

    if (!isActive) return;
    if (capturedSections.current.has(activeSection)) return;

    const momentId = sectionMoments[activeSection];
    if (!momentId) return;

    setMoment(momentId);

    // Wait for section to fully scroll into view and animate
    const timer = setTimeout(() => {
      capture(momentId);
      capturedSections.current.add(activeSection);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isActive, activeSection, capture, setMoment]);

  return { isActive };
}

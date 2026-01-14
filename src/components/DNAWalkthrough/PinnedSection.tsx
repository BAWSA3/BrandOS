'use client';

import { useRef, useEffect, useState, ReactNode, createContext, useContext } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from '@/lib/gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Context to share progress with children
interface PinnedSectionContextValue {
  progress: number;
  isActive: boolean;
}

const PinnedSectionContext = createContext<PinnedSectionContextValue>({
  progress: 0,
  isActive: false,
});

export const usePinnedSection = () => useContext(PinnedSectionContext);

interface PinnedSectionProps {
  children: ReactNode;
  index: number;
  totalSections: number;
  onProgressChange?: (progress: number) => void;
  onActiveChange?: (isActive: boolean) => void;
  pinDuration?: number; // viewport heights (default 1.75)
  className?: string;
}

export default function PinnedSection({
  children,
  index,
  totalSections,
  onProgressChange,
  onActiveChange,
  pinDuration = 1.75,
  className = '',
}: PinnedSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(index === 0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current || prefersReducedMotion) return;

    const section = sectionRef.current;
    const content = contentRef.current;

    // Create the ScrollTrigger with pin
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${window.innerHeight * pinDuration}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.5, // Smooth scrubbing
      onUpdate: (self) => {
        const newProgress = self.progress;
        setProgress(newProgress);
        onProgressChange?.(newProgress);

        // Update active state
        const nowActive = newProgress > 0 && newProgress < 1;
        if (nowActive !== isActive) {
          setIsActive(nowActive);
          onActiveChange?.(nowActive);
        }
      },
      onEnter: () => {
        setIsActive(true);
        onActiveChange?.(true);
      },
      onLeave: () => {
        setIsActive(false);
        onActiveChange?.(false);
      },
      onEnterBack: () => {
        setIsActive(true);
        onActiveChange?.(true);
      },
      onLeaveBack: () => {
        setIsActive(false);
        onActiveChange?.(false);
      },
    });

    // Create zoom/fade animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${window.innerHeight * pinDuration}`,
        scrub: 0.3, // Faster scrubbing for smoother transitions
      },
    });

    // Animation keyframes based on progress
    // 0-5%: Quick zoom in (reduced from 10%)
    // 5-92%: Fully visible (extended visible time)
    // 92-100%: Quick zoom out (reduced from 15%)

    const isFirst = index === 0;
    const isLast = index === totalSections - 1;

    // Set initial state (except for first section)
    // Start at high opacity so content is always visible during scroll navigation
    if (!isFirst) {
      gsap.set(content, {
        scale: 0.96,
        opacity: 0.7,
        filter: 'blur(2px)',
      });
    }

    // Zoom in (0% to 5%) - faster reveal
    if (!isFirst) {
      tl.to(content, {
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.05,
        ease: 'power1.out',
      }, 0);
    }

    // Hold at full scale (5% to 92%)
    tl.to(content, {
      scale: 1,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.87,
    }, 0.05);

    // Zoom out (92% to 100%) - faster exit, except for last section
    // Keep opacity high so content stays visible during scroll navigation
    if (!isLast) {
      tl.to(content, {
        scale: 0.96,
        opacity: 0.7,
        filter: 'blur(2px)',
        duration: 0.08,
        ease: 'power1.in',
      }, 0.92);
    }

    return () => {
      trigger.kill();
      tl.kill();
    };
  }, [index, totalSections, pinDuration, onProgressChange, onActiveChange, prefersReducedMotion, isActive]);

  // Reduced motion fallback - just show content normally
  if (prefersReducedMotion) {
    return (
      <div ref={sectionRef} className={`min-h-screen ${className}`}>
        <div ref={contentRef}>
          <PinnedSectionContext.Provider value={{ progress: 0.5, isActive: true }}>
            {children}
          </PinnedSectionContext.Provider>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className={`min-h-screen relative ${className}`}
      style={{ willChange: 'transform' }}
    >
      <div
        ref={contentRef}
        className="min-h-screen flex items-center justify-center"
        style={{
          willChange: 'transform, opacity, filter',
          transformOrigin: 'center center',
        }}
      >
        <PinnedSectionContext.Provider value={{ progress, isActive }}>
          {children}
        </PinnedSectionContext.Provider>
      </div>
    </div>
  );
}

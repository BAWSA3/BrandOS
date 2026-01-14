'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  children: ReactNode;
  onComplete?: () => void;
  autoStart?: boolean;
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'score',
    title: 'Brand Score',
    description: 'Your overall brand strength based on 4 key phases. Higher scores mean stronger brand consistency.',
    targetSelector: '[data-tour="score"]',
    position: 'right',
  },
  {
    id: 'identity',
    title: 'Identity',
    description: 'Your profile authenticity and activity metrics. This shows how real and active your brand presence is.',
    targetSelector: '[data-tour="identity"]',
    position: 'bottom',
  },
  {
    id: 'tone',
    title: 'Tone',
    description: 'Your voice characteristics across formality, energy, and confidence dimensions.',
    targetSelector: '[data-tour="tone"]',
    position: 'left',
  },
  {
    id: 'archetype',
    title: 'Archetype',
    description: 'Your brand personality type based on content analysis. Use this to guide your messaging.',
    targetSelector: '[data-tour="archetype"]',
    position: 'left',
  },
  {
    id: 'dna',
    title: 'Brand DNA',
    description: 'Your core keywords and voice signature. This is the essence of what makes your brand unique.',
    targetSelector: '[data-tour="dna"]',
    position: 'top',
  },
  {
    id: 'pillars',
    title: 'Content Pillars',
    description: 'The main themes in your content. Balance these for optimal engagement.',
    targetSelector: '[data-tour="pillars"]',
    position: 'top',
  },
];

export default function GuidedTour({
  children,
  onComplete,
  autoStart = true,
}: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [spotlightRect, setSpotlightRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const steps = DEFAULT_TOUR_STEPS;
  const step = steps[currentStep];

  // Start tour after a delay
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // Update position when step changes
  useEffect(() => {
    if (!isActive || !step) return;

    const updatePosition = () => {
      const target = document.querySelector(step.targetSelector);
      if (!target) {
        // If target not found, skip to next step
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          handleComplete();
        }
        return;
      }

      const rect = target.getBoundingClientRect();
      const padding = 12;

      setSpotlightRect({
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Position tooltip based on step.position
      const tooltipWidth = 280;
      const tooltipHeight = 120;
      let x = rect.left;
      let y = rect.top;

      switch (step.position) {
        case 'top':
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.top - tooltipHeight - 20;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.bottom + 20;
          break;
        case 'left':
          x = rect.left - tooltipWidth - 20;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
          break;
        case 'right':
          x = rect.right + 20;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
          break;
      }

      // Keep tooltip in viewport
      x = Math.max(20, Math.min(window.innerWidth - tooltipWidth - 20, x));
      y = Math.max(20, Math.min(window.innerHeight - tooltipHeight - 20, y));

      setTooltipPosition({ x, y });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep, step, steps.length]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <div style={{ position: 'relative' }}>
      {children}

      <AnimatePresence>
        {isActive && step && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              {/* SVG mask for spotlight effect */}
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <mask id="spotlight-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <motion.rect
                      initial={{ opacity: 0 }}
                      animate={{
                        x: spotlightRect.x,
                        y: spotlightRect.y,
                        width: spotlightRect.width,
                        height: spotlightRect.height,
                        opacity: 1,
                      }}
                      transition={{ duration: 0.3 }}
                      rx="12"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0, 0, 0, 0.75)"
                  mask="url(#spotlight-mask)"
                />
              </svg>

              {/* Spotlight border */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  left: spotlightRect.x,
                  top: spotlightRect.y,
                  width: spotlightRect.width,
                  height: spotlightRect.height,
                }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute',
                  borderRadius: '12px',
                  border: '2px solid #0047FF',
                  boxShadow: '0 0 20px rgba(0, 71, 255, 0.4)',
                  pointerEvents: 'none',
                }}
              />
            </motion.div>

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, x: tooltipPosition.x, top: tooltipPosition.y }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                left: 0,
                zIndex: 1001,
                width: '280px',
                background: '#0F1115',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Progress */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '16px',
                }}
              >
                {steps.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: '3px',
                      borderRadius: '2px',
                      background: i <= currentStep ? '#0047FF' : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  margin: '0 0 8px 0',
                }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.5,
                  margin: '0 0 16px 0',
                }}
              >
                {step.description}
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={handleSkip}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  SKIP TOUR
                </button>
                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0047FF',
                    color: '#FFFFFF',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                  }}
                >
                  {currentStep < steps.length - 1 ? 'NEXT' : 'FINISH'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

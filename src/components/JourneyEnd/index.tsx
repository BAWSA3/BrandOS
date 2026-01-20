'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AchievementUnlock from './transitions/AchievementUnlock';
import HighlightReel from './intermediates/HighlightReel';

// =============================================================================
// TYPES
// =============================================================================

export interface JourneyEndData {
  score: number;
  archetype: string;
  archetypeEmoji: string;
  personalityType: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
  topStrength: string;
  bestPhase: { name: string; score: number; diff: number };
  voiceProfile: string;
  keywords: string[];
}

interface JourneyEndProps {
  data: JourneyEndData;
  theme: string;
  onComplete: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

type Stage = 'transition' | 'highlight' | 'complete';

export default function JourneyEnd({
  data,
  theme,
  onComplete,
}: JourneyEndProps) {
  const [stage, setStage] = useState<Stage>('transition');

  // Handle transition complete → show highlight reel
  const handleTransitionComplete = () => {
    setStage('highlight');
  };

  // Handle "Claim Your Brand DNA" click → go to dashboard
  const handleClaimDNA = () => {
    setStage('complete');
  };

  // Call onComplete after the complete stage has rendered and stabilized
  useEffect(() => {
    if (stage === 'complete') {
      // Wait for the overlay to be fully rendered, then notify parent
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  return (
    <>
      {/* Solid background overlay - always present during complete stage */}
      {stage === 'complete' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: '#050505',
          }}
        />
      )}

      <AnimatePresence mode="wait">
        {/* ACHIEVEMENT UNLOCK TRANSITION */}
        {stage === 'transition' && (
          <motion.div
            key="transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#050505',
            }}
          >
            <AchievementUnlock
              archetype={data.archetype}
              archetypeEmoji={data.archetypeEmoji}
              score={data.score}
              personalityType={data.personalityType}
              onComplete={handleTransitionComplete}
              theme={theme}
            />
          </motion.div>
        )}

        {/* HIGHLIGHT REEL WITH "CLAIM YOUR BRAND DNA" CTA */}
        {stage === 'highlight' && (
          <motion.div
            key="highlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#050505',
            }}
          >
            <HighlightReel
              data={data}
              onContinue={handleClaimDNA}
              theme={theme}
            />
          </motion.div>
        )}

        {/* COMPLETE STAGE - content fades out, background remains */}
        {stage === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: '#050505',
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Export types for use in parent components
export type { JourneyEndProps };

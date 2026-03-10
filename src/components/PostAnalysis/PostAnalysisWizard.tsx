'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import TerminalPostCard from './TerminalPostCard';
import AnalysisStep, { AnalysisStepData } from './AnalysisStep';
import { ScrollReveal } from '../interactive';
import type { RawTweet } from '../DNAWalkthrough/TweetExcerpt';

interface PostAnalysisWizardProps {
  tweet: RawTweet;
  author: {
    name: string;
    username: string;
    profileImage?: string;
    verified?: boolean;
  };
  analysisData: {
    define: AnalysisStepData;
    check: AnalysisStepData;
    generate: AnalysisStepData;
    scale: AnalysisStepData;
  };
  onComplete?: () => void;
}

const PHASES = ['define', 'check', 'generate', 'scale'] as const;

const PHASE_HIGHLIGHTS: Record<string, { color: string; label: string }> = {
  define: { color: '#E8A838', label: 'Voice marker' },
  check: { color: '#10B981', label: 'Consistency signal' },
  generate: { color: '#9D4EDD', label: 'Replicable element' },
  scale: { color: '#0047FF', label: 'Growth trigger' },
};

export default function PostAnalysisWizard({
  tweet,
  author,
  analysisData,
  onComplete,
}: PostAnalysisWizardProps) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = intro, 0-3 = phases
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [postTags, setPostTags] = useState<{ label: string; color: string }[]>([]);
  const [highlightPhrases, setHighlightPhrases] = useState<{ text: string; color: string; label: string }[]>([]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Start scanning when user initiates
  const handleStartAnalysis = () => {
    setIsScanning(true);
    setScanProgress(0);
  };

  // Scan progress animation
  useEffect(() => {
    if (isScanning && scanProgress < 100) {
      const timer = setTimeout(() => {
        setScanProgress(prev => Math.min(prev + 2, 100));
      }, 40);
      return () => clearTimeout(timer);
    } else if (scanProgress >= 100 && isScanning) {
      setTimeout(() => {
        setIsScanning(false);
        setCurrentStep(0);
      }, 500);
    }
  }, [isScanning, scanProgress]);

  // Update post tags and highlights based on completed phases
  useEffect(() => {
    const tags: { label: string; color: string }[] = [];
    const highlights: { text: string; color: string; label: string }[] = [];

    if (completedSteps.includes(0)) {
      // DEFINE phase complete - add tone tag
      const toneParam = analysisData.define.parameters.find(p => p.id === 'tone');
      if (toneParam) {
        tags.push({ label: `TONE: ${String(toneParam.value).toUpperCase()}`, color: PHASE_HIGHLIGHTS.define.color });
      }
    }

    if (completedSteps.includes(1)) {
      // CHECK phase complete - add consistency tag
      const consistencyParam = analysisData.check.parameters.find(p => p.id === 'consistency');
      if (consistencyParam) {
        tags.push({ label: `CONSISTENCY: ${consistencyParam.value}%`, color: PHASE_HIGHLIGHTS.check.color });
      }
    }

    if (completedSteps.includes(2)) {
      // GENERATE phase complete - add hook/template tags
      const hookParam = analysisData.generate.parameters.find(p => p.id === 'hook');
      if (hookParam) {
        tags.push({ label: `HOOK: ${String(hookParam.value).toUpperCase()}`, color: PHASE_HIGHLIGHTS.generate.color });
      }
    }

    if (completedSteps.includes(3)) {
      // SCALE phase complete - add virality tag
      const viralityParam = analysisData.scale.parameters.find(p => p.id === 'virality');
      if (viralityParam) {
        tags.push({ label: `VIRAL POTENTIAL: ${viralityParam.value}`, color: PHASE_HIGHLIGHTS.scale.color });
      }
    }

    setPostTags(tags);
    setHighlightPhrases(highlights);
  }, [completedSteps, analysisData]);

  // Scroll to current step
  useEffect(() => {
    if (currentStep >= 0 && stepRefs.current[currentStep]) {
      setTimeout(() => {
        stepRefs.current[currentStep]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [currentStep]);

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => [...prev, stepIndex]);
    if (stepIndex < 3) {
      setCurrentStep(stepIndex + 1);
    } else {
      // All phases complete
      onComplete?.();
    }
  };

  const overallProgress = currentStep === -1 ? 0 : ((currentStep + 1) / 4) * 100;

  return (
    <div
      style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: '24px',
      }}
    >
      {/* Progress bar */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            POST DEEP-DIVE ANALYSIS
          </span>
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              color: '#0047FF',
            }}
          >
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div
          style={{
            height: '4px',
            background: 'rgba(0, 0, 0, 0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #E8A838, #10B981, #9D4EDD, #0047FF)',
              borderRadius: '2px',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
          }}
        >
          {PHASES.map((phase, i) => (
            <span
              key={phase}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '8px',
                letterSpacing: '0.08em',
                color: currentStep >= i ? '#000' : 'rgba(0, 0, 0, 0.3)',
                fontWeight: currentStep === i ? 600 : 400,
              }}
            >
              {phase.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* The Post */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.12em',
            color: 'rgba(0, 0, 0, 0.4)',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          /* ═══════════════════════════════════════ */
          <br />
          <span style={{ color: '#0047FF' }}>/*  YOUR TOP PERFORMING POST  */</span>
          <br />
          /* ═══════════════════════════════════════ */
        </div>

        <ScrollReveal direction="scale" delay={0.1}>
          <TerminalPostCard
            tweet={tweet}
            author={author}
            tags={postTags}
            highlightPhrases={highlightPhrases}
            isAnalyzing={isScanning}
            scanProgress={scanProgress}
          />
        </ScrollReveal>

        {/* Start Analysis Button */}
        <AnimatePresence>
          {currentStep === -1 && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ marginTop: '24px', textAlign: 'center' }}
            >
              <button
                onClick={handleStartAnalysis}
                style={{
                  padding: '18px 36px',
                  background: '#0047FF',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#0038CC'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#0047FF'}
              >
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '12px',
                    letterSpacing: '0.12em',
                    color: '#fff',
                  }}
                >
                  BEGIN DEEP ANALYSIS
                </span>
                <span style={{ color: '#fff', fontSize: '14px' }}>
                  →
                </span>
              </button>
              <p
                style={{
                  marginTop: '14px',
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  color: 'rgba(0, 0, 0, 0.4)',
                }}
              >
                Hover over the post • Click to begin analysis
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Analysis Steps */}
      <AnimatePresence>
        {currentStep >= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {PHASES.map((phase, index) => (
              <ScrollReveal
                key={phase}
                direction="up"
                delay={index * 0.08}
                distance={25}
              >
                <div ref={el => { stepRefs.current[index] = el; }}>
                  <AnalysisStep
                    data={analysisData[phase]}
                    isActive={currentStep === index}
                    isCompleted={completedSteps.includes(index)}
                    onComplete={() => handleStepComplete(index)}
                    stepNumber={index + 1}
                    totalSteps={4}
                  />
                </div>
              </ScrollReveal>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion state */}
      <AnimatePresence>
        {completedSteps.length === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              marginTop: '32px',
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(0, 71, 255, 0.05), rgba(16, 185, 129, 0.05))',
              border: '1px solid rgba(0, 71, 255, 0.15)',
              borderRadius: '6px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.12em',
                color: '#10B981',
                marginBottom: '8px',
              }}
            >
              ✓ ANALYSIS COMPLETE
            </div>
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#000',
                margin: '0 0 8px 0',
              }}
            >
              Post Deep-Dive Complete
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.6)',
                margin: '0 0 20px 0',
              }}
            >
              You now understand exactly why this post performed and how to replicate it.
            </p>
            <button
              onClick={onComplete}
              style={{
                padding: '16px 32px',
                background: '#0047FF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0038CC'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0047FF'}
            >
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: '#fff',
                }}
              >
                CONTINUE TO NEXT SECTION
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

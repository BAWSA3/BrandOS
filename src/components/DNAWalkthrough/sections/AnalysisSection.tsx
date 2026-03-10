'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RawTweet } from '../TweetExcerpt';
import ConversationalGate from '../ConversationalGate';

interface XProfileData {
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  verified: boolean;
  location?: string;
  url?: string;
}

interface PhaseData {
  score: number;
  insights: string[];
}

interface BrandScoreResult {
  overallScore: number;
  phases: {
    define: PhaseData;
    check: PhaseData;
    generate: PhaseData;
    scale: PhaseData;
  };
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
}

interface ToneData {
  minimal: number;
  playful: number;
  bold: number;
  experimental: number;
}

interface AnalysisSectionProps {
  profile: XProfileData;
  brandScore: BrandScoreResult;
  tone: ToneData;
  voiceProfile: string;
  archetype: string;
  archetypeEmoji: string;
  personalityType?: string;
  personalitySummary?: string;
  rawTweets: RawTweet[];
  theme: string;
  onComplete?: () => void;
}

const PHASE_META: Record<string, { label: string; color: string; what: string }> = {
  define: {
    label: 'DEFINE',
    color: '#E8A838',
    what: 'Brand clarity & recognition',
  },
  check: {
    label: 'CHECK',
    color: '#10B981',
    what: 'Voice consistency',
  },
  generate: {
    label: 'GENERATE',
    color: '#9D4EDD',
    what: 'AI-readiness',
  },
  scale: {
    label: 'SCALE',
    color: '#0047FF',
    what: 'Growth potential',
  },
};

function getScoreLabel(score: number): string {
  if (score >= 90) return 'EXCEPTIONAL';
  if (score >= 80) return 'EXCELLENT';
  if (score >= 70) return 'STRONG';
  if (score >= 60) return 'GOOD';
  if (score >= 50) return 'DECENT';
  if (score >= 40) return 'NEEDS WORK';
  return 'CRITICAL';
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#D4A574';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function getVoiceStyle(tone: ToneData): { style: string; description: string } {
  const formality = (100 - tone.playful + tone.minimal) / 2;
  const energy = (tone.bold + tone.experimental) / 2;

  if (formality > 65 && energy > 55) return { style: 'Authority', description: 'You lead with confidence and substance.' };
  if (formality > 65) return { style: 'Expert', description: 'Your voice carries weight through depth.' };
  if (energy > 65) return { style: 'Entertainer', description: 'You blend insight with energy.' };
  if (formality < 40 && energy < 40) return { style: 'Relatable', description: 'You connect through authenticity.' };
  return { style: 'Versatile', description: 'You adapt your voice to the message.' };
}

type Stage = 'intro' | 'score-reveal' | 'phases' | 'voice' | 'strengths';

export default function AnalysisSection({
  profile,
  brandScore,
  tone,
  voiceProfile,
  archetype,
  archetypeEmoji,
  personalityType,
  personalitySummary,
  rawTweets,
  theme,
  onComplete,
}: AnalysisSectionProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [revealedPhases, setRevealedPhases] = useState<number>(0);

  const scoreColor = getScoreColor(brandScore.overallScore);
  const voice = getVoiceStyle(tone);
  const phases = Object.entries(brandScore.phases) as [string, PhaseData][];
  const sortedPhases = [...phases].sort((a, b) => b[1].score - a[1].score);
  const strongestPhase = sortedPhases[0];

  return (
    <section
      className="min-h-screen"
      style={{ background: '#ffffff', position: 'relative' }}
    >
      <AnimatePresence mode="wait">
        {/* Stage 1: Intro */}
        {stage === 'intro' && (
          <ConversationalGate
            key="intro"
            message="Now let me show you what your content actually reveals about your brand."
            subtext="I've scored your presence across four key dimensions."
            buttonLabel="REVEAL MY SCORE"
            onContinue={() => setStage('score-reveal')}
          />
        )}

        {/* Stage 2: Score Reveal */}
        {stage === 'score-reveal' && (
          <motion.div
            key="score"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
            }}
          >
            {/* Big score reveal */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: `conic-gradient(${scoreColor} ${brandScore.overallScore * 3.6}deg, rgba(0,0,0,0.06) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '48px',
                    fontWeight: 700,
                    color: scoreColor,
                    lineHeight: 1,
                  }}
                >
                  {brandScore.overallScore}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    color: scoreColor,
                    marginTop: '6px',
                  }}
                >
                  {getScoreLabel(brandScore.overallScore)}
                </motion.span>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#000',
                textAlign: 'center',
                margin: '0 0 12px 0',
              }}
            >
              Your Brand Score
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                fontSize: '15px',
                color: 'rgba(0, 0, 0, 0.6)',
                textAlign: 'center',
                maxWidth: '400px',
                lineHeight: 1.6,
                marginBottom: '32px',
              }}
            >
              {brandScore.summary}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              onClick={() => setStage('phases')}
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
                BREAK IT DOWN
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* Stage 3: Phase breakdown */}
        {stage === 'phases' && (
          <motion.div
            key="phases"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
            }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: 'rgba(0, 0, 0, 0.4)',
                marginBottom: '24px',
              }}
            >
              YOUR FOUR DIMENSIONS
            </motion.p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                maxWidth: '500px',
                width: '100%',
                marginBottom: '32px',
              }}
            >
              {phases.map(([key, phase], i) => {
                const meta = PHASE_META[key];
                const isRevealed = i < revealedPhases;

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: isRevealed ? 1 : 0.3,
                      y: 0,
                      scale: isRevealed ? 1 : 0.95,
                    }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    style={{
                      padding: '20px',
                      background: isRevealed ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                      border: `1px solid ${isRevealed ? meta.color + '40' : 'rgba(0,0,0,0.06)'}`,
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        color: isRevealed ? meta.color : 'rgba(0,0,0,0.3)',
                        marginBottom: '8px',
                      }}
                    >
                      {meta.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '32px',
                        fontWeight: 700,
                        color: isRevealed ? '#000' : 'rgba(0,0,0,0.2)',
                        marginBottom: '4px',
                      }}
                    >
                      {isRevealed ? phase.score : '??'}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: isRevealed ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)',
                      }}
                    >
                      {meta.what}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Reveal button or continue */}
            {revealedPhases < 4 ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setRevealedPhases(prev => prev + 1)}
                style={{
                  padding: '14px 28px',
                  background: PHASE_META[phases[revealedPhases][0]].color,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    color: '#fff',
                  }}
                >
                  REVEAL {PHASE_META[phases[revealedPhases][0]].label}
                </span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center' }}
              >
                <p
                  style={{
                    fontSize: '16px',
                    color: '#000',
                    marginBottom: '20px',
                  }}
                >
                  Your strongest dimension is{' '}
                  <strong style={{ color: PHASE_META[strongestPhase[0]].color }}>
                    {PHASE_META[strongestPhase[0]].label}
                  </strong>
                </p>
                <button
                  onClick={() => setStage('voice')}
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
                    ANALYZE MY VOICE
                  </span>
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Stage 4: Voice & Archetype */}
        {stage === 'voice' && (
          <motion.div
            key="voice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
            }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: '16px',
                color: 'rgba(0, 0, 0, 0.6)',
                marginBottom: '32px',
                textAlign: 'center',
              }}
            >
              Based on your content, here's your brand identity:
            </motion.p>

            {/* Archetype card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                padding: '32px 48px',
                background: 'rgba(0, 71, 255, 0.04)',
                border: '1px solid rgba(0, 71, 255, 0.15)',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>{archetypeEmoji}</div>
              <div
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  color: 'rgba(0, 0, 0, 0.4)',
                  marginBottom: '8px',
                }}
              >
                YOUR ARCHETYPE
              </div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: '#000', marginBottom: '8px' }}>
                {archetype}
              </div>
              {personalityType && (
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    padding: '6px 12px',
                    background: 'rgba(0, 0, 0, 0.04)',
                    borderRadius: '4px',
                    color: 'rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {personalityType}
                </span>
              )}
            </motion.div>

            {/* Voice style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                padding: '24px 32px',
                background: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '8px',
                textAlign: 'center',
                maxWidth: '400px',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  color: 'rgba(0, 0, 0, 0.4)',
                  marginBottom: '8px',
                }}
              >
                YOUR VOICE STYLE
              </div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: '#000', marginBottom: '8px' }}>
                {voice.style}
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.6)', margin: 0, lineHeight: 1.5 }}>
                {voice.description}
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={() => setStage('strengths')}
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
                SHOW MY STRENGTHS
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* Stage 5: Strengths & Opportunities */}
        {stage === 'strengths' && (
          <motion.div
            key="strengths"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
            }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: '18px',
                color: '#000',
                marginBottom: '32px',
                textAlign: 'center',
              }}
            >
              Here's what's working — and where you can grow:
            </motion.p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                maxWidth: '700px',
                width: '100%',
                marginBottom: '40px',
              }}
            >
              {/* Strengths */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  padding: '24px',
                  background: 'rgba(16, 185, 129, 0.04)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    color: '#10B981',
                    marginBottom: '16px',
                  }}
                >
                  ✓ YOUR STRENGTHS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {brandScore.topStrengths.slice(0, 3).map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        fontSize: '14px',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: '#10B981', flexShrink: 0 }}>+</span>
                      <span style={{ color: 'rgba(0, 0, 0, 0.7)' }}>{s}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Opportunities */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  padding: '24px',
                  background: 'rgba(245, 158, 11, 0.04)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    color: '#F59E0B',
                    marginBottom: '16px',
                  }}
                >
                  → GROWTH OPPORTUNITIES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {brandScore.topImprovements.slice(0, 3).map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        fontSize: '14px',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: '#F59E0B', flexShrink: 0 }}>→</span>
                      <span style={{ color: 'rgba(0, 0, 0, 0.7)' }}>{s}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                fontSize: '15px',
                color: 'rgba(0, 0, 0, 0.6)',
                textAlign: 'center',
                maxWidth: '450px',
                marginBottom: '24px',
              }}
            >
              Next, I'll show you your complete Brand DNA — the patterns and keywords that define your unique voice.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              onClick={() => onComplete?.()}
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
                REVEAL MY BRAND DNA
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

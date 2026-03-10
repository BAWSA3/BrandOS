'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RawTweet } from '../TweetExcerpt';
import ConversationalGate from '../ConversationalGate';
import type { VoiceConsistencyReport } from '@/lib/schemas/voice-consistency.schema';

interface ContentPillar {
  name: string;
  frequency: number;
  avgEngagement: number;
}

interface PerformanceInsights {
  bestFormats: string[];
  optimalLength: { min: number; max: number };
  highEngagementTopics: string[];
  signaturePhrases: string[];
  hookPatterns: string[];
  voiceConsistency: number;
}

interface BrandDNASectionProps {
  keywords: string[];
  voiceSamples: string[];
  doPatterns: string[];
  dontPatterns: string[];
  contentPillars?: ContentPillar[] | string[];
  performanceInsights?: PerformanceInsights;
  voiceConsistencyReport?: VoiceConsistencyReport;
  rawTweets: RawTweet[];
  theme: string;
  onComplete?: () => void;
}

type Stage = 'intro' | 'keywords' | 'pillars' | 'patterns';

export default function BrandDNASection({
  keywords,
  voiceSamples,
  doPatterns,
  dontPatterns,
  contentPillars,
  performanceInsights,
  voiceConsistencyReport,
  rawTweets,
  theme,
  onComplete,
}: BrandDNASectionProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [revealedKeywords, setRevealedKeywords] = useState(0);

  const accentColor = '#0047FF';

  // Normalize contentPillars to ContentPillar[] format
  const normalizedPillars: ContentPillar[] = contentPillars
    ? contentPillars.map((p, i) => {
        if (typeof p === 'string') {
          return { name: p, frequency: 100 - i * 15, avgEngagement: 0 };
        }
        return p;
      })
    : [];
  const sortedPillars = [...normalizedPillars].sort((a, b) => b.frequency - a.frequency);
  const maxFreq = sortedPillars.length ? Math.max(...sortedPillars.map(p => p.frequency)) : 1;

  const consistencyScore = voiceConsistencyReport?.overallScore
    ?? performanceInsights?.voiceConsistency
    ?? null;

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
            message="This is your Brand DNA — the essence of what makes you recognizable."
            subtext="Let me show you the words, themes, and patterns that define your unique voice."
            buttonLabel="SHOW MY DNA"
            onContinue={() => setStage('keywords')}
          />
        )}

        {/* Stage 2: Keywords reveal */}
        {stage === 'keywords' && (
          <motion.div
            key="keywords"
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
              YOUR BRAND KEYWORDS
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '16px',
                color: 'rgba(0, 0, 0, 0.6)',
                textAlign: 'center',
                maxWidth: '400px',
                marginBottom: '32px',
              }}
            >
              These words appear most often in your content. They're the vocabulary of your brand.
            </motion.p>

            {/* Keywords grid */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center',
                maxWidth: '500px',
                marginBottom: '32px',
              }}
            >
              {keywords.slice(0, 8).map((kw, i) => {
                const isRevealed = i < revealedKeywords;
                return (
                  <motion.span
                    key={kw}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: isRevealed ? 1 : 0.2,
                      scale: isRevealed ? 1 : 0.9,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '14px',
                      letterSpacing: '0.05em',
                      padding: '10px 20px',
                      background: isRevealed ? `${accentColor}10` : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isRevealed ? accentColor + '30' : 'rgba(0,0,0,0.06)'}`,
                      borderRadius: '4px',
                      color: isRevealed ? '#000' : 'rgba(0,0,0,0.2)',
                    }}
                  >
                    {isRevealed ? kw : '???'}
                  </motion.span>
                );
              })}
            </div>

            {/* Reveal or continue */}
            {revealedKeywords < Math.min(keywords.length, 8) ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setRevealedKeywords(prev => prev + 2)}
                style={{
                  padding: '14px 28px',
                  background: accentColor,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#0038CC'}
                onMouseLeave={(e) => e.currentTarget.style.background = accentColor}
              >
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    color: '#fff',
                  }}
                >
                  REVEAL MORE
                </span>
              </motion.button>
            ) : (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setStage('pillars')}
                style={{
                  padding: '16px 32px',
                  background: accentColor,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#0038CC'}
                onMouseLeave={(e) => e.currentTarget.style.background = accentColor}
              >
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    color: '#fff',
                  }}
                >
                  SHOW MY CONTENT PILLARS
                </span>
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Stage 3: Content Pillars */}
        {stage === 'pillars' && (
          <motion.div
            key="pillars"
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
              YOUR CONTENT PILLARS
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '16px',
                color: 'rgba(0, 0, 0, 0.6)',
                textAlign: 'center',
                maxWidth: '400px',
                marginBottom: '32px',
              }}
            >
              These are the topics you return to most. Your audience knows what to expect from you.
            </motion.p>

            {/* Pillars */}
            <div
              style={{
                width: '100%',
                maxWidth: '500px',
                marginBottom: '40px',
              }}
            >
              {sortedPillars.slice(0, 4).map((pillar, i) => (
                <motion.div
                  key={pillar.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '13px',
                      color: '#000',
                      minWidth: '140px',
                    }}
                  >
                    {pillar.name}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: 'rgba(0,0,0,0.06)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(pillar.frequency / maxFreq) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
                      style={{
                        height: '100%',
                        background: accentColor,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '12px',
                      color: 'rgba(0,0,0,0.5)',
                      minWidth: '40px',
                      textAlign: 'right',
                    }}
                  >
                    {Math.min(Math.round(pillar.frequency), 100)}%
                  </span>
                </motion.div>
              ))}

              {sortedPillars.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    fontSize: '14px',
                    color: 'rgba(0,0,0,0.5)',
                    textAlign: 'center',
                  }}
                >
                  Content pillar analysis requires more posts.
                </motion.p>
              )}
            </div>

            {/* Voice consistency preview */}
            {consistencyScore !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                style={{
                  padding: '20px 32px',
                  background: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '32px',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: `conic-gradient(${consistencyScore >= 70 ? '#10B981' : '#F59E0B'} ${consistencyScore * 3.6}deg, rgba(0,0,0,0.06) 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    {Math.min(Math.round(consistencyScore), 100)}%
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: 'rgba(0,0,0,0.4)',
                      marginBottom: '4px',
                    }}
                  >
                    VOICE CONSISTENCY
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.7)' }}>
                    {consistencyScore >= 70 ? 'Your voice is consistent' : 'Room to improve consistency'}
                  </div>
                </div>
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={() => setStage('patterns')}
              style={{
                padding: '16px 32px',
                background: accentColor,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0038CC'}
              onMouseLeave={(e) => e.currentTarget.style.background = accentColor}
            >
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: '#fff',
                }}
              >
                SHOW MY PATTERNS
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* Stage 4: Do/Don't Patterns */}
        {stage === 'patterns' && (
          <motion.div
            key="patterns"
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
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              Your brand playbook
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                maxWidth: '400px',
                marginBottom: '40px',
              }}
            >
              These are the patterns that work for you — and the ones to avoid.
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
              {/* Do patterns */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
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
                  ✓ DO THIS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {doPatterns.slice(0, 4).map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        fontSize: '14px',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: '#10B981', flexShrink: 0 }}>+</span>
                      <span style={{ color: 'rgba(0, 0, 0, 0.7)' }}>{p}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Don't patterns */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  padding: '24px',
                  background: 'rgba(239, 68, 68, 0.04)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    color: '#EF4444',
                    marginBottom: '16px',
                  }}
                >
                  ✕ AVOID THIS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dontPatterns.slice(0, 4).map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        fontSize: '14px',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: '#EF4444', flexShrink: 0 }}>×</span>
                      <span style={{ color: 'rgba(0, 0, 0, 0.7)' }}>{p}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Voice sample */}
            {voiceSamples.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                style={{
                  padding: '24px',
                  background: 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '8px',
                  maxWidth: '500px',
                  textAlign: 'center',
                  marginBottom: '32px',
                }}
              >
                <div
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    color: 'rgba(0, 0, 0, 0.4)',
                    marginBottom: '12px',
                  }}
                >
                  YOUR VOICE SIGNATURE
                </div>
                <p
                  style={{
                    fontSize: '16px',
                    lineHeight: 1.6,
                    color: 'rgba(0, 0, 0, 0.7)',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  "{voiceSamples[0]}"
                </p>
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              style={{
                fontSize: '15px',
                color: 'rgba(0, 0, 0, 0.6)',
                textAlign: 'center',
                maxWidth: '400px',
                marginBottom: '24px',
              }}
            >
              Finally, let me give you a concrete action plan to strengthen your brand.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              onClick={() => onComplete?.()}
              style={{
                padding: '16px 32px',
                background: accentColor,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0038CC'}
              onMouseLeave={(e) => e.currentTarget.style.background = accentColor}
            >
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: '#fff',
                }}
              >
                SHOW MY ACTION PLAN
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

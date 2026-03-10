'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationalGate from '@/components/DNAWalkthrough/ConversationalGate';
import type { GrowthPlanData } from '../types';

interface BottleneckSectionProps {
  plan: GrowthPlanData;
  onComplete: () => void;
}

export default function BottleneckSection({ plan, onComplete }: BottleneckSectionProps) {
  const [stage, setStage] = useState<'intro' | 'reveal'>('intro');

  return (
    <section style={{ background: '#ffffff', position: 'relative', minHeight: '100vh' }}>
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <ConversationalGate
            key="intro"
            message="Here's what your data is screaming about."
            subtext="One bottleneck explains almost everything."
            buttonLabel="SHOW ME THE PROBLEM"
            onContinue={() => setStage('reveal')}
          />
        )}

        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: '60px 24px', maxWidth: '640px', margin: '0 auto' }}
          >
            {/* Terminal header */}
            <div style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'rgba(0,0,0,0.4)',
              marginBottom: '32px',
            }}>
              /* ═══════════════════════════════════ */
              <br />
              /*{'  '}THE BOTTLENECK{'                    '}*/
              <br />
              /* ═══════════════════════════════════ */
            </div>

            {/* Bottleneck title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                padding: '32px',
                background: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            >
              <div style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: '#EF4444',
                marginBottom: '12px',
              }}>
                [CRITICAL]
              </div>
              <h3 style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '24px',
                fontWeight: 600,
                color: '#000',
                margin: '0 0 12px 0',
              }}>
                {plan.bottleneck.title}
              </h3>
              <p style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '14px',
                color: 'rgba(0,0,0,0.6)',
                lineHeight: 1.7,
                margin: 0,
              }}>
                {plan.bottleneck.description}
              </p>
            </motion.div>

            {/* Key metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.05em',
                color: 'rgba(0,0,0,0.4)',
                marginBottom: '12px',
              }}
            >
              {'>'} the numbers that explain everything:
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
              {plan.bottleneck.keyMetrics.map((metric, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.15 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: '16px',
                    padding: '16px 20px',
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '6px',
                    alignItems: 'center',
                  }}
                >
                  <span style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#000',
                  }}>
                    {metric.metric}
                  </span>
                  <span style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '12px',
                    color: '#EF4444',
                    fontWeight: 600,
                  }}>
                    {metric.current}
                  </span>
                  <span style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '12px',
                    color: '#10B981',
                    fontWeight: 600,
                  }}>
                    → {metric.target}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Gap analysis bars */}
            {plan.gapScores && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ marginBottom: '32px' }}
              >
                <div style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  color: 'rgba(0,0,0,0.4)',
                  marginBottom: '16px',
                }}>
                  {'>'} gap analysis breakdown:
                </div>
                {[
                  { label: 'TONE ALIGNMENT', score: plan.gapScores.toneAlignment },
                  { label: 'CONSISTENCY', score: plan.gapScores.postingConsistency },
                  { label: 'HOOK STRENGTH', score: plan.gapScores.hookStrength },
                  { label: 'FORMAT MATCH', score: plan.gapScores.formatMatch },
                  { label: 'ENGAGEMENT VEL.', score: plan.gapScores.engagementVelocity },
                  { label: 'CTA EFFECTIVENESS', score: plan.gapScores.ctaEffectiveness },
                ].sort((a, b) => b.score - a.score).map((dim, i) => (
                  <motion.div
                    key={dim.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 + i * 0.1 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '140px 1fr 40px',
                      gap: '12px',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '9px',
                      letterSpacing: '0.05em',
                      color: 'rgba(0,0,0,0.5)',
                    }}>
                      {dim.label}
                    </span>
                    <div style={{
                      height: '8px',
                      background: 'rgba(0,0,0,0.04)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dim.score}%` }}
                        transition={{ delay: 1.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          borderRadius: '4px',
                          background: dim.score >= 70 ? '#10B981'
                            : dim.score >= 50 ? '#F59E0B'
                            : '#EF4444',
                        }}
                      />
                    </div>
                    <span style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 600,
                      color: dim.score >= 70 ? '#10B981'
                        : dim.score >= 50 ? '#F59E0B'
                        : '#EF4444',
                      textAlign: 'right',
                    }}>
                      {dim.score}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Continue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
              style={{ textAlign: 'center', paddingTop: '16px' }}
            >
              <button
                onClick={onComplete}
                style={{
                  padding: '16px 32px',
                  background: '#0047FF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#0038CC'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#0047FF'}
              >
                <span style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: '#fff',
                }}>HOW DO I FIX THIS?</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

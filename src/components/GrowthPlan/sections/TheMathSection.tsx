'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationalGate from '@/components/DNAWalkthrough/ConversationalGate';
import type { GrowthPlanData } from '../types';

interface TheMathSectionProps {
  plan: GrowthPlanData;
  onComplete: () => void;
}

export default function TheMathSection({ plan, onComplete }: TheMathSectionProps) {
  const [stage, setStage] = useState<'intro' | 'reveal'>('intro');

  return (
    <section style={{ background: '#ffffff', position: 'relative', minHeight: '100vh' }}>
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <ConversationalGate
            key="intro"
            message="Let's talk about where you are and where you're going."
            subtext="I've crunched your numbers. Here's the math."
            buttonLabel="SHOW ME THE MATH"
            dataPoint={{ label: 'CURRENT', value: `${plan.currentFollowers.toLocaleString()} followers` }}
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
              /*{'  '}GROWTH MATH{'                        '}*/
              <br />
              /* ═══════════════════════════════════ */
            </div>

            {/* The numbers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Current → Target */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '24px',
                  padding: '32px',
                  background: 'rgba(0, 71, 255, 0.03)',
                  border: '1px solid rgba(0, 71, 255, 0.1)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    color: 'rgba(0,0,0,0.4)',
                    marginBottom: '8px',
                  }}>CURRENT</div>
                  <div style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '36px',
                    fontWeight: 600,
                    color: '#000',
                  }}>{plan.currentFollowers.toLocaleString()}</div>
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '20px',
                    color: '#0047FF',
                  }}
                >
                  →
                </motion.div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    color: 'rgba(0,0,0,0.4)',
                    marginBottom: '8px',
                  }}>TARGET</div>
                  <div style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '36px',
                    fontWeight: 600,
                    color: '#0047FF',
                  }}>{plan.targetFollowers.toLocaleString()}</div>
                </div>
              </motion.div>

              {/* Breakdown cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'NEEDED', value: `+${(plan.targetFollowers - plan.currentFollowers).toLocaleString()}`, sub: 'total new followers' },
                  { label: 'PER MONTH', value: `~${plan.monthlyNeeded.toLocaleString()}`, sub: `over ${plan.deadlineMonths} months` },
                  { label: 'PER DAY', value: `~${plan.dailyNeeded}`, sub: 'net new followers' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.15 }}
                    style={{
                      padding: '20px 16px',
                      background: '#fff',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '9px',
                      letterSpacing: '0.1em',
                      color: 'rgba(0,0,0,0.4)',
                      marginBottom: '8px',
                    }}>{item.label}</div>
                    <div style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: '24px',
                      fontWeight: 600,
                      color: '#000',
                      marginBottom: '4px',
                    }}>{item.value}</div>
                    <div style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: '11px',
                      color: 'rgba(0,0,0,0.4)',
                    }}>{item.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Feasibility note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{
                  padding: '16px 20px',
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '6px',
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '14px',
                  color: 'rgba(0,0,0,0.7)',
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: '#10B981', fontWeight: 600 }}>~{plan.dailyNeeded}/day is realistic</span> — but only if you fix what your data is screaming about. Let me show you.
              </motion.div>

              {/* Continue */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
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
                  }}>WHAT&apos;S WORKING?</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

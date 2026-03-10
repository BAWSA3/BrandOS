'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationalGate from '@/components/DNAWalkthrough/ConversationalGate';
import type { GrowthPlanData } from '../types';

interface ExecutionSectionProps {
  plan: GrowthPlanData;
  onComplete: () => void;
}

export default function ExecutionSection({ plan, onComplete }: ExecutionSectionProps) {
  const [stage, setStage] = useState<'intro' | 'weekly' | 'milestones' | 'final'>('intro');

  return (
    <section style={{ background: '#ffffff', position: 'relative', minHeight: '100vh' }}>
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <ConversationalGate
            key="intro"
            message="Strategy without execution is just daydreaming."
            subtext="Here's exactly what to do, when to do it, and how to track it."
            buttonLabel="SHOW THE PLAN"
            onContinue={() => setStage('weekly')}
          />
        )}

        {stage === 'weekly' && (
          <motion.div
            key="weekly"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: '60px 24px', maxWidth: '700px', margin: '0 auto' }}
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
              /*{'  '}WEEKLY EXECUTION CADENCE{'          '}*/
              <br />
              /* ═══════════════════════════════════ */
            </div>

            {/* Weekly plan table */}
            <div style={{
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '24px',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '70px 1fr 120px 120px',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.03)',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
              }}>
                {['DAY', 'CONTENT', 'FORMAT', 'CTA'].map(h => (
                  <span key={h} style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '9px',
                    letterSpacing: '0.1em',
                    color: 'rgba(0,0,0,0.4)',
                  }}>{h}</span>
                ))}
              </div>
              {/* Rows */}
              {plan.weeklyPlan.map((day, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 1fr 120px 120px',
                    padding: '14px 16px',
                    borderBottom: i < plan.weeklyPlan.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    alignItems: 'center',
                  }}
                >
                  <span style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#0047FF',
                  }}>{day.day}</span>
                  <span style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '13px',
                    color: 'rgba(0,0,0,0.7)',
                  }}>{day.content}</span>
                  <span style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    color: 'rgba(0,0,0,0.5)',
                  }}>{day.format}</span>
                  <span style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    color: 'rgba(0,0,0,0.5)',
                  }}>{day.ctaType}</span>
                </motion.div>
              ))}
            </div>

            {/* Daily non-negotiables */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{
                padding: '20px',
                background: 'rgba(0, 71, 255, 0.03)',
                border: '1px solid rgba(0, 71, 255, 0.1)',
                borderRadius: '8px',
                marginBottom: '32px',
              }}
            >
              <div style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: '#0047FF',
                marginBottom: '12px',
              }}>
                DAILY NON-NEGOTIABLES:
              </div>
              {plan.dailyNonNegotiables.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '6px',
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '13px',
                  color: 'rgba(0,0,0,0.7)',
                }}>
                  <span style={{ color: '#0047FF' }}>-</span>
                  {item}
                </div>
              ))}
            </motion.div>

            {/* What to stop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                padding: '20px',
                background: 'rgba(239, 68, 68, 0.03)',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                marginBottom: '32px',
              }}
            >
              <div style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: '#EF4444',
                marginBottom: '12px',
              }}>
                STOP DOING:
              </div>
              {plan.stopDoing.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '6px',
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '13px',
                  color: 'rgba(0,0,0,0.7)',
                }}>
                  <span style={{ color: '#EF4444' }}>x</span>
                  {item}
                </div>
              ))}
            </motion.div>

            {/* Continue to milestones */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              style={{ textAlign: 'center' }}
            >
              <button
                onClick={() => setStage('milestones')}
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
                }}>SHOW MILESTONES</span>
              </button>
            </motion.div>
          </motion.div>
        )}

        {stage === 'milestones' && (
          <motion.div
            key="milestones"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: '60px 24px', maxWidth: '700px', margin: '0 auto' }}
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
              /*{'  '}MONTHLY MILESTONES{'                '}*/
              <br />
              /* ═══════════════════════════════════ */
            </div>

            {/* Milestone cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {plan.milestones.map((milestone, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  style={{
                    padding: '24px',
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0047FF',
                      letterSpacing: '0.05em',
                    }}>
                      {milestone.month.toUpperCase()}
                    </span>
                    <span style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#000',
                    }}>
                      {milestone.targetFollowers.toLocaleString()}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <span style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      color: '#10B981',
                    }}>
                      +{milestone.growth.toLocaleString()}
                    </span>
                    <span style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: '13px',
                      color: 'rgba(0,0,0,0.5)',
                    }}>
                      {milestone.focus}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    color: 'rgba(0,0,0,0.4)',
                  }}>
                    success: {milestone.metric}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Progress visualization */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                padding: '20px',
                background: 'rgba(0,0,0,0.02)',
                borderRadius: '8px',
                marginBottom: '32px',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <span style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  color: 'rgba(0,0,0,0.5)',
                }}>{plan.currentFollowers.toLocaleString()}</span>
                <span style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  color: '#0047FF',
                  fontWeight: 600,
                }}>{plan.targetFollowers.toLocaleString()}</span>
              </div>
              <div style={{
                height: '12px',
                background: 'rgba(0,0,0,0.04)',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1.2, duration: 2, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    borderRadius: '6px',
                    background: 'linear-gradient(90deg, #0047FF, #4B7BFF)',
                  }}
                />
                {/* Milestone markers */}
                {plan.milestones.map((m, i) => {
                  const pct = ((m.targetFollowers - plan.currentFollowers) / (plan.targetFollowers - plan.currentFollowers)) * 100;
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${pct}%`,
                        top: '-4px',
                        width: '2px',
                        height: '20px',
                        background: 'rgba(0,0,0,0.15)',
                      }}
                    />
                  );
                })}
              </div>
            </motion.div>

            {/* Continue to final */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              style={{ textAlign: 'center' }}
            >
              <button
                onClick={() => setStage('final')}
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
                }}>THE ONE THING</span>
              </button>
            </motion.div>
          </motion.div>
        )}

        {stage === 'final' && (
          <motion.div
            key="final"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '80vh',
              padding: '60px 24px',
              textAlign: 'center',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                maxWidth: '500px',
                padding: '40px',
                background: 'rgba(0, 71, 255, 0.03)',
                border: '1px solid rgba(0, 71, 255, 0.1)',
                borderRadius: '12px',
                marginBottom: '32px',
              }}
            >
              <div style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: '#0047FF',
                marginBottom: '20px',
              }}>
                THE ONE THING THAT WILL MAKE OR BREAK THIS
              </div>
              <p style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '18px',
                fontWeight: 500,
                color: '#000',
                lineHeight: 1.6,
                margin: 0,
              }}>
                {plan.oneThingThatMatters}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '14px',
                color: '#0047FF',
                marginBottom: '32px',
              }}
            >
              {plan.currentFollowers.toLocaleString()} → {plan.targetFollowers.toLocaleString()}. let&apos;s go.
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <button
                onClick={onComplete}
                style={{
                  padding: '16px 40px',
                  background: '#0047FF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0038CC';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#0047FF';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: '#fff',
                }}>VIEW MY DASHBOARD</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

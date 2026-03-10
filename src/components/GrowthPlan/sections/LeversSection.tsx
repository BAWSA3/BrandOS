'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationalGate from '@/components/DNAWalkthrough/ConversationalGate';
import type { GrowthPlanData } from '../types';

interface LeversSectionProps {
  plan: GrowthPlanData;
  onComplete: () => void;
}

function getImpactColor(impact: string): string {
  switch (impact) {
    case 'highest': return '#EF4444';
    case 'high': return '#F59E0B';
    case 'medium-high': return '#0047FF';
    case 'medium': return '#6B7280';
    default: return '#6B7280';
  }
}

export default function LeversSection({ plan, onComplete }: LeversSectionProps) {
  const [stage, setStage] = useState<'intro' | 'levers'>('intro');
  const [activeLever, setActiveLever] = useState(0);
  const [revealedActions, setRevealedActions] = useState(0);

  const currentLever = plan.levers[activeLever];
  const isLastLever = activeLever >= plan.levers.length - 1;
  const allActionsRevealed = currentLever && revealedActions >= currentLever.actionItems.length;

  function nextLever() {
    if (isLastLever) {
      onComplete();
    } else {
      setActiveLever(prev => prev + 1);
      setRevealedActions(0);
    }
  }

  return (
    <section style={{ background: '#ffffff', position: 'relative', minHeight: '100vh' }}>
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <ConversationalGate
            key="intro"
            message={`I've identified ${plan.levers.length} growth levers from your data.`}
            subtext="Each one targets a specific gap. Let's walk through them in order of impact."
            buttonLabel="SHOW ME THE LEVERS"
            onContinue={() => setStage('levers')}
          />
        )}

        {stage === 'levers' && currentLever && (
          <motion.div
            key={`lever-${activeLever}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: '60px 24px', maxWidth: '640px', margin: '0 auto' }}
          >
            {/* Lever counter */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
            }}>
              {plan.levers.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '32px',
                    height: '4px',
                    borderRadius: '2px',
                    background: i <= activeLever ? '#0047FF' : 'rgba(0,0,0,0.08)',
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>

            {/* Terminal header */}
            <div style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'rgba(0,0,0,0.4)',
              marginBottom: '24px',
            }}>
              LEVER {activeLever + 1} OF {plan.levers.length}
            </div>

            {/* Lever card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                padding: '28px',
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            >
              {/* Title + impact */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#000',
                  margin: 0,
                }}>
                  {currentLever.title}
                </h3>
                <span style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: `${getImpactColor(currentLever.impact)}12`,
                  color: getImpactColor(currentLever.impact),
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  IMPACT: {currentLever.impact.toUpperCase()}
                </span>
              </div>

              {/* Score bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <span style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  color: 'rgba(0,0,0,0.4)',
                }}>YOUR SCORE:</span>
                <div style={{
                  flex: 1,
                  height: '6px',
                  background: 'rgba(0,0,0,0.04)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${currentLever.score}%` }}
                    transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      borderRadius: '3px',
                      background: currentLever.score >= 70 ? '#10B981'
                        : currentLever.score >= 50 ? '#F59E0B'
                        : '#EF4444',
                    }}
                  />
                </div>
                <span style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 600,
                  color: currentLever.score >= 70 ? '#10B981'
                    : currentLever.score >= 50 ? '#F59E0B'
                    : '#EF4444',
                }}>
                  {currentLever.score}/100
                </span>
              </div>

              {/* Description */}
              <p style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '14px',
                color: 'rgba(0,0,0,0.6)',
                lineHeight: 1.7,
                margin: '0 0 20px 0',
              }}>
                {currentLever.description}
              </p>

              {/* Action items */}
              <div style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.05em',
                color: 'rgba(0,0,0,0.4)',
                marginBottom: '12px',
              }}>
                ACTION ITEMS:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentLever.actionItems.map((action, i) => {
                  const isRevealed = i < revealedActions;
                  return (
                    <motion.div
                      key={i}
                      animate={{
                        opacity: isRevealed ? 1 : 0.3,
                        scale: isRevealed ? 1 : 0.98,
                      }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px 16px',
                        background: isRevealed ? 'rgba(0, 71, 255, 0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${isRevealed ? 'rgba(0, 71, 255, 0.1)' : 'rgba(0,0,0,0.04)'}`,
                        borderRadius: '6px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isRevealed ? '#0047FF' : 'rgba(0,0,0,0.2)',
                        minWidth: '20px',
                      }}>
                        {i + 1}.
                      </span>
                      <span style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '13px',
                        color: isRevealed ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.2)',
                        lineHeight: 1.5,
                      }}>
                        {isRevealed ? action : '???'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Target */}
              {allActionsRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '6px',
                  }}
                >
                  <span style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    color: '#10B981',
                    letterSpacing: '0.05em',
                  }}>
                    TARGET:
                  </span>{' '}
                  <span style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '13px',
                    color: 'rgba(0,0,0,0.7)',
                  }}>
                    {currentLever.target}
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Action button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  if (!allActionsRevealed) {
                    setRevealedActions(prev => prev + 1);
                  } else {
                    nextLever();
                  }
                }}
                style={{
                  padding: '16px 32px',
                  background: allActionsRevealed ? '#0047FF' : '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: '#fff',
                }}>
                  {allActionsRevealed
                    ? (isLastLever ? 'SHOW MY EXECUTION PLAN' : `NEXT LEVER →`)
                    : `REVEAL ACTION ${revealedActions + 1}`}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

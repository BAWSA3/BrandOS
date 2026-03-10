'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationalGate from '@/components/DNAWalkthrough/ConversationalGate';
import type { GrowthPlanData } from '../types';

interface WhatsWorkingSectionProps {
  plan: GrowthPlanData;
  onComplete: () => void;
}

function getVerdictColor(verdict: string): string {
  const v = verdict.toLowerCase();
  if (v === 'elite' || v === 'exceptional' || v === 'excellent') return '#10B981';
  if (v === 'strong' || v === 'solid' || v === 'good') return '#0047FF';
  if (v === 'above target' || v === 'above average') return '#0047FF';
  return '#F59E0B';
}

export default function WhatsWorkingSection({ plan, onComplete }: WhatsWorkingSectionProps) {
  const [stage, setStage] = useState<'intro' | 'reveal'>('intro');
  const [revealedCount, setRevealedCount] = useState(0);

  const allRevealed = revealedCount >= plan.strengths.length;

  return (
    <section style={{ background: '#ffffff', position: 'relative', minHeight: '100vh' }}>
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <ConversationalGate
            key="intro"
            message="First, let's look at what you should NOT change."
            subtext="Your data shows real strengths. These are your foundation."
            buttonLabel="SHOW MY STRENGTHS"
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
              /*{'  '}WHAT&apos;S WORKING (DON&apos;T TOUCH){'     '}*/
              <br />
              /* ═══════════════════════════════════ */
            </div>

            {/* Strength cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {plan.strengths.map((strength, i) => {
                const isRevealed = i < revealedCount;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: isRevealed ? 1 : 0.3,
                      x: isRevealed ? 0 : -10,
                      scale: isRevealed ? 1 : 0.98,
                    }}
                    transition={{ duration: 0.4 }}
                    style={{
                      padding: '20px',
                      background: isRevealed ? '#fff' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isRevealed ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'}`,
                      borderRadius: '8px',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '16px',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '14px',
                        fontWeight: 500,
                        color: isRevealed ? '#000' : 'rgba(0,0,0,0.3)',
                        marginBottom: '4px',
                      }}>
                        {isRevealed ? strength.metric : '???'}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '10px',
                        letterSpacing: '0.05em',
                      }}>
                        <span style={{ color: isRevealed ? '#0047FF' : 'rgba(0,0,0,0.2)' }}>
                          {isRevealed ? `yours: ${strength.value}` : '---'}
                        </span>
                        <span style={{ color: 'rgba(0,0,0,0.3)' }}>
                          {isRevealed ? `benchmark: ${strength.benchmark}` : '---'}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: isRevealed ? `${getVerdictColor(strength.verdict)}15` : 'rgba(0,0,0,0.03)',
                      color: isRevealed ? getVerdictColor(strength.verdict) : 'rgba(0,0,0,0.2)',
                      fontWeight: 600,
                    }}>
                      {isRevealed ? strength.verdict.toUpperCase() : '?'}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Reveal / Continue button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ textAlign: 'center', paddingTop: '32px' }}
            >
              <button
                onClick={() => {
                  if (!allRevealed) {
                    setRevealedCount(prev => prev + 1);
                  } else {
                    onComplete();
                  }
                }}
                style={{
                  padding: '16px 32px',
                  background: allRevealed ? '#0047FF' : '#000',
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
                  {allRevealed
                    ? 'NOW SHOW ME THE PROBLEM'
                    : `REVEAL STRENGTH ${revealedCount + 1}`}
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

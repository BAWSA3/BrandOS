'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface ActionPlanSectionProps {
  profile: XProfileData;
  brandScore: BrandScoreResult;
  keywords: string[];
  doPatterns: string[];
  voiceConsistencyScore?: number | null;
  onViewDashboard: () => void;
  theme: string;
}

interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
}

function generateActions(
  profile: XProfileData,
  brandScore: BrandScoreResult,
  doPatterns: string[],
  voiceConsistencyScore?: number | null,
): ActionItem[] {
  const actions: ActionItem[] = [];

  const phases = [
    { key: 'define', ...brandScore.phases.define },
    { key: 'check', ...brandScore.phases.check },
    { key: 'generate', ...brandScore.phases.generate },
    { key: 'scale', ...brandScore.phases.scale },
  ].sort((a, b) => a.score - b.score);

  const weakest = phases[0];

  if (voiceConsistencyScore != null && voiceConsistencyScore < 70) {
    actions.push({
      priority: 'high',
      title: 'Strengthen your voice consistency',
      detail: doPatterns.length
        ? `Lean into your proven patterns: "${doPatterns[0]}"`
        : 'Pick 2-3 tone markers and use them in every post.',
    });
  }

  if (weakest.score < 70) {
    const phaseNames: Record<string, string> = {
      define: 'brand clarity',
      check: 'consistency',
      generate: 'content readiness',
      scale: 'growth potential',
    };
    actions.push({
      priority: 'high',
      title: `Improve your ${phaseNames[weakest.key]}`,
      detail: weakest.insights[0] || 'This is your biggest opportunity for growth.',
    });
  }

  brandScore.topImprovements.slice(0, 2).forEach((improvement) => {
    if (!actions.some(a => a.title.includes(improvement))) {
      actions.push({
        priority: 'medium',
        title: improvement,
        detail: 'Flagged by our AI as a growth lever specific to your account.',
      });
    }
  });

  return actions.slice(0, 4);
}

type Stage = 'intro' | 'actions';

export default function ActionPlanSection({
  profile,
  brandScore,
  keywords,
  doPatterns,
  voiceConsistencyScore,
  onViewDashboard,
  theme,
}: ActionPlanSectionProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [revealedActions, setRevealedActions] = useState(0);

  const actions = generateActions(profile, brandScore, doPatterns, voiceConsistencyScore);
  const accentColor = '#0047FF';

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
            message="Now let's turn these insights into action."
            subtext="I've created a personalized plan based on your unique brand profile."
            buttonLabel="SHOW MY ACTION PLAN"
            onContinue={() => setStage('actions')}
          />
        )}

        {/* Stage 2: Action items */}
        {stage === 'actions' && (
          <motion.div
            key="actions"
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
              YOUR ACTION PLAN
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '18px',
                color: '#000',
                textAlign: 'center',
                maxWidth: '450px',
                marginBottom: '40px',
              }}
            >
              {actions.length > 0
                ? `Here are ${actions.length} things you can do to strengthen your brand:`
                : 'Your brand is in great shape. Keep doing what you are doing!'}
            </motion.p>

            {/* Actions list */}
            <div
              style={{
                width: '100%',
                maxWidth: '500px',
                marginBottom: '40px',
              }}
            >
              {actions.map((action, i) => {
                const isRevealed = i < revealedActions;
                const priorityColors = {
                  high: '#EF4444',
                  medium: '#F59E0B',
                  low: '#10B981',
                };

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: isRevealed ? 1 : 0.3,
                      y: 0,
                      scale: isRevealed ? 1 : 0.98,
                    }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    style={{
                      padding: '20px',
                      background: isRevealed ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                      border: `1px solid ${isRevealed ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)'}`,
                      borderRadius: '8px',
                      marginBottom: '12px',
                      display: 'flex',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isRevealed ? accentColor : 'rgba(0,0,0,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isRevealed ? '#fff' : 'rgba(0,0,0,0.2)',
                      }}
                    >
                      {isRevealed ? i + 1 : '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: isRevealed ? '#000' : 'rgba(0,0,0,0.2)',
                          }}
                        >
                          {isRevealed ? action.title : '???'}
                        </span>
                        {isRevealed && (
                          <span
                            style={{
                              fontFamily: "'VCR OSD Mono', monospace",
                              fontSize: '9px',
                              letterSpacing: '0.08em',
                              padding: '3px 8px',
                              borderRadius: '3px',
                              background: `${priorityColors[action.priority]}15`,
                              color: priorityColors[action.priority],
                            }}
                          >
                            {action.priority.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: '13px',
                          lineHeight: 1.5,
                          color: isRevealed ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)',
                          margin: 0,
                        }}
                      >
                        {isRevealed ? action.detail : 'Complete the reveal to see this action.'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Reveal or finish */}
            {revealedActions < actions.length ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setRevealedActions(prev => prev + 1)}
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
                  REVEAL ACTION {revealedActions + 1}
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
                    marginBottom: '12px',
                  }}
                >
                  Your journey is complete.
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'rgba(0,0,0,0.5)',
                    marginBottom: '24px',
                    maxWidth: '350px',
                  }}
                >
                  Access your full dashboard to track your progress and generate on-brand content.
                </p>
                <button
                  onClick={onViewDashboard}
                  style={{
                    padding: '18px 40px',
                    background: accentColor,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease, transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0038CC';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = accentColor;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '12px',
                      letterSpacing: '0.12em',
                      color: '#fff',
                    }}
                  >
                    VIEW MY DASHBOARD
                  </span>
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

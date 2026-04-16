'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  getArchetypeIdentityNarrative,
  getPhaseNarrative,
  getCriticalGapNarrative,
  getEvolutionNarrative,
  getEmptyStateMessage,
  getStaleDataMessage,
  getScoreContextNarrative,
} from '@/lib/narrative-templates';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

// =============================================================================
// BrandOS Intelligence Report — Redesigned
// =============================================================================

type ReportView = 'creator' | 'brand';

interface PhaseScores {
  define: number;
  check: number;
  generate: number;
  scale: number;
}

interface PhaseComparison {
  phase: string;
  label: string;
  description: string;
  user: number;
  cohort: number;
  delta: number;
}

interface IntelligenceReport {
  username: string;
  tier: 'free' | 'pro';
  report: {
    archetype: {
      name: string;
      emoji: string;
      tagline: string;
      description: string;
      tier: number;
      tierLabel: string;
      color: string;
      strengths: string[];
      traits: string[];
      rarity: number;
      evolutionPaths: string[];
    };
    score: {
      current: number;
      percentile: number | null;
      cohortAverage: number;
      cohortSize: number;
      influenceTier: string;
    };
    phases: {
      scores: PhaseScores;
      insights: Record<string, string[]> | null;
      comparison: PhaseComparison[] | null;
      criticalGap: {
        weakest: string;
        weakestPhase: string;
        weakestScore: number;
        strongest: string;
        strongestPhase: string;
        strongestScore: number;
        gap: number;
      } | null;
    } | null;
    strengths: string[] | null;
    improvements: string[] | null;
    summary: string | null;
    nextMoves: string[] | null;
    contentPillars: string[] | null;
    patterns: {
      breakout: {
        sampleSize: number;
        keyDifference: { phase: string; label: string; delta: number };
        insight: string;
      } | null;
    };
    evolution: {
      currentTier: number;
      possiblePaths: string[];
      archetypeHistory: { primary?: string; reason?: string; score?: number; timestamp?: number }[];
      daysSinceArchetypeChange: number | null;
    };
    trajectory: { score: number; archetype: string; date: string }[];
    meta: {
      scannedAt: string;
      totalScans: number;
      daysSinceFirstScan: number | null;
      daysSinceLastScan: number | null;
      scoreChange: number | null;
      averageScore: number | null;
      isStale: boolean;
    };
  };
}

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const SANS = "'Helvetica Neue', sans-serif";
const KLEIN = '#0047FF';

function AsciiBar({ value, width = 16 }: { value: number; width?: number }) {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// =============================================================================
// Shared Components
// =============================================================================

function TerminalBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        width: '100%',
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(0, 0, 0, 0.02)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
        </div>
        <span style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(0,0,0,0.35)', marginLeft: 'auto' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '24px 20px' }}>{children}</div>
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(0,0,0,0.3)', marginBottom: '14px', textTransform: 'uppercase' as const }}>
      {children}
    </div>
  );
}

function Narrative({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: SANS, fontSize: '14px', color: 'rgba(0,0,0,0.7)', lineHeight: 1.7, margin: '0 0 12px 0' }}>
      {children}
    </p>
  );
}

function EmptyState({ section, totalScans }: { section: string; totalScans: number }) {
  return (
    <div style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.4)', fontStyle: 'italic', padding: '12px 0' }}>
      {getEmptyStateMessage(section, totalScans)}
    </div>
  );
}

function StaleBanner({ daysSinceLastScan, username }: { daysSinceLastScan: number; username: string }) {
  const message = getStaleDataMessage(daysSinceLastScan);
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        width: '100%',
        maxWidth: '640px',
        padding: '12px 16px',
        background: 'rgba(245, 158, 11, 0.06)',
        border: '1px solid rgba(245, 158, 11, 0.15)',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '24px',
      }}
    >
      <span style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.6)' }}>{message}</span>
      <a
        href={`/?scan=${username}`}
        style={{
          fontFamily: MONO,
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: KLEIN,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        SCAN AGAIN →
      </a>
    </motion.div>
  );
}

// =============================================================================
// Creator View — "My Growth"
// =============================================================================

function CreatorView({ data }: { data: IntelligenceReport }) {
  const r = data.report;
  const archetypeInfo = getArchetypeInfo(r.archetype.name);
  const phases = r.phases;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Archetype Identity */}
      <TerminalBox title="identity">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontFamily: MONO, fontSize: '28px', color: r.archetype.color, lineHeight: 1, marginBottom: '6px' }}>
              {r.archetype.emoji} {r.archetype.name}
            </div>
            <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em' }}>
              {r.archetype.tierLabel} · TIER {r.archetype.tier} · {r.archetype.rarity}% OF CREATORS
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: MONO, fontSize: '36px', color: '#000', fontWeight: 500, lineHeight: 1 }}>
              {r.score.current}
            </div>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.15em' }}>BRAND SCORE</div>
          </div>
        </div>

        {archetypeInfo && <Narrative>{getArchetypeIdentityNarrative(archetypeInfo)}</Narrative>}

        <div style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.5)', lineHeight: 1.6 }}>
          {getScoreContextNarrative(r.score.current, r.score.percentile, r.score.cohortAverage, r.archetype.name, r.score.influenceTier)}
        </div>
      </TerminalBox>

      {/* 2. Phase Intelligence */}
      {phases ? (
        <TerminalBox title="phase-intelligence">
          <SectionLabel>Phase Analysis</SectionLabel>
          {(['define', 'check', 'generate', 'scale'] as const).map((phase, i) => {
            const score = phases.scores[phase];
            const comp = phases.comparison?.find((c) => c.phase === phase);
            return (
              <motion.div
                key={phase}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: i < 3 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', fontFamily: MONO, fontSize: '12px' }}>
                  <span style={{ width: '72px', color: 'rgba(0,0,0,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{phase}</span>
                  <span style={{ color: 'rgba(0,0,0,0.25)', whiteSpace: 'pre', fontSize: '11px' }}>[{AsciiBar({ value: score })}]</span>
                  <span style={{ color: '#000', fontWeight: 500 }}>{score}</span>
                  {comp && (
                    <span style={{ fontSize: '10px', color: comp.delta > 0 ? '#10B981' : comp.delta < 0 ? '#EF4444' : 'rgba(0,0,0,0.3)' }}>
                      {comp.delta > 0 ? `+${comp.delta}` : comp.delta < 0 ? `${comp.delta}` : '±0'}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.6)', lineHeight: 1.6 }}>
                  {getPhaseNarrative(phase, score, r.archetype.name, comp?.delta ?? null)}
                </div>
              </motion.div>
            );
          })}

          {/* Critical gap callout */}
          {phases.criticalGap && phases.criticalGap.gap > 10 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                marginTop: '8px',
                padding: '14px 16px',
                background: 'rgba(0, 71, 255, 0.04)',
                border: '1px solid rgba(0, 71, 255, 0.12)',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: '10px', color: KLEIN, letterSpacing: '0.1em', marginBottom: '6px' }}>⚑ KEY INSIGHT</div>
              <div style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.7)', lineHeight: 1.6 }}>
                {getCriticalGapNarrative(phases.criticalGap.strongest, phases.criticalGap.strongestScore, phases.criticalGap.weakest, phases.criticalGap.weakestScore, phases.criticalGap.gap, r.archetype.name)}
              </div>
            </motion.div>
          )}
        </TerminalBox>
      ) : (
        <TerminalBox title="phase-intelligence">
          <SectionLabel>Phase Analysis</SectionLabel>
          <EmptyState section="phases" totalScans={r.meta.totalScans} />
        </TerminalBox>
      )}

      {/* 3. Content Pillars */}
      {r.contentPillars && r.contentPillars.length > 0 ? (
        <TerminalBox title="content-pillars">
          <SectionLabel>What You&apos;re Known For</SectionLabel>
          <Narrative>Your timeline signals these recurring themes:</Narrative>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {r.contentPillars.map((pillar, i) => (
              <span
                key={i}
                style={{
                  padding: '6px 14px',
                  background: 'rgba(0, 71, 255, 0.06)',
                  border: '1px solid rgba(0, 71, 255, 0.12)',
                  borderRadius: '20px',
                  fontFamily: MONO,
                  fontSize: '11px',
                  color: 'rgba(0,0,0,0.7)',
                  letterSpacing: '0.03em',
                }}
              >
                {pillar}
              </span>
            ))}
          </div>
        </TerminalBox>
      ) : null}

      {/* 4. Your Strengths */}
      {r.strengths && r.strengths.length > 0 ? (
        <TerminalBox title="strengths">
          <SectionLabel>What&apos;s Working</SectionLabel>
          {r.strengths.map((s, i) => (
            <div key={i} style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.7)', padding: '6px 0', display: 'flex', gap: '10px', lineHeight: 1.5 }}>
              <span style={{ fontFamily: MONO, color: '#10B981', fontSize: '11px', flexShrink: 0 }}>[+]</span>
              {s}
            </div>
          ))}
        </TerminalBox>
      ) : null}

      {/* 5. Your Next Move */}
      {r.nextMoves && r.nextMoves.length > 0 ? (
        <TerminalBox title="next-moves">
          <SectionLabel>Your Next Move</SectionLabel>
          <Narrative>Based on your archetype, gaps, and what top scorers do — here&apos;s what to focus on:</Narrative>
          {r.nextMoves.map((move, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '14px 16px',
                marginBottom: '8px',
                background: 'rgba(0, 71, 255, 0.03)',
                border: '1px solid rgba(0, 71, 255, 0.08)',
                borderRadius: '4px',
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: '14px', color: KLEIN, fontWeight: 500, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.7)', lineHeight: 1.6 }}>{move}</span>
            </motion.div>
          ))}
        </TerminalBox>
      ) : (
        <TerminalBox title="next-moves">
          <SectionLabel>Your Next Move</SectionLabel>
          <EmptyState section="nextMoves" totalScans={r.meta.totalScans} />
        </TerminalBox>
      )}

      {/* 6. What's Holding You Back */}
      {r.improvements && r.improvements.length > 0 ? (
        <TerminalBox title="growth-areas">
          <SectionLabel>What&apos;s Holding You Back</SectionLabel>
          {r.improvements.map((s, i) => (
            <div key={i} style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.7)', padding: '6px 0', display: 'flex', gap: '10px', lineHeight: 1.5 }}>
              <span style={{ fontFamily: MONO, color: '#F59E0B', fontSize: '11px', flexShrink: 0 }}>[!]</span>
              {s}
            </div>
          ))}
        </TerminalBox>
      ) : null}

      {/* 7. Pattern Intelligence */}
      {r.patterns.breakout ? (
        <TerminalBox title="patterns">
          <SectionLabel>{r.archetype.name}s Who Broke Through</SectionLabel>
          <Narrative>
            Based on {r.patterns.breakout.sampleSize} {r.archetype.name}s who scored 75+, the biggest differentiator was{' '}
            <strong style={{ color: KLEIN }}>{r.patterns.breakout.keyDifference.label}</strong> — {r.patterns.breakout.keyDifference.delta} points above the cohort average.
          </Narrative>
          <div style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.6)', lineHeight: 1.6 }}>
            {r.patterns.breakout.insight}
          </div>
        </TerminalBox>
      ) : null}

      {/* 8. Evolution Roadmap */}
      {archetypeInfo && (
        <TerminalBox title="evolution">
          <SectionLabel>Evolution Roadmap</SectionLabel>
          <Narrative>{getEvolutionNarrative(archetypeInfo, r.score.current, r.evolution.daysSinceArchetypeChange)}</Narrative>
          {r.evolution.possiblePaths.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {r.evolution.possiblePaths.map((path) => {
                const pathInfo = getArchetypeInfo(path);
                return (
                  <span
                    key={path}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '4px',
                      fontFamily: MONO,
                      fontSize: '11px',
                      color: pathInfo?.color || 'rgba(0,0,0,0.6)',
                    }}
                  >
                    {pathInfo?.emoji} {path}
                  </span>
                );
              })}
            </div>
          )}
        </TerminalBox>
      )}

      {/* 9. Score Trajectory */}
      {r.trajectory.length > 1 ? (
        <TerminalBox title="trajectory">
          <SectionLabel>Score History · {r.meta.totalScans} Scans</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {r.trajectory.slice(-10).map((entry, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: MONO, fontSize: '11px' }}>
                <span style={{ color: 'rgba(0,0,0,0.35)', minWidth: '70px' }}>
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span style={{ color: 'rgba(0,0,0,0.2)', whiteSpace: 'pre', fontSize: '10px' }}>[{AsciiBar({ value: entry.score, width: 12 })}]</span>
                <span style={{ color: '#000', fontWeight: 500 }}>{entry.score}</span>
                {i > 0 && (() => {
                  const prev = arr[i - 1].score;
                  const diff = entry.score - prev;
                  return diff !== 0 ? (
                    <span style={{ fontSize: '10px', color: diff > 0 ? '#10B981' : '#EF4444' }}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
          {r.meta.scoreChange != null && r.meta.scoreChange !== 0 && (
            <div style={{ marginTop: '12px', fontFamily: SANS, fontSize: '12px', color: 'rgba(0,0,0,0.5)' }}>
              Net change since first scan: <span style={{ color: r.meta.scoreChange > 0 ? '#10B981' : '#EF4444', fontWeight: 500 }}>
                {r.meta.scoreChange > 0 ? '+' : ''}{r.meta.scoreChange} pts
              </span>
            </div>
          )}
        </TerminalBox>
      ) : (
        <TerminalBox title="trajectory">
          <SectionLabel>Score History</SectionLabel>
          <EmptyState section="trajectory" totalScans={r.meta.totalScans} />
        </TerminalBox>
      )}

      {/* Summary */}
      {r.summary && (
        <div style={{ textAlign: 'center', padding: '16px 20px', fontFamily: SANS, fontSize: '14px', color: 'rgba(0,0,0,0.45)', lineHeight: 1.6, fontStyle: 'italic' }}>
          &quot;{r.summary}&quot;
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Brand View — "Brand Brief"
// =============================================================================

function BrandView({ data }: { data: IntelligenceReport }) {
  const r = data.report;
  const phases = r.phases;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Creator Assessment */}
      <TerminalBox title="creator-assessment">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.15em', marginBottom: '8px' }}>@{data.username}</div>
            <div style={{ fontFamily: MONO, fontSize: '24px', color: r.archetype.color, marginBottom: '4px' }}>{r.archetype.emoji} {r.archetype.name}</div>
            <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(0,0,0,0.4)', letterSpacing: '0.08em' }}>
              {r.archetype.tierLabel} · Tier {r.archetype.tier} · {r.archetype.rarity}% rarity
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: MONO, fontSize: '32px', color: '#000', fontWeight: 500 }}>{r.score.current}</div>
            <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(0,0,0,0.3)', letterSpacing: '0.15em' }}>
              {r.score.influenceTier.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ fontFamily: SANS, fontSize: '14px', color: 'rgba(0,0,0,0.6)', lineHeight: 1.6, marginTop: '16px' }}>
          {r.archetype.description}
        </div>
      </TerminalBox>

      {/* 2. Phase Breakdown */}
      {phases ? (
        <TerminalBox title="phase-breakdown">
          <SectionLabel>Phase Breakdown</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 40px 60px', gap: '8px 12px', alignItems: 'center', fontFamily: MONO, fontSize: '12px' }}>
            <span style={{ color: 'rgba(0,0,0,0.3)', fontSize: '9px', letterSpacing: '0.1em' }}>PHASE</span>
            <span style={{ color: 'rgba(0,0,0,0.3)', fontSize: '9px', letterSpacing: '0.1em' }}>SCORE</span>
            <span style={{ color: 'rgba(0,0,0,0.3)', fontSize: '9px', letterSpacing: '0.1em' }}>PTS</span>
            <span style={{ color: 'rgba(0,0,0,0.3)', fontSize: '9px', letterSpacing: '0.1em' }}>VS COHORT</span>
            {(['define', 'check', 'generate', 'scale'] as const).map((phase) => {
              const score = phases.scores[phase];
              const comp = phases.comparison?.find((c) => c.phase === phase);
              return [
                <span key={`${phase}-l`} style={{ color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase' as const }}>{phase}</span>,
                <span key={`${phase}-b`} style={{ color: 'rgba(0,0,0,0.25)', whiteSpace: 'pre', fontSize: '10px' }}>[{AsciiBar({ value: score, width: 14 })}]</span>,
                <span key={`${phase}-s`} style={{ color: '#000', fontWeight: 500 }}>{score}</span>,
                <span key={`${phase}-d`} style={{ fontSize: '11px', color: comp?.delta && comp.delta > 0 ? '#10B981' : comp?.delta && comp.delta < 0 ? '#EF4444' : 'rgba(0,0,0,0.3)' }}>
                  {comp ? (comp.delta > 0 ? `+${comp.delta}` : comp.delta < 0 ? `${comp.delta}` : '±0') : '—'}
                </span>,
              ];
            })}
          </div>
        </TerminalBox>
      ) : null}

      {/* 3. Content Pillars */}
      {r.contentPillars && r.contentPillars.length > 0 && (
        <TerminalBox title="content-pillars">
          <SectionLabel>Content Focus Areas</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {r.contentPillars.map((pillar, i) => (
              <span key={i} style={{ padding: '5px 12px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '4px', fontFamily: MONO, fontSize: '11px', color: 'rgba(0,0,0,0.6)' }}>
                {pillar}
              </span>
            ))}
          </div>
        </TerminalBox>
      )}

      {/* 4. Strengths */}
      {r.strengths && r.strengths.length > 0 && (
        <TerminalBox title="strengths">
          <SectionLabel>Key Strengths</SectionLabel>
          {r.strengths.map((s, i) => (
            <div key={i} style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.7)', padding: '4px 0', display: 'flex', gap: '8px' }}>
              <span style={{ fontFamily: MONO, color: '#10B981', fontSize: '10px' }}>•</span> {s}
            </div>
          ))}
        </TerminalBox>
      )}

      {/* 5. Summary Assessment */}
      {r.summary && (
        <TerminalBox title="assessment">
          <SectionLabel>Summary Assessment</SectionLabel>
          <div style={{ fontFamily: SANS, fontSize: '14px', color: 'rgba(0,0,0,0.7)', lineHeight: 1.7 }}>{r.summary}</div>
        </TerminalBox>
      )}

      {/* 6. Cohort Context */}
      <TerminalBox title="cohort">
        <SectionLabel>Cohort Context</SectionLabel>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontFamily: MONO, fontSize: '12px' }}>
          {r.score.percentile != null && (
            <div>
              <div style={{ fontSize: '20px', color: KLEIN, fontWeight: 500 }}>Top {100 - r.score.percentile}%</div>
              <div style={{ fontSize: '9px', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.1em' }}>PERCENTILE</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '20px', color: '#000' }}>{r.score.cohortSize}</div>
            <div style={{ fontSize: '9px', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.1em' }}>{r.archetype.name}S</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', color: 'rgba(0,0,0,0.5)' }}>{r.score.cohortAverage}</div>
            <div style={{ fontSize: '9px', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.1em' }}>COHORT AVG</div>
          </div>
        </div>
      </TerminalBox>

      {/* 7. Scan History */}
      <TerminalBox title="verification">
        <SectionLabel>Verification</SectionLabel>
        <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(0,0,0,0.5)', lineHeight: 2 }}>
          <div>Total scans: {r.meta.totalScans}</div>
          <div>Last scanned: {r.meta.scannedAt ? new Date(r.meta.scannedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}</div>
          {r.meta.daysSinceFirstScan != null && <div>Tracking since: {r.meta.daysSinceFirstScan} days ago</div>}
          <div>Influence tier: {r.score.influenceTier}</div>
        </div>
      </TerminalBox>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

function IntelligencePageContent() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoFetched, setAutoFetched] = useState(false);
  const [view, setView] = useState<ReportView>('creator');

  useEffect(() => {
    const u = searchParams.get('u');
    if (u && !autoFetched) {
      setUsername(u);
      setAutoFetched(true);
    }
  }, [searchParams, autoFetched]);

  useEffect(() => {
    if (autoFetched && username && !report && !loading) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetched, username]);

  async function fetchReport() {
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const res = await fetch(`/api/intelligence/report?username=${encodeURIComponent(username.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to fetch report');
        return;
      }
      setReport(data);
    } catch {
      setError('Failed to connect. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 80px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: MONO, fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 400, letterSpacing: '0.12em', color: '#000', margin: '0 0 6px 0' }}>
          INTELLIGENCE REPORT
        </h1>
        <p style={{ fontFamily: SANS, fontSize: '14px', color: 'rgba(0,0,0,0.4)', margin: 0 }}>
          Your brand, decoded by BrandOS.
        </p>
      </motion.div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', width: '100%', maxWidth: '440px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '4px' }}>
          <span style={{ fontFamily: MONO, fontSize: '14px', color: 'rgba(0,0,0,0.25)' }}>@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReport()}
            placeholder="username"
            style={{ flex: 1, border: 'none', outline: 'none', fontFamily: MONO, fontSize: '14px', color: '#000', background: 'transparent' }}
          />
        </div>
        <button
          onClick={fetchReport}
          disabled={loading || !username.trim()}
          style={{ padding: '12px 24px', background: loading ? 'rgba(0,0,0,0.08)' : KLEIN, color: '#fff', border: 'none', borderRadius: '4px', fontFamily: MONO, fontSize: '11px', letterSpacing: '0.1em', cursor: loading ? 'wait' : 'pointer', opacity: !username.trim() ? 0.4 : 1 }}
        >
          {loading ? 'LOADING...' : 'ANALYZE'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.12)', borderRadius: '4px', maxWidth: '440px', width: '100%' }}>
          <div style={{ fontFamily: MONO, fontSize: '11px', color: '#EF4444', marginBottom: '6px' }}>[ERROR]</div>
          <div style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(0,0,0,0.6)' }}>{error}</div>
          <button onClick={fetchReport} style={{ marginTop: '8px', padding: '6px 16px', background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '4px', fontFamily: MONO, fontSize: '10px', cursor: 'pointer', color: 'rgba(0,0,0,0.5)' }}>
            RETRY
          </button>
        </div>
      )}

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontFamily: MONO, fontSize: '12px', color: 'rgba(0,0,0,0.4)', textAlign: 'center' }}>
            <div>&gt; brandos.analyze(&quot;{username}&quot;)</div>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ color: KLEIN, marginTop: '8px' }}>
              compiling intelligence report...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report */}
      <AnimatePresence>
        {report && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', maxWidth: '640px' }}>
            {/* Stale data banner */}
            {report.report.meta.isStale && report.report.meta.daysSinceLastScan != null && (
              <StaleBanner daysSinceLastScan={report.report.meta.daysSinceLastScan} username={report.username} />
            )}

            {/* View toggle */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              {([['creator', 'MY GROWTH'], ['brand', 'BRAND BRIEF']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: view === key ? `2px solid ${KLEIN}` : '2px solid transparent',
                    fontFamily: MONO,
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    color: view === key ? KLEIN : 'rgba(0,0,0,0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* View content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {view === 'creator' ? <CreatorView data={report} /> : <BrandView data={report} />}
              </motion.div>
            </AnimatePresence>

            {/* Brand Card CTA */}
            <motion.a
              href={`/card/${report.username}`}
              target="_blank"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                display: 'block',
                padding: '16px 24px',
                marginTop: '24px',
                background: '#050505',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.1em', color: '#fff', marginBottom: '4px' }}>
                YOUR BRAND IDENTITY CARD
              </div>
              <div style={{ fontFamily: SANS, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                Share with brands or put in your bio → mybrandos.app/card/{report.username}
              </div>
            </motion.a>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: '9px', color: 'rgba(0,0,0,0.2)', letterSpacing: '0.12em', paddingTop: '24px' }}>
              BRANDOS INTELLIGENCE · {new Date().getFullYear()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function IntelligencePage() {
  return (
    <Suspense>
      <IntelligencePageContent />
    </Suspense>
  );
}

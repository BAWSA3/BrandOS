'use client';

import { motion } from 'framer-motion';
import WalkthroughSection from '../WalkthroughSection';
import { ParallaxCard } from '../motion';

interface ScoreWalkthroughProps {
  score: number;
  phases: {
    define: { score: number; insights: string[] };
    check: { score: number; insights: string[] };
    generate: { score: number; insights: string[] };
    scale: { score: number; insights: string[] };
  };
  summary: string;
  theme: string;
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'EXCEPTIONAL';
  if (score >= 80) return 'EXCELLENT';
  if (score >= 70) return 'STRONG';
  if (score >= 60) return 'GOOD';
  if (score >= 50) return 'DECENT';
  if (score >= 40) return 'NEEDS WORK';
  return 'CRITICAL';
}

function getPercentile(score: number): number {
  // Estimate percentile based on score distribution
  if (score >= 90) return 95;
  if (score >= 85) return 90;
  if (score >= 80) return 85;
  if (score >= 75) return 75;
  if (score >= 70) return 65;
  if (score >= 65) return 55;
  if (score >= 60) return 45;
  if (score >= 55) return 35;
  if (score >= 50) return 25;
  return 15;
}

function getScoreTier(score: number): string {
  if (score >= 80) return "You're in the top 15% of creators we've analyzed.";
  if (score >= 70) return "You're ahead of most creators in your space.";
  if (score >= 60) return 'You have solid foundations to build on.';
  if (score >= 50) return 'There are clear opportunities for improvement.';
  return 'Significant improvements needed to stand out.';
}

function getLowestPhase(phases: ScoreWalkthroughProps['phases']): { name: string; score: number } {
  const phaseScores = [
    { name: 'Define', score: phases.define.score },
    { name: 'Check', score: phases.check.score },
    { name: 'Generate', score: phases.generate.score },
    { name: 'Scale', score: phases.scale.score },
  ];
  return phaseScores.reduce((min, p) => (p.score < min.score ? p : min));
}

function getHighestPhase(phases: ScoreWalkthroughProps['phases']): { name: string; score: number } {
  const phaseScores = [
    { name: 'Define', score: phases.define.score },
    { name: 'Check', score: phases.check.score },
    { name: 'Generate', score: phases.generate.score },
    { name: 'Scale', score: phases.scale.score },
  ];
  return phaseScores.reduce((max, p) => (p.score > max.score ? p : max));
}

// Average scores for comparison (based on typical creator data)
const AVERAGE_SCORES = {
  overall: 62,
  define: 65,
  check: 58,
  generate: 55,
  scale: 70,
};

export default function ScoreWalkthrough({ score, phases, summary, theme }: ScoreWalkthroughProps) {
  const label = getScoreLabel(score);
  const percentile = getPercentile(score);
  const lowestPhase = getLowestPhase(phases);
  const highestPhase = getHighestPhase(phases);
  const accentColor = '#2E6AFF';
  const isDark = theme === 'dark';

  const scoreDiff = score - AVERAGE_SCORES.overall;
  const scoreDiffText = scoreDiff >= 0 ? `+${scoreDiff}` : `${scoreDiff}`;

  const howWeCalculated = `Composite of Define (${phases.define.score}) for identity clarity, Check (${phases.check.score}) for consistency, Generate (${phases.generate.score}) for profile completeness, and Scale (${phases.scale.score}) for growth readiness. Weighted equally across all dimensions.`;

  const whyItMatters = `${getScoreTier(score)} Creators with scores above 70 see 2-3x better engagement rates. Your strongest area is ${highestPhase.name} (${highestPhase.score}).`;

  const whatYouCanDo = [
    `Focus on your ${lowestPhase.name} score (${lowestPhase.score}) - this is your biggest opportunity for improvement.`,
    score < 70
      ? 'Optimize your profile bio and visual consistency to boost your Define score.'
      : 'Maintain your strong foundation while experimenting with new content formats.',
    'Use the detailed breakdown in your dashboard to target specific metrics.',
  ];

  return (
    <WalkthroughSection
      label="Brand Score"
      howWeCalculated={howWeCalculated}
      whyItMatters={whyItMatters}
      whatYouCanDo={whatYouCanDo}
      theme={theme}
      accentColor={accentColor}
    >
      <div className="space-y-4">
        {/* Top Row: Score + Percentile + Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Hero Score Card - Blue */}
          <ParallaxCard
            depth={0.4}
            direction="up"
            className="md:col-span-1 rounded-[4px] p-6 relative overflow-hidden"
            style={{
              background: accentColor,
              minHeight: '180px',
            }}
          >
            {/* Grid Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Score Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div
                className="text-[10px] tracking-wider"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                SYSTEM_SCORE
              </div>

              <div className="flex items-end justify-between mt-2">
                <motion.div
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, type: 'spring', damping: 15 }}
                  style={{
                    fontSize: 'clamp(64px, 14vw, 80px)',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                    letterSpacing: '-0.04em',
                    lineHeight: 0.85,
                  }}
                >
                  {score}
                </motion.div>

                <div
                  className="px-3 py-1.5 rounded-full mb-1"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: '#FFFFFF',
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </span>
                </div>
              </div>
            </div>
          </ParallaxCard>

          {/* Percentile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-[4px] p-5 flex flex-col justify-between"
            style={{
              background: isDark ? '#1A1A1A' : '#F5F5F5',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              minHeight: '180px',
            }}
          >
            <div
              className="text-[10px] tracking-wider"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              PERCENTILE RANK
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-baseline gap-1">
                <span
                  style={{
                    fontSize: '48px',
                    fontWeight: 700,
                    color: '#10B981',
                    fontFamily: "'Helvetica Neue', sans-serif",
                    lineHeight: 1,
                  }}
                >
                  {percentile}
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    fontFamily: "'Helvetica Neue', sans-serif",
                  }}
                >
                  %
                </span>
              </div>
              <p
                className="text-xs mt-2"
                style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
              >
                You outperform {percentile}% of creators we&apos;ve analyzed
              </p>
            </div>

            {/* Mini progress bar */}
            <div className="mt-2">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percentile}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: '#10B981' }}
                />
              </div>
            </div>
          </motion.div>

          {/* Comparison Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-[4px] p-5 flex flex-col justify-between"
            style={{
              background: isDark ? '#1A1A1A' : '#F5F5F5',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              minHeight: '180px',
            }}
          >
            <div
              className="text-[10px] tracking-wider"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              VS AVERAGE CREATOR
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-baseline gap-1">
                <span
                  style={{
                    fontSize: '48px',
                    fontWeight: 700,
                    color: scoreDiff >= 0 ? '#10B981' : '#EF4444',
                    fontFamily: "'Helvetica Neue', sans-serif",
                    lineHeight: 1,
                  }}
                >
                  {scoreDiffText}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    fontFamily: "'Helvetica Neue', sans-serif",
                  }}
                >
                  pts
                </span>
              </div>
              <p
                className="text-xs mt-2"
                style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
              >
                Average creator scores {AVERAGE_SCORES.overall}/100
              </p>
            </div>

            {/* Comparison visualization */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1">
                <div className="flex justify-between text-[9px] mb-1">
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>AVG</span>
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>YOU</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-2 rounded"
                    style={{
                      width: `${AVERAGE_SCORES.overall}%`,
                      background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    }}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${score - AVERAGE_SCORES.overall}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-2 rounded"
                    style={{ background: scoreDiff >= 0 ? '#10B981' : '#EF4444' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Phase Breakdown with Progress Bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-[4px] p-5"
          style={{
            background: isDark ? '#1A1A1A' : '#F5F5F5',
            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <div
            className="text-[10px] tracking-wider mb-4"
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            }}
          >
            PHASE BREAKDOWN
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'DEFINE', score: phases.define.score, avg: AVERAGE_SCORES.define, desc: 'Identity clarity & recognition' },
              { name: 'CHECK', score: phases.check.score, avg: AVERAGE_SCORES.check, desc: 'Consistency & coherence' },
              { name: 'GENERATE', score: phases.generate.score, avg: AVERAGE_SCORES.generate, desc: 'Profile completeness' },
              { name: 'SCALE', score: phases.scale.score, avg: AVERAGE_SCORES.scale, desc: 'Growth readiness' },
            ].map((phase, index) => {
              const diff = phase.score - phase.avg;
              const isLowest = phase.name.toLowerCase() === lowestPhase.name.toLowerCase();
              const isHighest = phase.name.toLowerCase() === highestPhase.name.toLowerCase();

              return (
                <motion.div
                  key={phase.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="p-3 rounded-lg"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    border: isLowest
                      ? '1px solid rgba(239, 68, 68, 0.3)'
                      : isHighest
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          fontFamily: "'VCR OSD Mono', monospace",
                          fontSize: '11px',
                          letterSpacing: '0.05em',
                          color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        }}
                      >
                        {phase.name}
                      </span>
                      {isLowest && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                          FOCUS
                        </span>
                      )}
                      {isHighest && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                          BEST
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: '18px',
                          fontWeight: 600,
                          color: phase.score >= 70 ? '#10B981' : phase.score >= 50 ? '#F59E0B' : '#EF4444',
                        }}
                      >
                        {phase.score}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{
                          color: diff >= 0 ? '#10B981' : '#EF4444',
                        }}
                      >
                        {diff >= 0 ? '+' : ''}{diff} vs avg
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-2 rounded-full overflow-hidden mb-1.5"
                    style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${phase.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                      className="h-full rounded-full"
                      style={{
                        background: phase.score >= 70 ? '#10B981' : phase.score >= 50 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>

                  <p
                    className="text-[11px]"
                    style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                  >
                    {phase.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Key Insights Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="rounded-[4px] p-4"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <div className="text-[10px] tracking-wider text-green-400 mb-2" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
              TOP STRENGTH
            </div>
            <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
              Your <strong>{highestPhase.name}</strong> score of {highestPhase.score} shows strong {highestPhase.name === 'Define' ? 'brand identity' : highestPhase.name === 'Check' ? 'consistency' : highestPhase.name === 'Generate' ? 'profile optimization' : 'growth potential'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="rounded-[4px] p-4"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="text-[10px] tracking-wider text-red-400 mb-2" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
              FOCUS AREA
            </div>
            <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
              <strong>{lowestPhase.name}</strong> at {lowestPhase.score} is {lowestPhase.score - AVERAGE_SCORES[lowestPhase.name.toLowerCase() as keyof typeof AVERAGE_SCORES] >= 0 ? 'still above average but' : ''} your best opportunity to improve
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="rounded-[4px] p-4"
            style={{
              background: 'rgba(46, 106, 255, 0.1)',
              border: '1px solid rgba(46, 106, 255, 0.2)',
            }}
          >
            <div className="text-[10px] tracking-wider text-blue-400 mb-2" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
              ENGAGEMENT POTENTIAL
            </div>
            <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
              Scores like yours correlate with <strong>{score >= 80 ? '3-4x' : score >= 70 ? '2-3x' : '1.5-2x'}</strong> higher engagement than average creators
            </p>
          </motion.div>
        </div>
      </div>
    </WalkthroughSection>
  );
}

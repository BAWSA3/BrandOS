'use client';

import { motion } from 'framer-motion';
import WalkthroughSection from '../WalkthroughSection';
import { StaggerContainer, StaggerItem } from '../motion';
import type { ParallaxLayerConfig } from '../motion';

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

interface PillarsWalkthroughProps {
  contentPillars?: ContentPillar[];
  performanceInsights?: PerformanceInsights;
  theme: string;
  parallaxLayers?: ParallaxLayerConfig[];
}

const PILLAR_COLORS = ['#FFFFFF', '#0047FF', '#FF6B00'];

// Calculate balance score (higher is more balanced)
function getBalanceScore(pillars: ContentPillar[]): number {
  if (pillars.length === 0) return 0;
  const frequencies = pillars.map(p => p.frequency);
  const avg = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
  const variance = frequencies.reduce((sum, f) => sum + Math.pow(f - avg, 2), 0) / frequencies.length;
  // Lower variance = higher balance score
  return Math.round(Math.max(0, 100 - variance));
}

// Get balance label
function getBalanceLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Well Balanced', color: '#10B981' };
  if (score >= 50) return { label: 'Moderate', color: '#F59E0B' };
  return { label: 'Unbalanced', color: '#EF4444' };
}

// Calculate engagement efficiency
function getEngagementEfficiency(pillars: ContentPillar[]): { best: string; worst: string; efficiency: number } {
  if (pillars.length === 0) return { best: 'N/A', worst: 'N/A', efficiency: 0 };

  const sorted = [...pillars].sort((a, b) => (b.avgEngagement || 0) - (a.avgEngagement || 0));
  const avgEngagement = pillars.reduce((sum, p) => sum + (p.avgEngagement || 0), 0) / pillars.length;

  return {
    best: sorted[0]?.name || 'N/A',
    worst: sorted[sorted.length - 1]?.name || 'N/A',
    efficiency: Math.round(avgEngagement * 10) / 10,
  };
}

export default function PillarsWalkthrough({
  contentPillars,
  performanceInsights,
  theme,
  parallaxLayers,
}: PillarsWalkthroughProps) {
  const pillars = contentPillars?.slice(0, 3) || [];
  const hasPillars = pillars.length > 0;
  const isDark = theme === 'dark';

  const balanceScore = getBalanceScore(pillars);
  const balanceInfo = getBalanceLabel(balanceScore);
  const engagementData = getEngagementEfficiency(pillars);

  const howWeCalculated = hasPillars
    ? `Categorized your posts into themes: ${pillars.map((p) => `${p.name} (${p.frequency}%)`).join(', ')}. Balance score: ${balanceScore}/100.`
    : 'More content needed to identify pillars.';

  const whyItMatters = `Content pillars create expectations. Balanced distribution keeps followers engaged and prevents content fatigue.`;

  const whatYouCanDo: string[] = [];

  if (hasPillars) {
    const topPillar = pillars[0];
    const lowestPillar = pillars[pillars.length - 1];

    if (topPillar.frequency > 60) {
      whatYouCanDo.push(
        `Your "${topPillar.name}" pillar dominates at ${topPillar.frequency}%. Consider balancing with more "${lowestPillar?.name || 'diverse'}" content.`
      );
    }
    if (performanceInsights?.bestFormats?.length) {
      whatYouCanDo.push(
        `Double down on your best-performing formats: ${performanceInsights.bestFormats.slice(0, 2).join(', ')}.`
      );
    }
    whatYouCanDo.push(
      'Create a content calendar that cycles through all pillars for consistent variety.'
    );
  } else {
    whatYouCanDo.push(
      'Post more consistently to build enough data for pillar analysis.',
      'Identify 2-3 main topics you want to be known for and focus on them.',
      'Track which content types get the most engagement and double down.'
    );
  }

  return (
    <WalkthroughSection
      label="Content Distribution"
      howWeCalculated={howWeCalculated}
      whyItMatters={whyItMatters}
      whatYouCanDo={whatYouCanDo}
      theme={theme}
      accentColor="#FF6B00"
      parallaxLayers={parallaxLayers}
    >
      {/* Bento Grid Layout for Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {hasPillars ? (
          <>
            {/* Pillar Chart Card - Dark with Grid Pattern */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="md:col-span-2 rounded-[4px] p-5 md:p-6 relative overflow-hidden"
              style={{
                background: isDark ? '#1A1A1A' : '#F8F8F8',
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {/* Grid Pattern Overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(rgba(255, 107, 0, 0.3) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-5">
                  <div
                    className="text-[10px] tracking-wider"
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    }}
                  >
                    CONTENT PILLARS
                  </div>
                  {/* Pillar Count Badge */}
                  <div
                    className="px-2 py-1 rounded"
                    style={{
                      background: 'rgba(255, 107, 0, 0.2)',
                      border: '1px solid rgba(255, 107, 0, 0.3)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '10px',
                        color: '#FF6B00',
                      }}
                    >
                      {pillars.length} PILLARS
                    </span>
                  </div>
                </div>

                {/* Pillar Bars with Engagement */}
                <div className="space-y-5">
                  {pillars.map((pillar, index) => (
                    <motion.div
                      key={pillar.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                    >
                      {/* Label & Value */}
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            style={{
                              fontFamily: "'Helvetica Neue', sans-serif",
                              fontSize: '14px',
                              color: isDark ? '#FFFFFF' : '#000000',
                            }}
                          >
                            {pillar.name}
                          </span>
                          {index === 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px]"
                              style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#10B981',
                                fontFamily: "'VCR OSD Mono', monospace",
                              }}
                            >
                              TOP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {pillar.avgEngagement > 0 && (
                            <span
                              className="text-xs"
                              style={{
                                fontFamily: "'VCR OSD Mono', monospace",
                                color: '#10B981',
                              }}
                            >
                              {pillar.avgEngagement.toFixed(1)}% eng
                            </span>
                          )}
                          <span
                            style={{
                              fontFamily: "'VCR OSD Mono', monospace",
                              fontSize: '14px',
                              letterSpacing: '0.05em',
                              color: PILLAR_COLORS[index],
                            }}
                          >
                            {pillar.frequency}%
                          </span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div
                        className="h-3 rounded-[2px] overflow-hidden"
                        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pillar.frequency}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                          className="h-full rounded-[2px]"
                          style={{
                            background: PILLAR_COLORS[index],
                            boxShadow: `0 0 15px ${PILLAR_COLORS[index]}40`,
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Column */}
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Balance Score Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-[4px] p-4"
                style={{
                  background: '#FF6B00',
                }}
              >
                <div
                  className="text-[10px] tracking-wider mb-2"
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  BALANCE SCORE
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: '#FFFFFF' }}
                  >
                    {balanceScore}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    /100
                  </span>
                </div>
                <div
                  className="text-xs mt-1"
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  {balanceInfo.label}
                </div>
              </motion.div>

              {/* Performance Insights Card */}
              {performanceInsights && performanceInsights.bestFormats.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="rounded-[4px] p-4 flex-1"
                  style={{
                    background: isDark ? 'rgba(255, 107, 0, 0.1)' : 'rgba(255, 107, 0, 0.08)',
                    border: '1px solid rgba(255, 107, 0, 0.2)',
                  }}
                >
                  <div
                    className="text-[10px] tracking-wider mb-3"
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      color: '#FF6B00',
                    }}
                  >
                    TOP PERFORMING
                  </div>
                  <StaggerContainer className="flex flex-wrap gap-1.5" staggerDelay={0.1}>
                    {performanceInsights.bestFormats.slice(0, 3).map((format) => (
                      <StaggerItem
                        key={format}
                        direction="scale"
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                          fontFamily: "'Helvetica Neue', sans-serif",
                        }}
                      >
                        {format}
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </motion.div>
              )}

              {/* Voice Consistency Card */}
              {performanceInsights && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="rounded-[4px] p-4"
                  style={{
                    background: '#FFFFFF',
                  }}
                >
                  <div
                    className="text-[10px] tracking-wider mb-2"
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      color: 'rgba(0,0,0,0.4)',
                    }}
                  >
                    VOICE CONSISTENCY
                  </div>
                  <div
                    className="text-2xl font-semibold"
                    style={{
                      color: performanceInsights.voiceConsistency >= 70 ? '#10B981' : '#F59E0B',
                    }}
                  >
                    {performanceInsights.voiceConsistency}%
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      color: 'rgba(0,0,0,0.5)',
                    }}
                  >
                    {performanceInsights.voiceConsistency >= 70 ? 'Strong consistency' : 'Room to improve'}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Row - Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="md:col-span-2 grid grid-cols-3 gap-3"
            >
              {/* Best Pillar */}
              <div
                className="rounded-[4px] p-4 text-center"
                style={{
                  background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <div
                  className="text-[9px] tracking-wider mb-2"
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    color: '#10B981',
                  }}
                >
                  BEST ENGAGEMENT
                </div>
                <div
                  className="text-sm font-medium truncate"
                  style={{
                    color: isDark ? '#FFFFFF' : '#000000',
                  }}
                >
                  {engagementData.best}
                </div>
              </div>

              {/* Avg Engagement */}
              <div
                className="rounded-[4px] p-4 text-center"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <div
                  className="text-[9px] tracking-wider mb-2"
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                  }}
                >
                  AVG ENGAGEMENT
                </div>
                <div
                  className="text-sm font-medium"
                  style={{
                    color: isDark ? '#FFFFFF' : '#000000',
                  }}
                >
                  {engagementData.efficiency > 0 ? `${engagementData.efficiency}%` : 'N/A'}
                </div>
              </div>

              {/* Focus Area */}
              <div
                className="rounded-[4px] p-4 text-center"
                style={{
                  background: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <div
                  className="text-[9px] tracking-wider mb-2"
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    color: '#F59E0B',
                  }}
                >
                  FOCUS AREA
                </div>
                <div
                  className="text-sm font-medium truncate"
                  style={{
                    color: isDark ? '#FFFFFF' : '#000000',
                  }}
                >
                  {engagementData.worst}
                </div>
              </div>
            </motion.div>

            {/* Optimal Length Card */}
            {performanceInsights?.optimalLength && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-[4px] p-4"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <div
                  className="text-[10px] tracking-wider mb-2"
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                  }}
                >
                  OPTIMAL LENGTH
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-xl font-bold"
                    style={{ color: isDark ? '#FFFFFF' : '#000000' }}
                  >
                    {performanceInsights.optimalLength.min}-{performanceInsights.optimalLength.max}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                  >
                    chars
                  </span>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          /* No Data State */
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="md:col-span-3 rounded-[4px] p-8 text-center"
            style={{
              background: isDark ? '#1A1A1A' : '#F8F8F8',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div className="text-5xl mb-4">📊</div>
            <p
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '16px',
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              }}
            >
              Not enough content data yet
            </p>
            <p
              className="mt-2"
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '14px',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              Keep posting and we will track your content pillars
            </p>
          </motion.div>
        )}
      </div>
    </WalkthroughSection>
  );
}

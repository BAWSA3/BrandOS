'use client';

import { motion } from 'framer-motion';
import WalkthroughSection from '../WalkthroughSection';
import { TypewriterText, StaggerContainer, StaggerItem } from '../motion';
import type { ParallaxLayerConfig } from '../motion';

interface KeywordsWalkthroughProps {
  keywords: string[];
  voiceSamples: string[];
  doPatterns: string[];
  dontPatterns: string[];
  theme: string;
  parallaxLayers?: ParallaxLayerConfig[];
}

// Generate mock frequency data for keywords (in production, this would come from API)
function generateKeywordStats(keywords: string[]) {
  return keywords.slice(0, 5).map((keyword, index) => ({
    word: keyword,
    frequency: Math.max(95 - index * 15, 30), // Decreasing frequency
    trending: index < 2 ? 'up' : index > 3 ? 'down' : 'stable',
    uniqueness: Math.floor(Math.random() * 30) + 70, // 70-100% unique
  }));
}

export default function KeywordsWalkthrough({
  keywords,
  voiceSamples,
  doPatterns,
  dontPatterns,
  theme,
  parallaxLayers,
}: KeywordsWalkthroughProps) {
  const keywordStats = generateKeywordStats(keywords);
  const voiceSample = voiceSamples?.[0] || '';
  const isDark = theme === 'dark';

  // Calculate brand vocabulary metrics
  const totalKeywords = keywords.length;
  const avgUniqueness = Math.round(
    keywordStats.reduce((sum, k) => sum + k.uniqueness, 0) / keywordStats.length
  );
  const vocabularyScore = Math.min(100, totalKeywords * 8 + avgUniqueness / 2);

  const howWeCalculated = `Analyzed ${totalKeywords} signature terms from your content. Your vocabulary uniqueness is ${avgUniqueness}% compared to similar creators.`;

  const whyItMatters = `Keywords are your brand's signature - they trigger recognition. Consistent usage improves discoverability and reach.`;

  const whatYouCanDo = [
    `Use your top keywords (${keywordStats.slice(0, 3).map(k => k.word).join(', ')}) consistently to reinforce brand recognition.`,
    doPatterns.length > 0
      ? `Continue doing: ${doPatterns[0]}`
      : 'Develop signature phrases that become uniquely associated with your brand.',
    dontPatterns.length > 0
      ? `Avoid: ${dontPatterns[0]}`
      : 'Stay authentic to your voice rather than copying trending formats.',
  ];

  return (
    <WalkthroughSection
      label="Brand DNA Keywords"
      howWeCalculated={howWeCalculated}
      whyItMatters={whyItMatters}
      whatYouCanDo={whatYouCanDo}
      theme={theme}
      accentColor="#0047FF"
      parallaxLayers={parallaxLayers}
    >
      {/* Bento Grid Layout for Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Keywords with Frequency Bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="md:col-span-2 rounded-[4px] p-5 md:p-6"
          style={{
            background: isDark ? '#1A1A1A' : '#F8F8F8',
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
            BRAND DNA KEYWORDS
          </div>
          <div className="space-y-4">
            {keywordStats.map((stat, index) => (
              <motion.div
                key={stat.word}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        color: '#0047FF',
                      }}
                    >
                      [{stat.word}]
                    </span>
                    {stat.trending === 'up' && (
                      <span className="text-xs text-green-500">+</span>
                    )}
                    {stat.trending === 'down' && (
                      <span className="text-xs text-red-500">-</span>
                    )}
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    }}
                  >
                    {stat.frequency}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${stat.frequency}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, #0047FF 0%, ${stat.uniqueness > 85 ? '#10B981' : '#0047FF'} 100%)`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Column Stats */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Vocabulary Score Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-[4px] p-4"
            style={{
              background: '#0047FF',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-2"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              VOCABULARY SCORE
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-3xl font-bold"
                style={{ color: '#FFFFFF' }}
              >
                {Math.round(vocabularyScore)}
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
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {vocabularyScore >= 80 ? 'Distinctive voice' : vocabularyScore >= 60 ? 'Developing voice' : 'Building voice'}
            </div>
          </motion.div>

          {/* Uniqueness Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-[4px] p-4"
            style={{
              background: isDark ? 'rgba(0, 71, 255, 0.15)' : 'rgba(0, 71, 255, 0.1)',
              border: '1px solid rgba(0, 71, 255, 0.3)',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-2"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: '#0047FF',
              }}
            >
              UNIQUENESS
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-bold"
                style={{ color: isDark ? '#FFFFFF' : '#000000' }}
              >
                {avgUniqueness}%
              </span>
            </div>
            <div
              className="text-xs mt-1"
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              }}
            >
              vs similar creators
            </div>
          </motion.div>

          {/* Keywords Count Card */}
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
              SIGNATURE TERMS
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-bold"
                style={{ color: '#000000' }}
              >
                {totalKeywords}
              </span>
              <span
                className="text-sm"
                style={{ color: 'rgba(0,0,0,0.5)' }}
              >
                detected
              </span>
            </div>
          </motion.div>
        </div>

        {/* Voice Signature Card - Terminal Style */}
        {voiceSample && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="md:col-span-3 rounded-[4px] overflow-hidden"
            style={{
              background: isDark ? '#1A1A1A' : '#F8F8F8',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              borderLeft: '3px solid #0047FF',
            }}
          >
            <div
              className="px-4 py-2 flex items-center gap-2"
              style={{
                background: 'rgba(0, 71, 255, 0.1)',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: '#0047FF',
                }}
              >
                {'>'} VOICE_SIGNATURE
              </span>
            </div>
            <div className="p-5">
              <p
                className="text-sm leading-relaxed"
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                }}
              >
                "<TypewriterText
                  text={voiceSample}
                  delay={400}
                  charDelay={20}
                  cursorColor="#0047FF"
                  showCursor={true}
                />"
              </p>
            </div>
          </motion.div>
        )}

        {/* Do/Don't Cards - Split Layout */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-[4px] p-4 md:p-5"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className="text-[10px] tracking-wider"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: '#10B981',
              }}
            >
              DO
            </div>
            <div
              className="px-2 py-0.5 rounded text-[9px]"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                fontFamily: "'VCR OSD Mono', monospace",
              }}
            >
              {doPatterns.length} PATTERNS
            </div>
          </div>
          <StaggerContainer className="space-y-2" staggerDelay={0.12} initialDelay={0.6}>
            {doPatterns.slice(0, 3).map((pattern, i) => (
              <StaggerItem
                key={i}
                direction="left"
                className="flex items-start gap-2 text-xs"
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                }}
              >
                <span style={{ color: '#10B981', fontWeight: 600 }}>+</span>
                <span>{pattern}</span>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </motion.div>

        {/* Don't Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="rounded-[4px] p-4 md:p-5"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className="text-[10px] tracking-wider"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: '#EF4444',
              }}
            >
              DON'T
            </div>
            <div
              className="px-2 py-0.5 rounded text-[9px]"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                fontFamily: "'VCR OSD Mono', monospace",
              }}
            >
              {dontPatterns.length} PATTERNS
            </div>
          </div>
          <StaggerContainer className="space-y-2" staggerDelay={0.12} initialDelay={0.7}>
            {dontPatterns.slice(0, 3).map((pattern, i) => (
              <StaggerItem
                key={i}
                direction="right"
                className="flex items-start gap-2 text-xs"
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                }}
              >
                <span style={{ color: '#EF4444', fontWeight: 600 }}>-</span>
                <span>{pattern}</span>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="rounded-[4px] p-4 flex items-center justify-around"
          style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <div className="text-center">
            <div
              className="text-lg font-bold"
              style={{ color: '#10B981' }}
            >
              {keywordStats.filter(k => k.trending === 'up').length}
            </div>
            <div
              className="text-[9px] tracking-wider"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              TRENDING UP
            </div>
          </div>
          <div
            className="w-px h-8"
            style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          />
          <div className="text-center">
            <div
              className="text-lg font-bold"
              style={{ color: isDark ? '#FFFFFF' : '#000000' }}
            >
              {keywordStats.filter(k => k.trending === 'stable').length}
            </div>
            <div
              className="text-[9px] tracking-wider"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              STABLE
            </div>
          </div>
          <div
            className="w-px h-8"
            style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          />
          <div className="text-center">
            <div
              className="text-lg font-bold"
              style={{ color: '#F59E0B' }}
            >
              {keywordStats.filter(k => k.trending === 'down').length}
            </div>
            <div
              className="text-[9px] tracking-wider"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              DECLINING
            </div>
          </div>
        </motion.div>
      </div>
    </WalkthroughSection>
  );
}

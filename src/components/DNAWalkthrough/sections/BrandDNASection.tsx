'use client';

import { motion } from 'framer-motion';
import { XTweetEmbed, RawTweet } from '../TweetExcerpt';
import WalkthroughSection from '../WalkthroughSection';
import type { ParallaxLayerConfig } from '../motion';
import type { VoiceConsistencyReport } from '@/lib/schemas/voice-consistency.schema';

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

interface BrandDNASectionProps {
  keywords: string[];
  voiceSamples: string[];
  doPatterns: string[];
  dontPatterns: string[];
  contentPillars?: ContentPillar[];
  performanceInsights?: PerformanceInsights;
  voiceConsistencyReport?: VoiceConsistencyReport;
  rawTweets: RawTweet[];
  theme: string;
  parallaxLayers?: ParallaxLayerConfig[];
}

function findTweetForKeyword(tweets: RawTweet[], keyword: string): RawTweet | null {
  const kw = keyword.toLowerCase();
  return tweets.find(t => t.text.toLowerCase().includes(kw)) || null;
}

function findTweetForPillar(tweets: RawTweet[], pillarName: string): RawTweet | null {
  const words = pillarName.toLowerCase().split(/\s+/);
  return tweets.find(t => {
    const lower = t.text.toLowerCase();
    return words.some(w => lower.includes(w));
  }) || null;
}

export default function BrandDNASection({
  keywords,
  voiceSamples,
  doPatterns,
  dontPatterns,
  contentPillars,
  performanceInsights,
  voiceConsistencyReport,
  rawTweets,
  theme,
  parallaxLayers,
}: BrandDNASectionProps) {
  const isDark = theme === 'dark';
  const accentColor = '#9d4edd';

  const consistencyScore = voiceConsistencyReport?.overallScore
    ?? performanceInsights?.voiceConsistency
    ?? null;

  const outlierTweets = voiceConsistencyReport?.outliers?.slice(0, 2) ?? [];
  const sortedPillars = contentPillars
    ? [...contentPillars].sort((a, b) => b.frequency - a.frequency)
    : [];
  const maxFreq = sortedPillars.length ? Math.max(...sortedPillars.map(p => p.frequency)) : 1;

  return (
    <WalkthroughSection
      label="GENERATE: Your Brand DNA"
      theme={theme}
      accentColor={accentColor}
      parallaxLayers={parallaxLayers}
      narrativeBlocks={[
        {
          type: 'context',
          content: `This is the distilled version of your brand. These are the themes, words, and patterns that make @${rawTweets[0] ? 'your content' : 'your profile'} recognizably yours.`,
        },
      ]}
    >
      <div className="space-y-6">
        {/* Content Pillars */}
        {sortedPillars.length > 0 && (
          <div>
            <h4
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                marginBottom: '14px',
              }}
            >
              YOUR CONTENT PILLARS
            </h4>
            <p
              style={{
                fontSize: '13px',
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              These are the topics you return to most often. Consistent pillars help your audience know what to expect from you.
            </p>
            <div className="space-y-4">
              {sortedPillars.slice(0, 4).map((pillar, i) => {
                const tweet = findTweetForPillar(rawTweets, pillar.name);
                return (
                  <motion.div
                    key={pillar.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontFamily: "'VCR OSD Mono', monospace",
                          fontSize: '12px',
                          color: isDark ? '#fff' : '#000',
                          minWidth: '120px',
                        }}
                      >
                        {pillar.name}
                      </span>
                      <div style={{ flex: 1, height: 6, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 3 }}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(pillar.frequency / maxFreq) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                          style={{ height: '100%', background: accentColor, borderRadius: 3 }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "'VCR OSD Mono', monospace",
                          fontSize: '10px',
                          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                          minWidth: '32px',
                          textAlign: 'right',
                        }}
                      >
                        {Math.round(pillar.frequency)}%
                      </span>
                    </div>
                    {tweet && (
                      <XTweetEmbed
                        tweetId={tweet.id}
                        theme={theme}
                        accentColor={accentColor}
                        annotation={`Example of your "${pillar.name}" content`}
                        index={i}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Keywords with Tweet Evidence */}
        {keywords.length > 0 && (
          <div>
            <h4
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                marginBottom: '14px',
              }}
            >
              BRAND KEYWORDS
            </h4>
            <p
              style={{
                fontSize: '13px',
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              These words appeared most often in your content. They&apos;re the vocabulary that defines your brand voice.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {keywords.slice(0, 8).map((kw, i) => (
                <motion.span
                  key={kw}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.05em',
                    padding: '6px 14px',
                    background: `${accentColor}12`,
                    border: `1px solid ${accentColor}25`,
                    borderRadius: '3px',
                    color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)',
                  }}
                >
                  {kw}
                </motion.span>
              ))}
            </div>

            {/* Show a tweet that uses a top keyword */}
            {rawTweets.length > 0 && keywords.length > 0 && (() => {
              const topKw = keywords[0];
              const tweet = findTweetForKeyword(rawTweets, topKw);
              if (!tweet) return null;
              return (
                <XTweetEmbed
                  tweetId={tweet.id}
                  theme={theme}
                  accentColor={accentColor}
                  annotation={`Your keyword "${topKw}" in action`}
                />
              );
            })()}
          </div>
        )}

        {/* Voice Consistency */}
        {consistencyScore !== null && (
          <div>
            <h4
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                marginBottom: '14px',
              }}
            >
              VOICE CONSISTENCY
            </h4>
            <div className="flex items-center gap-4 mb-4">
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: `conic-gradient(${consistencyScore >= 70 ? '#10B981' : consistencyScore >= 50 ? '#F59E0B' : '#EF4444'} ${consistencyScore * 3.6}deg, ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: isDark ? '#1A1A1A' : '#F8F8F8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '16px',
                    fontWeight: 600,
                    color: isDark ? '#fff' : '#000',
                  }}
                >
                  {Math.round(consistencyScore)}%
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: '14px',
                    color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {consistencyScore >= 80
                    ? 'Your voice is highly consistent. People know what to expect when they see your posts.'
                    : consistencyScore >= 60
                      ? 'Your voice is mostly consistent with some variation. A bit more focus will strengthen brand recognition.'
                      : 'Your voice varies significantly across posts. Building consistency will help your audience connect with your brand.'}
                </p>
                {voiceConsistencyReport?.drift && (
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '10px',
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                      marginTop: '4px',
                      display: 'inline-block',
                    }}
                  >
                    DRIFT: {voiceConsistencyReport.drift.direction.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Outlier examples */}
            {outlierTweets.length > 0 && (
              <div>
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    color: '#F59E0B',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  POSTS THAT DRIFTED FROM YOUR VOICE
                </span>
                <div className="space-y-2">
                  {outlierTweets.map((outlier, i) => (
                    <XTweetEmbed
                      key={outlier.tweetId}
                      tweetId={outlier.tweetId}
                      theme={theme}
                      accentColor="#F59E0B"
                      annotation={`Scored ${outlier.score}/100${outlier.flags.length ? ` — ${outlier.flags[0]}` : ''}`}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Do/Don't Patterns */}
        {(doPatterns.length > 0 || dontPatterns.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {doPatterns.length > 0 && (
              <div
                style={{
                  padding: '16px',
                  background: isDark ? 'rgba(16,185,129,0.04)' : 'rgba(16,185,129,0.03)',
                  border: '1px solid rgba(16,185,129,0.12)',
                  borderRadius: '4px',
                }}
              >
                <h4
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    color: '#10B981',
                    marginBottom: '10px',
                  }}
                >
                  YOUR BRAND PATTERNS (DO)
                </h4>
                <div className="space-y-2">
                  {doPatterns.slice(0, 4).map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: 1.5 }}>
                      <span style={{ color: '#10B981', flexShrink: 0 }}>+</span>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dontPatterns.length > 0 && (
              <div
                style={{
                  padding: '16px',
                  background: isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.03)',
                  border: '1px solid rgba(239,68,68,0.12)',
                  borderRadius: '4px',
                }}
              >
                <h4
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    color: '#EF4444',
                    marginBottom: '10px',
                  }}
                >
                  AVOID THESE (DON&apos;T)
                </h4>
                <div className="space-y-2">
                  {dontPatterns.slice(0, 4).map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: 1.5 }}>
                      <span style={{ color: '#EF4444', flexShrink: 0 }}>×</span>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voice Sample */}
        {voiceSamples.length > 0 && (
          <div
            style={{
              padding: '16px',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              borderRadius: '4px',
            }}
          >
            <h4
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                marginBottom: '10px',
              }}
            >
              VOICE SIGNATURE
            </h4>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)',
                fontStyle: 'italic',
                margin: 0,
              }}
            >
              &ldquo;{voiceSamples[0]}&rdquo;
            </p>
          </div>
        )}
      </div>
    </WalkthroughSection>
  );
}

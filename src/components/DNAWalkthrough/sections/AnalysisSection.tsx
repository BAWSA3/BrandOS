'use client';

import { motion } from 'framer-motion';
import { XTweetEmbed, RawTweet } from '../TweetExcerpt';
import WalkthroughSection from '../WalkthroughSection';
import type { ParallaxLayerConfig } from '../motion';

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

interface ToneData {
  minimal: number;
  playful: number;
  bold: number;
  experimental: number;
}

interface AnalysisSectionProps {
  profile: XProfileData;
  brandScore: BrandScoreResult;
  tone: ToneData;
  voiceProfile: string;
  archetype: string;
  archetypeEmoji: string;
  personalityType?: string;
  personalitySummary?: string;
  rawTweets: RawTweet[];
  theme: string;
  parallaxLayers?: ParallaxLayerConfig[];
}

const PHASE_META: Record<string, { label: string; color: string; what: string }> = {
  define: {
    label: 'DEFINE',
    color: '#E8A838',
    what: 'How clear and recognizable your brand identity is from your profile alone.',
  },
  check: {
    label: 'CHECK',
    color: '#00ff88',
    what: 'How consistently your posts, tone, and visuals reinforce the same brand message.',
  },
  generate: {
    label: 'GENERATE',
    color: '#9d4edd',
    what: 'How well your profile is set up for AI-powered content generation that sounds like you.',
  },
  scale: {
    label: 'SCALE',
    color: '#ff6b35',
    what: 'How ready your account is to grow audience reach while keeping brand integrity.',
  },
};

function getScoreLabel(score: number): string {
  if (score >= 90) return 'EXCEPTIONAL';
  if (score >= 80) return 'EXCELLENT';
  if (score >= 70) return 'STRONG';
  if (score >= 60) return 'GOOD';
  if (score >= 50) return 'DECENT';
  if (score >= 40) return 'NEEDS WORK';
  return 'CRITICAL';
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#D4A574';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function getVoiceStyle(tone: ToneData): { style: string; description: string } {
  const formality = (100 - tone.playful + tone.minimal) / 2;
  const energy = (tone.bold + tone.experimental) / 2;

  if (formality > 65 && energy > 55) return { style: 'Authority', description: 'You lead with confidence and substance. Your audience expects expert takes.' };
  if (formality > 65) return { style: 'Expert', description: 'Your voice carries weight through depth. People come to you for reliable, well-reasoned analysis.' };
  if (energy > 65) return { style: 'Entertainer', description: 'You blend insight with energy. Your content gets shared because it\'s both valuable and engaging.' };
  if (formality < 40 && energy < 40) return { style: 'Relatable', description: 'You connect through authenticity. Your audience relates because you keep it real.' };
  return { style: 'Versatile', description: 'You adapt your voice to the message. This flexibility helps you reach broader audiences.' };
}

function pickAnnotatedTweet(tweets: RawTweet[], keywords: string[]): { tweet: RawTweet; annotation: string } | null {
  if (!tweets.length) return null;
  const sorted = [...tweets].sort((a, b) => (b.public_metrics?.like_count ?? 0) - (a.public_metrics?.like_count ?? 0));
  const best = sorted[0];
  return {
    tweet: best,
    annotation: `This is your highest-engagement post. ${keywords.length ? `It touches on your brand themes: ${keywords.slice(0, 3).join(', ')}.` : 'It shows the voice and tone your audience responds to most.'}`,
  };
}

export default function AnalysisSection({
  profile,
  brandScore,
  tone,
  voiceProfile,
  archetype,
  archetypeEmoji,
  personalityType,
  personalitySummary,
  rawTweets,
  theme,
  parallaxLayers,
}: AnalysisSectionProps) {
  const isDark = theme === 'dark';
  const scoreColor = getScoreColor(brandScore.overallScore);
  const voice = getVoiceStyle(tone);

  const phases = Object.entries(brandScore.phases) as [string, PhaseData][];
  const sortedPhases = [...phases].sort((a, b) => b[1].score - a[1].score);
  const strongestPhase = sortedPhases[0];
  const weakestPhase = sortedPhases[sortedPhases.length - 1];

  const annotatedTweet = pickAnnotatedTweet(rawTweets, []);

  return (
    <WalkthroughSection
      label="CHECK: What It Means"
      theme={theme}
      accentColor={scoreColor}
      parallaxLayers={parallaxLayers}
      narrativeBlocks={[
        {
          type: 'context',
          content: `We ran your data through four analysis dimensions. Here's how your brand scores — and what each number actually tells you about @${profile.username}.`,
        },
        {
          type: 'callout',
          label: 'THE BOTTOM LINE',
          content: brandScore.summary,
        },
      ]}
    >
      <div className="space-y-6">
        {/* Overall Score Hero */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: `conic-gradient(${scoreColor} ${brandScore.overallScore * 3.6}deg, ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: isDark ? '#1A1A1A' : '#F8F8F8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '32px',
                    fontWeight: 700,
                    color: scoreColor,
                    lineHeight: 1,
                  }}
                >
                  {brandScore.overallScore}
                </span>
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '8px',
                    letterSpacing: '0.12em',
                    color: scoreColor,
                    marginTop: '4px',
                  }}
                >
                  {getScoreLabel(brandScore.overallScore)}
                </span>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 space-y-2">
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: isDark ? '#fff' : '#000',
                margin: 0,
              }}
            >
              Brand Score: {brandScore.overallScore}/100
            </h3>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
                margin: 0,
                maxWidth: '500px',
              }}
            >
              Your strongest dimension is{' '}
              <strong style={{ color: PHASE_META[strongestPhase[0]].color }}>
                {PHASE_META[strongestPhase[0]].label}
              </strong>{' '}
              ({strongestPhase[1].score}/100). Your biggest opportunity is{' '}
              <strong style={{ color: PHASE_META[weakestPhase[0]].color }}>
                {PHASE_META[weakestPhase[0]].label}
              </strong>{' '}
              ({weakestPhase[1].score}/100).
            </p>
          </div>
        </div>

        {/* Phase Breakdown */}
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
            HOW EACH DIMENSION SCORED
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {phases.map(([key, phase], i) => {
              const meta = PHASE_META[key];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  style={{
                    padding: '16px',
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '12px',
                        letterSpacing: '0.08em',
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '16px',
                        fontWeight: 600,
                        color: isDark ? '#fff' : '#000',
                      }}
                    >
                      {phase.score}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: 6,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginBottom: '10px',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${phase.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                      style={{
                        height: '100%',
                        background: meta.color,
                        borderRadius: '3px',
                      }}
                    />
                  </div>

                  <p
                    style={{
                      fontSize: '12px',
                      lineHeight: 1.5,
                      color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                      margin: '0 0 6px 0',
                    }}
                  >
                    {meta.what}
                  </p>

                  {/* Top insight */}
                  {phase.insights[0] && (
                    <p
                      style={{
                        fontSize: '12px',
                        lineHeight: 1.5,
                        color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        margin: 0,
                        fontStyle: 'italic',
                      }}
                    >
                      &ldquo;{phase.insights[0]}&rdquo;
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Voice & Archetype */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Voice Style */}
          <div
            style={{
              padding: '20px',
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
                marginBottom: '12px',
              }}
            >
              YOUR VOICE STYLE
            </h4>
            <div style={{ fontSize: '24px', fontWeight: 600, color: isDark ? '#fff' : '#000', marginBottom: '6px' }}>
              {voice.style}
            </div>
            <p
              style={{
                fontSize: '13px',
                lineHeight: 1.6,
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                margin: 0,
              }}
            >
              {voice.description}
            </p>
            {voiceProfile && (
              <p
                style={{
                  marginTop: '10px',
                  fontSize: '12px',
                  color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                  fontStyle: 'italic',
                }}
              >
                Signature: {voiceProfile}
              </p>
            )}
          </div>

          {/* Archetype */}
          <div
            style={{
              padding: '20px',
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
                marginBottom: '12px',
              }}
            >
              YOUR BRAND ARCHETYPE
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px' }}>{archetypeEmoji}</span>
              <span style={{ fontSize: '22px', fontWeight: 600, color: isDark ? '#fff' : '#000' }}>
                {archetype}
              </span>
            </div>
            {personalityType && (
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  padding: '4px 10px',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderRadius: '3px',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  display: 'inline-block',
                  marginBottom: '8px',
                }}
              >
                {personalityType}
              </span>
            )}
            {personalitySummary && (
              <p
                style={{
                  marginTop: '8px',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                }}
              >
                {personalitySummary}
              </p>
            )}
          </div>
        </div>

        {/* Annotated Best Tweet */}
        {annotatedTweet && (
          <div>
            <h4
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                marginBottom: '12px',
              }}
            >
              YOUR VOICE IN ACTION
            </h4>
            <XTweetEmbed
              tweetId={annotatedTweet.tweet.id}
              annotation={annotatedTweet.annotation}
              theme={theme}
              accentColor={scoreColor}
            />
          </div>
        )}

        {/* Top Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              TOP STRENGTHS
            </h4>
            <div className="space-y-2">
              {brandScore.topStrengths.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: 1.5 }}>
                  <span style={{ color: '#10B981', flexShrink: 0 }}>+</span>
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              background: isDark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.03)',
              border: '1px solid rgba(245,158,11,0.12)',
              borderRadius: '4px',
            }}
          >
            <h4
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: '#F59E0B',
                marginBottom: '10px',
              }}
            >
              GROWTH OPPORTUNITIES
            </h4>
            <div className="space-y-2">
              {brandScore.topImprovements.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: 1.5 }}>
                  <span style={{ color: '#F59E0B', flexShrink: 0 }}>→</span>
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WalkthroughSection>
  );
}

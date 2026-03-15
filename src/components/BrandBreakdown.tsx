'use client';

import { motion } from 'motion/react';
import { GeneratedBrandDNA } from './BrandDNAPreview';
import type { RawTweet } from './DNAWalkthrough/TweetExcerpt';
import MetalArchetypeIcon from '@/components/MetalArchetypeIcon';

// ============================================================================
// Types
// ============================================================================

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

interface BrandScoreResult {
  overallScore: number;
  phases: {
    define: { score: number; insights: string[] };
    check: { score: number; insights: string[] };
    generate: { score: number; insights: string[] };
    scale: { score: number; insights: string[] };
  };
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
}

interface BrandBreakdownProps {
  profile: XProfileData;
  brandScore: BrandScoreResult;
  generatedBrandDNA: GeneratedBrandDNA;
  rawTweets?: RawTweet[];
  onComplete: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'EXCEPTIONAL';
  if (score >= 80) return 'EXCELLENT';
  if (score >= 70) return 'STRONG';
  if (score >= 60) return 'GOOD';
  if (score >= 50) return 'DECENT';
  if (score >= 35) return 'NEEDS WORK';
  return 'CRITICAL';
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#00C853';
  if (score >= 60) return '#0047FF';
  if (score >= 40) return '#E8A838';
  return '#FF3B30';
}

const PHASE_META: Record<string, { label: string; desc: string; color: string }> = {
  define: { label: 'DEFINE', desc: 'Brand clarity & identity', color: '#E8A838' },
  check: { label: 'CHECK', desc: 'Voice consistency', color: '#00ff88' },
  generate: { label: 'GENERATE', desc: 'Content readiness', color: '#9d4edd' },
  scale: { label: 'SCALE', desc: 'Growth potential', color: '#ff6b35' },
};

// ============================================================================
// Sub-components
// ============================================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1.5 h-1.5 rounded-full bg-[#0047FF]" />
      <span
        className="text-[11px] tracking-[0.2em] uppercase"
        style={{ fontFamily: 'var(--font-vcr, "VCR OSD Mono", monospace)', color: '#0047FF' }}
      >
        {children}
      </span>
      <div className="flex-1 h-px bg-black/10" />
    </div>
  );
}

function PhaseBar({ name, score }: { name: string; score: number }) {
  const meta = PHASE_META[name];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3"
    >
      <div className="w-[80px] shrink-0">
        <div className="font-mono text-[10px] tracking-[0.15em] text-black/40">{meta.label}</div>
        <div className="font-mono text-[10px] text-black/25">{meta.desc}</div>
      </div>
      <div className="flex-1 h-[6px] bg-black/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: meta.color }}
        />
      </div>
      <span className="font-mono text-sm font-bold w-[32px] text-right" style={{ color: meta.color }}>
        {score}
      </span>
    </motion.div>
  );
}

function ToneBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] tracking-[0.1em] text-black/40 w-[90px] shrink-0 uppercase">
        {label}
      </span>
      <div className="flex-1 h-[4px] bg-black/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="h-full rounded-full bg-black/70"
        />
      </div>
      <span className="font-mono text-[11px] text-black/50 w-[28px] text-right">{value}</span>
    </div>
  );
}

function TopPost({ tweet, rank }: { tweet: RawTweet; rank: number }) {
  const likes = tweet.public_metrics?.like_count || 0;
  const rts = tweet.public_metrics?.retweet_count || 0;
  return (
    <div className="border border-black/8 rounded-lg p-4 bg-white/60">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[9px] tracking-[0.15em] text-black/30">#{rank}</span>
        <div className="flex gap-3 ml-auto font-mono text-[10px] text-black/40">
          <span>{formatCount(likes)} likes</span>
          <span>{formatCount(rts)} RTs</span>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-black/70 line-clamp-3">
        {tweet.text}
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function BrandBreakdown({
  profile,
  brandScore,
  generatedBrandDNA,
  rawTweets = [],
  onComplete,
}: BrandBreakdownProps) {
  const voiceConsistency =
    generatedBrandDNA.voiceConsistencyReport?.overallScore ??
    generatedBrandDNA.performanceInsights?.voiceConsistency ??
    null;

  // Sort tweets by engagement for top posts
  const sortedTweets = [...rawTweets]
    .sort((a, b) => {
      const aEng = (a.public_metrics?.like_count || 0) + (a.public_metrics?.retweet_count || 0);
      const bEng = (b.public_metrics?.like_count || 0) + (b.public_metrics?.retweet_count || 0);
      return bEng - aEng;
    })
    .slice(0, 3);

  const totalEngagement = rawTweets.reduce(
    (sum, t) => sum + (t.public_metrics?.like_count || 0) + (t.public_metrics?.retweet_count || 0),
    0
  );

  // Find strongest and weakest phase
  const phaseEntries = Object.entries(brandScore.phases) as [string, { score: number; insights: string[] }][];
  const strongest = phaseEntries.reduce((best, [name, p]) => (p.score > best.score ? { name, score: p.score } : best), { name: '', score: 0 });
  const weakest = phaseEntries.reduce((worst, [name, p]) => (p.score < worst.score ? { name, score: p.score } : worst), { name: '', score: 100 });

  return (
    <div className="relative min-h-screen bg-white">
      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-[640px] mx-auto px-6 py-16">

        {/* ═══════ HEADER: Profile + Score ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Profile */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {profile.profile_image_url && (
              <img
                src={profile.profile_image_url.replace('_normal', '_200x200')}
                alt=""
                className="w-16 h-16 rounded-full border-2 border-black/10"
              />
            )}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-black">{profile.name}</span>
                {profile.verified && (
                  <span className="text-[10px] font-mono bg-[#0047FF] text-white px-1.5 py-0.5 rounded">verified</span>
                )}
              </div>
              <span className="font-mono text-sm text-black/40">@{profile.username}</span>
              <div className="flex gap-4 mt-1 font-mono text-[10px] text-black/35">
                <span>{formatCount(profile.followers_count)} followers</span>
                <span>{formatCount(profile.tweet_count)} posts</span>
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="inline-flex flex-col items-center">
            <div
              className="text-[72px] font-bold leading-none"
              style={{
                fontFamily: 'var(--font-vcr, "VCR OSD Mono", monospace)',
                color: getScoreColor(brandScore.overallScore),
              }}
            >
              {brandScore.overallScore}
            </div>
            <div className="font-mono text-[11px] tracking-[0.2em] text-black/40 mt-1">
              BRAND SCORE — {getScoreLabel(brandScore.overallScore)}
            </div>
          </div>

          {/* Summary */}
          <p className="font-mono text-[12px] leading-relaxed text-black/50 max-w-md mx-auto mt-4">
            {brandScore.summary}
          </p>
        </motion.div>

        {/* ═══════ ARCHETYPE & PERSONALITY ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-14"
        >
          <SectionLabel>Your Archetype</SectionLabel>
          <div className="flex items-start gap-5 p-5 border border-black/8 rounded-xl bg-white/80">
            <MetalArchetypeIcon
              src={generatedBrandDNA.archetypeEmoji || '🧬'}
              alt={generatedBrandDNA.archetype || 'archetype'}
              size={48}
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-lg font-bold text-black">{generatedBrandDNA.archetype}</span>
                {generatedBrandDNA.personalityType && (
                  <span className="font-mono text-[10px] bg-black/5 text-black/50 px-2 py-0.5 rounded">
                    {generatedBrandDNA.personalityType}
                  </span>
                )}
              </div>
              {generatedBrandDNA.personalitySummary && (
                <p className="font-mono text-[12px] leading-relaxed text-black/50">
                  {generatedBrandDNA.personalitySummary}
                </p>
              )}
              {generatedBrandDNA.voiceProfile && !generatedBrandDNA.personalitySummary && (
                <p className="font-mono text-[12px] leading-relaxed text-black/50">
                  {generatedBrandDNA.voiceProfile}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══════ 4 PHASE SCORES ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-14"
        >
          <SectionLabel>Phase Breakdown</SectionLabel>
          <div className="space-y-4">
            {phaseEntries.map(([name, phase]) => (
              <PhaseBar key={name} name={name} score={phase.score} />
            ))}
          </div>
          <div className="flex gap-4 mt-4 font-mono text-[10px]">
            <span className="text-black/30">
              Strongest: <span style={{ color: PHASE_META[strongest.name]?.color }}>{PHASE_META[strongest.name]?.label}</span>
            </span>
            <span className="text-black/30">
              Growth area: <span style={{ color: PHASE_META[weakest.name]?.color }}>{PHASE_META[weakest.name]?.label}</span>
            </span>
          </div>
        </motion.div>

        {/* ═══════ TONE PROFILE ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-14"
        >
          <SectionLabel>Tone Profile</SectionLabel>
          <div className="space-y-3">
            <ToneBar label="Minimal" value={generatedBrandDNA.tone.minimal} />
            <ToneBar label="Playful" value={generatedBrandDNA.tone.playful} />
            <ToneBar label="Bold" value={generatedBrandDNA.tone.bold} />
            <ToneBar label="Experimental" value={generatedBrandDNA.tone.experimental} />
          </div>
        </motion.div>

        {/* ═══════ STRENGTHS & GROWTH ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-14"
        >
          <SectionLabel>What We Found</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <div className="font-mono text-[10px] tracking-[0.15em] text-[#00C853] mb-3 uppercase">Strengths</div>
              <div className="space-y-2">
                {brandScore.topStrengths.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-mono text-[#00C853] text-xs mt-0.5">+</span>
                    <span className="font-mono text-[12px] text-black/60 leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Growth areas */}
            <div>
              <div className="font-mono text-[10px] tracking-[0.15em] text-[#E8A838] mb-3 uppercase">Growth Areas</div>
              <div className="space-y-2">
                {brandScore.topImprovements.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-mono text-[#E8A838] text-xs mt-0.5">&rarr;</span>
                    <span className="font-mono text-[12px] text-black/60 leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════ BRAND DNA: Keywords + Pillars ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-14"
        >
          <SectionLabel>Brand DNA</SectionLabel>

          {/* Keywords */}
          <div className="mb-6">
            <div className="font-mono text-[10px] tracking-[0.15em] text-black/30 mb-3 uppercase">Keywords</div>
            <div className="flex flex-wrap gap-2">
              {generatedBrandDNA.keywords.slice(0, 8).map((kw, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                  className="font-mono text-[11px] px-3 py-1.5 rounded border border-black/10 text-black/60 bg-black/[0.02]"
                >
                  {kw}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Content Pillars */}
          {generatedBrandDNA.contentPillars && generatedBrandDNA.contentPillars.length > 0 && (
            <div className="mb-6">
              <div className="font-mono text-[10px] tracking-[0.15em] text-black/30 mb-3 uppercase">Content Pillars</div>
              <div className="space-y-2">
                {generatedBrandDNA.contentPillars.slice(0, 4).map((pillar, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-black/50 w-[140px] shrink-0 truncate">{pillar.name}</span>
                    <div className="flex-1 h-[4px] bg-black/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pillar.frequency}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                        className="h-full rounded-full bg-[#0047FF]/60"
                      />
                    </div>
                    <span className="font-mono text-[10px] text-black/35 w-[28px] text-right">{pillar.frequency}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Consistency */}
          {voiceConsistency !== null && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="font-mono text-[10px] tracking-[0.1em] text-black/40 uppercase">Voice Consistency</span>
              <div className="flex-1 h-[4px] bg-black/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${voiceConsistency}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="h-full rounded-full"
                  style={{ background: voiceConsistency >= 70 ? '#00C853' : voiceConsistency >= 50 ? '#E8A838' : '#FF3B30' }}
                />
              </div>
              <span className="font-mono text-sm font-bold text-black/60">{voiceConsistency}%</span>
            </div>
          )}
        </motion.div>

        {/* ═══════ VOICE PATTERNS: Do / Don't ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-14"
        >
          <SectionLabel>Voice Patterns</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-mono text-[10px] tracking-[0.15em] text-[#00C853] mb-3 uppercase">Do This</div>
              <div className="space-y-2">
                {generatedBrandDNA.doPatterns.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-mono text-[#00C853] text-xs mt-0.5">+</span>
                    <span className="font-mono text-[11px] text-black/55 leading-relaxed">{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.15em] text-[#FF3B30] mb-3 uppercase">Avoid This</div>
              <div className="space-y-2">
                {generatedBrandDNA.dontPatterns.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-mono text-[#FF3B30] text-xs mt-0.5">-</span>
                    <span className="font-mono text-[11px] text-black/55 leading-relaxed">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════ TOP POSTS ═══════ */}
        {sortedTweets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-14"
          >
            <SectionLabel>Top Posts</SectionLabel>
            <div className="flex gap-4 mb-4 font-mono text-[10px] text-black/30">
              <span>{rawTweets.length} posts scanned</span>
              <span>{formatCount(totalEngagement)} total engagement</span>
            </div>
            <div className="space-y-3">
              {sortedTweets.map((tweet, i) => (
                <TopPost key={tweet.id} tweet={tweet} rank={i + 1} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════ VOICE SIGNATURE ═══════ */}
        {generatedBrandDNA.voiceSamples?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mb-14"
          >
            <SectionLabel>Voice Signature</SectionLabel>
            <div className="p-4 rounded-lg bg-black/[0.02] border border-black/5 font-mono text-[12px] text-black/50 leading-relaxed italic">
              &ldquo;{generatedBrandDNA.voiceSamples[0]}&rdquo;
            </div>
          </motion.div>
        )}

        {/* ═══════ CTA ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center pt-4 pb-8"
        >
          <button
            onClick={onComplete}
            className="font-mono text-[12px] tracking-[0.15em] uppercase px-8 py-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: '#0047FF',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            View Dashboard &rarr;
          </button>
          <div className="mt-4 font-mono text-[10px] text-black/25 tracking-[0.15em]">
            POWERED BY BRANDOS
          </div>
        </motion.div>
      </div>
    </div>
  );
}

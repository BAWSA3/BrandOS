'use client';

import { motion } from 'framer-motion';
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

interface ActionPlanSectionProps {
  profile: XProfileData;
  brandScore: BrandScoreResult;
  keywords: string[];
  doPatterns: string[];
  voiceConsistencyScore?: number | null;
  onViewDashboard: () => void;
  theme: string;
  parallaxLayers?: ParallaxLayerConfig[];
}

interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  category: 'quick-win' | 'long-term';
  title: string;
  detail: string;
  source: string;
}

function generateActions(
  profile: XProfileData,
  brandScore: BrandScoreResult,
  keywords: string[],
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

  // Bio optimization
  const bioLength = profile.description?.length ?? 0;
  if (bioLength < 100) {
    actions.push({
      priority: 'high',
      category: 'quick-win',
      title: `Expand your bio from ${bioLength} to 160 characters`,
      detail: `Include your value proposition, what you post about, and a call-to-action. ${keywords.length >= 2 ? `Work in your brand keywords: "${keywords[0]}" and "${keywords[1]}".` : ''}`,
      source: `Your bio is ${bioLength} characters — profiles with 120+ chars see up to 40% more follows.`,
    });
  }

  // Missing link
  if (!profile.url) {
    actions.push({
      priority: 'high',
      category: 'quick-win',
      title: 'Add a link to your profile',
      detail: 'Point it to your best content, newsletter, or portfolio. This drives traffic from every profile visit.',
      source: 'No website link detected in your profile.',
    });
  }

  // Missing location
  if (!profile.location) {
    actions.push({
      priority: 'medium',
      category: 'quick-win',
      title: 'Add a location to your profile',
      detail: 'It can be your real location or something brand-relevant (e.g., "Building in public"). Helps discoverability.',
      source: 'No location set. Profiles with location rank better in search.',
    });
  }

  // Voice consistency
  if (voiceConsistencyScore != null && voiceConsistencyScore < 70) {
    actions.push({
      priority: 'high',
      category: 'long-term',
      title: 'Strengthen your voice consistency',
      detail: `Your voice consistency is ${Math.round(voiceConsistencyScore)}%. ${doPatterns.length ? `Lean into your proven patterns: "${doPatterns[0]}"` : 'Pick 2-3 tone markers and use them in every post.'} Consistent voice builds audience trust.`,
      source: `Voice consistency scored ${Math.round(voiceConsistencyScore)}/100.`,
    });
  }

  // Weakest phase
  if (weakest.score < 70) {
    const phaseNames: Record<string, string> = {
      define: 'brand definition',
      check: 'brand consistency',
      generate: 'content generation readiness',
      scale: 'growth readiness',
    };
    actions.push({
      priority: 'high',
      category: 'long-term',
      title: `Focus on your ${phaseNames[weakest.key]} (${weakest.score}/100)`,
      detail: weakest.insights[0] || `This is your lowest-scoring dimension. Improving it will have the biggest impact on your overall Brand Score.`,
      source: `${weakest.key.toUpperCase()} phase scored ${weakest.score}/100 — your biggest opportunity.`,
    });
  }

  // Posting cadence
  if (profile.tweet_count < 500) {
    actions.push({
      priority: 'medium',
      category: 'long-term',
      title: 'Post more consistently',
      detail: `With ${profile.tweet_count.toLocaleString()} total posts, increasing your cadence will give the algorithm more signals. Aim for 3-5 posts per week minimum.`,
      source: `Account has ${profile.tweet_count.toLocaleString()} total posts.`,
    });
  }

  // Follower ratio
  const ratio = profile.followers_count / Math.max(profile.following_count, 1);
  if (ratio < 1) {
    actions.push({
      priority: 'medium',
      category: 'long-term',
      title: 'Improve your follower-to-following ratio',
      detail: `Currently ${ratio.toFixed(1)}:1. Focus on creating original content rather than just engaging. Unfollow inactive accounts to signal authority.`,
      source: `Following ${profile.following_count.toLocaleString()} accounts with ${profile.followers_count.toLocaleString()} followers.`,
    });
  }

  // General improvement from brand score
  brandScore.topImprovements.slice(0, 2).forEach((improvement) => {
    if (!actions.some(a => a.detail.includes(improvement))) {
      actions.push({
        priority: 'medium',
        category: 'long-term',
        title: improvement,
        detail: 'This was flagged by our AI analysis as a growth lever specific to your account.',
        source: 'AI brand analysis recommendation.',
      });
    }
  });

  // Sort: high > medium > low, quick-win > long-term
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const categoryOrder = { 'quick-win': 0, 'long-term': 1 };
  actions.sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return categoryOrder[a.category] - categoryOrder[b.category];
  });

  return actions.slice(0, 6);
}

export default function ActionPlanSection({
  profile,
  brandScore,
  keywords,
  doPatterns,
  voiceConsistencyScore,
  onViewDashboard,
  theme,
  parallaxLayers,
}: ActionPlanSectionProps) {
  const isDark = theme === 'dark';
  const accentColor = '#ff6b35';

  const actions = generateActions(profile, brandScore, keywords, doPatterns, voiceConsistencyScore);
  const quickWins = actions.filter(a => a.category === 'quick-win');
  const longTerm = actions.filter(a => a.category === 'long-term');

  return (
    <WalkthroughSection
      label="SCALE: Start Here"
      theme={theme}
      accentColor={accentColor}
      parallaxLayers={parallaxLayers}
      narrativeBlocks={[
        {
          type: 'context',
          content: `Based on everything we found, here are the specific changes that will move your Brand Score the most — starting with things you can do right now.`,
        },
      ]}
    >
      <div className="space-y-6">
        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <div>
            <h4
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: '#10B981',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ display: 'inline-block', width: 6, height: 6, background: '#10B981', borderRadius: '50%' }} />
              QUICK WINS (DO THESE NOW)
            </h4>
            <div className="space-y-3">
              {quickWins.map((action, i) => (
                <ActionCard key={i} action={action} index={i + 1} isDark={isDark} />
              ))}
            </div>
          </div>
        )}

        {/* Long-Term */}
        {longTerm.length > 0 && (
          <div>
            <h4
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: accentColor,
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ display: 'inline-block', width: 6, height: 6, background: accentColor, borderRadius: '50%' }} />
              LONG-TERM IMPROVEMENTS
            </h4>
            <div className="space-y-3">
              {longTerm.map((action, i) => (
                <ActionCard key={i} action={action} index={quickWins.length + i + 1} isDark={isDark} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {actions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p
              style={{
                fontSize: '16px',
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              }}
            >
              Your brand is in great shape. Keep doing what you&apos;re doing.
            </p>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '32px 20px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            marginTop: '8px',
          }}
        >
          <p
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.15em',
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              textAlign: 'center',
            }}
          >
            READY TO TAKE CONTROL OF YOUR BRAND?
          </p>
          <motion.button
            onClick={onViewDashboard}
            whileHover={{ scale: 1.03, boxShadow: `0 0 30px ${accentColor}40` }}
            whileTap={{ scale: 0.98 }}
            className="px-10 py-5 cursor-pointer border-none font-semibold"
            style={{
              fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
              fontSize: '14px',
              letterSpacing: '0.12em',
              color: '#050505',
              background: `linear-gradient(135deg, ${accentColor} 0%, #e55d2b 100%)`,
              boxShadow: `0 4px 24px ${accentColor}40`,
              border: `2px solid ${accentColor}`,
            }}
          >
            VIEW YOUR DASHBOARD
          </motion.button>
        </motion.div>
      </div>
    </WalkthroughSection>
  );
}

function ActionCard({ action, index, isDark }: { action: ActionItem; index: number; isDark: boolean }) {
  const priorityColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      style={{
        padding: '16px',
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
        borderRadius: '4px',
        display: 'flex',
        gap: '14px',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '12px',
          fontWeight: 600,
          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        }}
      >
        {index}
      </div>
      <div className="flex-1">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: isDark ? '#fff' : '#000',
              lineHeight: 1.4,
            }}
          >
            {action.title}
          </span>
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '8px',
              letterSpacing: '0.08em',
              padding: '2px 6px',
              borderRadius: '2px',
              background: `${priorityColors[action.priority]}15`,
              color: priorityColors[action.priority],
              flexShrink: 0,
            }}
          >
            {action.priority.toUpperCase()}
          </span>
        </div>
        <p
          style={{
            fontSize: '13px',
            lineHeight: 1.55,
            color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
            margin: '0 0 6px 0',
          }}
        >
          {action.detail}
        </p>
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.05em',
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          }}
        >
          SOURCE: {action.source}
        </span>
      </div>
    </motion.div>
  );
}

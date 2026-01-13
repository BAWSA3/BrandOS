'use client';

import { motion } from 'framer-motion';
import WalkthroughSection from '../WalkthroughSection';
import { AuthenticityAnalysis } from '@/lib/gemini';
import { StaggerContainer, StaggerItem } from '../motion';

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

interface IssuesWalkthroughProps {
  brandScore: BrandScoreResult;
  profile: XProfileData;
  authenticity?: AuthenticityAnalysis | null;
  theme: string;
}

interface Issue {
  title: string;
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  description: string;
  fix: string;
  impact: number; // potential score improvement
  priority: number; // 1-5, 1 being highest priority
}

function detectIssues(
  brandScore: BrandScoreResult,
  profile: XProfileData,
  authenticity?: AuthenticityAnalysis | null
): Issue[] {
  const issues: Issue[] = [];

  // Authenticity issues
  if (authenticity && (100 - authenticity.score) < 50) {
    issues.push({
      title: 'Authenticity Concerns',
      severity: 'critical',
      metric: `${(100 - authenticity.score)}% authentic`,
      description: 'Unusual patterns detected that may indicate inauthentic activity.',
      fix: 'Focus on genuine engagement rather than growth hacks. Quality interactions build lasting audiences.',
      impact: 15,
      priority: 1,
    });
  }

  // Bio issues
  const bioLength = profile.description?.length || 0;
  if (bioLength < 80) {
    issues.push({
      title: 'Bio Underutilized',
      severity: bioLength < 40 ? 'critical' : 'warning',
      metric: `${bioLength}/160 chars`,
      description: 'Your bio is too short to effectively communicate your value proposition.',
      fix: 'Expand your bio with: who you are, what you post about, and a clear call-to-action.',
      impact: bioLength < 40 ? 12 : 8,
      priority: bioLength < 40 ? 1 : 2,
    });
  }

  // Missing link
  if (!profile.url) {
    issues.push({
      title: 'No Website Link',
      severity: 'warning',
      metric: 'Missing',
      description: 'You are missing an opportunity to drive traffic from your profile.',
      fix: 'Add a link to your website, newsletter, or featured content.',
      impact: 5,
      priority: 3,
    });
  }

  // Low phase scores
  const phases = [
    { name: 'Define', score: brandScore.phases.define.score },
    { name: 'Check', score: brandScore.phases.check.score },
    { name: 'Generate', score: brandScore.phases.generate.score },
    { name: 'Scale', score: brandScore.phases.scale.score },
  ];

  phases.forEach((phase) => {
    if (phase.score < 50) {
      issues.push({
        title: `Low ${phase.name} Score`,
        severity: phase.score < 30 ? 'critical' : 'warning',
        metric: `${phase.score}/100`,
        description: `Your ${phase.name.toLowerCase()} phase is underperforming.`,
        fix:
          phase.name === 'Define'
            ? 'Clarify your brand identity with a stronger bio and consistent visual style.'
            : phase.name === 'Check'
            ? 'Improve consistency in your posting frequency and voice.'
            : phase.name === 'Generate'
            ? 'Complete your profile and create more engaging content.'
            : 'Focus on growth tactics and engagement optimization.',
        impact: phase.score < 30 ? 10 : 6,
        priority: phase.score < 30 ? 2 : 3,
      });
    }
  });

  // Low engagement ratio
  if (profile.followers_count > 1000 && profile.followers_count / profile.tweet_count < 0.5) {
    issues.push({
      title: 'Low Content Efficiency',
      severity: 'info',
      metric: `${(profile.followers_count / profile.tweet_count).toFixed(1)} followers/post`,
      description: 'Your content-to-follower ratio suggests room for optimization.',
      fix: 'Focus on quality over quantity. Analyze your best-performing posts and create more like them.',
      impact: 4,
      priority: 4,
    });
  }

  // Sort by priority and return top 4
  return issues.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

// Calculate health score based on issues
function calculateHealthScore(issues: Issue[]): number {
  if (issues.length === 0) return 100;
  const totalImpact = issues.reduce((sum, i) => sum + i.impact, 0);
  return Math.max(0, Math.round(100 - totalImpact));
}

// Get health label
function getHealthLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Excellent', color: '#10B981' };
  if (score >= 70) return { label: 'Good', color: '#3B82F6' };
  if (score >= 50) return { label: 'Needs Work', color: '#F59E0B' };
  return { label: 'Critical', color: '#EF4444' };
}

export default function IssuesWalkthrough({
  brandScore,
  profile,
  authenticity,
  theme,
}: IssuesWalkthroughProps) {
  const issues = detectIssues(brandScore, profile, authenticity);
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const healthScore = calculateHealthScore(issues);
  const healthInfo = getHealthLabel(healthScore);
  const totalPotentialImprovement = issues.reduce((sum, i) => sum + i.impact, 0);

  const isDark = theme === 'dark';

  const howWeCalculated = criticalCount > 0 || warningCount > 0
    ? `Compared against successful creators: ${criticalCount} critical, ${warningCount} warning${warningCount !== 1 ? 's' : ''}, ${infoCount} info. Health score: ${healthScore}/100.`
    : 'No issues detected - your brand fundamentals are solid.';

  const whyItMatters = `Addressing issues removes friction from growth. Critical issues hurt reach; warnings are missed opportunities.`;

  const whatYouCanDo =
    issues.length > 0
      ? [
          issues[0] ? `Priority fix: ${issues[0].fix}` : '',
          `Fixing all issues could improve your score by up to +${totalPotentialImprovement} points.`,
          'Address critical issues first, then move to warnings.',
        ].filter(Boolean)
      : [
          'Your brand has no major issues! Focus on consistency and growth.',
          'Monitor your metrics regularly to catch issues early.',
          'Experiment with new content formats to find optimization opportunities.',
        ];

  return (
    <WalkthroughSection
      label="Issues Detected"
      howWeCalculated={howWeCalculated}
      whyItMatters={whyItMatters}
      whatYouCanDo={whatYouCanDo}
      theme={theme}
      accentColor="#EF4444"
    >
      {/* Bento Grid Layout for Issues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {issues.length > 0 ? (
          <>
            {/* Health Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-[4px] p-5 relative overflow-hidden"
              style={{
                background: healthInfo.color,
              }}
            >
              <div
                className="text-[10px] tracking-wider mb-2"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                BRAND HEALTH
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-4xl font-bold"
                  style={{ color: '#FFFFFF' }}
                >
                  {healthScore}
                </span>
                <span
                  className="text-lg"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  /100
                </span>
              </div>
              <div
                className="text-sm mt-1"
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                {healthInfo.label}
              </div>
              {/* Decorative circle */}
              <div
                className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-20"
                style={{ background: '#FFFFFF' }}
              />
            </motion.div>

            {/* Issue Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-[4px] p-4 flex flex-col justify-between"
              style={{
                background: isDark ? '#1A1A1A' : '#F8F8F8',
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div
                className="text-[10px] tracking-wider mb-3"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                }}
              >
                ISSUES BREAKDOWN
              </div>
              <div className="space-y-2">
                {criticalCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span
                        className="text-xs"
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        }}
                      >
                        Critical
                      </span>
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: '#EF4444' }}
                    >
                      {criticalCount}
                    </span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span
                        className="text-xs"
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        }}
                      >
                        Warning
                      </span>
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: '#F59E0B' }}
                    >
                      {warningCount}
                    </span>
                  </div>
                )}
                {infoCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span
                        className="text-xs"
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        }}
                      >
                        Info
                      </span>
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: '#3B82F6' }}
                    >
                      {infoCount}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Potential Improvement Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-[4px] p-4"
              style={{
                background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div
                className="text-[10px] tracking-wider mb-2"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  color: '#10B981',
                }}
              >
                POTENTIAL GAIN
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-3xl font-bold"
                  style={{ color: '#10B981' }}
                >
                  +{totalPotentialImprovement}
                </span>
                <span
                  className="text-sm"
                  style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                >
                  pts
                </span>
              </div>
              <div
                className="text-xs mt-1"
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                }}
              >
                if all issues fixed
              </div>
            </motion.div>

            {/* Issue Cards Grid */}
            <StaggerContainer className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4" staggerDelay={0.1} initialDelay={0.3}>
              {issues.map((issue, index) => (
                <StaggerItem
                  key={issue.title}
                  direction="up"
                  className="rounded-[4px] p-4 md:p-5"
                  style={{
                    background: isDark
                      ? issue.severity === 'critical'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : issue.severity === 'warning'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(59, 130, 246, 0.1)'
                      : issue.severity === 'critical'
                      ? 'rgba(239, 68, 68, 0.08)'
                      : issue.severity === 'warning'
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(59, 130, 246, 0.08)',
                    border: `1px solid ${
                      issue.severity === 'critical'
                        ? 'rgba(239, 68, 68, 0.3)'
                        : issue.severity === 'warning'
                        ? 'rgba(245, 158, 11, 0.3)'
                        : 'rgba(59, 130, 246, 0.3)'
                    }`,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            fontFamily: "'VCR OSD Mono', monospace",
                            background:
                              issue.severity === 'critical'
                                ? 'rgba(239, 68, 68, 0.3)'
                                : issue.severity === 'warning'
                                ? 'rgba(245, 158, 11, 0.3)'
                                : 'rgba(59, 130, 246, 0.3)',
                            color:
                              issue.severity === 'critical'
                                ? '#EF4444'
                                : issue.severity === 'warning'
                                ? '#F59E0B'
                                : '#3B82F6',
                          }}
                        >
                          #{index + 1} {issue.severity.toUpperCase()}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            fontFamily: "'VCR OSD Mono', monospace",
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10B981',
                          }}
                        >
                          +{issue.impact} PTS
                        </span>
                      </div>
                      <h4
                        className="font-medium"
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: '14px',
                          color: isDark ? '#FFFFFF' : '#000000',
                        }}
                      >
                        {issue.title}
                      </h4>
                    </div>
                    <span
                      className="text-xs shrink-0"
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        color:
                          issue.severity === 'critical'
                            ? '#EF4444'
                            : issue.severity === 'warning'
                            ? '#F59E0B'
                            : '#3B82F6',
                      }}
                    >
                      {issue.metric}
                    </span>
                  </div>

                  {/* Description */}
                  <p
                    className="text-sm mb-3"
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    }}
                  >
                    {issue.description}
                  </p>

                  {/* Fix */}
                  <div
                    className="flex items-start gap-2 p-3 rounded-[4px]"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    }}
                  >
                    <span className="text-sm shrink-0">💡</span>
                    <p
                      className="text-sm"
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                      }}
                    >
                      {issue.fix}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </>
        ) : (
          /* No Issues State */
          <>
            {/* Perfect Health Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="md:col-span-3 rounded-[4px] p-8 text-center"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                className="text-6xl mb-4"
              >
                ✅
              </motion.div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  color: '#10B981',
                }}
              >
                No Major Issues Detected
              </h3>
              <p
                className="mb-4"
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '14px',
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                }}
              >
                Your brand fundamentals are solid. Focus on growth and optimization.
              </p>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: '#10B981' }}
                  >
                    100
                  </div>
                  <div
                    className="text-[10px] tracking-wider"
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    }}
                  >
                    HEALTH SCORE
                  </div>
                </div>
                <div
                  className="w-px h-12"
                  style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                />
                <div className="text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: isDark ? '#FFFFFF' : '#000000' }}
                  >
                    0
                  </div>
                  <div
                    className="text-[10px] tracking-wider"
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    }}
                  >
                    ISSUES FOUND
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </WalkthroughSection>
  );
}

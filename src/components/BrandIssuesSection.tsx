'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, AlertCircle, Info, TrendingDown, MessageSquare, Users, Target, Zap, Volume2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface BrandIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  metric?: string;
  description: string;
  impact: string;
  fixTeaser: string;
  icon: React.ReactNode;
}

export interface BrandIssuesSectionProps {
  voiceConsistency?: number;
  engagementScore?: number;
  brandScore?: number;
  followersCount?: number;
  followingCount?: number;
  hasBio?: boolean;
  bioLength?: number;
  hasContentPillars?: boolean;
  contentPillarsCount?: number;
  authenticityScore?: number;
  isWarning?: boolean;
}

// ============================================================================
// Issue Detection Logic
// ============================================================================

function detectBrandIssues(props: BrandIssuesSectionProps): BrandIssue[] {
  const issues: BrandIssue[] = [];
  const {
    voiceConsistency = 70,
    engagementScore = 50,
    brandScore = 50,
    followersCount = 0,
    followingCount = 0,
    hasBio = true,
    bioLength = 100,
    hasContentPillars = true,
    contentPillarsCount = 3,
    authenticityScore = 100,
    isWarning = false,
  } = props;

  // Voice Consistency Issues
  if (voiceConsistency < 50) {
    issues.push({
      id: 'voice-critical',
      severity: 'critical',
      title: 'Inconsistent Voice',
      metric: `${voiceConsistency}%`,
      description: 'Your messaging style varies significantly across posts, confusing your audience about who you are.',
      impact: 'Followers struggle to recognize your content, reducing engagement and memorability.',
      fixTeaser: 'BrandOS analyzes your best-performing content to establish consistent voice guidelines.',
      icon: <Volume2 size={18} />,
    });
  } else if (voiceConsistency < 70) {
    issues.push({
      id: 'voice-warning',
      severity: 'warning',
      title: 'Voice Drift Detected',
      metric: `${voiceConsistency}%`,
      description: 'Your tone shifts between posts. Some feel formal, others casual.',
      impact: 'Inconsistency weakens brand recall and audience trust.',
      fixTeaser: 'Get real-time voice checking before you post.',
      icon: <Volume2 size={18} />,
    });
  }

  // Engagement Issues
  if (engagementScore < 40) {
    issues.push({
      id: 'engagement-critical',
      severity: 'critical',
      title: 'Low Engagement',
      metric: `${engagementScore}/100`,
      description: 'Your content isn\'t resonating. Low likes, replies, and shares indicate a disconnect.',
      impact: 'Algorithm deprioritization leads to shrinking reach over time.',
      fixTeaser: 'AI-powered content suggestions based on what works for your archetype.',
      icon: <TrendingDown size={18} />,
    });
  } else if (engagementScore < 60) {
    issues.push({
      id: 'engagement-warning',
      severity: 'warning',
      title: 'Engagement Below Potential',
      metric: `${engagementScore}/100`,
      description: 'Your engagement is average for your follower count. There\'s room to grow.',
      impact: 'Missing opportunities to convert followers into fans.',
      fixTeaser: 'Discover your high-performing content patterns.',
      icon: <TrendingDown size={18} />,
    });
  }

  // Bio/Profile Issues
  if (!hasBio || bioLength < 50) {
    issues.push({
      id: 'bio-critical',
      severity: 'critical',
      title: 'Weak Bio',
      metric: bioLength > 0 ? `${bioLength} chars` : 'Empty',
      description: 'Your bio doesn\'t clearly communicate who you are or what value you provide.',
      impact: 'Profile visitors leave without following—wasted discovery opportunities.',
      fixTeaser: 'Generate an optimized bio based on your Brand DNA.',
      icon: <MessageSquare size={18} />,
    });
  } else if (bioLength < 100) {
    issues.push({
      id: 'bio-warning',
      severity: 'warning',
      title: 'Bio Underutilized',
      metric: `${bioLength}/160 chars`,
      description: 'You\'re not using your full bio space to communicate your value.',
      impact: 'Missing keywords and CTAs that could drive conversions.',
      fixTeaser: 'Optimize your bio with strategic keywords.',
      icon: <MessageSquare size={18} />,
    });
  }

  // Content Pillars Issues
  if (!hasContentPillars || contentPillarsCount < 2) {
    issues.push({
      id: 'pillars-warning',
      severity: 'warning',
      title: 'Content Gaps',
      metric: contentPillarsCount > 0 ? `${contentPillarsCount} pillars` : 'None detected',
      description: 'Your content lacks clear themes. Audiences can\'t predict what to expect.',
      impact: 'Harder to build authority in any specific area.',
      fixTeaser: 'Identify and strengthen your content pillars.',
      icon: <Target size={18} />,
    });
  }

  // Follower Ratio Issues (potential bot/spam signals)
  if (followersCount > 0 && followingCount > 0) {
    const ratio = followingCount / followersCount;
    if (ratio > 5 && followersCount < 1000) {
      issues.push({
        id: 'ratio-warning',
        severity: 'info',
        title: 'Follow Ratio Imbalanced',
        metric: `Following ${followingCount} / ${followersCount} followers`,
        description: 'You follow many more accounts than follow you, which can appear spammy.',
        impact: 'May reduce perceived authority and profile credibility.',
        fixTeaser: 'Strategies to grow organic followers.',
        icon: <Users size={18} />,
      });
    }
  }

  // Authenticity Warning
  if (isWarning || authenticityScore < 60) {
    issues.push({
      id: 'authenticity-critical',
      severity: 'critical',
      title: 'Authenticity Concerns',
      metric: authenticityScore < 100 ? `${authenticityScore}% authentic` : undefined,
      description: 'Unusual patterns detected that may indicate inauthentic activity.',
      impact: 'Platform algorithms may suppress your content, and audiences may lose trust.',
      fixTeaser: 'Build genuine engagement strategies.',
      icon: <AlertTriangle size={18} />,
    });
  }

  // Overall Brand Score
  if (brandScore < 50) {
    issues.push({
      id: 'brand-critical',
      severity: 'critical',
      title: 'Brand Clarity Crisis',
      metric: `${brandScore}/100`,
      description: 'Your overall brand presence lacks definition and consistency.',
      impact: 'Difficult to stand out and build meaningful audience connections.',
      fixTeaser: 'Complete Brand DNA system to rebuild from the ground up.',
      icon: <Zap size={18} />,
    });
  } else if (brandScore < 70) {
    issues.push({
      id: 'brand-warning',
      severity: 'warning',
      title: 'Brand Needs Polish',
      metric: `${brandScore}/100`,
      description: 'You have a foundation, but your brand isn\'t fully optimized.',
      impact: 'Leaving growth and opportunities on the table.',
      fixTeaser: 'Fine-tune your brand with targeted improvements.',
      icon: <Zap size={18} />,
    });
  }

  // Sort by severity
  const severityOrder: Record<IssueSeverity, number> = { critical: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return issues;
}

// ============================================================================
// Severity Styling
// ============================================================================

const severityStyles: Record<IssueSeverity, { bg: string; border: string; icon: string; badge: string; badgeBg: string }> = {
  critical: {
    bg: 'bg-red-500/5',
    border: 'border-red-500/30',
    icon: 'text-red-500',
    badge: 'text-red-400',
    badgeBg: 'bg-red-500/20',
  },
  warning: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/30',
    icon: 'text-amber-500',
    badge: 'text-amber-400',
    badgeBg: 'bg-amber-500/20',
  },
  info: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    badge: 'text-blue-400',
    badgeBg: 'bg-blue-500/20',
  },
};

const SeverityIcon: React.FC<{ severity: IssueSeverity }> = ({ severity }) => {
  if (severity === 'critical') return <AlertTriangle size={14} className="text-red-500" />;
  if (severity === 'warning') return <AlertCircle size={14} className="text-amber-500" />;
  return <Info size={14} className="text-blue-400" />;
};

// ============================================================================
// Issue Card Component
// ============================================================================

interface IssueCardProps {
  issue: BrandIssue;
  index: number;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, index }) => {
  const styles = severityStyles[issue.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`relative rounded-xl p-4 border ${styles.bg} ${styles.border} hover:border-opacity-60 transition-all group`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${styles.badgeBg}`}>
            <span className={styles.icon}>{issue.icon}</span>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm leading-tight">{issue.title}</h4>
            {issue.metric && (
              <span className="font-mono text-[10px] text-gray-500 tracking-wider">{issue.metric}</span>
            )}
          </div>
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${styles.badgeBg} ${styles.badge}`}>
          <SeverityIcon severity={issue.severity} />
          {issue.severity}
        </span>
      </div>

      {/* Description */}
      <p className="text-[13px] text-gray-400 leading-relaxed mb-3">
        {issue.description}
      </p>

      {/* Impact */}
      <div className="bg-black/30 rounded-lg p-2.5 mb-3">
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block mb-1">IMPACT</span>
        <p className="text-[12px] text-gray-300 leading-relaxed">{issue.impact}</p>
      </div>

      {/* Fix Teaser */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <span className="text-[10px] text-[#D4A574] font-medium">
          💡 {issue.fixTeaser}
        </span>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const BrandIssuesSection: React.FC<BrandIssuesSectionProps> = (props) => {
  const issues = detectBrandIssues(props);

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  if (issues.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-4xl mx-auto px-4"
      >
        <div className="text-center py-8 px-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-emerald-400 mb-2">No Major Issues Detected</h3>
          <p className="text-sm text-gray-400">Your brand is performing well! Minor optimizations may still be available.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 
            className="text-lg font-bold text-white mb-1"
            style={{ fontFamily: "'VCR OSD Mono', monospace", letterSpacing: '0.1em' }}
          >
            ISSUES DETECTED
          </h2>
          <p className="text-sm text-gray-500">
            Areas that need attention to strengthen your brand
          </p>
        </div>
        
        {/* Summary Badges */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
              <AlertTriangle size={12} className="text-red-500" />
              <span className="text-[11px] font-bold text-red-400">{criticalCount} CRITICAL</span>
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
              <AlertCircle size={12} className="text-amber-500" />
              <span className="text-[11px] font-bold text-amber-400">{warningCount} WARNING</span>
            </span>
          )}
          {infoCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
              <Info size={12} className="text-blue-400" />
              <span className="text-[11px] font-bold text-blue-400">{infoCount} INFO</span>
            </span>
          )}
        </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {issues.map((issue, index) => (
          <IssueCard key={issue.id} issue={issue} index={index} />
        ))}
      </div>
    </motion.div>
  );
};

export default BrandIssuesSection;

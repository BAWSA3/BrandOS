'use client';

import { useCallback } from 'react';
import { motion, type Variants } from 'motion/react';
import BrandScoreCard from './BrandScoreCard';
import QuickStatsCard from './QuickStatsCard';
import RecentPostsCard from './RecentPostsCard';
import AIInsightsPanel from './AIInsightsPanel';
import AIIdeaFeed from './AIIdeaFeed';
import PhaseQuickAccess from './PhaseQuickAccess';
import { useDashboardData } from './useDashboardData';
import { useBrandCompleteness } from '@/components/BrandCompleteness';
import { useBrandStore } from '@/lib/store';
import { useWorkflowStore } from '@/components/workflow/useWorkflowStore';
import type { Phase } from '@/components/PhaseNavigation';
import type { TonePill } from '@/components/workflow/workflow.types';

interface DashboardHomeProps {
  onNavigatePhase: (phase: Phase) => void;
}

// Staggered animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function DashboardHome({ onNavigatePhase }: DashboardHomeProps) {
  const {
    posts,
    insights,
    ideas,
    stats,
    isLoadingPosts,
    isLoadingInsights,
    isLoadingIdeas,
    refreshIdeas,
  } = useDashboardData();

  const completeness = useBrandCompleteness();
  const { phaseProgress } = useBrandStore();

  // Bridge: idea -> Generate workflow
  const handleCreatePost = useCallback(
    (topic: string, tone: string) => {
      // Pre-fill the workflow store
      useWorkflowStore.setState({
        topic,
        tone: (tone || 'casual') as TonePill,
      });
      // Navigate to Generate phase
      onNavigatePhase('generate');
    },
    [onNavigatePhase]
  );

  return (
    <div className="min-h-[calc(100vh-140px)] p-6">
      <motion.div
        className="max-w-[1400px] mx-auto grid grid-cols-3 gap-4 auto-rows-min"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Row 1: Brand Score Hero (2 cols) + Quick Stats (1 col) */}
        <motion.div className="col-span-2" variants={itemVariants}>
          <BrandScoreCard />
        </motion.div>

        <motion.div className="col-span-1" variants={itemVariants}>
          <QuickStatsCard
            postsThisWeek={stats.postsThisWeek}
            avgEngagementRate={stats.avgEngagementRate}
            brandConsistency={stats.brandConsistency}
          />
        </motion.div>

        {/* Row 2: Recent Posts (full width) */}
        <motion.div className="col-span-3" variants={itemVariants}>
          <RecentPostsCard posts={posts} isLoading={isLoadingPosts} />
        </motion.div>

        {/* Row 3: AI Insights (full width) */}
        <motion.div className="col-span-3" variants={itemVariants}>
          <AIInsightsPanel insights={insights} isLoading={isLoadingInsights} />
        </motion.div>

        {/* Row 4: Idea Feed (2 cols) + Phase Quick Access (1 col) */}
        <motion.div className="col-span-2" variants={itemVariants}>
          <AIIdeaFeed
            ideas={ideas}
            isLoading={isLoadingIdeas}
            onRefresh={refreshIdeas}
            onCreatePost={handleCreatePost}
          />
        </motion.div>

        <motion.div className="col-span-1" variants={itemVariants}>
          <PhaseQuickAccess
            brandCompleteness={completeness}
            hasChecked={phaseProgress.hasCompletedFirstCheck}
            hasGenerated={phaseProgress.hasCompletedFirstGeneration}
            onNavigate={onNavigatePhase}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

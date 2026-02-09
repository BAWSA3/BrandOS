'use client';

import { useCallback } from 'react';
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

  const handleCreatePost = useCallback(
    (topic: string, tone: string) => {
      useWorkflowStore.setState({
        topic,
        tone: (tone || 'casual') as TonePill,
      });
      onNavigatePhase('generate');
    },
    [onNavigatePhase]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top row: Brand score + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <BrandScoreCard />
        </div>
        <div>
          <QuickStatsCard
            postsThisWeek={stats.postsThisWeek}
            avgEngagementRate={stats.avgEngagementRate}
            brandConsistency={stats.brandConsistency}
          />
        </div>
      </div>

      {/* Recent posts */}
      <RecentPostsCard posts={posts} isLoading={isLoadingPosts} />

      {/* AI Insights */}
      <AIInsightsPanel insights={insights} isLoading={isLoadingInsights} />

      {/* Bottom row: Ideas + Phase access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AIIdeaFeed
            ideas={ideas}
            isLoading={isLoadingIdeas}
            onRefresh={refreshIdeas}
            onCreatePost={handleCreatePost}
          />
        </div>
        <div>
          <PhaseQuickAccess
            brandCompleteness={completeness}
            hasChecked={phaseProgress.hasCompletedFirstCheck}
            hasGenerated={phaseProgress.hasCompletedFirstGeneration}
            onNavigate={onNavigatePhase}
          />
        </div>
      </div>
    </div>
  );
}

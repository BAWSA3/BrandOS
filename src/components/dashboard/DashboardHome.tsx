'use client';

import { useCallback, CSSProperties } from 'react';
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

// Staggered reveal animation helper
function staggerStyle(index: number): CSSProperties {
  return {
    animationDelay: `${index * 80}ms`,
    animationFillMode: 'both',
  };
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
    <div className="space-y-4">
      {/* ─── Row 1: Brand Score Hero (2/3) + Quick Stats (1/3) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 animate-fade-in" style={staggerStyle(0)}>
          <BrandScoreCard />
        </div>
        <div className="animate-fade-in" style={staggerStyle(1)}>
          <QuickStatsCard
            postsThisWeek={stats.postsThisWeek}
            avgEngagementRate={stats.avgEngagementRate}
            brandConsistency={stats.brandConsistency}
          />
        </div>
      </div>

      {/* ─── Row 2: Recent X Posts (full-width scrollable) ─── */}
      <div className="animate-fade-in" style={staggerStyle(2)}>
        <RecentPostsCard posts={posts} isLoading={isLoadingPosts} />
      </div>

      {/* ─── Row 2b: AI Performance Insights ─── */}
      <div className="animate-fade-in" style={staggerStyle(3)}>
        <AIInsightsPanel insights={insights} isLoading={isLoadingInsights} />
      </div>

      {/* ─── Row 3: AI Idea Feed (2/3) + Phase Quick Access (1/3) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 animate-fade-in" style={staggerStyle(4)}>
          <AIIdeaFeed
            ideas={ideas}
            isLoading={isLoadingIdeas}
            onRefresh={refreshIdeas}
            onCreatePost={handleCreatePost}
          />
        </div>
        <div className="animate-fade-in" style={staggerStyle(5)}>
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

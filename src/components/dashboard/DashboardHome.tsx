'use client';

import { useCallback, CSSProperties } from 'react';
import BrandScoreCard from './BrandScoreCard';
import QuickStatsCard from './QuickStatsCard';
import BrandFeedCard from './BrandFeedCard';
import BrandConsistencyChart from './BrandConsistencyChart';
import AIInsightsPanel from './AIInsightsPanel';
import AIIdeaFeed from './AIIdeaFeed';
import PhaseQuickAccess from './PhaseQuickAccess';
import { useDashboardData } from './useDashboardData';
import { useBrandCompleteness } from '@/components/BrandCompleteness';
import { useBrandStore, useCurrentBrand } from '@/lib/store';
import { useWorkflowStore } from '@/components/workflow/useWorkflowStore';
import CalendarSummaryCard from './CalendarSummaryCard';
import DriftAlertsBar from './DriftAlertsBar';
import type { Phase } from '@/components/PhaseNavigation';
import type { TonePill } from '@/components/workflow/workflow.types';
import SwissBackground from '../SwissBackground';

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
    insights,
    ideas,
    health,
    stats,
    isLoadingInsights,
    isLoadingIdeas,
    refreshIdeas,
  } = useDashboardData();

  const completeness = useBrandCompleteness();
  const { phaseProgress } = useBrandStore();
  const brand = useCurrentBrand();

  const handleSaveToCalendar = useCallback(
    async (topic: string, tone: string) => {
      if (!brand?.id) return;
      try {
        await fetch('/api/calendar/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId: brand.id,
            content: topic,
            tone: tone || 'casual',
            status: 'idea',
            sourceType: 'idea-feed',
          }),
        });
      } catch (err) {
        console.error('Failed to save to calendar:', err);
      }
    },
    [brand?.id]
  );

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
    <SwissBackground mode="page" showClouds={false}>
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
              brandTrend={health.hasSnapshot ? health.trend : undefined}
            />
          </div>
        </div>

        {/* ─── Drift Alerts ─── */}
        <div className="animate-fade-in" style={staggerStyle(2)}>
          <DriftAlertsBar />
        </div>

        {/* ─── Row 2: Brand Feed — synced X tweets with alignment scores ─── */}
        <div className="animate-fade-in" style={staggerStyle(3)}>
          <BrandFeedCard />
        </div>

        {/* ─── Row 2b: Brand Consistency Over Time ─── */}
        <div className="animate-fade-in" style={staggerStyle(4)}>
          <BrandConsistencyChart />
        </div>

        {/* ─── Row 2c: AI Performance Insights ─── */}
        <div className="animate-fade-in" style={staggerStyle(5)}>
          <AIInsightsPanel insights={insights} isLoading={isLoadingInsights} />
        </div>

        {/* ─── Row 3: AI Idea Feed (2/3) + Calendar Summary + Phase Access (1/3) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 animate-fade-in" style={staggerStyle(6)}>
            <AIIdeaFeed
              ideas={ideas}
              isLoading={isLoadingIdeas}
              onRefresh={refreshIdeas}
              onCreatePost={handleCreatePost}
              onSaveToCalendar={handleSaveToCalendar}
            />
          </div>
          <div className="space-y-4 animate-fade-in" style={staggerStyle(7)}>
            <CalendarSummaryCard
              onOpenCalendar={() => onNavigatePhase('generate')}
            />
            <PhaseQuickAccess
              brandCompleteness={completeness}
              hasChecked={phaseProgress.hasCompletedFirstCheck}
              hasGenerated={phaseProgress.hasCompletedFirstGeneration}
              onNavigate={onNavigatePhase}
            />
          </div>
        </div>
      </div>
    </SwissBackground>
  );
}

'use client';

import { useCallback, useMemo, CSSProperties } from 'react';
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
import { SeasonalScene } from '@/components/world';
import AsciiBird from '@/components/AsciiBird';
import { SEASON_PALETTES } from '@/components/ascii-sky/ascii-sky-engine';

interface DashboardHomeProps {
  onNavigatePhase: (phase: Phase) => void;
}

function staggerStyle(index: number): CSSProperties {
  return {
    animationDelay: `${index * 80}ms`,
    animationFillMode: 'both',
  };
}

const GROWTH_MILESTONES = [
  { threshold: 0, label: 'Barren ground', season: 'spring' as const },
  { threshold: 15, label: 'Seeds planted', season: 'spring' as const },
  { threshold: 30, label: 'First sprouts', season: 'spring' as const },
  { threshold: 50, label: 'Growing strong', season: 'summer' as const },
  { threshold: 70, label: 'In full bloom', season: 'summer' as const },
  { threshold: 85, label: 'Bearing fruit', season: 'autumn' as const },
  { threshold: 100, label: 'Fully cultivated', season: 'autumn' as const },
];

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

  const growthState = useMemo(() => {
    let current = GROWTH_MILESTONES[0];
    for (const m of GROWTH_MILESTONES) {
      if (completeness >= m.threshold) current = m;
    }
    return current;
  }, [completeness]);

  const palette = SEASON_PALETTES[growthState.season];

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
    <div>
      {/* Living World Hero */}
      <div
        className="relative overflow-hidden animate-fade-in"
        style={{
          height: 220,
          borderRadius: 12,
          marginBottom: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <SeasonalScene
          season={growthState.season}
          growth={completeness / 100}
          height="220px"
          fontSize="10px"
          showPath
        />

        {/* Bird companion */}
        <AsciiBird
          mode="perch"
          season={growthState.season}
          scale={0.15}
          top="25%"
          perchX={30 + (completeness / 100) * 40}
        />

        {/* Overlay: brand info */}
        <div
          className="absolute inset-0 flex flex-col justify-end pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(5,5,16,0.85) 0%, rgba(5,5,16,0.3) 40%, transparent 100%)',
            padding: 24,
          }}
        >
          <div className="flex items-end justify-between">
            <div>
              <h1
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: 'clamp(20px, 3vw, 28px)',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '0.03em',
                  marginBottom: 4,
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                {brand?.name || 'Your Brand'}
              </h1>
              <div className="flex items-center gap-3">
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    color: palette.groundAccent,
                    textTransform: 'uppercase',
                  }}
                >
                  {growthState.label}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.1em',
                  }}
                >
                  {completeness}% COMPLETE
                </span>
              </div>
            </div>

            {/* Growth progress bar */}
            <div style={{ width: 120 }}>
              <div
                style={{
                  height: 4,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${completeness}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${palette.groundAccent}, ${palette.hillColor})`,
                    borderRadius: 2,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>SEED</span>
                <span style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>BLOOM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: Brand Score + Quick Stats */}
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

        {/* Drift Alerts */}
        <div className="animate-fade-in" style={staggerStyle(2)}>
          <DriftAlertsBar />
        </div>

        {/* Brand Feed */}
        <div className="animate-fade-in" style={staggerStyle(3)}>
          <BrandFeedCard />
        </div>

        {/* Brand Consistency */}
        <div className="animate-fade-in" style={staggerStyle(4)}>
          <BrandConsistencyChart />
        </div>

        {/* AI Performance Insights */}
        <div className="animate-fade-in" style={staggerStyle(5)}>
          <AIInsightsPanel insights={insights} isLoading={isLoadingInsights} />
        </div>

        {/* AI Idea Feed + Calendar + Phase Access */}
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
    </div>
  );
}

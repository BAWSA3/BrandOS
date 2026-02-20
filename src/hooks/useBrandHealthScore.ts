'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { useBrandCompleteness } from '@/components/BrandCompleteness';

export interface BrandHealthDimensions {
  completeness: number;
  consistency: number;
  voiceMatch: number;
  engagement: number;
  activity: number;
}

export interface HealthHistoryPoint {
  score: number;
  date: string;
  completeness: number;
  consistency: number;
  voiceMatch: number;
  engagement: number;
  activity: number;
}

export interface BrandHealthScore {
  overallScore: number;
  dimensions: BrandHealthDimensions;
  trend: { direction: 'up' | 'down' | 'stable'; delta: number };
  history: HealthHistoryPoint[];
  isLoading: boolean;
  isComputing: boolean;
  lastUpdated: string | null;
  hasSnapshot: boolean;
  refresh: () => Promise<void>;
}

const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

export function useBrandHealthScore(): BrandHealthScore {
  const brand = useCurrentBrand();
  const { user } = useAuth();
  const completeness = useBrandCompleteness();

  const [overallScore, setOverallScore] = useState(0);
  const [dimensions, setDimensions] = useState<BrandHealthDimensions>({
    completeness: 0, consistency: 0, voiceMatch: 0, engagement: 0, activity: 0,
  });
  const [trend, setTrend] = useState<{ direction: 'up' | 'down' | 'stable'; delta: number }>({
    direction: 'stable', delta: 0,
  });
  const [history, setHistory] = useState<HealthHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const autoComputeTriggered = useRef(false);

  const brandId = brand?.id;

  // Fetch latest snapshot + history
  const fetchData = useCallback(async () => {
    if (!brandId || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetch(`/api/brand-health/latest?brandId=${brandId}`),
        fetch(`/api/brand-health/history?brandId=${brandId}&limit=30`),
      ]);

      const latestData = await latestRes.json();
      const historyData = await historyRes.json();

      if (latestData.snapshot) {
        const s = latestData.snapshot;
        setOverallScore(s.overallScore);
        setDimensions({
          completeness: s.completeness,
          consistency: s.consistency,
          voiceMatch: s.voiceMatch,
          engagement: s.engagement,
          activity: s.activity,
        });
        setTrend({ direction: s.trendDirection, delta: s.trendDelta });
        setLastUpdated(s.createdAt);
        setHasSnapshot(true);
      } else {
        // Fallback: use completeness only
        setOverallScore(completeness);
        setDimensions({
          completeness, consistency: 0, voiceMatch: 0, engagement: 0, activity: 0,
        });
        setHasSnapshot(false);
      }

      if (historyData.snapshots) {
        setHistory(
          historyData.snapshots
            .reverse()
            .map((s: { overallScore: number; completeness: number; consistency: number; voiceMatch: number; engagement: number; activity: number; createdAt: string }) => ({
              score: s.overallScore,
              date: s.createdAt,
              completeness: s.completeness,
              consistency: s.consistency,
              voiceMatch: s.voiceMatch,
              engagement: s.engagement,
              activity: s.activity,
            }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch brand health data:', err);
      // Fallback to completeness
      setOverallScore(completeness);
      setDimensions({
        completeness, consistency: 0, voiceMatch: 0, engagement: 0, activity: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [brandId, user, completeness]);

  // Compute a new snapshot
  const compute = useCallback(async () => {
    if (!brandId || !user || isComputing) return;

    setIsComputing(true);
    try {
      const res = await fetch('/api/brand-health/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      });

      const data = await res.json();
      if (data.snapshot) {
        const s = data.snapshot;
        setOverallScore(s.overallScore);
        setDimensions({
          completeness: s.completeness,
          consistency: s.consistency,
          voiceMatch: s.voiceMatch,
          engagement: s.engagement,
          activity: s.activity,
        });
        setTrend({ direction: s.trendDirection, delta: s.trendDelta });
        setLastUpdated(s.createdAt);
        setHasSnapshot(true);

        // Refresh history after compute
        const historyRes = await fetch(`/api/brand-health/history?brandId=${brandId}&limit=30`);
        const historyData = await historyRes.json();
        if (historyData.snapshots) {
          setHistory(
            historyData.snapshots
              .reverse()
              .map((snap: { overallScore: number; completeness: number; consistency: number; voiceMatch: number; engagement: number; activity: number; createdAt: string }) => ({
                score: snap.overallScore,
                date: snap.createdAt,
                completeness: snap.completeness,
                consistency: snap.consistency,
                voiceMatch: snap.voiceMatch,
                engagement: snap.engagement,
                activity: snap.activity,
              }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to compute brand health:', err);
    } finally {
      setIsComputing(false);
    }
  }, [brandId, user, isComputing]);

  // Initial fetch
  useEffect(() => {
    fetchData();
    autoComputeTriggered.current = false;
  }, [fetchData]);

  // Auto-compute if snapshot is stale (> 24h old)
  useEffect(() => {
    if (autoComputeTriggered.current || isLoading || isComputing || !hasSnapshot) return;
    if (!lastUpdated) return;

    const age = Date.now() - new Date(lastUpdated).getTime();
    if (age > STALE_THRESHOLD) {
      autoComputeTriggered.current = true;
      compute();
    }
  }, [lastUpdated, isLoading, isComputing, hasSnapshot, compute]);

  return {
    overallScore,
    dimensions,
    trend,
    history,
    isLoading,
    isComputing,
    lastUpdated,
    hasSnapshot,
    refresh: compute,
  };
}

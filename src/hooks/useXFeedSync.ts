'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';

export interface FeedTweet {
  id: string;
  tweetId: string;
  text: string;
  postedAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
    quotes: number;
  };
  entities: { hashtags: string[]; mentions: string[]; urls: string[] } | null;
  alignmentScore: number | null;
  engagementRate: number | null;
  syncedAt: string;
}

export interface FeedStats {
  totalSynced: number;
  avgAlignmentScore: number | null;
  avgEngagementRate: number | null;
  lastSyncAt: string | null;
}

interface XFeedState {
  tweets: FeedTweet[];
  stats: FeedStats;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  sync: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AUTO_SYNC_THRESHOLD = 60 * 60 * 1000; // 1 hour

export function useXFeedSync(): XFeedState {
  const brand = useCurrentBrand();
  const { user } = useAuth();

  const [tweets, setTweets] = useState<FeedTweet[]>([]);
  const [stats, setStats] = useState<FeedStats>({
    totalSynced: 0,
    avgAlignmentScore: null,
    avgEngagementRate: null,
    lastSyncAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSyncTriggered = useRef(false);

  const brandId = brand?.id;

  const fetchFeed = useCallback(async () => {
    if (!brandId || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/x-feed?brandId=${brandId}&limit=20`);
      if (!res.ok) throw new Error('Failed to fetch feed');
      const data = await res.json();
      setTweets(data.tweets || []);
      setStats(data.stats || {
        totalSynced: 0,
        avgAlignmentScore: null,
        avgEngagementRate: null,
        lastSyncAt: null,
      });
    } catch (err) {
      console.error('Failed to fetch X feed:', err);
      setError('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, [brandId, user]);

  const scoreUnscored = useCallback(async () => {
    if (!brandId) return;
    try {
      await fetch('/api/x-feed/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      });
      // Silently refresh feed to show new scores
      await fetchFeed();
    } catch {
      // Scoring is best-effort — don't block the UI
    }
  }, [brandId, fetchFeed]);

  const sync = useCallback(async () => {
    if (!brandId || !user || isSyncing) return;

    setIsSyncing(true);
    setError(null);
    try {
      const res = await fetch('/api/x-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Sync failed');
        return;
      }

      // Refresh feed after sync, then score unscored tweets in background
      await fetchFeed();
      scoreUnscored();
    } catch (err) {
      console.error('Failed to sync tweets:', err);
      setError('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [brandId, user, isSyncing, fetchFeed, scoreUnscored]);

  // Initial fetch
  useEffect(() => {
    fetchFeed();
    autoSyncTriggered.current = false;
  }, [fetchFeed]);

  // Auto-sync if last sync was > 1 hour ago
  useEffect(() => {
    if (autoSyncTriggered.current || isLoading || isSyncing) return;
    if (!stats.lastSyncAt && tweets.length === 0 && brandId && user) {
      // Never synced — trigger first sync
      autoSyncTriggered.current = true;
      sync();
      return;
    }
    if (!stats.lastSyncAt) return;

    const age = Date.now() - new Date(stats.lastSyncAt).getTime();
    if (age > AUTO_SYNC_THRESHOLD) {
      autoSyncTriggered.current = true;
      sync();
    }
  }, [stats.lastSyncAt, tweets.length, isLoading, isSyncing, brandId, user, sync]);

  return {
    tweets,
    stats,
    isLoading,
    isSyncing,
    error,
    sync,
    refresh: fetchFeed,
  };
}

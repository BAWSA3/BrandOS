'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentBrand, useBrandStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import type { DashboardPost } from '@/app/api/dashboard/posts/route';
import type { DashboardInsight } from '@/app/api/dashboard/insights/route';
import type { ContentIdea } from '@/app/api/dashboard/ideas/route';

interface DashboardData {
  posts: DashboardPost[];
  insights: DashboardInsight[];
  ideas: ContentIdea[];
  stats: {
    postsThisWeek: number;
    avgEngagementRate: number;
    brandConsistency: number;
    totalChecks: number;
    totalGenerations: number;
  };
  isLoadingPosts: boolean;
  isLoadingInsights: boolean;
  isLoadingIdeas: boolean;
  error: string | null;
  refreshIdeas: () => void;
}

export function useDashboardData(): DashboardData {
  const brandDNA = useCurrentBrand();
  const { user } = useAuth();
  const { history } = useBrandStore();

  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats from history
  const totalChecks = history.filter((h) => h.type === 'check').length;
  const totalGenerations = history.filter((h) => h.type === 'generate').length;
  const checkScores = history
    .filter((h) => h.type === 'check' && typeof h.output === 'object' && 'score' in h.output)
    .map((h) => (h.output as { score: number }).score);
  const brandConsistency =
    checkScores.length > 0
      ? Math.round(checkScores.reduce((a, b) => a + b, 0) / checkScores.length)
      : 0;

  // Calculate posts this week and avg engagement from fetched posts
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const postsThisWeek = posts.filter(
    (p) => new Date(p.created_at).getTime() > oneWeekAgo
  ).length;

  const avgEngagementRate =
    posts.length > 0
      ? parseFloat(
          (
            posts.reduce((sum, p) => {
              const engagement =
                p.public_metrics.like_count +
                p.public_metrics.retweet_count +
                p.public_metrics.reply_count;
              const impressions = p.public_metrics.impression_count || 1;
              return sum + (engagement / impressions) * 100;
            }, 0) / posts.length
          ).toFixed(1)
        )
      : 0;

  // Fetch posts
  useEffect(() => {
    if (!user) {
      setIsLoadingPosts(false);
      return;
    }

    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const res = await fetch('/api/dashboard/posts');
        const data = await res.json();
        if (data.posts) {
          setPosts(data.posts);
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError('Failed to load posts');
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [user]);

  // Fetch insights after posts load
  useEffect(() => {
    if (posts.length === 0 || !brandDNA) return;

    const fetchInsights = async () => {
      setIsLoadingInsights(true);
      try {
        const res = await fetch('/api/dashboard/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ posts, brandDNA }),
        });
        const data = await res.json();
        if (data.insights) {
          setInsights(data.insights);
        }
      } catch (err) {
        console.error('Failed to fetch insights:', err);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    fetchInsights();
  }, [posts, brandDNA]);

  // Fetch ideas
  const fetchIdeas = useCallback(async () => {
    if (!brandDNA) return;

    setIsLoadingIdeas(true);
    try {
      // Extract recent topics from posts
      const recentTopics = posts
        .slice(0, 5)
        .map((p) => p.text.slice(0, 100));

      const res = await fetch('/api/dashboard/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          recentTopics: recentTopics.length > 0 ? recentTopics : undefined,
        }),
      });
      const data = await res.json();
      if (data.ideas) {
        setIdeas(data.ideas);
      }
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
    } finally {
      setIsLoadingIdeas(false);
    }
  }, [brandDNA, posts]);

  useEffect(() => {
    if (brandDNA?.name) {
      fetchIdeas();
    }
  }, [brandDNA?.name, fetchIdeas]);

  return {
    posts,
    insights,
    ideas,
    stats: {
      postsThisWeek,
      avgEngagementRate,
      brandConsistency,
      totalChecks,
      totalGenerations,
    },
    isLoadingPosts,
    isLoadingInsights,
    isLoadingIdeas,
    error,
    refreshIdeas: fetchIdeas,
  };
}

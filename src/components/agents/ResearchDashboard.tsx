'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopicCard from './TopicCard';
import {
  ResearchTopic,
  ResearchBrief,
  TCGVertical,
  VERTICAL_CONFIGS,
  TopicCategory,
} from '@/lib/agents/research.types';
import { BrandDNA } from '@/lib/types';

interface ResearchDashboardProps {
  brandDNA: BrandDNA;
  initialData?: ResearchBrief;
  onGenerateContent?: (topics: ResearchTopic[]) => void;
}

const verticalTabs: { id: TCGVertical | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pokemon', label: 'Pokemon' },
  { id: 'mtg', label: 'MTG' },
  { id: 'yugioh', label: 'Yu-Gi-Oh' },
  { id: 'sports-cards', label: 'Sports' },
  { id: 'collectibles', label: 'Other' },
];

const categoryFilters: { id: TopicCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'news', label: 'News' },
  { id: 'trend', label: 'Trends' },
  { id: 'product-launch', label: 'Releases' },
  { id: 'price-alert', label: 'Price Alerts' },
  { id: 'controversy', label: 'Hot Takes' },
];

export default function ResearchDashboard({
  brandDNA,
  initialData,
  onGenerateContent,
}: ResearchDashboardProps) {
  const [researchData, setResearchData] = useState<ResearchBrief | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVertical, setSelectedVertical] = useState<TCGVertical | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory | 'all'>('all');
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<'last-24h' | 'last-week' | 'last-month'>('last-week');

  const fetchResearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          action: 'aggregate',
          params: {
            verticals: selectedVertical === 'all'
              ? ['pokemon', 'mtg', 'yugioh', 'sports-cards', 'collectibles']
              : [selectedVertical],
            timeRange,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch research');
      }

      setResearchData(data.research);
      setSelectedTopics(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch research');
    } finally {
      setLoading(false);
    }
  }, [brandDNA, selectedVertical, timeRange]);

  const filteredTopics = researchData?.topics.filter((topic) => {
    if (selectedVertical !== 'all' && topic.vertical !== selectedVertical) {
      return false;
    }
    if (selectedCategory !== 'all' && topic.category !== selectedCategory) {
      return false;
    }
    return true;
  }) || [];

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTopics.size === filteredTopics.length) {
      setSelectedTopics(new Set());
    } else {
      setSelectedTopics(new Set(filteredTopics.map((t) => t.id)));
    }
  };

  const handleGenerateContent = () => {
    const topics = filteredTopics.filter((t) => selectedTopics.has(t.id));
    onGenerateContent?.(topics);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Research Dashboard</h2>
          <p className="text-neutral-400">
            Discover trending topics in TCG and collectibles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
          >
            <option value="last-24h">Last 24 hours</option>
            <option value="last-week">Last week</option>
            <option value="last-month">Last month</option>
          </select>
          <button
            onClick={fetchResearch}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Researching...
              </>
            ) : (
              <>
                <span>🔍</span>
                Fetch Trends
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Summary */}
      {researchData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700"
        >
          <h3 className="text-lg font-semibold text-white mb-2">Market Summary</h3>
          <p className="text-neutral-300 mb-3">{researchData.summary}</p>
          {researchData.trendingKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-neutral-500">Trending:</span>
              {researchData.trendingKeywords.slice(0, 8).map((keyword, idx) => (
                <span
                  key={idx}
                  className="text-sm px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Vertical Tabs */}
      <div className="flex gap-2 p-1 bg-neutral-900 rounded-lg overflow-x-auto">
        {verticalTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedVertical(tab.id)}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-all ${
              selectedVertical === tab.id
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TopicCategory | 'all')}
            className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
          >
            {categoryFilters.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-neutral-500">
            {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredTopics.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="text-sm text-neutral-400 hover:text-white"
            >
              {selectedTopics.size === filteredTopics.length ? 'Deselect all' : 'Select all'}
            </button>
            {selectedTopics.size > 0 && onGenerateContent && (
              <button
                onClick={handleGenerateContent}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm flex items-center gap-2"
              >
                <span>✨</span>
                Generate Content ({selectedTopics.size})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTopics.map((topic) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <TopicCard
                topic={topic}
                isSelected={selectedTopics.has(topic.id)}
                onSelect={() => handleTopicSelect(topic.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {!loading && filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-white mb-2">
            {researchData ? 'No topics match your filters' : 'No research data yet'}
          </h3>
          <p className="text-neutral-400 mb-4">
            {researchData
              ? 'Try adjusting your filters or fetching new trends'
              : 'Click "Fetch Trends" to discover what\'s happening in the TCG world'}
          </p>
          {!researchData && (
            <button
              onClick={fetchResearch}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Start Research
            </button>
          )}
        </div>
      )}

      {/* Vertical Summaries */}
      {researchData && Object.keys(researchData.verticalSummaries).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Vertical Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(researchData.verticalSummaries)
              .filter(([_, summary]) => summary)
              .map(([vertical, summary]) => (
                <div
                  key={vertical}
                  className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800"
                >
                  <div className="font-medium text-white mb-1">
                    {VERTICAL_CONFIGS[vertical as TCGVertical]?.name || vertical}
                  </div>
                  <p className="text-sm text-neutral-400">{summary}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { ResearchTopic, TCGVertical, VERTICAL_CONFIGS } from '@/lib/agents/research.types';

interface TopicCardProps {
  topic: ResearchTopic;
  isSelected?: boolean;
  onSelect?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
}

const verticalColors: Record<TCGVertical, string> = {
  pokemon: '#FFCB05',
  mtg: '#8B4513',
  yugioh: '#9B2335',
  'sports-cards': '#00A86B',
  collectibles: '#9B59B6',
};

const categoryIcons: Record<string, string> = {
  news: '📰',
  trend: '📈',
  controversy: '🔥',
  'product-launch': '🚀',
  'price-alert': '💰',
  community: '👥',
  tournament: '🏆',
};

const engagementColors: Record<string, string> = {
  viral: '#EF4444',
  high: '#F59E0B',
  medium: '#10B981',
  low: '#6B7280',
};

export default function TopicCard({
  topic,
  isSelected = false,
  onSelect,
  onViewDetails,
  compact = false,
}: TopicCardProps) {
  const verticalColor = verticalColors[topic.vertical] || '#6B7280';
  const verticalName = VERTICAL_CONFIGS[topic.vertical]?.name || topic.vertical;
  const categoryIcon = categoryIcons[topic.category] || '📋';
  const engagementColor = engagementColors[topic.engagementLevel || 'low'];

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={onSelect}
        className={`p-3 rounded-lg border cursor-pointer transition-all ${
          isSelected
            ? 'border-2 bg-neutral-800'
            : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
        }`}
        style={{
          borderColor: isSelected ? verticalColor : undefined,
        }}
      >
        <div className="flex items-start gap-2">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="mt-1 w-4 h-4 rounded border-neutral-600 bg-neutral-800"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{categoryIcon}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${verticalColor}20`, color: verticalColor }}
              >
                {verticalName}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{ backgroundColor: `${engagementColor}20`, color: engagementColor }}
              >
                {topic.engagementLevel || 'low'}
              </span>
            </div>
            <h4 className="text-sm font-medium text-white truncate">{topic.title}</h4>
          </div>
          <div className="text-right">
            <div
              className="text-lg font-bold"
              style={{ color: topic.relevanceScore >= 70 ? '#10B981' : '#6B7280' }}
            >
              {topic.relevanceScore}
            </div>
            <div className="text-xs text-neutral-500">relevance</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`p-4 rounded-xl border transition-all ${
        isSelected
          ? 'border-2 bg-neutral-800/80'
          : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
      }`}
      style={{
        borderColor: isSelected ? verticalColor : undefined,
        boxShadow: isSelected ? `0 0 20px ${verticalColor}15` : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-5 h-5 rounded border-neutral-600 bg-neutral-800 cursor-pointer"
            />
          )}
          <span className="text-xl">{categoryIcon}</span>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ backgroundColor: `${verticalColor}20`, color: verticalColor }}
          >
            {verticalName}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-400 capitalize">
            {topic.category.replace('-', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="text-xs px-2 py-1 rounded-full capitalize font-medium"
            style={{ backgroundColor: `${engagementColor}20`, color: engagementColor }}
          >
            {topic.engagementLevel || 'low'}
          </div>
          <div
            className="w-10 h-10 rounded-lg flex flex-col items-center justify-center"
            style={{
              backgroundColor: topic.relevanceScore >= 70 ? '#10B98120' : '#6B728020',
              color: topic.relevanceScore >= 70 ? '#10B981' : '#6B7280',
            }}
          >
            <span className="text-lg font-bold leading-none">{topic.relevanceScore}</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2">{topic.title}</h3>

      {/* Summary */}
      <p className="text-sm text-neutral-400 mb-3 line-clamp-2">{topic.summary}</p>

      {/* Keywords */}
      {topic.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {topic.keywords.slice(0, 5).map((keyword, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400"
            >
              {keyword}
            </span>
          ))}
          {topic.keywords.length > 5 && (
            <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-500">
              +{topic.keywords.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Hashtags */}
      {topic.hashtags && topic.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {topic.hashtags.slice(0, 4).map((tag, idx) => (
            <span key={idx} className="text-xs text-blue-400">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Sources indicator */}
      {topic.sources.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>Sources:</span>
          {[...new Set(topic.sources.map((s) => s.source))].map((source) => (
            <span
              key={source}
              className="px-2 py-0.5 rounded bg-neutral-800 capitalize"
            >
              {source}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      {onViewDetails && (
        <div className="mt-3 pt-3 border-t border-neutral-800">
          <button
            onClick={onViewDetails}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            View details →
          </button>
        </div>
      )}
    </motion.div>
  );
}

// Mini version for lists
export function TopicCardMini({ topic }: { topic: ResearchTopic }) {
  const verticalColor = verticalColors[topic.vertical] || '#6B7280';
  const categoryIcon = categoryIcons[topic.category] || '📋';

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-900/50">
      <span>{categoryIcon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{topic.title}</div>
        <div
          className="text-xs"
          style={{ color: verticalColor }}
        >
          {VERTICAL_CONFIGS[topic.vertical]?.name}
        </div>
      </div>
      <div className="text-sm font-bold text-neutral-400">{topic.relevanceScore}</div>
    </div>
  );
}

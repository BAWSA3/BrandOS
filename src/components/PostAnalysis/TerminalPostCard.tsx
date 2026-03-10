'use client';

import { motion } from 'framer-motion';
import type { RawTweet } from '../DNAWalkthrough/TweetExcerpt';

interface TerminalPostCardProps {
  tweet: RawTweet;
  author: {
    name: string;
    username: string;
    profileImage?: string;
    verified?: boolean;
  };
  tags?: { label: string; color: string }[];
  highlightPhrases?: { text: string; color: string; label: string }[];
  showMetrics?: boolean;
  isAnalyzing?: boolean;
  scanProgress?: number;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'now';
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function highlightText(
  text: string,
  phrases: { text: string; color: string; label: string }[]
): React.ReactNode[] {
  if (!phrases.length) return [text];

  let result: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  // Sort phrases by position in text to process in order
  const sortedPhrases = [...phrases].sort((a, b) => {
    const posA = text.toLowerCase().indexOf(a.text.toLowerCase());
    const posB = text.toLowerCase().indexOf(b.text.toLowerCase());
    return posA - posB;
  });

  for (const phrase of sortedPhrases) {
    const lowerRemaining = remaining.toLowerCase();
    const lowerPhrase = phrase.text.toLowerCase();
    const index = lowerRemaining.indexOf(lowerPhrase);

    if (index === -1) continue;

    // Add text before the phrase
    if (index > 0) {
      result.push(remaining.slice(0, index));
    }

    // Add the highlighted phrase
    const actualPhrase = remaining.slice(index, index + phrase.text.length);
    result.push(
      <span
        key={keyIndex++}
        style={{
          color: phrase.color,
          fontWeight: 600,
          borderBottom: `2px solid ${phrase.color}40`,
          cursor: 'help',
        }}
        title={phrase.label}
      >
        {actualPhrase}
      </span>
    );

    remaining = remaining.slice(index + phrase.text.length);
  }

  // Add any remaining text
  if (remaining) {
    result.push(remaining);
  }

  return result;
}

export default function TerminalPostCard({
  tweet,
  author,
  tags = [],
  highlightPhrases = [],
  showMetrics = true,
  isAnalyzing = false,
  scanProgress = 0,
}: TerminalPostCardProps) {
  const metrics = tweet.public_metrics;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.15)',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        position: 'relative',
      }}
    >
      {/* Terminal header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(0, 0, 0, 0.03)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
        </div>
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: 'rgba(0, 0, 0, 0.4)',
            marginLeft: 'auto',
          }}
        >
          brandos://post/analysis
        </span>
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '9px',
            padding: '2px 6px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '2px',
            color: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          X POST
        </span>
      </div>

      {/* Scanning overlay */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: 41,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <motion.div
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #0047FF, transparent)',
              boxShadow: '0 0 10px rgba(0, 71, 255, 0.5)',
            }}
          />
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: '#0047FF',
            }}
          >
            ANALYZING POST...
          </span>
          <div
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              color: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            [{('█').repeat(Math.floor(scanProgress / 5))}{('░').repeat(20 - Math.floor(scanProgress / 5))}] {scanProgress}%
          </div>
        </motion.div>
      )}

      {/* Post content */}
      <div style={{ padding: '16px 18px' }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          {author.profileImage && (
            <img
              src={author.profileImage.replace('_normal', '_200x200')}
              alt={author.name}
              style={{
                width: 40,
                height: 40,
                borderRadius: '4px',
                objectFit: 'cover',
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#000' }}>
                {author.name}
              </span>
              {author.verified && (
                <span style={{ fontSize: '12px', color: '#1D9BF0' }}>✓</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  color: 'rgba(0, 0, 0, 0.5)',
                }}
              >
                @{author.username}
              </span>
              <span style={{ color: 'rgba(0, 0, 0, 0.3)' }}>·</span>
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  color: 'rgba(0, 0, 0, 0.4)',
                }}
              >
                {formatDate(tweet.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Tweet text */}
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: '#000',
            margin: '0 0 14px 0',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}
        >
          {highlightPhrases.length > 0
            ? highlightText(tweet.text, highlightPhrases)
            : tweet.text}
        </p>

        {/* Metrics */}
        {showMetrics && metrics && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '12px 0',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <MetricItem icon="♡" value={metrics.like_count} label="likes" />
            <MetricItem icon="↻" value={metrics.retweet_count} label="retweets" />
            <MetricItem icon="💬" value={metrics.reply_count} label="replies" />
            {metrics.impression_count && metrics.impression_count > 0 && (
              <MetricItem icon="👁" value={metrics.impression_count} label="views" />
            )}
          </div>
        )}

        {/* Analysis tags */}
        {tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              paddingTop: '12px',
              borderTop: metrics ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            {tags.map((tag, i) => (
              <motion.span
                key={tag.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.08em',
                  padding: '4px 8px',
                  background: `${tag.color}10`,
                  border: `1px solid ${tag.color}30`,
                  borderRadius: '3px',
                  color: tag.color,
                }}
              >
                {tag.label}
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricItem({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '12px',
          fontWeight: 600,
          color: '#000',
        }}
      >
        {formatNumber(value)}
      </span>
      <span
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '9px',
          color: 'rgba(0, 0, 0, 0.4)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
}

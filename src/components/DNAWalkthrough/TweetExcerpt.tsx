'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface RawTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
    impression_count?: number;
  };
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: Record<string, string | boolean>
        ) => Promise<HTMLElement | undefined>;
      };
      ready: (cb: () => void) => void;
    };
  }
}

let widgetsScriptLoaded = false;
let widgetsScriptLoading = false;
const widgetsReadyCallbacks: (() => void)[] = [];

function loadWidgetsScript(): Promise<void> {
  if (widgetsScriptLoaded && window.twttr) return Promise.resolve();

  return new Promise((resolve) => {
    widgetsReadyCallbacks.push(resolve);

    if (widgetsScriptLoading) return;
    widgetsScriptLoading = true;

    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = () => {
      widgetsScriptLoaded = true;
      if (window.twttr) {
        window.twttr.ready(() => {
          widgetsReadyCallbacks.forEach((cb) => cb());
          widgetsReadyCallbacks.length = 0;
        });
      }
    };
    document.head.appendChild(script);
  });
}

// ── X Embed (Official) ────────────────────────────────────────

interface XTweetEmbedProps {
  tweetId: string;
  theme: string;
  index?: number;
  annotation?: string;
  accentColor?: string;
}

export function XTweetEmbed({
  tweetId,
  theme,
  index = 0,
  annotation,
  accentColor = '#2E6AFF',
}: XTweetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const renderEmbed = useCallback(async () => {
    if (!containerRef.current || !window.twttr) return;
    containerRef.current.textContent = '';

    try {
      const el = await window.twttr.widgets.createTweet(tweetId, containerRef.current, {
        theme: theme === 'dark' ? 'dark' : 'light',
        conversation: 'none',
        dnt: 'true',
        align: 'center',
      });
      setLoaded(true);
      if (!el) setFailed(true);
    } catch {
      setFailed(true);
    }
  }, [tweetId, theme]);

  useEffect(() => {
    let cancelled = false;
    loadWidgetsScript().then(() => {
      if (!cancelled) renderEmbed();
    });
    return () => { cancelled = true; };
  }, [renderEmbed]);

  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
    >
      {!loaded && !failed && (
        <div
          style={{
            padding: '32px 18px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            }}
          >
            LOADING POST...
          </span>
        </div>
      )}

      <div ref={containerRef} style={{ minHeight: loaded ? undefined : 0 }} />

      {failed && (
        <div
          style={{
            padding: '16px 18px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <a
            href={`https://x.com/i/status/${tweetId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              color: accentColor,
              textDecoration: 'underline',
            }}
          >
            View post on X
          </a>
        </div>
      )}

      {annotation && loaded && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: `${accentColor}08`,
            border: `1px solid ${accentColor}15`,
            borderRadius: '3px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: accentColor,
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              lineHeight: 1.5,
            }}
          >
            {annotation}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ── Text Fallback (for cases without a tweet ID) ──────────────

interface TweetExcerptTextProps {
  tweet: RawTweet;
  annotation?: string;
  highlightWords?: string[];
  accentColor?: string;
  theme: string;
  index?: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function highlightText(text: string, words: string[], color: string) {
  if (!words.length) return text;

  const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const isMatch = words.some(w => part.toLowerCase() === w.toLowerCase());
    if (isMatch) {
      return (
        <span key={i} style={{ color, fontWeight: 600, borderBottom: `1px solid ${color}40` }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

export function TweetExcerptText({
  tweet,
  annotation,
  highlightWords = [],
  accentColor = '#2E6AFF',
  theme,
  index = 0,
}: TweetExcerptTextProps) {
  const isDark = theme === 'dark';
  const metrics = tweet.public_metrics;
  const truncatedText = tweet.text.length > 280 ? tweet.text.slice(0, 277) + '...' : tweet.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      style={{
        padding: '16px 18px',
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        borderLeft: `3px solid ${accentColor}30`,
        borderRadius: '4px',
      }}
    >
      <p
        style={{
          fontSize: '14px',
          lineHeight: 1.65,
          color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
          margin: 0,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}
      >
        &ldquo;{highlightWords.length ? highlightText(truncatedText, highlightWords, accentColor) : truncatedText}&rdquo;
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginTop: '10px',
          flexWrap: 'wrap',
        }}
      >
        {tweet.created_at && (
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.05em',
              color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
            }}
          >
            {formatDate(tweet.created_at)}
          </span>
        )}

        {metrics && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <MetricPill label="likes" value={metrics.like_count} isDark={isDark} />
            <MetricPill label="RT" value={metrics.retweet_count} isDark={isDark} />
            <MetricPill label="replies" value={metrics.reply_count} isDark={isDark} />
            {metrics.impression_count != null && metrics.impression_count > 0 && (
              <MetricPill label="views" value={metrics.impression_count} isDark={isDark} />
            )}
          </div>
        )}
      </div>

      {annotation && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: `${accentColor}08`,
            border: `1px solid ${accentColor}15`,
            borderRadius: '3px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: accentColor,
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              lineHeight: 1.5,
            }}
          >
            {annotation}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function MetricPill({ label, value, isDark }: { label: string; value: number; isDark: boolean }) {
  return (
    <span
      style={{
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: '10px',
        letterSpacing: '0.03em',
        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
      }}
    >
      {formatNumber(value)} {label}
    </span>
  );
}

export default TweetExcerptText;

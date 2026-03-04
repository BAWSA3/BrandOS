'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XTweetEmbed, RawTweet } from '../TweetExcerpt';
import type { ParallaxLayerConfig } from '../motion';
import WalkthroughSection from '../WalkthroughSection';

interface XProfileData {
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  verified: boolean;
  location?: string;
  url?: string;
}

interface DataRevealSectionProps {
  profile: XProfileData;
  rawTweets: RawTweet[];
  theme: string;
  parallaxLayers?: ParallaxLayerConfig[];
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function getSignals(profile: XProfileData, tweetCount: number) {
  const signals: { label: string; value: string; status: 'found' | 'missing' }[] = [
    { label: 'Display name', value: profile.name, status: 'found' },
    { label: 'Username', value: `@${profile.username}`, status: 'found' },
    {
      label: 'Profile photo',
      value: profile.profile_image_url ? 'Present' : 'Missing',
      status: profile.profile_image_url ? 'found' : 'missing',
    },
    { label: 'Followers', value: formatNumber(profile.followers_count), status: 'found' },
    { label: 'Following', value: formatNumber(profile.following_count), status: 'found' },
    { label: 'Total posts', value: formatNumber(profile.tweet_count), status: 'found' },
    {
      label: 'Recent posts analyzed',
      value: tweetCount > 0 ? `${tweetCount} posts` : 'Unavailable',
      status: tweetCount > 0 ? 'found' : 'missing',
    },
  ];
  return signals;
}

// ── Accordion Item ────────────────────────────────────────────

interface AccordionItemProps {
  title: string;
  summary: string;
  defaultOpen?: boolean;
  theme: string;
  children: React.ReactNode;
}

function AccordionItem({ title, summary, defaultOpen = false, theme, children }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.12em',
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              display: 'block',
              marginBottom: '2px',
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: '13px',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            }}
          >
            {summary}
          </span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: '14px',
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
            flexShrink: 0,
            marginLeft: '12px',
          }}
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 18px 18px' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────

export default function DataRevealSection({
  profile,
  rawTweets,
  theme,
  parallaxLayers,
}: DataRevealSectionProps) {
  const isDark = theme === 'dark';
  const topTweets = [...rawTweets]
    .sort((a, b) => (b.public_metrics?.like_count ?? 0) - (a.public_metrics?.like_count ?? 0))
    .slice(0, 3);

  const signals = getSignals(profile, rawTweets.length);
  const foundCount = signals.filter((s) => s.status === 'found').length;

  const truncatedBio = profile.description
    ? profile.description.length > 100
      ? profile.description.slice(0, 97) + '...'
      : profile.description
    : null;

  return (
    <WalkthroughSection
      label="DEFINE: What We Found"
      theme={theme}
      accentColor="#2E6AFF"
      parallaxLayers={parallaxLayers}
      narrativeBlocks={[
        {
          type: 'context',
          content: `We pulled your public X profile and ${rawTweets.length > 0 ? `analyzed ${rawTweets.length} of your recent posts` : 'your profile data'} to understand how your content builds your brand.`,
        },
        ...(rawTweets.length > 0
          ? [
              {
                type: 'callout' as const,
                label: 'CONTENT ANALYZED',
                content: `${rawTweets.length} posts scanned for voice, topics, and engagement patterns.`,
              },
            ]
          : []),
      ]}
    >
      <div className="space-y-4">
        {/* ── Compact Profile Snapshot ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          {profile.profile_image_url && (
            <img
              src={profile.profile_image_url.replace('_normal', '_200x200')}
              alt={profile.name}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                flexShrink: 0,
              }}
            />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: isDark ? '#fff' : '#000' }}>
                {profile.name}
              </span>
              {profile.verified && (
                <span style={{ fontSize: '12px', color: '#1D9BF0' }}>&#10003;</span>
              )}
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                }}
              >
                @{profile.username}
              </span>
            </div>
            {truncatedBio && (
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '12px',
                  lineHeight: 1.4,
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {truncatedBio}
              </p>
            )}
          </div>

          {/* Inline stats */}
          <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
            {[
              { label: 'Followers', value: formatNumber(profile.followers_count) },
              { label: 'Posts', value: formatNumber(profile.tweet_count) },
              { label: 'Analyzed', value: rawTweets.length > 0 ? `${rawTweets.length}` : '—' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '15px',
                    fontWeight: 600,
                    color: isDark ? '#fff' : '#000',
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '8px',
                    letterSpacing: '0.1em',
                    color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                    marginTop: '2px',
                  }}
                >
                  {stat.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Accordion: Profile Signals ── */}
        <AccordionItem
          title="PROFILE SIGNALS"
          summary={`${foundCount} of ${signals.length} signals found`}
          defaultOpen={false}
          theme={theme}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '6px',
            }}
          >
            {signals.map((signal, i) => (
              <motion.div
                key={signal.label}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '3px',
                  background:
                    signal.status === 'found'
                      ? isDark
                        ? 'rgba(16,185,129,0.06)'
                        : 'rgba(16,185,129,0.04)'
                      : isDark
                        ? 'rgba(245,158,11,0.06)'
                        : 'rgba(245,158,11,0.04)',
                }}
              >
                <span style={{ fontSize: '12px', flexShrink: 0 }}>
                  {signal.status === 'found' ? '✓' : '—'}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
                  }}
                >
                  {signal.label}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {signal.value}
                </span>
              </motion.div>
            ))}
          </div>
        </AccordionItem>

        {/* ── Accordion: Top Posts (Expanded by default) ── */}
        {topTweets.length > 0 && (
          <AccordionItem
            title="TOP POSTS"
            summary={`${topTweets.length} highest-engagement posts`}
            defaultOpen={true}
            theme={theme}
          >
            <div className="space-y-3">
              {topTweets.map((tweet, i) => (
                <XTweetEmbed
                  key={tweet.id}
                  tweetId={tweet.id}
                  theme={theme}
                  index={i}
                  accentColor="#2E6AFF"
                />
              ))}
            </div>
          </AccordionItem>
        )}
      </div>
    </WalkthroughSection>
  );
}

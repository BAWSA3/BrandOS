'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XTweetEmbed, RawTweet } from '../TweetExcerpt';
import ConversationalGate from '../ConversationalGate';

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
  onComplete?: () => void;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

type RevealStage = 'intro' | 'profile' | 'scanning' | 'results';

export default function DataRevealSection({
  profile,
  rawTweets,
  theme,
  onComplete,
}: DataRevealSectionProps) {
  const [stage, setStage] = useState<RevealStage>('intro');
  const [scanProgress, setScanProgress] = useState(0);

  const topTweets = [...rawTweets]
    .sort((a, b) => (b.public_metrics?.like_count ?? 0) - (a.public_metrics?.like_count ?? 0))
    .slice(0, 3);

  const handleStartScan = () => {
    setStage('scanning');
    // Animate scan progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 3;
      const clampedProgress = Math.min(progress, 100);
      setScanProgress(clampedProgress);
      if (clampedProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => setStage('results'), 400);
      }
    }, 50);
  };

  return (
    <section
      className="min-h-screen"
      style={{ background: '#ffffff', position: 'relative' }}
    >
      {/* Stage 1: Introduction */}
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <ConversationalGate
            key="intro"
            message={`Hey @${profile.username}. I've been looking at your profile.`}
            subtext="Let me show you what I see when I analyze your brand presence on X."
            buttonLabel="SHOW ME"
            onContinue={() => setStage('profile')}
            dataPoint={{ label: 'PROFILE', value: `@${profile.username}` }}
          />
        )}

        {/* Stage 2: Profile reveal */}
        {stage === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
            }}
          >
            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                background: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '8px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                marginBottom: '32px',
              }}
            >
              {profile.profile_image_url && (
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  src={profile.profile_image_url.replace('_normal', '_200x200')}
                  alt={profile.name}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #fff',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    margin: '0 auto 16px',
                  }}
                />
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 600, color: '#000' }}>
                    {profile.name}
                  </span>
                  {profile.verified && (
                    <span style={{ fontSize: '14px', color: '#1D9BF0' }}>✓</span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '12px',
                    color: 'rgba(0, 0, 0, 0.5)',
                  }}
                >
                  @{profile.username}
                </span>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '32px',
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                {[
                  { label: 'Followers', value: formatNumber(profile.followers_count) },
                  { label: 'Following', value: formatNumber(profile.following_count) },
                  { label: 'Posts', value: formatNumber(profile.tweet_count) },
                ].map((stat) => (
                  <div key={stat.label} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#000',
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '9px',
                        letterSpacing: '0.1em',
                        color: 'rgba(0, 0, 0, 0.4)',
                        marginTop: '4px',
                      }}
                    >
                      {stat.label.toUpperCase()}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* AI message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                fontSize: '18px',
                color: '#000',
                textAlign: 'center',
                maxWidth: '450px',
                lineHeight: 1.5,
                marginBottom: '8px',
              }}
            >
              I found {formatNumber(profile.tweet_count)} posts on your profile.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              style={{
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                maxWidth: '400px',
                marginBottom: '32px',
              }}
            >
              {rawTweets.length > 0
                ? `Let me scan your ${rawTweets.length} most recent posts to understand your voice and content patterns.`
                : "I'll analyze your profile data to understand your brand presence."}
            </motion.p>

            {/* Scan button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              onClick={handleStartScan}
              style={{
                padding: '16px 32px',
                background: '#0047FF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0038CC'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0047FF'}
            >
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: '#fff',
                }}
              >
                {rawTweets.length > 0 ? 'SCAN MY POSTS' : 'ANALYZE MY PROFILE'}
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* Stage 3: Scanning animation */}
        {stage === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
            }}
          >
            <div
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.12em',
                color: '#0047FF',
                marginBottom: '24px',
              }}
            >
              SCANNING POSTS...
            </div>

            {/* ASCII progress bar */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                color: '#000',
                marginBottom: '16px',
              }}
            >
              [{Array(20).fill(null).map((_, i) => (
                <span key={i} style={{ color: i < Math.floor(scanProgress / 5) ? '#0047FF' : 'rgba(0,0,0,0.15)' }}>
                  {i < Math.floor(scanProgress / 5) ? '█' : '░'}
                </span>
              ))}] {scanProgress}%
            </div>

            <div
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                color: 'rgba(0, 0, 0, 0.4)',
              }}
            >
              {scanProgress < 30 && 'Reading post content...'}
              {scanProgress >= 30 && scanProgress < 60 && 'Analyzing voice patterns...'}
              {scanProgress >= 60 && scanProgress < 90 && 'Detecting content themes...'}
              {scanProgress >= 90 && 'Finalizing analysis...'}
            </div>
          </motion.div>
        )}

        {/* Stage 4: Results */}
        {stage === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
            }}
          >
            {/* Success message */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                textAlign: 'center',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '28px',
                  color: '#10B981',
                }}
              >
                ✓
              </div>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#000',
                  margin: '0 0 8px 0',
                }}
              >
                Analysis Complete
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgba(0, 0, 0, 0.5)',
                }}
              >
                I found some interesting patterns in your content.
              </p>
            </motion.div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                display: 'flex',
                gap: '24px',
                marginBottom: '40px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {[
                { label: 'Posts Scanned', value: rawTweets.length || '—' },
                { label: 'Total Engagement', value: formatNumber(rawTweets.reduce((sum, t) => sum + (t.public_metrics?.like_count || 0) + (t.public_metrics?.retweet_count || 0), 0)) },
                { label: 'Top Post Likes', value: topTweets[0] ? formatNumber(topTweets[0].public_metrics?.like_count || 0) : '—' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  style={{
                    padding: '20px 28px',
                    background: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '24px',
                      fontWeight: 600,
                      color: '#0047FF',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '9px',
                      letterSpacing: '0.1em',
                      color: 'rgba(0, 0, 0, 0.4)',
                      marginTop: '6px',
                    }}
                  >
                    {stat.label.toUpperCase()}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* AI message + continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{
                fontSize: '16px',
                color: '#000',
                textAlign: 'center',
                maxWidth: '450px',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              Now let me show you exactly why your best content works — and how you can replicate it.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              onClick={() => onComplete?.()}
              style={{
                padding: '16px 32px',
                background: '#0047FF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0038CC'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0047FF'}
            >
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: '#fff',
                }}
              >
                CONTINUE
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

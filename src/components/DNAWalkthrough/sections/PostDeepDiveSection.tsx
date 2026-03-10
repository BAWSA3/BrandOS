'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConversationalGate from '../ConversationalGate';
import type { RawTweet } from '../TweetExcerpt';

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

interface ToneData {
  minimal: number;
  playful: number;
  bold: number;
  experimental: number;
}

interface BrandScoreResult {
  overallScore: number;
  phases: {
    define: { score: number; insights: string[] };
    check: { score: number; insights: string[] };
    generate: { score: number; insights: string[] };
    scale: { score: number; insights: string[] };
  };
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
}

interface ContentPillar {
  name: string;
  frequency: number;
  avgEngagement: number;
}

interface GeneratedBrandDNA {
  archetype: string;
  archetypeEmoji?: string;
  keywords: string[];
  tone: ToneData;
  voiceProfile?: string;
  contentPillars?: ContentPillar[] | string[];
  doPatterns?: string[];
  dontPatterns?: string[];
}

interface PostDeepDiveSectionProps {
  profile: XProfileData;
  rawTweets: RawTweet[];
  brandScore: BrandScoreResult;
  brandDNA: GeneratedBrandDNA;
  onComplete?: () => void;
  theme?: string;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ContentInsight {
  label: string;
  value: string | number;
  description: string;
  color: string;
}

interface RepresentativePost {
  tweet: RawTweet;
  reason: string;
  tag: string;
  tagColor: string;
}

function analyzePostPatterns(
  tweets: RawTweet[],
  brandDNA: GeneratedBrandDNA,
  brandScore: BrandScoreResult
): { insights: ContentInsight[]; representativePosts: RepresentativePost[] } {
  if (!tweets.length) {
    return { insights: [], representativePosts: [] };
  }

  // Calculate engagement stats
  const totalLikes = tweets.reduce((sum, t) => sum + (t.public_metrics?.like_count || 0), 0);
  const totalRetweets = tweets.reduce((sum, t) => sum + (t.public_metrics?.retweet_count || 0), 0);
  const avgLikes = Math.round(totalLikes / tweets.length);
  const avgLength = Math.round(tweets.reduce((sum, t) => sum + t.text.length, 0) / tweets.length);

  // Sort by engagement
  const sortedByLikes = [...tweets].sort(
    (a, b) => (b.public_metrics?.like_count || 0) - (a.public_metrics?.like_count || 0)
  );

  // Find posts with questions
  const questionPosts = tweets.filter(t => t.text.includes('?'));

  // Find posts with hooks (starts with strong statement)
  const hookPatterns = ['The', 'I ', 'You ', 'This', 'Here', 'Why', 'How', 'What'];
  const hookPosts = tweets.filter(t =>
    hookPatterns.some(h => t.text.trim().startsWith(h))
  );

  // Identify short vs long posts
  const shortPosts = tweets.filter(t => t.text.length < 100);
  const longPosts = tweets.filter(t => t.text.length > 200);

  // Calculate which length performs better
  const shortAvgLikes = shortPosts.length
    ? shortPosts.reduce((s, t) => s + (t.public_metrics?.like_count || 0), 0) / shortPosts.length
    : 0;
  const longAvgLikes = longPosts.length
    ? longPosts.reduce((s, t) => s + (t.public_metrics?.like_count || 0), 0) / longPosts.length
    : 0;

  const bestLength = shortAvgLikes > longAvgLikes ? 'Short' : longAvgLikes > shortAvgLikes ? 'Long' : 'Mixed';

  // Build insights
  const insights: ContentInsight[] = [
    {
      label: 'POSTS ANALYZED',
      value: tweets.length,
      description: 'Recent posts scanned for patterns',
      color: '#0047FF',
    },
    {
      label: 'AVG ENGAGEMENT',
      value: `${formatNumber(avgLikes)} likes`,
      description: 'Average likes per post',
      color: '#10B981',
    },
    {
      label: 'BEST LENGTH',
      value: bestLength,
      description: bestLength === 'Short'
        ? 'Your shorter posts perform better'
        : bestLength === 'Long'
          ? 'Your longer posts get more engagement'
          : 'Length doesn\'t significantly affect your engagement',
      color: '#9D4EDD',
    },
    {
      label: 'HOOK USAGE',
      value: `${Math.round((hookPosts.length / tweets.length) * 100)}%`,
      description: 'Posts that start with strong hooks',
      color: '#E8A838',
    },
  ];

  // Select 3 representative posts
  const representativePosts: RepresentativePost[] = [];

  // 1. Top performer
  if (sortedByLikes[0]) {
    representativePosts.push({
      tweet: sortedByLikes[0],
      reason: 'This is your highest-performing post. It shows the content style your audience responds to most.',
      tag: 'TOP PERFORMER',
      tagColor: '#10B981',
    });
  }

  // 2. Best example of brand voice (find one that matches keywords)
  const keywordLower = (brandDNA.keywords || []).map(k => k.toLowerCase());
  const brandVoicePost = tweets.find(t =>
    keywordLower.some(k => t.text.toLowerCase().includes(k)) &&
    t.id !== sortedByLikes[0]?.id
  );
  if (brandVoicePost) {
    representativePosts.push({
      tweet: brandVoicePost,
      reason: `This post exemplifies your brand voice. It touches on your key themes: ${brandDNA.keywords?.slice(0, 2).join(', ') || 'your signature topics'}.`,
      tag: 'BRAND VOICE',
      tagColor: '#0047FF',
    });
  } else if (sortedByLikes[1]) {
    representativePosts.push({
      tweet: sortedByLikes[1],
      reason: 'Another high-engagement post that shows your content patterns.',
      tag: 'HIGH ENGAGEMENT',
      tagColor: '#0047FF',
    });
  }

  // 3. Growth opportunity (a post that could have done better, or a recent one)
  const recentPosts = [...tweets].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const recentPost = recentPosts.find(t =>
    t.id !== representativePosts[0]?.tweet.id &&
    t.id !== representativePosts[1]?.tweet.id
  );
  if (recentPost) {
    const recentLikes = recentPost.public_metrics?.like_count || 0;
    const isUnderperforming = recentLikes < avgLikes * 0.5;
    representativePosts.push({
      tweet: recentPost,
      reason: isUnderperforming
        ? 'This recent post underperformed. Consider applying the patterns from your top posts here.'
        : 'A recent post showing your current content direction.',
      tag: isUnderperforming ? 'GROWTH OPPORTUNITY' : 'RECENT',
      tagColor: isUnderperforming ? '#F59E0B' : '#6B7280',
    });
  }

  return { insights, representativePosts };
}

type Stage = 'intro' | 'scanning' | 'insights' | 'posts';

export default function PostDeepDiveSection({
  profile,
  rawTweets,
  brandScore,
  brandDNA,
  onComplete,
}: PostDeepDiveSectionProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [scanProgress, setScanProgress] = useState(0);
  const [revealedInsights, setRevealedInsights] = useState(0);
  const [revealedPosts, setRevealedPosts] = useState(0);

  const { insights, representativePosts } = useMemo(
    () => analyzePostPatterns(rawTweets, brandDNA, brandScore),
    [rawTweets, brandDNA, brandScore]
  );

  if (!rawTweets.length) {
    return (
      <section
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#ffffff' }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '8px',
          }}
        >
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              color: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            No posts available for analysis
          </span>
        </div>
      </section>
    );
  }

  const handleStartScan = () => {
    setStage('scanning');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      const clampedProgress = Math.min(progress, 100);
      setScanProgress(clampedProgress);
      if (clampedProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => setStage('insights'), 400);
      }
    }, 30);
  };

  return (
    <section
      className="min-h-screen"
      style={{ background: '#ffffff', position: 'relative' }}
    >
      <AnimatePresence mode="wait">
        {/* Stage 1: Intro */}
        {stage === 'intro' && (
          <ConversationalGate
            key="intro"
            message={`I'm about to scan your last ${rawTweets.length} posts to find patterns in what works.`}
            subtext="I'll identify your best content and show you exactly why it performs."
            buttonLabel="SCAN MY POSTS"
            onContinue={handleStartScan}
            dataPoint={{ label: 'POSTS TO ANALYZE', value: rawTweets.length }}
          />
        )}

        {/* Stage 2: Scanning */}
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
              SCANNING {rawTweets.length} POSTS...
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
              {scanProgress < 25 && 'Reading post content...'}
              {scanProgress >= 25 && scanProgress < 50 && 'Analyzing engagement patterns...'}
              {scanProgress >= 50 && scanProgress < 75 && 'Identifying voice markers...'}
              {scanProgress >= 75 && scanProgress < 100 && 'Extracting insights...'}
              {scanProgress >= 100 && 'Analysis complete!'}
            </div>
          </motion.div>
        )}

        {/* Stage 3: Insights reveal */}
        {stage === 'insights' && (
          <motion.div
            key="insights"
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
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                fontSize: '24px',
                color: '#10B981',
              }}
            >
              ✓
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#000',
                marginBottom: '8px',
              }}
            >
              Analysis Complete
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.5)',
                marginBottom: '32px',
              }}
            >
              Here's what I found in your content:
            </motion.p>

            {/* Insights grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                maxWidth: '500px',
                width: '100%',
                marginBottom: '32px',
              }}
            >
              {insights.map((insight, i) => {
                const isRevealed = i < revealedInsights;
                return (
                  <motion.div
                    key={insight.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: isRevealed ? 1 : 0.3,
                      y: 0,
                      scale: isRevealed ? 1 : 0.95,
                    }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    style={{
                      padding: '20px',
                      background: isRevealed ? 'rgba(0, 0, 0, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                      border: `1px solid ${isRevealed ? insight.color + '30' : 'rgba(0,0,0,0.06)'}`,
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '9px',
                        letterSpacing: '0.1em',
                        color: isRevealed ? insight.color : 'rgba(0,0,0,0.3)',
                        marginBottom: '8px',
                      }}
                    >
                      {insight.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '24px',
                        fontWeight: 700,
                        color: isRevealed ? '#000' : 'rgba(0,0,0,0.2)',
                        marginBottom: '6px',
                      }}
                    >
                      {isRevealed ? insight.value : '??'}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: isRevealed ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)',
                        lineHeight: 1.4,
                      }}
                    >
                      {isRevealed ? insight.description : ''}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Reveal or continue */}
            {revealedInsights < insights.length ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setRevealedInsights(prev => prev + 2)}
                style={{
                  padding: '14px 28px',
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
                  REVEAL MORE
                </span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center' }}
              >
                <p
                  style={{
                    fontSize: '15px',
                    color: 'rgba(0,0,0,0.6)',
                    marginBottom: '20px',
                  }}
                >
                  Let me show you 3 posts that illustrate these patterns.
                </p>
                <button
                  onClick={() => setStage('posts')}
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
                    SHOW EXAMPLE POSTS
                  </span>
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Stage 4: Representative posts */}
        {stage === 'posts' && (
          <motion.div
            key="posts"
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
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: 'rgba(0, 0, 0, 0.4)',
                marginBottom: '24px',
              }}
            >
              POSTS THAT DEFINE YOUR BRAND
            </motion.p>

            <div
              style={{
                width: '100%',
                maxWidth: '550px',
                marginBottom: '32px',
              }}
            >
              {representativePosts.map((item, i) => {
                const isRevealed = i < revealedPosts;
                const likes = item.tweet.public_metrics?.like_count || 0;
                const retweets = item.tweet.public_metrics?.retweet_count || 0;

                return (
                  <motion.div
                    key={item.tweet.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                      opacity: isRevealed ? 1 : 0.15,
                      y: 0,
                    }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                    style={{
                      marginBottom: '20px',
                      padding: '20px',
                      background: isRevealed ? '#fff' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isRevealed ? item.tagColor + '30' : 'rgba(0,0,0,0.06)'}`,
                      borderRadius: '8px',
                      boxShadow: isRevealed ? '0 4px 20px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {/* Tag */}
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: isRevealed ? item.tagColor + '15' : 'rgba(0,0,0,0.04)',
                        borderRadius: '4px',
                        marginBottom: '12px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'VCR OSD Mono', monospace",
                          fontSize: '9px',
                          letterSpacing: '0.1em',
                          color: isRevealed ? item.tagColor : 'rgba(0,0,0,0.2)',
                        }}
                      >
                        {isRevealed ? item.tag : 'LOCKED'}
                      </span>
                    </div>

                    {/* Post content */}
                    <p
                      style={{
                        fontSize: '15px',
                        lineHeight: 1.6,
                        color: isRevealed ? '#000' : 'rgba(0,0,0,0.15)',
                        margin: '0 0 12px 0',
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {isRevealed ? item.tweet.text : 'Click reveal to see this post...'}
                    </p>

                    {/* Metrics */}
                    {isRevealed && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          marginBottom: '12px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid rgba(0,0,0,0.06)',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'VCR OSD Mono', monospace",
                            fontSize: '11px',
                            color: 'rgba(0,0,0,0.5)',
                          }}
                        >
                          ♥ {formatNumber(likes)}
                        </span>
                        <span
                          style={{
                            fontFamily: "'VCR OSD Mono', monospace",
                            fontSize: '11px',
                            color: 'rgba(0,0,0,0.5)',
                          }}
                        >
                          ↻ {formatNumber(retweets)}
                        </span>
                        <span
                          style={{
                            fontFamily: "'VCR OSD Mono', monospace",
                            fontSize: '11px',
                            color: 'rgba(0,0,0,0.3)',
                            marginLeft: 'auto',
                          }}
                        >
                          {formatDate(item.tweet.created_at)}
                        </span>
                      </div>
                    )}

                    {/* Reason */}
                    {isRevealed && (
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'rgba(0,0,0,0.6)',
                          margin: 0,
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                        }}
                      >
                        {item.reason}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Reveal or continue */}
            {revealedPosts < representativePosts.length ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setRevealedPosts(prev => prev + 1)}
                style={{
                  padding: '14px 28px',
                  background: representativePosts[revealedPosts]?.tagColor || '#0047FF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    color: '#fff',
                  }}
                >
                  REVEAL {representativePosts[revealedPosts]?.tag || 'POST'}
                </span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center' }}
              >
                <p
                  style={{
                    fontSize: '15px',
                    color: 'rgba(0,0,0,0.6)',
                    marginBottom: '20px',
                    maxWidth: '400px',
                  }}
                >
                  Now let's dive deeper into what makes your brand unique.
                </p>
                <button
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
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

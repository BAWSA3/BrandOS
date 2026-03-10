// ===== MARKET SCANNER AGENT =====
// Scans X for high-performing content in user's niches, extracts viral patterns

import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/db';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

interface TwitterSearchResult {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    impression_count?: number;
    quote_count?: number;
  };
}

interface ViralPatterns {
  hookType: string;
  format: string;
  tone: string;
  cta: string;
  length: string;
  topic: string;
}

/**
 * Compute viral score from engagement metrics
 * Formula: (relativeEngagement × 25) + (reach × 25) + (shares × 25) + (conversation × 25)
 */
function computeViralScore(metrics: TwitterSearchResult['public_metrics']): number {
  if (!metrics) return 0;

  const likes = metrics.like_count || 0;
  const retweets = metrics.retweet_count || 0;
  const replies = metrics.reply_count || 0;
  const impressions = metrics.impression_count || 1;
  const quotes = metrics.quote_count || 0;

  // Engagement component (likes + replies relative to impressions)
  const engagementRate = (likes + replies) / impressions;
  const engagementScore = Math.min(25, engagementRate * 500);

  // Reach component (impressions-based, log scale)
  const reachScore = Math.min(25, (Math.log10(Math.max(impressions, 1)) / 6) * 25);

  // Shares component (retweets + quotes)
  const shareRate = (retweets + quotes) / Math.max(impressions, 1);
  const sharesScore = Math.min(25, shareRate * 1000);

  // Conversation component (reply ratio)
  const conversationRate = replies / Math.max(impressions, 1);
  const conversationScore = Math.min(25, conversationRate * 1000);

  return Math.round(engagementScore + reachScore + sharesScore + conversationScore);
}

/**
 * Search X API for tweets matching niche keywords
 */
async function searchNicheTweets(
  keywords: string[],
  hashtags: string[],
  referenceAccounts: string[],
  maxResults: number = 20
): Promise<TwitterSearchResult[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];

  // Build query: keywords OR hashtags, optionally from reference accounts
  const parts: string[] = [];
  if (keywords.length > 0) {
    parts.push(`(${keywords.slice(0, 3).join(' OR ')})`);
  }
  if (hashtags.length > 0) {
    parts.push(`(${hashtags.slice(0, 3).map(h => `#${h.replace(/^#/, '')}`).join(' OR ')})`);
  }

  let query = parts.join(' OR ');
  if (!query) return [];

  // Filter for quality: exclude retweets, English only
  query += ' -is:retweet lang:en';

  try {
    const params = new URLSearchParams({
      query,
      max_results: Math.min(maxResults, 100).toString(),
      'tweet.fields': 'created_at,public_metrics,author_id',
      'user.fields': 'username',
      expansions: 'author_id',
    });

    const response = await fetch(`${TWITTER_API_BASE}/tweets/search/recent?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.error(`[market-scanner] X API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data.data) return [];

    // Attach author usernames
    const userMap = new Map<string, string>();
    if (data.includes?.users) {
      for (const user of data.includes.users) {
        userMap.set(user.id, user.username);
      }
    }

    return data.data.map((tweet: TwitterSearchResult & { _authorUsername?: string }) => ({
      ...tweet,
      _authorUsername: userMap.get(tweet.author_id) || undefined,
    }));
  } catch (error) {
    console.error('[market-scanner] Search error:', error);
    return [];
  }
}

/**
 * Use Claude to extract structured patterns from a viral tweet
 */
async function extractPatterns(tweets: { text: string; viralScore: number }[]): Promise<ViralPatterns[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || tweets.length === 0) return [];

  try {
    const anthropic = new Anthropic({ apiKey });

    const tweetList = tweets
      .map((t, i) => `[${i + 1}] (score: ${t.viralScore}) ${t.text}`)
      .join('\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze these high-performing tweets and extract patterns for each.

TWEETS:
${tweetList}

For each tweet, return:
- hookType: "question" | "bold-claim" | "contrarian" | "story" | "data" | "list" | "how-to" | "observation"
- format: "single-tweet" | "thread-opener" | "list" | "story" | "hot-take" | "educational"
- tone: "raw-honest" | "data-backed" | "humorous" | "inspirational" | "provocative" | "casual" | "authoritative"
- cta: "question" | "follow" | "retweet" | "reply" | "link" | "none" | "save-this"
- length: "short" (<100 chars) | "medium" (100-200) | "long" (200+)
- topic: brief topic descriptor

Return ONLY valid JSON array:
[
  { "hookType": "...", "format": "...", "tone": "...", "cta": "...", "length": "...", "topic": "..." }
]`,
      }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]) as ViralPatterns[];
  } catch (error) {
    console.error('[market-scanner] Pattern extraction error:', error);
    return [];
  }
}

/**
 * Run the market scanner for a specific brand
 */
export async function runMarketScanner(brandId: string): Promise<{
  benchmarksCreated: number;
  benchmarksPruned: number;
  nichesScanned: number;
}> {
  const result = { benchmarksCreated: 0, benchmarksPruned: 0, nichesScanned: 0 };

  // Get brand's active niches
  const niches = await prisma.contentNiche.findMany({
    where: { brandId, isActive: true },
  });

  if (niches.length === 0) {
    console.log('[market-scanner] No active niches for brand', brandId);
    return result;
  }

  for (const niche of niches) {
    result.nichesScanned++;

    const keywords: string[] = JSON.parse(niche.keywords);
    const hashtags: string[] = JSON.parse(niche.hashtags);
    const referenceAccounts: string[] = JSON.parse(niche.referenceAccounts);

    // Search for tweets
    const tweets = await searchNicheTweets(keywords, hashtags, referenceAccounts);

    // Score tweets
    const scoredTweets = tweets
      .map(tweet => ({
        tweet,
        viralScore: computeViralScore(tweet.public_metrics),
        authorUsername: (tweet as unknown as { _authorUsername?: string })._authorUsername,
      }))
      .filter(t => t.viralScore >= 30) // Only keep reasonably viral content
      .sort((a, b) => b.viralScore - a.viralScore)
      .slice(0, 10); // Top 10 per niche

    if (scoredTweets.length === 0) continue;

    // Extract patterns via Claude
    const patterns = await extractPatterns(
      scoredTweets.map(t => ({ text: t.tweet.text, viralScore: t.viralScore }))
    );

    // Upsert benchmarks
    for (let i = 0; i < scoredTweets.length; i++) {
      const { tweet, viralScore, authorUsername } = scoredTweets[i];
      const tweetPatterns = patterns[i] || {
        hookType: 'unknown',
        format: 'single-tweet',
        tone: 'casual',
        cta: 'none',
        length: 'medium',
        topic: 'unknown',
      };

      try {
        await prisma.viralBenchmark.upsert({
          where: {
            platform_externalId: {
              platform: 'x',
              externalId: tweet.id,
            },
          },
          update: {
            metrics: JSON.stringify(tweet.public_metrics || {}),
            viralScore,
            patterns: JSON.stringify(tweetPatterns),
            scannedAt: new Date(),
          },
          create: {
            platform: 'x',
            externalId: tweet.id,
            authorUsername: authorUsername || null,
            content: tweet.text,
            metrics: JSON.stringify(tweet.public_metrics || {}),
            viralScore,
            patterns: JSON.stringify(tweetPatterns),
            niche: niche.name,
            brandId,
          },
        });
        result.benchmarksCreated++;
      } catch (error) {
        console.error('[market-scanner] Upsert error:', error);
      }
    }

    // Small delay between niches to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Prune benchmarks older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const pruned = await prisma.viralBenchmark.deleteMany({
    where: {
      brandId,
      scannedAt: { lt: thirtyDaysAgo },
    },
  });
  result.benchmarksPruned = pruned.count;

  return result;
}

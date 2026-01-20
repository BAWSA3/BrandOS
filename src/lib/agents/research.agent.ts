// ===== RESEARCH AGENT =====
// Aggregates TCG/Collectibles news and trends from multiple sources
// Synthesizes findings into actionable content topics

import Anthropic from '@anthropic-ai/sdk';
import { BrandDNA } from '@/lib/types';
import { AgentContext, AgentResponse, ContentBrief } from './types';
import {
  TCGVertical,
  ResearchSource,
  ResearchTopic,
  ResearchBrief,
  ResearchOptions,
  RawSourceData,
  TrendingPeriod,
  VERTICAL_CONFIGS,
  TopicCategory,
  SourceReference,
  ResearchContentBrief,
} from './research.types';
import { aggregateFromSources, getAvailableSources } from './sources';

// ===== PROMPT BUILDERS =====

function buildSynthesisPrompt(
  brand: BrandDNA,
  rawData: RawSourceData,
  verticals: TCGVertical[],
  timeRange: TrendingPeriod
): string {
  const verticalNames = verticals.map((v) => VERTICAL_CONFIGS[v].name).join(', ');

  // Summarize source data for the prompt
  const twitterSummary = rawData.twitter
    ? `Twitter/X Posts (${rawData.twitter.length} posts):\n${rawData.twitter
        .slice(0, 20)
        .map((t) => `- @${t.authorUsername}: "${t.text.slice(0, 150)}..." (${t.metrics.likes} likes, ${t.metrics.retweets} RTs)`)
        .join('\n')}`
    : 'No Twitter data';

  const redditSummary = rawData.reddit
    ? `Reddit Posts (${rawData.reddit.length} posts):\n${rawData.reddit
        .slice(0, 20)
        .map((r) => `- r/${r.subreddit}: "${r.title}" (${r.score} upvotes, ${r.numComments} comments)`)
        .join('\n')}`
    : 'No Reddit data';

  const youtubeSummary = rawData.youtube
    ? `YouTube Videos (${rawData.youtube.length} videos):\n${rawData.youtube
        .slice(0, 15)
        .map((y) => `- ${y.channelTitle}: "${y.title}" (${y.viewCount || 'N/A'} views)`)
        .join('\n')}`
    : 'No YouTube data';

  const serperSummary = rawData.serper
    ? `News Articles (${rawData.serper.length} articles):\n${rawData.serper
        .slice(0, 15)
        .map((s) => `- ${s.source || 'Unknown'}: "${s.title}" - ${s.snippet.slice(0, 100)}...`)
        .join('\n')}`
    : 'No news data';

  return `You are a TCG/Collectibles market researcher analyzing trends for "${brand.name}", a trading cards and collectibles platform.

BRAND CONTEXT:
- Name: ${brand.name}
- Focus Keywords: ${brand.keywords.join(', ') || 'Trading cards, collectibles, TCG'}
- Brand Voice: ${brand.voiceSamples.length > 0 ? brand.voiceSamples.slice(0, 2).join(' | ') : 'Professional, informative, engaging'}

RESEARCH PARAMETERS:
- Verticals being tracked: ${verticalNames}
- Time range: ${timeRange}
- Data fetched at: ${rawData.fetchedAt}

RAW DATA FROM SOURCES:

${twitterSummary}

${redditSummary}

${youtubeSummary}

${serperSummary}

TASK: Analyze this data and identify the TOP 8-12 most significant topics/trends that would be valuable for content creation. Consider:
1. Topics with high engagement across multiple sources
2. Breaking news or announcements
3. Controversies or debates in the community
4. Price movements or market trends
5. Product launches or set releases
6. Community sentiment shifts

For each topic, determine:
- Relevance score (0-100) based on importance to TCG/collectibles audience
- Sentiment score (-100 to 100, negative = controversy/concern, positive = excitement/optimism)
- Engagement level (low/medium/high/viral)
- Best content angles for social media

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "topics": [
    {
      "id": "unique-topic-id",
      "title": "Concise topic title",
      "summary": "2-3 sentence summary of what's happening and why it matters",
      "vertical": "pokemon|mtg|yugioh|sports-cards|collectibles",
      "category": "news|trend|controversy|product-launch|price-alert|community|tournament",
      "relevanceScore": 85,
      "sentimentScore": 50,
      "engagementLevel": "high",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "hashtags": ["#Hashtag1", "#Hashtag2"],
      "contentAngles": [
        "Angle 1: How to position this for your audience",
        "Angle 2: Alternative take or perspective"
      ],
      "suggestedPlatforms": ["twitter", "instagram", "tiktok"]
    }
  ],
  "summary": "Overall market summary in 2-3 sentences",
  "trendingKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "verticalSummaries": {
    "pokemon": "One sentence summary for Pokemon TCG",
    "mtg": "One sentence summary for MTG",
    "yugioh": "One sentence summary for Yu-Gi-Oh",
    "sports-cards": "One sentence summary for Sports Cards",
    "collectibles": "One sentence summary for Other Collectibles"
  }
}`;
}

function buildContentBriefPrompt(
  brand: BrandDNA,
  topic: ResearchTopic,
  contentType: string,
  platform: string
): string {
  return `You are a content strategist creating a brief for "${brand.name}" based on a trending TCG/Collectibles topic.

BRAND DNA:
- Name: ${brand.name}
- Tone Profile:
  - Minimal: ${brand.tone.minimal}/100
  - Playful: ${brand.tone.playful}/100
  - Bold: ${brand.tone.bold}/100
  - Experimental: ${brand.tone.experimental}/100
- Keywords: ${brand.keywords.join(', ') || 'Trading cards, collectibles'}
- DO: ${brand.doPatterns.join('; ') || 'Be informative, engaging, authentic'}
- DON'T: ${brand.dontPatterns.join('; ') || 'Be boring, salesy, inauthentic'}

TOPIC TO COVER:
- Title: ${topic.title}
- Summary: ${topic.summary}
- Vertical: ${topic.vertical}
- Category: ${topic.category}
- Keywords: ${topic.keywords.join(', ')}
- Content Angles: ${topic.contentAngles?.join('; ') || 'General coverage'}

TARGET OUTPUT:
- Content Type: ${contentType}
- Platform: ${platform}

Create a detailed content brief that the Content Agent can use to generate the actual content.

Return ONLY valid JSON:
{
  "angle": "The specific angle/hook for this piece",
  "keyPoints": ["Point 1 to cover", "Point 2 to cover", "Point 3 to cover"],
  "suggestedHashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "tone": "Recommended tone adjustment (e.g., 'more playful', 'authoritative', 'urgent')",
  "callToAction": "Suggested CTA that ties back to the platform",
  "sourcesToCite": ["Source or fact to reference"]
}`;
}

// ===== RESPONSE PARSERS =====

function parseResearchBrief(
  responseText: string,
  rawData: RawSourceData,
  verticals: TCGVertical[]
): ResearchBrief | null {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.topics || !Array.isArray(parsed.topics)) {
      return null;
    }

    // Transform topics to include source references
    const topics: ResearchTopic[] = parsed.topics.map((t: Record<string, unknown>, index: number) => ({
      id: (t.id as string) || `topic-${Date.now()}-${index}`,
      title: t.title as string,
      summary: t.summary as string,
      vertical: t.vertical as TCGVertical,
      category: (t.category as TopicCategory) || 'trend',
      relevanceScore: (t.relevanceScore as number) || 50,
      sentimentScore: t.sentimentScore as number | undefined,
      engagementLevel: t.engagementLevel as 'low' | 'medium' | 'high' | 'viral' | undefined,
      sources: buildSourceReferences(t, rawData),
      keywords: (t.keywords as string[]) || [],
      hashtags: t.hashtags as string[] | undefined,
      contentAngles: t.contentAngles as string[] | undefined,
      suggestedPlatforms: t.suggestedPlatforms as string[] | undefined,
      firstSeen: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }));

    // Build vertical summaries with fallbacks
    const verticalSummaries: Record<TCGVertical, string> = {
      pokemon: '',
      mtg: '',
      yugioh: '',
      'sports-cards': '',
      collectibles: '',
    };

    if (parsed.verticalSummaries) {
      for (const v of verticals) {
        verticalSummaries[v] = parsed.verticalSummaries[v] || `No significant updates for ${VERTICAL_CONFIGS[v].name}`;
      }
    }

    return {
      topics,
      summary: parsed.summary || 'Research complete.',
      trendingKeywords: parsed.trendingKeywords || [],
      verticalSummaries,
      aggregatedAt: rawData.fetchedAt,
    };
  } catch (error) {
    console.error('Failed to parse research brief:', error);
    return null;
  }
}

function buildSourceReferences(
  topic: Record<string, unknown>,
  rawData: RawSourceData
): SourceReference[] {
  const refs: SourceReference[] = [];
  const keywords = (topic.keywords as string[]) || [];
  const title = ((topic.title as string) || '').toLowerCase();

  // Find matching Twitter posts
  if (rawData.twitter) {
    const matches = rawData.twitter.filter((t) =>
      keywords.some((k) => t.text.toLowerCase().includes(k.toLowerCase())) ||
      t.text.toLowerCase().includes(title.slice(0, 30))
    );
    for (const match of matches.slice(0, 2)) {
      refs.push({
        source: 'twitter',
        url: `https://twitter.com/${match.authorUsername}/status/${match.id}`,
        author: match.authorUsername,
        publishedAt: match.createdAt,
        engagement: {
          likes: match.metrics.likes,
          shares: match.metrics.retweets,
        },
        snippet: match.text.slice(0, 200),
      });
    }
  }

  // Find matching Reddit posts
  if (rawData.reddit) {
    const matches = rawData.reddit.filter((r) =>
      keywords.some((k) => r.title.toLowerCase().includes(k.toLowerCase())) ||
      r.title.toLowerCase().includes(title.slice(0, 30))
    );
    for (const match of matches.slice(0, 2)) {
      refs.push({
        source: 'reddit',
        url: match.permalink,
        author: match.author,
        publishedAt: match.createdAt,
        engagement: {
          likes: match.score,
          comments: match.numComments,
        },
        snippet: match.title,
      });
    }
  }

  // Find matching YouTube videos
  if (rawData.youtube) {
    const matches = rawData.youtube.filter((y) =>
      keywords.some((k) => y.title.toLowerCase().includes(k.toLowerCase()))
    );
    for (const match of matches.slice(0, 1)) {
      refs.push({
        source: 'youtube',
        url: `https://youtube.com/watch?v=${match.id}`,
        author: match.channelTitle,
        publishedAt: match.publishedAt,
        engagement: {
          views: match.viewCount,
          likes: match.likeCount,
        },
        snippet: match.title,
      });
    }
  }

  return refs;
}

function parseContentBrief(
  responseText: string,
  topic: ResearchTopic,
  contentType: string,
  platform: string
): ResearchContentBrief | null {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      topic,
      contentType: contentType as ContentBrief['type'],
      platform: platform as ContentBrief['platform'],
      angle: parsed.angle || topic.title,
      keyPoints: parsed.keyPoints || [],
      sourcesToCite: topic.sources.slice(0, 2),
      suggestedHashtags: parsed.suggestedHashtags || topic.hashtags || [],
      tone: parsed.tone,
    };
  } catch {
    return null;
  }
}

// ===== MAIN AGENT FUNCTIONS =====

/**
 * Aggregate trends from all sources and synthesize into research brief
 */
export async function aggregateTrends(
  context: AgentContext,
  options: ResearchOptions = {}
): Promise<AgentResponse<ResearchBrief>> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    if (!context.brandDNA?.name) {
      return {
        success: false,
        error: 'Brand DNA is required',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    // Set defaults
    const verticals: TCGVertical[] = options.verticals || [
      'pokemon',
      'mtg',
      'sports-cards',
    ];
    const timeRange: TrendingPeriod = options.timeRange || 'last-week';

    // Get available sources
    const availableSources = await getAvailableSources();
    const sources: ResearchSource[] = options.sources
      ? options.sources.filter((s) => availableSources.includes(s))
      : availableSources;

    if (sources.length === 0) {
      // Fallback to Reddit which doesn't require API key
      sources.push('reddit');
    }

    // Fetch raw data from sources
    const rawData = await aggregateFromSources({
      verticals,
      sources,
      timeRange,
      postsPerSource: 30,
    });

    // Check if we got any data
    const totalItems =
      (rawData.twitter?.length || 0) +
      (rawData.reddit?.length || 0) +
      (rawData.youtube?.length || 0) +
      (rawData.serper?.length || 0);

    if (totalItems === 0) {
      return {
        success: false,
        error: 'No data retrieved from any source. Check API configurations.',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    // Synthesize with Claude
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: buildSynthesisPrompt(
            context.brandDNA,
            rawData,
            verticals,
            timeRange
          ),
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const researchBrief = parseResearchBrief(responseText, rawData, verticals);

    if (!researchBrief) {
      return {
        success: false,
        error: 'Failed to parse research results from AI response',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    // Calculate confidence based on data quality
    let confidence = 0.6;
    if (sources.length >= 2) confidence += 0.1;
    if (totalItems >= 50) confidence += 0.1;
    if (researchBrief.topics.length >= 5) confidence += 0.1;
    if (!rawData.errors || rawData.errors.length === 0) confidence += 0.1;

    return {
      success: true,
      data: researchBrief,
      confidence: Math.min(confidence, 0.95),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Research agent error:', error);

    let errorMessage = 'Research aggregation failed';
    if (error instanceof Error) {
      if (error.message.includes('credit balance is too low')) {
        errorMessage = 'API credits depleted. Please check your Anthropic account.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Get topics for a specific vertical
 */
export async function getTopicsForVertical(
  context: AgentContext,
  vertical: TCGVertical,
  limit: number = 10
): Promise<AgentResponse<ResearchTopic[]>> {
  const startTime = Date.now();

  const result = await aggregateTrends(context, {
    verticals: [vertical],
    timeRange: 'last-week',
    limit,
  });

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to get topics',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }

  const topics = result.data.topics
    .filter((t) => t.vertical === vertical)
    .slice(0, limit);

  return {
    success: true,
    data: topics,
    confidence: result.confidence,
    processingTime: Date.now() - startTime,
  };
}

/**
 * Generate content brief from a research topic
 */
export async function generateContentBrief(
  context: AgentContext,
  topic: ResearchTopic,
  contentType: string,
  platform: string
): Promise<AgentResponse<ResearchContentBrief>> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    if (!context.brandDNA?.name) {
      return {
        success: false,
        error: 'Brand DNA is required',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: buildContentBriefPrompt(
            context.brandDNA,
            topic,
            contentType,
            platform
          ),
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const brief = parseContentBrief(responseText, topic, contentType, platform);

    if (!brief) {
      return {
        success: false,
        error: 'Failed to parse content brief from AI response',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    return {
      success: true,
      data: brief,
      confidence: 0.85,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Content brief generation failed',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Rank topics by relevance and engagement
 */
export function rankTopics(
  topics: ResearchTopic[],
  options: {
    preferredVerticals?: TCGVertical[];
    minRelevance?: number;
    sortBy?: 'relevance' | 'engagement' | 'recency';
  } = {}
): ResearchTopic[] {
  const { preferredVerticals, minRelevance = 0, sortBy = 'relevance' } = options;

  let filtered = topics.filter((t) => t.relevanceScore >= minRelevance);

  if (preferredVerticals && preferredVerticals.length > 0) {
    // Boost preferred verticals
    filtered = filtered.map((t) => ({
      ...t,
      relevanceScore: preferredVerticals.includes(t.vertical)
        ? Math.min(t.relevanceScore + 10, 100)
        : t.relevanceScore,
    }));
  }

  // Sort based on criteria
  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'engagement':
        const engagementOrder = { viral: 4, high: 3, medium: 2, low: 1 };
        return (
          (engagementOrder[b.engagementLevel || 'low'] || 0) -
          (engagementOrder[a.engagementLevel || 'low'] || 0)
        );
      case 'recency':
        return new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime();
      case 'relevance':
      default:
        return b.relevanceScore - a.relevanceScore;
    }
  });
}

/**
 * Quick research summary - lighter weight version
 */
export async function getQuickSummary(
  context: AgentContext,
  verticals: TCGVertical[] = ['pokemon', 'mtg', 'sports-cards']
): Promise<
  AgentResponse<{
    summary: string;
    topTopics: { title: string; vertical: string }[];
    trendingKeywords: string[];
  }>
> {
  const startTime = Date.now();

  const result = await aggregateTrends(context, {
    verticals,
    timeRange: 'last-week',
    limit: 5,
  });

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to get summary',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }

  return {
    success: true,
    data: {
      summary: result.data.summary,
      topTopics: result.data.topics.slice(0, 5).map((t) => ({
        title: t.title,
        vertical: t.vertical,
      })),
      trendingKeywords: result.data.trendingKeywords.slice(0, 10),
    },
    confidence: result.confidence,
    processingTime: Date.now() - startTime,
  };
}

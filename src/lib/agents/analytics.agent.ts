// ===== ANALYTICS AGENT =====
// Analyzes content performance and provides actionable recommendations

import Anthropic from '@anthropic-ai/sdk';
import { BrandDNA, Platform } from '@/lib/types';
import { 
  AgentContext, 
  AgentResponse, 
  AnalyticsRequest, 
  AnalyticsReport,
  ContentPerformanceData,
  GoalAchievement,
  ChannelPerformance,
} from './types';

// Platform benchmarks for context
interface PlatformBenchmarks {
  engagementRate: { good: number; great: number };
  clickRate: { good: number; great: number };
  description: string;
}

const platformBenchmarks: Record<Platform | 'default', PlatformBenchmarks> = {
  twitter: {
    engagementRate: { good: 0.02, great: 0.05 },
    clickRate: { good: 0.01, great: 0.02 },
    description: 'Engagement = (likes + retweets + replies) / impressions',
  },
  linkedin: {
    engagementRate: { good: 0.04, great: 0.06 },
    clickRate: { good: 0.01, great: 0.03 },
    description: 'Engagement = (likes + comments + shares) / impressions',
  },
  instagram: {
    engagementRate: { good: 0.03, great: 0.06 },
    clickRate: { good: 0.005, great: 0.01 },
    description: 'Engagement = (likes + comments + saves) / reach',
  },
  tiktok: {
    engagementRate: { good: 0.05, great: 0.10 },
    clickRate: { good: 0.01, great: 0.03 },
    description: 'Engagement = (likes + comments + shares) / views',
  },
  email: {
    engagementRate: { good: 0.25, great: 0.40 }, // Open rate
    clickRate: { good: 0.025, great: 0.05 },
    description: 'Open rate for engagement, click-through rate for clicks',
  },
  website: {
    engagementRate: { good: 0.03, great: 0.05 }, // Time on page / bounce rate proxy
    clickRate: { good: 0.02, great: 0.05 },
    description: 'Engagement proxy via scroll depth and time on page',
  },
  default: {
    engagementRate: { good: 0.03, great: 0.05 },
    clickRate: { good: 0.01, great: 0.03 },
    description: 'General engagement benchmarks',
  },
};

// Build analytics prompt
function buildAnalyticsPrompt(brand: BrandDNA, request: AnalyticsRequest): string {
  // Calculate aggregated stats for context
  const totalImpressions = request.performanceData.reduce(
    (sum, d) => sum + (d.metrics.impressions || 0), 0
  );
  const totalEngagements = request.performanceData.reduce(
    (sum, d) => sum + (d.metrics.engagements || 0), 0
  );
  const totalClicks = request.performanceData.reduce(
    (sum, d) => sum + (d.metrics.clicks || 0), 0
  );
  
  const overallEngagementRate = totalImpressions > 0 
    ? ((totalEngagements / totalImpressions) * 100).toFixed(2) 
    : 'N/A';
  const overallClickRate = totalImpressions > 0 
    ? ((totalClicks / totalImpressions) * 100).toFixed(2) 
    : 'N/A';

  // Group data by platform
  const platformGroups = request.performanceData.reduce((acc, d) => {
    if (!acc[d.platform]) acc[d.platform] = [];
    acc[d.platform].push(d);
    return acc;
  }, {} as Record<string, ContentPerformanceData[]>);

  const platformSummaries = Object.entries(platformGroups).map(([platform, data]) => {
    const impressions = data.reduce((sum, d) => sum + (d.metrics.impressions || 0), 0);
    const engagements = data.reduce((sum, d) => sum + (d.metrics.engagements || 0), 0);
    const clicks = data.reduce((sum, d) => sum + (d.metrics.clicks || 0), 0);
    const benchmarks = platformBenchmarks[platform as Platform] || platformBenchmarks.default;
    
    return `
${platform.toUpperCase()} (${data.length} pieces):
- Impressions: ${impressions.toLocaleString()}
- Engagements: ${engagements.toLocaleString()} (${impressions > 0 ? ((engagements/impressions)*100).toFixed(2) : 0}%)
- Clicks: ${clicks.toLocaleString()} (${impressions > 0 ? ((clicks/impressions)*100).toFixed(2) : 0}%)
- Benchmark: Good eng. rate = ${(benchmarks.engagementRate.good * 100).toFixed(1)}%, Great = ${(benchmarks.engagementRate.great * 100).toFixed(1)}%`;
  }).join('\n');

  return `You are a marketing analytics expert analyzing content performance for "${brand.name}".

BRAND CONTEXT:
- Name: ${brand.name}
- Keywords: ${brand.keywords.join(', ') || 'None specified'}

ANALYSIS PERIOD: ${request.period}

AGGREGATE PERFORMANCE:
- Total Content Pieces: ${request.performanceData.length}
- Total Impressions: ${totalImpressions.toLocaleString()}
- Total Engagements: ${totalEngagements.toLocaleString()}
- Total Clicks: ${totalClicks.toLocaleString()}
- Overall Engagement Rate: ${overallEngagementRate}%
- Overall Click Rate: ${overallClickRate}%

PERFORMANCE BY PLATFORM:
${platformSummaries}

DETAILED CONTENT DATA:
${JSON.stringify(request.performanceData.map(d => ({
  id: d.contentId,
  platform: d.platform,
  type: d.contentType,
  published: d.publishedAt,
  metrics: d.metrics,
  preview: d.content?.substring(0, 100) + '...',
})), null, 2)}

${request.goals && request.goals.length > 0 ? `
CAMPAIGN GOALS:
${request.goals.map(g => `- ${g.metric}: Target ${g.target}`).join('\n')}
` : ''}

${request.questions && request.questions.length > 0 ? `
SPECIFIC QUESTIONS TO ANSWER:
${request.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
` : ''}

PLATFORM BENCHMARKS FOR CONTEXT:
- Twitter: Good engagement = 2-3%, Great = 5%+
- LinkedIn: Good engagement = 4%, Great = 6%+
- Instagram: Good engagement = 3%, Great = 6%+
- Email: Good open rate = 25-35%, Great = 40%+; Good click rate = 2.5%, Great = 5%+

YOUR TASK:
1. Analyze the data and identify what's working and what isn't
2. Determine goal achievement status if goals were provided
3. Find patterns in top-performing vs underperforming content
4. Provide specific, actionable recommendations
5. Suggest A/B tests to run based on the data

Be specific with numbers. Don't just say "engagement is low" - say "engagement is 1.2%, which is below the 2% benchmark for Twitter."

Return ONLY valid JSON:
{
  "period": "${request.period}",
  "summary": "2-3 sentence executive summary of performance - what's the headline?",
  "goalAchievement": [
    {
      "goal": "Goal name",
      "target": 1000,
      "actual": 850,
      "status": "close"
    }
  ],
  "channelPerformance": [
    {
      "platform": "twitter",
      "summary": "1-2 sentence channel summary",
      "topContent": {
        "description": "What the top piece was about",
        "metric": "engagements",
        "value": 450
      },
      "underperformer": {
        "description": "What the weak piece was about",
        "metric": "engagements",
        "value": 12
      },
      "insights": ["Specific insight 1", "Specific insight 2"]
    }
  ],
  "contentAnalysis": {
    "whatWorked": [
      { "pattern": "Pattern that drove success", "evidence": "Specific data" }
    ],
    "whatDidnt": [
      { "pattern": "Pattern that underperformed", "evidence": "Specific data" }
    ],
    "surprises": ["Unexpected finding with data"]
  },
  "recommendations": {
    "immediate": [
      {
        "action": "Specific action to take this week",
        "rationale": "Why this will help",
        "expectedImpact": "What improvement to expect"
      }
    ],
    "strategic": [
      {
        "action": "Longer-term strategic change",
        "rationale": "Why this matters",
        "expectedImpact": "Expected outcome"
      }
    ]
  },
  "abTestSuggestions": [
    {
      "hypothesis": "What we think might work",
      "test": "How to test it",
      "successMetric": "How to measure success"
    }
  ]
}`;
}

// Parse analytics report
function parseAnalyticsReport(responseText: string): AnalyticsReport | null {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.summary || !parsed.channelPerformance) return null;
    
    return parsed as AnalyticsReport;
  } catch {
    return null;
  }
}

/**
 * Analyze content performance and generate recommendations
 */
export async function analyzePerformance(
  context: AgentContext,
  request: AnalyticsRequest
): Promise<AgentResponse<AnalyticsReport>> {
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

    // Validate input
    if (!context.brandDNA?.name) {
      return {
        success: false,
        error: 'Brand DNA is required',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    if (!request.performanceData || request.performanceData.length === 0) {
      return {
        success: false,
        error: 'Performance data is required',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: buildAnalyticsPrompt(context.brandDNA, request),
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    const report = parseAnalyticsReport(responseText);
    
    if (!report) {
      return {
        success: false,
        error: 'Failed to parse analytics report',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    // Calculate confidence based on data quality
    let confidence = 0.7;
    if (request.performanceData.length >= 10) confidence += 0.1;
    if (request.performanceData.length >= 20) confidence += 0.1;
    if (request.goals && request.goals.length > 0) confidence += 0.05;

    return {
      success: true,
      data: report,
      confidence: Math.min(confidence, 0.95),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Analytics agent error:', error);
    
    let errorMessage = 'Analytics failed';
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
 * Quick performance check - lightweight analysis
 */
export async function quickPerformanceCheck(
  context: AgentContext,
  performanceData: ContentPerformanceData[]
): Promise<AgentResponse<{ status: 'winning' | 'neutral' | 'losing'; keyMetric: string; oneAction: string }>> {
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

    // Calculate quick stats
    const totalImpressions = performanceData.reduce(
      (sum, d) => sum + (d.metrics.impressions || 0), 0
    );
    const totalEngagements = performanceData.reduce(
      (sum, d) => sum + (d.metrics.engagements || 0), 0
    );
    const engagementRate = totalImpressions > 0 
      ? (totalEngagements / totalImpressions) * 100 
      : 0;

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Quick performance check for "${context.brandDNA.name}":

- ${performanceData.length} content pieces
- ${totalImpressions.toLocaleString()} total impressions
- ${totalEngagements.toLocaleString()} total engagements
- ${engagementRate.toFixed(2)}% engagement rate

Benchmark: Good = 2-3%, Great = 5%+

Return ONLY valid JSON:
{
  "status": "winning" | "neutral" | "losing",
  "keyMetric": "The most important number and what it means",
  "oneAction": "Single most impactful action to take right now"
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Failed to parse quick check',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const quickCheck = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: quickCheck,
      confidence: 0.75,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Quick check failed',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Compare performance between two time periods
 */
export async function comparePerformancePeriods(
  context: AgentContext,
  periodA: { name: string; data: ContentPerformanceData[] },
  periodB: { name: string; data: ContentPerformanceData[] }
): Promise<AgentResponse<{
  comparison: string;
  periodAStats: { impressions: number; engagements: number; rate: number };
  periodBStats: { impressions: number; engagements: number; rate: number };
  change: { direction: 'up' | 'down' | 'flat'; percentage: number };
  insights: string[];
}>> {
  const startTime = Date.now();
  
  try {
    // Calculate stats for both periods
    const calcStats = (data: ContentPerformanceData[]) => {
      const impressions = data.reduce((sum, d) => sum + (d.metrics.impressions || 0), 0);
      const engagements = data.reduce((sum, d) => sum + (d.metrics.engagements || 0), 0);
      return {
        impressions,
        engagements,
        rate: impressions > 0 ? (engagements / impressions) * 100 : 0,
      };
    };

    const statsA = calcStats(periodA.data);
    const statsB = calcStats(periodB.data);
    
    const rateChange = statsA.rate > 0 
      ? ((statsB.rate - statsA.rate) / statsA.rate) * 100 
      : 0;
    
    const direction: 'up' | 'down' | 'flat' = 
      rateChange > 5 ? 'up' : 
      rateChange < -5 ? 'down' : 
      'flat';

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Return basic comparison without AI insights
      return {
        success: true,
        data: {
          comparison: `${periodB.name} vs ${periodA.name}: Engagement ${direction === 'up' ? 'improved' : direction === 'down' ? 'declined' : 'stable'}`,
          periodAStats: statsA,
          periodBStats: statsB,
          change: { direction, percentage: Math.abs(rateChange) },
          insights: ['AI insights unavailable - API key not configured'],
        },
        confidence: 0.6,
        processingTime: Date.now() - startTime,
      };
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Compare these two periods for "${context.brandDNA.name}":

${periodA.name}:
- ${periodA.data.length} pieces
- ${statsA.impressions.toLocaleString()} impressions
- ${statsA.engagements.toLocaleString()} engagements
- ${statsA.rate.toFixed(2)}% engagement rate

${periodB.name}:
- ${periodB.data.length} pieces
- ${statsB.impressions.toLocaleString()} impressions
- ${statsB.engagements.toLocaleString()} engagements
- ${statsB.rate.toFixed(2)}% engagement rate

Change: ${rateChange > 0 ? '+' : ''}${rateChange.toFixed(1)}%

Provide 3 specific insights about what might explain this change.

Return ONLY valid JSON:
{
  "comparison": "One sentence comparison",
  "insights": ["Insight 1", "Insight 2", "Insight 3"]
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const aiInsights = jsonMatch 
      ? JSON.parse(jsonMatch[0]) 
      : { comparison: 'Analysis unavailable', insights: [] };

    return {
      success: true,
      data: {
        comparison: aiInsights.comparison,
        periodAStats: statsA,
        periodBStats: statsB,
        change: { direction, percentage: Math.abs(rateChange) },
        insights: aiInsights.insights,
      },
      confidence: 0.8,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Comparison failed',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}


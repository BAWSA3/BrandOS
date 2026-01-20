// ===== RESEARCH AGENT API ROUTE =====
// POST /api/agents/research - Aggregate TCG/Collectibles trends and generate research briefs

import { NextRequest, NextResponse } from 'next/server';
import { createAgents, validateBrandDNA } from '@/lib/agents';
import { BrandDNA } from '@/lib/types';
import {
  TCGVertical,
  ResearchSource,
  TrendingPeriod,
  ResearchTopic,
} from '@/lib/agents/research.types';
import { getAllSourceStatuses } from '@/lib/agents/sources';

type ResearchAction =
  | 'aggregate'
  | 'get-topics'
  | 'get-summary'
  | 'generate-brief'
  | 'research-to-content';

interface ResearchRequestBody {
  brandDNA: BrandDNA;
  action: ResearchAction;
  params?: {
    // For aggregate
    verticals?: TCGVertical[];
    sources?: ResearchSource[];
    timeRange?: TrendingPeriod;
    limit?: number;

    // For get-topics
    vertical?: TCGVertical;

    // For generate-brief
    topic?: ResearchTopic;
    contentType?: string;
    platform?: string;

    // For research-to-content
    selectedTopics?: ResearchTopic[];
    platforms?: string[];
    contentPerTopic?: number;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ResearchRequestBody = await request.json();
    const { brandDNA, action = 'aggregate', params = {} } = body;

    // Validate brand DNA
    if (!validateBrandDNA(brandDNA)) {
      return NextResponse.json(
        {
          error: 'Invalid or missing brand DNA',
          details: 'Brand DNA must include at least a name and tone profile',
        },
        { status: 400 }
      );
    }

    const agents = createAgents(brandDNA);

    switch (action) {
      // ===== AGGREGATE TRENDS =====
      case 'aggregate': {
        const result = await agents.researchTrends({
          verticals: params.verticals,
          sources: params.sources,
          timeRange: params.timeRange || 'last-week',
          limit: params.limit,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          research: result.data,
          confidence: result.confidence,
          processingTime: result.processingTime,
        });
      }

      // ===== GET TOPICS FOR VERTICAL =====
      case 'get-topics': {
        if (!params.vertical) {
          return NextResponse.json(
            { error: 'Missing vertical parameter' },
            { status: 400 }
          );
        }

        const result = await agents.getVerticalTopics(
          params.vertical,
          params.limit || 10
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          topics: result.data,
          vertical: params.vertical,
          confidence: result.confidence,
          processingTime: result.processingTime,
        });
      }

      // ===== GET QUICK SUMMARY =====
      case 'get-summary': {
        const result = await agents.getResearchSummary(params.verticals);

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          summary: result.data,
          confidence: result.confidence,
          processingTime: result.processingTime,
        });
      }

      // ===== GENERATE CONTENT BRIEF =====
      case 'generate-brief': {
        if (!params.topic || !params.contentType || !params.platform) {
          return NextResponse.json(
            { error: 'Missing topic, contentType, or platform parameter' },
            { status: 400 }
          );
        }

        const result = await agents.createBriefFromTopic(
          params.topic,
          params.contentType,
          params.platform
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          brief: result.data,
          confidence: result.confidence,
          processingTime: result.processingTime,
        });
      }

      // ===== RESEARCH TO CONTENT WORKFLOW =====
      case 'research-to-content': {
        const result = await agents.researchToContent({
          verticals: params.verticals,
          selectedTopics: params.selectedTopics,
          platforms: params.platforms as import('@/lib/types').Platform[],
          contentPerTopic: params.contentPerTopic,
        });

        return NextResponse.json({
          research: result.research.data,
          content: result.content?.data,
          confidence: result.research.confidence,
          processingTime: Date.now() - startTime,
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action: ${action}`,
            validActions: [
              'aggregate',
              'get-topics',
              'get-summary',
              'generate-brief',
              'research-to-content',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Research API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Research operation failed';

    return NextResponse.json(
      {
        error: errorMessage,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET /api/agents/research - Get agent info and source status
export async function GET() {
  // Get current source statuses
  let sourceStatuses: Awaited<ReturnType<typeof getAllSourceStatuses>> = [];
  try {
    sourceStatuses = await getAllSourceStatuses();
  } catch {
    sourceStatuses = [];
  }

  return NextResponse.json({
    agent: 'research',
    description:
      'Aggregates TCG/Collectibles news and trends from social platforms, Reddit, YouTube, and news sources. Synthesizes findings into actionable content topics.',
    capabilities: [
      'trend-aggregation',
      'news-monitoring',
      'topic-synthesis',
      'content-brief-generation',
      'source-tracking',
      'vertical-analysis',
    ],
    verticals: ['pokemon', 'mtg', 'yugioh', 'sports-cards', 'collectibles'],
    sources: sourceStatuses,
    endpoints: {
      'POST /api/agents/research': {
        description: 'Execute research operations',
        body: {
          brandDNA: 'BrandDNA object (required)',
          action:
            'aggregate | get-topics | get-summary | generate-brief | research-to-content',
          params: {
            verticals: 'TCGVertical[] (optional)',
            sources: 'ResearchSource[] (optional)',
            timeRange: 'last-24h | last-week | last-month (optional)',
            limit: 'number (optional)',
            vertical: 'TCGVertical (for get-topics)',
            topic: 'ResearchTopic (for generate-brief)',
            contentType: 'string (for generate-brief)',
            platform: 'string (for generate-brief)',
            selectedTopics: 'ResearchTopic[] (for research-to-content)',
            platforms: 'string[] (for research-to-content)',
            contentPerTopic: 'number (for research-to-content)',
          },
        },
      },
    },
  });
}

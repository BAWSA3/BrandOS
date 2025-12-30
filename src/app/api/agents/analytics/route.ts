// ===== ANALYTICS AGENT API ROUTE =====
// POST /api/agents/analytics - Analyze content performance

import { NextRequest, NextResponse } from 'next/server';
import { 
  createAgents, 
  validateBrandDNA, 
  AnalyticsRequest,
  ContentPerformanceData,
} from '@/lib/agents';
import { BrandDNA } from '@/lib/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      brandDNA, 
      performanceData,
      period,
      goals,
      questions,
      quickCheck,
      compare,
    } = body as {
      brandDNA: BrandDNA;
      performanceData?: ContentPerformanceData[];
      period?: string;
      goals?: { metric: string; target: number }[];
      questions?: string[];
      quickCheck?: boolean;
      compare?: {
        periodA: { name: string; data: ContentPerformanceData[] };
        periodB: { name: string; data: ContentPerformanceData[] };
      };
    };

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

    // Mode 1: Compare two periods
    if (compare) {
      if (!compare.periodA?.data?.length || !compare.periodB?.data?.length) {
        return NextResponse.json(
          { error: 'Comparison requires both periodA and periodB with data' },
          { status: 400 }
        );
      }

      const result = await agents.comparePeriods(compare.periodA, compare.periodB);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        comparison: result.data,
        confidence: result.confidence,
        processingTime: result.processingTime,
      });
    }

    // Validate performance data for other modes
    if (!performanceData || performanceData.length === 0) {
      return NextResponse.json(
        { 
          error: 'Performance data is required',
          details: 'Provide an array of ContentPerformanceData objects',
        },
        { status: 400 }
      );
    }

    // Mode 2: Quick health check
    if (quickCheck) {
      const result = await agents.quickCheck(performanceData);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        quickCheck: result.data,
        confidence: result.confidence,
        processingTime: result.processingTime,
      });
    }

    // Mode 3: Full analytics report
    const analyticsRequest: AnalyticsRequest = {
      performanceData,
      period: period || 'Analysis period',
      goals,
      questions,
    };

    const result = await agents.analyzeContent(analyticsRequest);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      report: result.data,
      confidence: result.confidence,
      processingTime: result.processingTime,
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Analytics failed';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET /api/agents/analytics - Get agent info
export async function GET() {
  return NextResponse.json({
    agent: 'analytics',
    description: 'Analyzes content performance and provides actionable recommendations',
    capabilities: [
      'performance-analysis',
      'recommendation-generation',
      'ab-test-suggestions',
      'trend-identification',
      'benchmark-comparison',
      'period-comparison',
    ],
    endpoints: {
      'POST /api/agents/analytics': {
        description: 'Analyze content performance',
        modes: {
          fullReport: {
            body: {
              brandDNA: 'BrandDNA (required)',
              performanceData: 'ContentPerformanceData[] (required)',
              period: 'string (optional) - e.g., "Last 30 days"',
              goals: '[{ metric: string, target: number }] (optional)',
              questions: 'string[] (optional) - specific questions to answer',
            },
          },
          quickCheck: {
            body: {
              brandDNA: 'BrandDNA (required)',
              performanceData: 'ContentPerformanceData[] (required)',
              quickCheck: 'true',
            },
          },
          compare: {
            body: {
              brandDNA: 'BrandDNA (required)',
              compare: {
                periodA: '{ name: string, data: ContentPerformanceData[] }',
                periodB: '{ name: string, data: ContentPerformanceData[] }',
              },
            },
          },
        },
        dataFormat: {
          ContentPerformanceData: {
            contentId: 'string',
            platform: 'Platform',
            contentType: 'ContentType',
            publishedAt: 'string (ISO date)',
            metrics: {
              impressions: 'number (optional)',
              engagements: 'number (optional)',
              clicks: 'number (optional)',
              shares: 'number (optional)',
              comments: 'number (optional)',
              saves: 'number (optional)',
              conversions: 'number (optional)',
            },
            content: 'string (optional) - the actual content for context',
          },
        },
      },
    },
    benchmarks: {
      twitter: { engagementRate: { good: '2-3%', great: '5%+' } },
      linkedin: { engagementRate: { good: '4%', great: '6%+' } },
      instagram: { engagementRate: { good: '3%', great: '6%+' } },
      email: { openRate: { good: '25-35%', great: '40%+' }, clickRate: { good: '2.5%', great: '5%+' } },
    },
  });
}







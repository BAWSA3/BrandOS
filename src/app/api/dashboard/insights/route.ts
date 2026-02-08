import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA } from '@/lib/types';
import { buildBrandContext } from '@/prompts/brand-guardian';

interface InsightsRequest {
  posts: {
    text: string;
    created_at: string;
    public_metrics: {
      like_count: number;
      retweet_count: number;
      reply_count: number;
      impression_count: number;
    };
  }[];
  brandDNA: BrandDNA;
}

export interface DashboardInsight {
  type: 'performance' | 'timing' | 'content' | 'brand' | 'growth';
  icon: string;
  title: string;
  description: string;
  metric?: string;
  trend?: 'up' | 'down' | 'stable';
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { posts, brandDNA } = (await request.json()) as InsightsRequest;

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        insights: [
          {
            type: 'content',
            icon: '📝',
            title: 'Start posting to see insights',
            description: 'Once you have posts, we\'ll analyze your performance and give actionable suggestions.',
            trend: 'stable' as const,
          },
        ],
      });
    }

    const anthropic = new Anthropic({ apiKey });

    const postsContext = posts.slice(0, 15).map((p, i) => 
      `Post ${i + 1} (${p.created_at}): "${p.text.slice(0, 200)}" — Likes: ${p.public_metrics.like_count}, Retweets: ${p.public_metrics.retweet_count}, Replies: ${p.public_metrics.reply_count}, Views: ${p.public_metrics.impression_count || 'N/A'}`
    ).join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a social media performance analyst for a brand. Analyze these recent X/Twitter posts and provide insights.

${buildBrandContext(brandDNA)}

RECENT POSTS:
${postsContext}

Analyze the data and return ONLY valid JSON with 3-5 insights:
{
  "insights": [
    {
      "type": "performance|timing|content|brand|growth",
      "icon": "emoji",
      "title": "Short insight title",
      "description": "1-2 sentence actionable insight",
      "metric": "optional metric like +12% or 3x",
      "trend": "up|down|stable"
    }
  ]
}

Focus on: best performing content types, optimal posting times, engagement patterns, brand voice consistency, and growth opportunities. Be specific with numbers from the data.`,
      }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ insights: parsed.insights });
    } catch {
      return NextResponse.json({
        insights: [{
          type: 'content',
          icon: '📊',
          title: 'Analysis in progress',
          description: 'We\'re still learning your posting patterns. Check back after more posts.',
          trend: 'stable',
        }],
      });
    }
  } catch (error) {
    console.error('Dashboard insights error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}

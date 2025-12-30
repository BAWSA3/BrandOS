// ===== CONTENT AGENT API ROUTE =====
// POST /api/agents/content - Generate on-brand content

import { NextRequest, NextResponse } from 'next/server';
import { createAgents, validateBrandDNA, ContentBrief } from '@/lib/agents';
import { BrandDNA, Platform } from '@/lib/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      brandDNA, 
      brief, 
      batch,
      adapt,
      ideas,
    } = body as {
      brandDNA: BrandDNA;
      brief?: ContentBrief;
      batch?: ContentBrief[];
      adapt?: {
        content: string;
        fromPlatform: Platform;
        toPlatform: Platform;
      };
      ideas?: {
        topic: string;
        platforms: Platform[];
        count?: number;
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

    // Handle different modes

    // Mode 1: Generate content ideas
    if (ideas) {
      if (!ideas.topic || !ideas.platforms?.length) {
        return NextResponse.json(
          { error: 'Ideas mode requires topic and platforms array' },
          { status: 400 }
        );
      }

      const result = await agents.getContentIdeas(
        ideas.topic, 
        ideas.platforms, 
        ideas.count
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        ideas: result.data?.ideas,
        confidence: result.confidence,
        processingTime: result.processingTime,
      });
    }

    // Mode 2: Adapt content for different platform
    if (adapt) {
      if (!adapt.content || !adapt.fromPlatform || !adapt.toPlatform) {
        return NextResponse.json(
          { error: 'Adapt mode requires content, fromPlatform, and toPlatform' },
          { status: 400 }
        );
      }

      const result = await agents.adaptContent(
        adapt.content,
        adapt.fromPlatform,
        adapt.toPlatform
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        content: result.data,
        confidence: result.confidence,
        processingTime: result.processingTime,
      });
    }

    // Mode 3: Batch content generation
    if (batch && batch.length > 0) {
      // Limit batch size to prevent abuse
      const limitedBatch = batch.slice(0, 10);
      
      const result = await agents.createContentBatch(limitedBatch);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        content: result.data?.pieces,
        summary: result.data?.summary,
        confidence: result.confidence,
        processingTime: result.processingTime,
      });
    }

    // Mode 4: Single content generation
    if (brief) {
      if (!brief.topic || !brief.platform) {
        return NextResponse.json(
          { error: 'Content brief requires topic and platform' },
          { status: 400 }
        );
      }

      const result = await agents.createContent(brief);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        content: result.data,
        confidence: result.confidence,
        processingTime: result.processingTime,
      });
    }

    return NextResponse.json(
      { 
        error: 'No valid action specified',
        details: 'Provide one of: brief (single), batch (multiple), adapt (cross-platform), or ideas (brainstorm)',
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Content API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Content generation failed';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET /api/agents/content - Get agent info
export async function GET() {
  return NextResponse.json({
    agent: 'content',
    description: 'Generates platform-specific, on-brand content',
    capabilities: [
      'content-creation',
      'copywriting',
      'platform-optimization',
      'content-adaptation',
      'batch-generation',
      'idea-generation',
    ],
    endpoints: {
      'POST /api/agents/content': {
        description: 'Generate content',
        modes: {
          single: {
            body: {
              brandDNA: 'BrandDNA (required)',
              brief: {
                type: 'ContentType (required)',
                platform: 'Platform (required)',
                topic: 'string (required)',
                keyMessage: 'string (optional)',
                cta: 'string (optional)',
                tone: 'default | energetic | professional | casual (optional)',
                length: 'short | medium | long (optional)',
                includeHashtags: 'boolean (optional)',
                campaignContext: 'string (optional)',
              },
            },
          },
          batch: {
            body: {
              brandDNA: 'BrandDNA (required)',
              batch: 'ContentBrief[] (max 10)',
            },
          },
          adapt: {
            body: {
              brandDNA: 'BrandDNA (required)',
              adapt: {
                content: 'string - original content',
                fromPlatform: 'Platform',
                toPlatform: 'Platform',
              },
            },
          },
          ideas: {
            body: {
              brandDNA: 'BrandDNA (required)',
              ideas: {
                topic: 'string',
                platforms: 'Platform[]',
                count: 'number (optional, default 5)',
              },
            },
          },
        },
      },
    },
  });
}







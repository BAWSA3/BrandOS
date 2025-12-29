// ===== CAMPAIGN AGENT API ROUTE =====
// POST /api/agents/campaign - Create a marketing campaign plan

import { NextRequest, NextResponse } from 'next/server';
import { createAgents, validateBrandDNA, CampaignBrief } from '@/lib/agents';
import { BrandDNA } from '@/lib/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { brandDNA, brief, preview } = body as {
      brandDNA: BrandDNA;
      brief?: CampaignBrief;
      preview?: boolean;
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

    // Validate brief
    if (!brief?.idea && !preview) {
      return NextResponse.json(
        { 
          error: 'Missing campaign idea',
          details: 'Provide a brief.idea string describing your campaign concept',
        },
        { status: 400 }
      );
    }

    const agents = createAgents(brandDNA);

    // If preview mode, return lightweight summary
    if (preview && brief?.idea) {
      const result = await agents.getCampaignPreview(brief.idea);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        preview: result.data,
        confidence: result.confidence,
        processingTime: result.processingTime,
      });
    }

    // Full campaign plan
    const result = await agents.planCampaign(brief!);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      campaign: result.data,
      confidence: result.confidence,
      processingTime: result.processingTime,
    });

  } catch (error) {
    console.error('Campaign API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Campaign planning failed';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET /api/agents/campaign - Get agent info
export async function GET() {
  return NextResponse.json({
    agent: 'campaign',
    description: 'Creates marketing campaign plans from ideas',
    capabilities: [
      'campaign-planning',
      'content-calendar-generation',
      'strategy-development',
      'objective-setting',
      'audience-targeting',
    ],
    endpoints: {
      'POST /api/agents/campaign': {
        description: 'Create a campaign plan',
        body: {
          brandDNA: 'BrandDNA object (required)',
          brief: {
            idea: 'string (required) - The campaign concept',
            objective: 'awareness | engagement | conversion | retention (optional)',
            targetAudience: 'string (optional)',
            timeline: 'string (optional)',
            channels: 'Platform[] (optional)',
            budget: 'minimal | moderate | significant (optional)',
          },
          preview: 'boolean (optional) - Get lightweight summary instead',
        },
        response: {
          campaign: 'CampaignPlan object',
          confidence: 'number 0-1',
          processingTime: 'number (ms)',
        },
      },
    },
  });
}


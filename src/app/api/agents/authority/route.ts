// ===== AUTHORITY AGENT API ROUTE =====
// POST /api/agents/authority - Generate authority content, handle objections, competitive positioning

import { NextRequest, NextResponse } from 'next/server';
import { createAgents, validateBrandDNA } from '@/lib/agents';
import { BrandDNA, Platform } from '@/lib/types';
import {
  AuthorityContentType,
  AuthorityPillar,
  TargetAudience,
  ObjectionType,
  CompetitorType,
  EducationalTopic,
  TrustContentFormat,
} from '@/lib/agents/authority.types';
import { getMessagingFrameworkSummary } from '@/lib/agents/authority.agent';

type AuthorityAction =
  | 'generate'
  | 'handle-objection'
  | 'competitive'
  | 'educational'
  | 'trust'
  | 'trend-to-authority'
  | 'get-framework'
  | 'get-objections'
  | 'get-competitors'
  | 'get-educational-topics';

interface AuthorityRequestBody {
  brandDNA: BrandDNA;
  action: AuthorityAction;
  params?: {
    // For generate
    contentType?: AuthorityContentType;
    audience?: TargetAudience;
    pillar?: AuthorityPillar;
    topic?: string;
    platform?: Platform;

    // For handle-objection
    objectionType?: ObjectionType;
    context?: string;
    format?: 'short' | 'detailed' | 'empathetic';

    // For competitive
    competitor?: CompetitorType;
    competitiveFormat?: 'comparison' | 'differentiation' | 'migration-guide';

    // For educational
    educationalTopic?: EducationalTopic;
    depth?: 'beginner' | 'intermediate' | 'advanced';
    educationalFormat?: 'explainer' | 'faq' | 'guide' | 'infographic-script';

    // For trust
    trustFormat?: TrustContentFormat;
    focusPillar?: AuthorityPillar;

    // For trend-to-authority
    trendTopic?: string;
    trendSummary?: string;
    vertical?: string;
    audiences?: TargetAudience[];
    platforms?: Platform[];
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: AuthorityRequestBody = await request.json();
    const { brandDNA, action = 'generate', params = {} } = body;

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
      // ===== GENERATE AUTHORITY CONTENT =====
      case 'generate': {
        const result = await agents.createAuthorityContent({
          contentType: params.contentType || 'thought-leadership',
          audience: params.audience,
          pillar: params.pillar,
          topic: params.topic,
          platform: params.platform,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          content: result.data,
          confidence: result.confidence,
          processingTime: result.processingTime,
        });
      }

      // ===== HANDLE OBJECTION =====
      case 'handle-objection': {
        if (!params.objectionType) {
          return NextResponse.json(
            { error: 'Missing objectionType parameter' },
            { status: 400 }
          );
        }

        const result = await agents.handleCustomerObjection({
          objectionType: params.objectionType,
          context: params.context,
          audience: params.audience,
          format: params.format,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          response: result.data,
          confidence: result.confidence,
          processingTime: result.processingTime,
        });
      }

      // ===== COMPETITIVE CONTENT =====
      case 'competitive': {
        if (!params.competitor) {
          return NextResponse.json(
            { error: 'Missing competitor parameter' },
            { status: 400 }
          );
        }

        const result = await agents.createCompetitiveContent({
          competitor: params.competitor,
          audience: params.audience,
          format: params.competitiveFormat,
          platform: params.platform,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          competitive: result.data,
          confidence: result.confidence,
          processingTime: result.processingTime,
        });
      }

      // ===== EDUCATIONAL CONTENT =====
      case 'educational': {
        if (!params.educationalTopic) {
          return NextResponse.json(
            { error: 'Missing educationalTopic parameter' },
            { status: 400 }
          );
        }

        const result = await agents.createEducationalContent({
          topic: params.educationalTopic,
          audience: params.audience,
          depth: params.depth,
          format: params.educationalFormat,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          educational: result.data,
          confidence: result.confidence,
          processingTime: result.processingTime,
        });
      }

      // ===== TRUST CONTENT =====
      case 'trust': {
        if (!params.trustFormat) {
          return NextResponse.json(
            { error: 'Missing trustFormat parameter' },
            { status: 400 }
          );
        }

        const result = await agents.createTrustContent({
          format: params.trustFormat,
          audience: params.audience,
          platform: params.platform,
          focusPillar: params.focusPillar,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          trust: result.data,
          confidence: result.confidence,
          processingTime: result.processingTime,
        });
      }

      // ===== TREND TO AUTHORITY =====
      case 'trend-to-authority': {
        if (!params.trendTopic || !params.trendSummary) {
          return NextResponse.json(
            { error: 'Missing trendTopic or trendSummary parameter' },
            { status: 400 }
          );
        }

        const result = await agents.trendToAuthority({
          trendTopic: params.trendTopic,
          trendSummary: params.trendSummary,
          vertical: params.vertical,
          audiences: params.audiences,
          platforms: params.platforms,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          authority: result.data,
          confidence: result.confidence,
          processingTime: result.processingTime,
        });
      }

      // ===== GET MESSAGING FRAMEWORK =====
      case 'get-framework': {
        return NextResponse.json({
          framework: agents.getMessagingFramework(),
          processingTime: Date.now() - startTime,
        });
      }

      // ===== GET OBJECTION TYPES =====
      case 'get-objections': {
        return NextResponse.json({
          objections: agents.getObjectionTypes(),
          processingTime: Date.now() - startTime,
        });
      }

      // ===== GET COMPETITOR POSITIONS =====
      case 'get-competitors': {
        return NextResponse.json({
          competitors: agents.getCompetitorPositions(),
          processingTime: Date.now() - startTime,
        });
      }

      // ===== GET EDUCATIONAL TOPICS =====
      case 'get-educational-topics': {
        return NextResponse.json({
          topics: agents.getEducationalTopics(),
          processingTime: Date.now() - startTime,
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action: ${action}`,
            validActions: [
              'generate',
              'handle-objection',
              'competitive',
              'educational',
              'trust',
              'trend-to-authority',
              'get-framework',
              'get-objections',
              'get-competitors',
              'get-educational-topics',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Authority API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Authority operation failed';

    return NextResponse.json(
      {
        error: errorMessage,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET /api/agents/authority - Get agent info and capabilities
export async function GET() {
  const framework = getMessagingFrameworkSummary();

  return NextResponse.json({
    agent: 'authority',
    description:
      'Positions Relique as the trusted authority in RWA collectibles. Generates thought leadership, educational, competitive, and trust-building content.',
    capabilities: [
      'thought-leadership',
      'educational-content',
      'competitive-positioning',
      'objection-handling',
      'trust-building',
      'trend-to-authority',
    ],
    framework: {
      pillars: framework.pillars.map((p) => p.id),
      audiences: framework.audiences.map((a) => a.id),
      objectionTypes: framework.objectionCount,
      competitorProfiles: framework.competitorCount,
    },
    endpoints: {
      'POST /api/agents/authority': {
        description: 'Execute authority operations',
        body: {
          brandDNA: 'BrandDNA object (required)',
          action:
            'generate | handle-objection | competitive | educational | trust | trend-to-authority | get-framework | get-objections | get-competitors | get-educational-topics',
          params: {
            contentType: 'thought-leadership | educational | competitive | trust-building | conversion (for generate)',
            audience: 'collector | trader | seller (optional)',
            pillar: 'security | transparency | liquidity | authenticity (optional)',
            topic: 'string (optional)',
            platform: 'Platform (optional)',
            objectionType: 'trust | complexity | value | control (for handle-objection)',
            context: 'string (optional)',
            format: 'short | detailed | empathetic (optional)',
            competitor: 'ebay | tcgplayer | localshop | courtyard | alt | dibbs (for competitive)',
            competitiveFormat: 'comparison | differentiation | migration-guide (optional)',
            educationalTopic: 'how-vaulting-works | nft-basics | tokenization-explained | ... (for educational)',
            depth: 'beginner | intermediate | advanced (optional)',
            trustFormat: 'vault-tour | security-feature | process-transparency | ... (for trust)',
            trendTopic: 'string (for trend-to-authority)',
            trendSummary: 'string (for trend-to-authority)',
          },
        },
      },
    },
  });
}

// ===== ORCHESTRATION API ROUTE =====
// POST /api/agents/orchestrate - Run multi-agent workflows

import { NextRequest, NextResponse } from 'next/server';
import {
  createAgents,
  validateBrandDNA,
  ContentPerformanceData,
  TCGVertical,
  ResearchTopic,
  TargetAudience,
  AuthorityContentType,
} from '@/lib/agents';
import { BrandDNA, Platform } from '@/lib/types';

type WorkflowType = 'idea-to-campaign-content' | 'analyze-and-improve' | 'research-to-content' | 'research-to-authority-content';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      brandDNA, 
      workflow,
      params,
    } = body as {
      brandDNA: BrandDNA;
      workflow: WorkflowType;
      params: Record<string, unknown>;
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

    if (!workflow) {
      return NextResponse.json(
        {
          error: 'Workflow type is required',
          availableWorkflows: ['idea-to-campaign-content', 'analyze-and-improve', 'research-to-content', 'research-to-authority-content'],
        },
        { status: 400 }
      );
    }

    const agents = createAgents(brandDNA);

    // Workflow 1: Idea → Campaign → Content
    if (workflow === 'idea-to-campaign-content') {
      const { idea, generateContent, contentCount } = params as {
        idea?: string;
        generateContent?: boolean;
        contentCount?: number;
      };

      if (!idea) {
        return NextResponse.json(
          { error: 'Idea is required for idea-to-campaign-content workflow' },
          { status: 400 }
        );
      }

      const result = await agents.ideaToCampaignWithContent(idea, {
        generateContent: generateContent ?? true,
        contentCount: contentCount ?? 5,
      });

      return NextResponse.json({
        workflow: 'idea-to-campaign-content',
        campaign: result.campaign.success ? result.campaign.data : null,
        campaignError: result.campaign.success ? null : result.campaign.error,
        content: result.content?.success ? result.content.data : null,
        contentError: result.content?.success === false ? result.content.error : null,
        confidence: {
          campaign: result.campaign.confidence,
          content: result.content?.confidence,
        },
        processingTime: Date.now() - startTime,
      });
    }

    // Workflow 2: Analyze → Improve
    if (workflow === 'analyze-and-improve') {
      const { performanceData, platforms } = params as {
        performanceData?: ContentPerformanceData[];
        platforms?: Platform[];
      };

      if (!performanceData?.length) {
        return NextResponse.json(
          { error: 'performanceData is required for analyze-and-improve workflow' },
          { status: 400 }
        );
      }

      if (!platforms?.length) {
        return NextResponse.json(
          { error: 'platforms array is required for analyze-and-improve workflow' },
          { status: 400 }
        );
      }

      const result = await agents.analyzeAndImprove(performanceData, platforms);

      return NextResponse.json({
        workflow: 'analyze-and-improve',
        analysis: result.analysis.success ? result.analysis.data : null,
        analysisError: result.analysis.success ? null : result.analysis.error,
        improvedContent: result.improvedContent?.success ? result.improvedContent.data : null,
        improvedContentError: result.improvedContent?.success === false ? result.improvedContent.error : null,
        confidence: {
          analysis: result.analysis.confidence,
          content: result.improvedContent?.confidence,
        },
        processingTime: Date.now() - startTime,
      });
    }

    // Workflow 3: Research → Select → Content
    if (workflow === 'research-to-content') {
      const { verticals, selectedTopics, platforms, contentPerTopic } = params as {
        verticals?: TCGVertical[];
        selectedTopics?: ResearchTopic[];
        platforms?: Platform[];
        contentPerTopic?: number;
      };

      const result = await agents.researchToContent({
        verticals,
        selectedTopics,
        platforms,
        contentPerTopic,
      });

      return NextResponse.json({
        workflow: 'research-to-content',
        research: result.research.success ? result.research.data : null,
        researchError: result.research.success ? null : result.research.error,
        content: result.content?.success ? result.content.data : null,
        contentError: result.content?.success === false ? result.content.error : null,
        confidence: {
          research: result.research.confidence,
          content: result.content?.confidence,
        },
        processingTime: Date.now() - startTime,
      });
    }

    // Workflow 4: Research → Authority → Content
    if (workflow === 'research-to-authority-content') {
      const { verticals, audiences, platforms, contentTypes, maxAnglesPerTopic } = params as {
        verticals?: TCGVertical[];
        audiences?: TargetAudience[];
        platforms?: Platform[];
        contentTypes?: AuthorityContentType[];
        maxAnglesPerTopic?: number;
      };

      const result = await agents.researchToAuthorityContent({
        verticals,
        audiences,
        platforms,
        contentTypes,
        maxAnglesPerTopic,
      });

      return NextResponse.json({
        workflow: 'research-to-authority-content',
        research: result.research.success ? result.research.data : null,
        researchError: result.research.success ? null : result.research.error,
        authorityContent: result.authorityContent,
        workflowStages: result.workflow,
        processingTime: Date.now() - startTime,
      });
    }

    return NextResponse.json(
      {
        error: `Unknown workflow: ${workflow}`,
        availableWorkflows: ['idea-to-campaign-content', 'analyze-and-improve', 'research-to-content', 'research-to-authority-content'],
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Orchestration API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Workflow execution failed';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET /api/agents/orchestrate - Get available workflows
export async function GET() {
  return NextResponse.json({
    description: 'Multi-agent workflow orchestration',
    workflows: {
      'idea-to-campaign-content': {
        description: 'Takes an idea, creates a campaign plan, and generates initial content',
        agents: ['campaign', 'content'],
        params: {
          idea: 'string (required) - Your campaign concept',
          generateContent: 'boolean (optional, default true) - Also generate content',
          contentCount: 'number (optional, default 5) - How many content pieces to generate',
        },
        response: {
          campaign: 'CampaignPlan - The full campaign strategy',
          content: 'ContentBatch - Generated content pieces',
        },
      },
      'analyze-and-improve': {
        description: 'Analyzes performance data and generates improved content based on learnings',
        agents: ['analytics', 'content'],
        params: {
          performanceData: 'ContentPerformanceData[] (required)',
          platforms: 'Platform[] (required) - Platforms to generate improved content for',
        },
        response: {
          analysis: 'AnalyticsReport - Performance analysis with recommendations',
          improvedContent: 'ContentBatch - New content applying learnings',
        },
      },
      'research-to-content': {
        description: 'Researches TCG/collectibles trends and generates content from top topics',
        agents: ['research', 'content'],
        params: {
          verticals: 'TCGVertical[] (optional) - pokemon, mtg, yugioh, sports-cards, collectibles',
          selectedTopics: 'ResearchTopic[] (optional) - Pre-selected topics to skip research step',
          platforms: 'Platform[] (optional) - Platforms to generate content for',
          contentPerTopic: 'number (optional, default 2) - Content pieces per topic',
        },
        response: {
          research: 'ResearchBrief - Aggregated trends and topics',
          content: 'ContentBatch - Generated content pieces',
        },
      },
      'research-to-authority-content': {
        description: 'Researches trends and creates authority positioning content that positions Relique as the expert',
        agents: ['research', 'authority'],
        params: {
          verticals: 'TCGVertical[] (optional) - pokemon, mtg, yugioh, sports-cards, collectibles',
          audiences: 'TargetAudience[] (optional) - collector, trader, seller',
          platforms: 'Platform[] (optional) - Platforms to optimize content for',
          contentTypes: 'AuthorityContentType[] (optional) - thought-leadership, educational, competitive, trust-building',
          maxAnglesPerTopic: 'number (optional, default 2) - Authority angles per trending topic',
        },
        response: {
          research: 'ResearchBrief - Aggregated trends and topics',
          authorityContent: 'AuthorityContent[] - Generated authority content pieces',
          workflowStages: 'Stage status for each workflow step',
        },
      },
    },
    usage: {
      method: 'POST',
      body: {
        brandDNA: 'BrandDNA (required)',
        workflow: 'string (required) - One of the available workflow names',
        params: 'object (required) - Workflow-specific parameters',
      },
    },
  });
}







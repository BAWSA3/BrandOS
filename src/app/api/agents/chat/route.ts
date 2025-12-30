// ===== AGENT CHAT API ROUTE =====
// POST /api/agents/chat - Handle conversational agent interactions

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { 
  createAgents, 
  validateBrandDNA,
  CampaignBrief,
  ContentBrief,
  AnalyticsRequest,
} from '@/lib/agents';
import { agentPersonas, ChatMessage, ChatArtifact } from '@/lib/agents/chat.types';
import { AgentName } from '@/lib/agents/types';
import { BrandDNA, Platform } from '@/lib/types';

interface ChatRequest {
  agentName: AgentName;
  brandId: string;
  brandDNA?: BrandDNA;
  message: string;
  history?: ChatMessage[];
}

// Detect intent from user message
function detectIntent(message: string, agentName: AgentName): {
  action: string;
  params: Record<string, unknown>;
} {
  const lowerMessage = message.toLowerCase();

  if (agentName === 'campaign') {
    if (
      lowerMessage.includes('create') ||
      lowerMessage.includes('plan') ||
      lowerMessage.includes('build') ||
      lowerMessage.includes('launch')
    ) {
      return {
        action: 'create_campaign',
        params: { idea: message },
      };
    }
    if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule')) {
      return {
        action: 'create_calendar',
        params: { idea: message },
      };
    }
  }

  if (agentName === 'content') {
    // Detect platform
    let platform: Platform = 'twitter';
    if (lowerMessage.includes('linkedin')) platform = 'linkedin';
    else if (lowerMessage.includes('instagram')) platform = 'instagram';
    else if (lowerMessage.includes('tiktok')) platform = 'tiktok';
    else if (lowerMessage.includes('email')) platform = 'email';
    else if (lowerMessage.includes('blog')) platform = 'website';

    if (
      lowerMessage.includes('write') ||
      lowerMessage.includes('create') ||
      lowerMessage.includes('draft')
    ) {
      return {
        action: 'create_content',
        params: { topic: message, platform },
      };
    }
    if (lowerMessage.includes('idea') || lowerMessage.includes('suggest')) {
      return {
        action: 'generate_ideas',
        params: { topic: message, platforms: [platform] },
      };
    }
    if (lowerMessage.includes('adapt') || lowerMessage.includes('convert')) {
      return {
        action: 'adapt_content',
        params: { platform },
      };
    }
  }

  if (agentName === 'analytics') {
    if (
      lowerMessage.includes('analyze') ||
      lowerMessage.includes('report') ||
      lowerMessage.includes('performance')
    ) {
      return {
        action: 'analyze',
        params: {},
      };
    }
    if (lowerMessage.includes('compare') || lowerMessage.includes('vs')) {
      return {
        action: 'compare',
        params: {},
      };
    }
  }

  // Default: conversational
  return {
    action: 'chat',
    params: {},
  };
}

// Build conversational prompt
function buildChatPrompt(
  agentName: AgentName,
  brandDNA: BrandDNA,
  message: string,
  history: ChatMessage[]
): string {
  const persona = agentPersonas[agentName];
  
  const historyText = history
    .slice(-6) // Last 6 messages
    .map((m) => `${m.role === 'user' ? 'User' : persona.displayName}: ${m.content}`)
    .join('\n\n');

  return `${persona.systemPrompt}

BRAND CONTEXT:
- Brand Name: ${brandDNA.name}
- Tone Profile: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)
- Keywords: ${brandDNA.keywords.join(', ') || 'None specified'}
- DO: ${brandDNA.doPatterns.join('; ') || 'None specified'}
- DON'T: ${brandDNA.dontPatterns.join('; ') || 'None specified'}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n\n` : ''}USER MESSAGE:
${message}

Respond naturally as ${persona.displayName}. Be helpful, specific, and actionable. If you create something (campaign, content, analysis), provide it in a structured format.

For campaigns, structure as:
- Name, Summary, Objectives, Phases, Content Calendar

For content, provide:
- The actual content ready to use
- Variations if appropriate
- Posting tips

For analytics discussions, reference:
- Specific benchmarks
- Actionable recommendations

Keep responses conversational but valuable.`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { agentName, brandId, brandDNA, message, history = [] } = body as ChatRequest;

    // Validate agent
    if (!agentName || !(agentName in agentPersonas)) {
      return NextResponse.json(
        { error: 'Invalid agent name' },
        { status: 400 }
      );
    }

    // Get brand DNA (from request or would normally fetch from DB)
    let brand = brandDNA;
    if (!brand) {
      // In production, fetch from database using brandId
      // For now, return error
      return NextResponse.json(
        { error: 'Brand DNA is required' },
        { status: 400 }
      );
    }

    if (!validateBrandDNA(brand)) {
      return NextResponse.json(
        { error: 'Invalid brand DNA' },
        { status: 400 }
      );
    }

    // Detect intent
    const { action, params } = detectIntent(message, agentName);

    // Handle specific actions with agents
    const agents = createAgents(brand);
    const artifacts: ChatArtifact[] = [];
    let responseContent = '';

    if (action === 'create_campaign' && agentName === 'campaign') {
      const result = await agents.planCampaign({
        idea: params.idea as string,
      });

      if (result.success && result.data) {
        artifacts.push({
          type: 'campaign-plan',
          title: result.data.name,
          data: result.data,
          expandable: true,
        });
        responseContent = `I've created a campaign plan for you: **${result.data.name}**\n\n${result.data.summary}\n\nThe plan includes ${result.data.phases.length} phases over ${result.data.contentCalendar.length} weeks. Click below to see the full details.`;
      } else {
        responseContent = `I had trouble creating that campaign. ${result.error || 'Could you provide more details about what you're trying to achieve?'}`;
      }
    } else if (action === 'create_content' && agentName === 'content') {
      const result = await agents.createContent({
        type: 'general',
        platform: params.platform as Platform,
        topic: params.topic as string,
      });

      if (result.success && result.data) {
        artifacts.push({
          type: 'content',
          title: `${result.data.platform} Content`,
          data: result.data,
          expandable: true,
        });
        responseContent = `Here's your content for ${result.data.platform}:\n\n---\n${result.data.content}\n---\n\n**Brand alignment: ${result.data.brandAlignmentScore}/100**\n${result.data.brandAlignmentNotes}`;
        
        if (result.data.postingNotes.bestTime) {
          responseContent += `\n\n📅 Best time to post: ${result.data.postingNotes.bestTime}`;
        }
      } else {
        responseContent = `I had trouble creating that content. ${result.error || 'Could you be more specific about what you need?'}`;
      }
    } else if (action === 'generate_ideas' && agentName === 'content') {
      const result = await agents.getContentIdeas(
        params.topic as string,
        params.platforms as Platform[],
        5
      );

      if (result.success && result.data) {
        artifacts.push({
          type: 'content-ideas',
          title: 'Content Ideas',
          data: result.data.ideas,
          expandable: true,
        });
        
        const ideasList = result.data.ideas
          .slice(0, 5)
          .map((idea, i) => `${i + 1}. **${idea.platform}**: "${idea.hook}"\n   _Angle: ${idea.angle}_`)
          .join('\n\n');
        
        responseContent = `Here are some content ideas:\n\n${ideasList}\n\nWant me to develop any of these into full content?`;
      } else {
        responseContent = `I had trouble generating ideas. ${result.error || 'What topic would you like ideas for?'}`;
      }
    } else {
      // Default: conversational response via Claude
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key not configured' },
          { status: 500 }
        );
      }

      const anthropic = new Anthropic({ apiKey });

      const chatResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: buildChatPrompt(agentName, brand, message, history),
          },
        ],
      });

      responseContent = chatResponse.content[0].type === 'text'
        ? chatResponse.content[0].text
        : 'I apologize, but I had trouble processing that request.';
    }

    return NextResponse.json({
      content: responseContent,
      artifacts: artifacts.length > 0 ? artifacts : undefined,
      action,
      confidence: artifacts.length > 0 ? 0.85 : 0.75,
      processingTime: Date.now() - startTime,
    });

  } catch (error) {
    console.error('Agent chat error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Chat failed',
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET - Info about the chat endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/agents/chat',
    description: 'Conversational interface to BrandOS AI agents',
    agents: Object.keys(agentPersonas),
    body: {
      agentName: 'campaign | content | analytics (required)',
      brandId: 'string (required)',
      brandDNA: 'BrandDNA object (required if not fetching from DB)',
      message: 'string (required) - User message',
      history: 'ChatMessage[] (optional) - Previous messages for context',
    },
    response: {
      content: 'string - Agent response',
      artifacts: 'ChatArtifact[] - Structured outputs (campaigns, content, etc.)',
      action: 'string - Detected action taken',
      confidence: 'number - Confidence score',
      processingTime: 'number - Processing time in ms',
    },
  });
}






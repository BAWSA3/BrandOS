// ===== UNIFIED AGENT CHAT API =====
// POST /api/agents/chat/unified - Auto-routing chat that picks the right agent

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { 
  createAgents, 
  validateBrandDNA,
} from '@/lib/agents';
import { routeToAgent, RoutingDecision, getRoutingExplanation } from '@/lib/agents/conductor';
import { agentPersonas, ChatMessage, ChatArtifact } from '@/lib/agents/chat.types';
import { AgentName } from '@/lib/agents/types';
import { BrandDNA, Platform } from '@/lib/types';

interface UnifiedChatRequest {
  brandDNA: BrandDNA;
  brandId: string;
  message: string;
  history?: ChatMessage[];
  currentAgent?: AgentName | null; // For context continuity
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { brandDNA, brandId, message, history = [], currentAgent } = body as UnifiedChatRequest;

    // Validate brand
    if (!validateBrandDNA(brandDNA)) {
      return NextResponse.json(
        { error: 'Invalid brand DNA' },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Route to appropriate agent
    let routing: RoutingDecision;
    
    // If there's a current agent and the message seems like a follow-up, keep the same agent
    if (currentAgent && isFollowUp(message)) {
      routing = {
        agent: currentAgent,
        confidence: 0.9,
        reasoning: 'Continuing conversation with same agent',
        suggestedAction: 'chat',
      };
    } else {
      routing = await routeToAgent(message);
    }

    const agentName = routing.agent;
    const persona = agentPersonas[agentName];
    const agents = createAgents(brandDNA);
    
    let responseContent = '';
    const artifacts: ChatArtifact[] = [];

    // Execute agent action based on routing
    if (routing.suggestedAction === 'create_campaign' || 
        routing.suggestedAction === 'create_launch_campaign' ||
        routing.suggestedAction === 'create_calendar') {
      
      const result = await agents.planCampaign({ idea: message });

      if (result.success && result.data) {
        artifacts.push({
          type: 'campaign-plan',
          title: result.data.name,
          data: result.data,
          expandable: true,
        });
        
        responseContent = `I've created a campaign plan: **${result.data.name}**\n\n${result.data.summary}\n\n`;
        responseContent += `📅 **${result.data.phases.length} phases** over **${result.data.contentCalendar.length} weeks**\n`;
        responseContent += `🎯 Primary objective: ${result.data.objectives.primary}\n\n`;
        responseContent += `Click below to see the full plan with content calendar.`;
      } else {
        responseContent = `I had some trouble creating that campaign. ${result.error || ''}\n\nCould you give me more details about:\n- What you're promoting\n- Your target audience\n- Timeline (if any)`;
      }
    } else if (routing.suggestedAction === 'create_content' || 
               routing.suggestedAction === 'create_thread' ||
               routing.suggestedAction === 'create_email') {
      
      const platform = detectPlatform(message);
      const result = await agents.createContent({
        type: 'general',
        platform,
        topic: message,
      });

      if (result.success && result.data) {
        artifacts.push({
          type: 'content',
          title: `${capitalizeFirst(result.data.platform)} Content`,
          data: result.data,
          expandable: true,
        });

        responseContent = `Here's your ${result.data.platform} content:\n\n---\n${result.data.content}\n---\n\n`;
        responseContent += `**Brand alignment: ${result.data.brandAlignmentScore}/100** — ${result.data.brandAlignmentNotes}\n\n`;
        
        if (result.data.variations && result.data.variations.length > 0) {
          responseContent += `I also have ${result.data.variations.length} alternative versions if you want to A/B test.`;
        }
        
        if (result.data.postingNotes.bestTime) {
          responseContent += `\n\n📅 Best time to post: ${result.data.postingNotes.bestTime}`;
        }
      } else {
        responseContent = `I had trouble creating that content. ${result.error || ''}\n\nWhat platform is this for? And what's the main message you want to convey?`;
      }
    } else if (routing.suggestedAction === 'generate_ideas') {
      const platforms: Platform[] = ['twitter', 'linkedin'];
      const result = await agents.getContentIdeas(message, platforms, 5);

      if (result.success && result.data) {
        artifacts.push({
          type: 'content-ideas',
          title: 'Content Ideas',
          data: result.data.ideas,
          expandable: true,
        });

        responseContent = `Here are some content ideas:\n\n`;
        result.data.ideas.slice(0, 5).forEach((idea, i) => {
          responseContent += `${i + 1}. **${capitalizeFirst(idea.platform)}**: "${idea.hook}"\n   _${idea.angle}_\n\n`;
        });
        responseContent += `Want me to develop any of these into full content?`;
      } else {
        responseContent = `Let me help you brainstorm. What topic or theme would you like content ideas for?`;
      }
    } else if (routing.suggestedAction === 'analyze' || 
               routing.suggestedAction === 'full_report' ||
               routing.suggestedAction === 'compare_periods') {
      // Analytics needs data - ask for it or provide guidance
      responseContent = `I'd love to analyze your content performance! To give you useful insights, I'll need some data.\n\n`;
      responseContent += `You can share:\n`;
      responseContent += `- Impressions, engagements, clicks for recent posts\n`;
      responseContent += `- Which platforms you want to analyze\n`;
      responseContent += `- Time period (last week, last month, etc.)\n\n`;
      responseContent += `Or if you have specific questions like "why is engagement dropping?" or "what content works best?", I can help you think through it even without exact numbers.`;
    } else {
      // Conversational response
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key not configured' },
          { status: 500 }
        );
      }

      const anthropic = new Anthropic({ apiKey });

      const systemPrompt = `${persona.systemPrompt}

BRAND CONTEXT for ${brandDNA.name}:
- Tone: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)
- Keywords: ${brandDNA.keywords.join(', ') || 'None'}
- DO: ${brandDNA.doPatterns.join('; ') || 'None'}
- DON'T: ${brandDNA.dontPatterns.join('; ') || 'None'}

You were selected to handle this request because: ${routing.reasoning}

Respond helpfully as ${persona.displayName}. Be conversational but valuable. If you can create something tangible (campaign, content, analysis), offer to do so.`;

      const historyText = history
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: historyText 
              ? `Previous conversation:\n${historyText}\n\nNew message: ${message}`
              : message,
          },
        ],
      });

      responseContent = response.content[0].type === 'text'
        ? response.content[0].text
        : 'I apologize, but I had trouble processing that.';
    }

    return NextResponse.json({
      content: responseContent,
      agent: agentName,
      routing,
      artifacts: artifacts.length > 0 ? artifacts : undefined,
      confidence: routing.confidence,
      processingTime: Date.now() - startTime,
    });

  } catch (error) {
    console.error('Unified chat error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Chat failed',
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Check if message is a follow-up
function isFollowUp(message: string): boolean {
  const followUpPatterns = [
    /^(yes|yeah|yep|sure|ok|okay|please|do it|go ahead)/i,
    /^(can you|could you|would you)/i,
    /^(what about|how about|and|also)/i,
    /^(more|another|different|alternative)/i,
    /\?$/, // Questions are often follow-ups
  ];
  
  const lowerMessage = message.toLowerCase().trim();
  
  // Short messages are often follow-ups
  if (lowerMessage.split(' ').length <= 5) {
    return followUpPatterns.some(p => p.test(lowerMessage));
  }
  
  return false;
}

// Detect platform from message
function detectPlatform(message: string): Platform {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('linkedin')) return 'linkedin';
  if (lowerMessage.includes('instagram')) return 'instagram';
  if (lowerMessage.includes('tiktok')) return 'tiktok';
  if (lowerMessage.includes('email')) return 'email';
  if (lowerMessage.includes('blog') || lowerMessage.includes('article')) return 'website';
  
  // Default to Twitter for social content
  return 'twitter';
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// GET - Info
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/agents/chat/unified',
    description: 'Unified chat with automatic agent routing',
    body: {
      brandDNA: 'BrandDNA (required)',
      brandId: 'string (required)',
      message: 'string (required)',
      history: 'ChatMessage[] (optional)',
      currentAgent: 'AgentName (optional) - for context continuity',
    },
    response: {
      content: 'string - Agent response',
      agent: 'AgentName - Which agent handled the request',
      routing: 'RoutingDecision - Why this agent was chosen',
      artifacts: 'ChatArtifact[] - Structured outputs',
      confidence: 'number',
      processingTime: 'number',
    },
  });
}







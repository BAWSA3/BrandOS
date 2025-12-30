// ===== CONDUCTOR CHAT API ROUTE =====
// POST /api/conductor/chat - Handle orchestrated agent interactions

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { 
  createAgents, 
  validateBrandDNA,
} from '@/lib/agents';
import { AgentName } from '@/lib/agents/types';
import { agentPersonas, ChatMessage } from '@/lib/agents/chat.types';
import { 
  ConductorMessage,
  IntentClassification,
  IntentType,
  WorkflowPlan,
  WorkflowStep,
  WorkflowType,
  conductorPersona,
  createConductorMessage,
  createWorkflowPlan,
  ConductorArtifact,
} from '@/lib/agents/conductor.types';
import { BrandDNA, Platform } from '@/lib/types';
import { routeToAgent, RoutingDecision } from '@/lib/agents/conductor';

interface ConductorChatRequest {
  brandId: string;
  brandDNA: BrandDNA;
  message: string;
  history?: ConductorMessage[];
  currentWorkflow?: WorkflowPlan | null;
  pendingApproval?: boolean;
}

// ===== INTENT CLASSIFICATION =====

const intentPatterns: Record<IntentType, {
  keywords: string[];
  patterns: RegExp[];
}> = {
  idea: {
    keywords: ['want to add', 'what if', 'let\'s build', 'new feature', 'could we', 'idea'],
    patterns: [/i\s+want\s+to/i, /what\s+if\s+we/i, /let'?s\s+(build|create|add)/i],
  },
  bug: {
    keywords: ['broken', 'not working', 'error', 'bug', 'fix', 'issue', 'problem'],
    patterns: [/is\s+(broken|not\s+working)/i, /doesn'?t\s+work/i, /getting\s+(an?\s+)?error/i],
  },
  question: {
    keywords: ['how does', 'what is', 'where is', 'why', 'explain', 'tell me'],
    patterns: [/how\s+(does|do|can|should)/i, /what\s+(is|are)/i, /where\s+(is|are|can)/i],
  },
  task: {
    keywords: ['update', 'change', 'add', 'remove', 'create', 'make'],
    patterns: [/^(update|change|add|remove|create|make)\s/i, /please\s+(update|change|add)/i],
  },
  exploration: {
    keywords: ['show me', 'find', 'options', 'alternatives', 'research', 'explore'],
    patterns: [/show\s+me/i, /what\s+are\s+(the\s+)?options/i, /find\s+.*/i],
  },
  audit: {
    keywords: ['audit', 'health', 'check', 'review', 'assess'],
    patterns: [/run\s+(an?\s+)?audit/i, /health\s+(check|report)/i],
  },
  campaign: {
    keywords: ['campaign', 'launch', 'marketing', 'promote', 'strategy'],
    patterns: [/create\s+(a\s+)?campaign/i, /marketing\s+strategy/i, /launch\s+plan/i],
  },
  content: {
    keywords: ['write', 'post', 'tweet', 'email', 'content', 'copy', 'draft'],
    patterns: [/write\s+(a\s+|me\s+)?/i, /create\s+(a\s+)?(post|content)/i],
  },
  analytics: {
    keywords: ['analyze', 'performance', 'metrics', 'report', 'insights'],
    patterns: [/analy[sz]e/i, /performance\s+report/i, /how\s+.*(performing|doing)/i],
  },
};

function classifyIntent(message: string): IntentClassification {
  const lowerMessage = message.toLowerCase();
  const scores: Record<IntentType, { score: number; triggers: string[] }> = {} as any;

  // Initialize scores
  for (const intent of Object.keys(intentPatterns) as IntentType[]) {
    scores[intent] = { score: 0, triggers: [] };
  }

  // Score based on keywords and patterns
  for (const [intent, config] of Object.entries(intentPatterns)) {
    for (const keyword of config.keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[intent as IntentType].score += 1;
        scores[intent as IntentType].triggers.push(keyword);
      }
    }
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        scores[intent as IntentType].score += 2;
        scores[intent as IntentType].triggers.push(pattern.source);
      }
    }
  }

  // Find best match
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score);
  
  const [topIntent, topData] = sorted[0];
  const confidence = Math.min(0.95, 0.3 + (topData.score * 0.15));

  // Map intent to workflow
  const workflowMap: Partial<Record<IntentType, WorkflowType>> = {
    idea: 'idea-to-impl',
    campaign: 'idea-to-campaign',
    content: 'content-creation',
    analytics: 'campaign-analytics',
    bug: 'bug-to-fix',
    audit: 'weekly-audit',
    question: 'direct-response',
  };

  return {
    type: topIntent as IntentType,
    confidence,
    triggers: topData.triggers.slice(0, 3),
    suggestedWorkflow: workflowMap[topIntent as IntentType] || null,
  };
}

// ===== WORKFLOW PLANNING =====

function planWorkflow(intent: IntentClassification, message: string): WorkflowPlan | null {
  switch (intent.suggestedWorkflow) {
    case 'idea-to-campaign':
      return createWorkflowPlan(
        'idea-to-campaign',
        'Idea to Campaign',
        'Transform your idea into a full marketing campaign',
        [
          { agentName: 'campaign', action: 'Analyze idea and create campaign strategy' },
          { agentName: 'campaign', action: 'Build content calendar', checkpoint: true },
          { agentName: 'content', action: 'Generate initial content pieces' },
        ]
      );

    case 'content-creation':
      return createWorkflowPlan(
        'content-creation',
        'Content Creation',
        'Create on-brand content for your channels',
        [
          { agentName: 'content', action: 'Create content based on your request' },
        ]
      );

    case 'campaign-analytics':
      return createWorkflowPlan(
        'campaign-analytics',
        'Campaign Analytics',
        'Analyze performance and optimize content',
        [
          { agentName: 'analytics', action: 'Analyze current performance' },
          { agentName: 'content', action: 'Generate improved content based on insights', checkpoint: true },
        ]
      );

    default:
      return null; // Direct response, no workflow needed
  }
}

// ===== AGENT EXECUTION =====

async function executeAgent(
  agentName: AgentName,
  action: string,
  brandDNA: BrandDNA,
  userMessage: string,
  history: ConductorMessage[]
): Promise<{
  success: boolean;
  content: string;
  artifacts?: ConductorArtifact[];
  error?: string;
}> {
  const agents = createAgents(brandDNA);
  const persona = agentPersonas[agentName];

  try {
    if (agentName === 'campaign') {
      const result = await agents.planCampaign({ idea: userMessage });
      if (result.success && result.data) {
        return {
          success: true,
          content: `**${result.data.name}**\n\n${result.data.summary}\n\nThis campaign has ${result.data.phases.length} phases over ${result.data.contentCalendar.length} weeks.`,
          artifacts: [{
            type: 'campaign-plan',
            title: result.data.name,
            data: result.data,
            expandable: true,
          }],
        };
      }
      return { success: false, content: '', error: result.error || 'Campaign planning failed' };
    }

    if (agentName === 'content') {
      // Detect platform from message
      let platform: Platform = 'twitter';
      const lowerMsg = userMessage.toLowerCase();
      if (lowerMsg.includes('linkedin')) platform = 'linkedin';
      else if (lowerMsg.includes('instagram')) platform = 'instagram';
      else if (lowerMsg.includes('email')) platform = 'email';
      else if (lowerMsg.includes('blog')) platform = 'website';

      const result = await agents.createContent({
        type: 'general',
        platform,
        topic: userMessage,
      });
      
      if (result.success && result.data) {
        return {
          success: true,
          content: `**Content for ${result.data.platform}:**\n\n${result.data.content}\n\n*Brand alignment: ${result.data.brandAlignmentScore}/100*`,
          artifacts: [{
            type: 'content',
            title: `${result.data.platform} Content`,
            data: result.data,
            expandable: true,
          }],
        };
      }
      return { success: false, content: '', error: result.error || 'Content creation failed' };
    }

    if (agentName === 'analytics') {
      // For analytics, we'd need actual data - for now return helpful guidance
      return {
        success: true,
        content: `📊 **Analytics Insight**\n\nTo provide detailed analytics, I'd need your performance data. However, here are some general recommendations based on your brand:\n\n1. **Engagement timing**: Post during peak hours for your audience\n2. **Content mix**: Balance promotional (20%) with value-driven content (80%)\n3. **A/B testing**: Test different hooks and CTAs\n4. **Consistency**: Maintain your brand voice across all platforms`,
        artifacts: [{
          type: 'analytics-report',
          title: 'Analytics Recommendations',
          data: { type: 'general_recommendations' },
          expandable: true,
        }],
      };
    }

    return { success: false, content: '', error: 'Unknown agent' };
  } catch (error) {
    return { 
      success: false, 
      content: '', 
      error: error instanceof Error ? error.message : 'Agent execution failed' 
    };
  }
}

// ===== MAIN CHAT HANDLER =====

async function generateConductorResponse(
  message: string,
  brandDNA: BrandDNA,
  history: ConductorMessage[],
  currentWorkflow: WorkflowPlan | null
): Promise<{
  content: string;
  intent?: IntentClassification;
  workflow?: WorkflowPlan;
  artifacts?: ConductorArtifact[];
  agentUsed?: AgentName;
  confidence: number;
}> {
  // Classify intent
  const intent = classifyIntent(message);
  
  // Plan workflow if needed
  let workflow = currentWorkflow;
  if (!workflow && intent.suggestedWorkflow && intent.suggestedWorkflow !== 'direct-response') {
    workflow = planWorkflow(intent, message);
  }

  // Route to appropriate agent
  const routingDecision = await routeToAgent(message);
  
  // Execute agent
  const agentResult = await executeAgent(
    routingDecision.agent,
    routingDecision.suggestedAction,
    brandDNA,
    message,
    history
  );

  if (agentResult.success) {
    const persona = agentPersonas[routingDecision.agent];
    const intro = workflow 
      ? `**Workflow: ${workflow.name}**\n\nI've routed this to ${persona.avatar} **${persona.displayName}** (${persona.title}).\n\n---\n\n`
      : `${persona.avatar} **${persona.displayName}** says:\n\n`;
    
    return {
      content: intro + agentResult.content,
      intent,
      workflow: workflow || undefined,
      artifacts: agentResult.artifacts,
      agentUsed: routingDecision.agent,
      confidence: routingDecision.confidence,
    };
  }

  // Fallback to conversational response
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      content: "I'm having trouble connecting to my AI systems. Please try again in a moment.",
      intent,
      confidence: 0.3,
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const historyContext = history
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : 'Conductor'}: ${m.content}`)
    .join('\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `${conductorPersona.systemPrompt}

BRAND CONTEXT:
- Brand: ${brandDNA.name}
- Tone: Minimal ${brandDNA.tone.minimal}/100, Playful ${brandDNA.tone.playful}/100, Bold ${brandDNA.tone.bold}/100

INTENT DETECTED: ${intent.type} (${Math.round(intent.confidence * 100)}% confidence)
TRIGGERS: ${intent.triggers.join(', ')}

${historyContext ? `RECENT CONVERSATION:\n${historyContext}\n\n` : ''}USER MESSAGE:
${message}

Respond as the Conductor. Be helpful and clear. If you can't fully help, explain which agent would be best and why.`,
    }],
  });

  const responseText = response.content[0].type === 'text' 
    ? response.content[0].text 
    : 'I apologize, but I had trouble processing that request.';

  return {
    content: responseText,
    intent,
    workflow: workflow || undefined,
    confidence: 0.7,
  };
}

// ===== API HANDLERS =====

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { 
      brandId, 
      brandDNA, 
      message, 
      history = [],
      currentWorkflow = null,
      pendingApproval = false,
    } = body as ConductorChatRequest;

    // Validate brand DNA
    if (!brandDNA || !validateBrandDNA(brandDNA)) {
      return NextResponse.json(
        { error: 'Valid Brand DNA is required' },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Handle approval responses
    if (pendingApproval) {
      const lowerMessage = message.toLowerCase().trim();
      if (['yes', 'approve', 'proceed', 'go', 'ok', 'okay'].includes(lowerMessage)) {
        return NextResponse.json({
          content: '✅ Approved! Proceeding with the workflow...',
          approved: true,
          processingTime: Date.now() - startTime,
        });
      } else if (['no', 'cancel', 'stop', 'wait'].includes(lowerMessage)) {
        return NextResponse.json({
          content: '⏸️ Workflow paused. Let me know when you\'d like to continue or if you\'d like to make changes.',
          approved: false,
          processingTime: Date.now() - startTime,
        });
      }
    }

    // Generate response
    const result = await generateConductorResponse(
      message.trim(),
      brandDNA,
      history,
      currentWorkflow
    );

    return NextResponse.json({
      content: result.content,
      intent: result.intent,
      workflow: result.workflow,
      artifacts: result.artifacts,
      agentUsed: result.agentUsed,
      confidence: result.confidence,
      processingTime: Date.now() - startTime,
    });

  } catch (error) {
    console.error('Conductor chat error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Conductor processing failed',
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET - Info about the conductor endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/conductor/chat',
    description: 'Intelligent orchestration layer for BrandOS AI agents',
    conductor: {
      name: conductorPersona.displayName,
      title: conductorPersona.title,
      capabilities: conductorPersona.capabilities,
    },
    intents: Object.keys(intentPatterns),
    workflows: [
      'idea-to-impl',
      'idea-to-campaign', 
      'content-creation',
      'campaign-analytics',
      'bug-to-fix',
      'weekly-audit',
      'direct-response',
    ],
    agents: ['campaign', 'content', 'analytics'],
    usage: {
      method: 'POST',
      body: {
        brandId: 'string (required)',
        brandDNA: 'BrandDNA object (required)',
        message: 'string (required)',
        history: 'ConductorMessage[] (optional)',
        currentWorkflow: 'WorkflowPlan | null (optional)',
        pendingApproval: 'boolean (optional)',
      },
    },
  });
}





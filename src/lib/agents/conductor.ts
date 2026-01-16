// ===== CONDUCTOR - INTELLIGENT AGENT ROUTING =====
// Analyzes user prompts and routes to the appropriate agent

import Anthropic from '@anthropic-ai/sdk';
import { AgentName } from './types';
import { agentPersonas } from './chat.types';

export interface RoutingDecision {
  agent: AgentName;
  confidence: number;
  reasoning: string;
  suggestedAction: string;
}

// Keywords and patterns for quick routing (no AI needed)
const routingPatterns: Record<AgentName, {
  keywords: string[];
  patterns: RegExp[];
}> = {
  campaign: {
    keywords: [
      'campaign', 'launch', 'strategy', 'calendar', 'plan', 'marketing',
      'promote', 'promotion', 'roadmap', 'timeline', 'phases', 'objectives',
      'target audience', 'messaging', 'go-to-market', 'gtm', 'awareness',
    ],
    patterns: [
      /create\s+(a\s+)?campaign/i,
      /plan\s+(a\s+|the\s+)?launch/i,
      /marketing\s+strategy/i,
      /content\s+calendar/i,
      /how\s+(should|can)\s+(we|i)\s+(market|promote)/i,
    ],
  },
  content: {
    keywords: [
      'write', 'draft', 'post', 'tweet', 'thread', 'caption', 'copy',
      'email', 'subject line', 'headline', 'tagline', 'blog', 'article',
      'linkedin', 'instagram', 'tiktok', 'twitter', 'social',
    ],
    patterns: [
      /write\s+(a\s+|me\s+)?/i,
      /create\s+(a\s+)?(post|tweet|thread|email|caption)/i,
      /draft\s+(a\s+|an\s+)?/i,
      /(twitter|linkedin|instagram|tiktok)\s+(post|thread|content)/i,
      /give\s+me\s+.*(copy|content|post)/i,
    ],
  },
  analytics: {
    keywords: [
      'analyze', 'analysis', 'performance', 'metrics', 'data', 'report',
      'engagement', 'impressions', 'clicks', 'conversion', 'roi',
      'working', 'improve', 'optimize', 'benchmark', 'compare',
      'insight', 'why', 'dropping', 'increasing',
    ],
    patterns: [
      /analy[sz]e\s+(my|our|the)/i,
      /how\s+(is|are)\s+.*(performing|doing)/i,
      /what('s|\s+is)\s+working/i,
      /why\s+(is|are)\s+.*(dropping|low|down|decreasing)/i,
      /performance\s+(report|analysis)/i,
      /what\s+should\s+(i|we)\s+(do|change|improve)/i,
    ],
  },
  research: {
    keywords: [
      'research', 'trends', 'trending', 'news', 'latest', 'hot', 'buzz',
      'tcg', 'pokemon', 'magic', 'mtg', 'yugioh', 'sports cards', 'collectibles',
      'community', 'reddit', 'twitter', 'youtube', 'market', 'prices',
      'drops', 'releases', 'set', 'grading', 'psa', 'bgs', 'what\'s new',
      'find topics', 'content ideas', 'based on trends',
    ],
    patterns: [
      /what('s|\s+is)\s+(trending|hot|new)/i,
      /(find|get|show)\s+(me\s+)?.*(trends|news|topics)/i,
      /research\s+(topics?|trends?|news)/i,
      /latest\s+(news|trends|releases|drops)/i,
      /create\s+content\s+.*(trends|news|latest)/i,
      /(pokemon|mtg|yugioh|sports\s*cards?)\s+(news|trends|updates)/i,
      /what\s+are\s+people\s+talking\s+about/i,
      /content\s+(ideas?|topics?)\s+(from|based)/i,
    ],
  },
  authority: {
    keywords: [
      'authority', 'positioning', 'thought leadership', 'expert', 'position',
      'objection', 'competitor', 'vs', 'versus', 'compare', 'comparison',
      'why relique', 'trust', 'security', 'vault', 'vaulting', 'tokenization',
      'nft', 'how does relique', 'better than', 'educational', 'explain',
      'ebay', 'tcgplayer', 'courtyard', 'alt', 'dibbs',
      'collector', 'trader', 'seller', 'audience',
      'proof', 'differentiate', 'advantage', 'benefit',
    ],
    patterns: [
      /why\s+(should|would)\s+(i|we|they)\s+(use|choose|trust)\s+relique/i,
      /(what|how)\s+(makes|is)\s+relique\s+(different|better|unique)/i,
      /relique\s+vs\s+/i,
      /vs\s+(ebay|tcgplayer|courtyard|alt|dibbs)/i,
      /handle\s+(an?\s+)?objection/i,
      /respond\s+to\s+.*(concern|objection|question)/i,
      /(explain|how\s+does)\s+(vaulting|tokenization|nft)/i,
      /position\s+(relique|us|ourselves)/i,
      /thought\s+leadership/i,
      /trust\s+(building|content)/i,
      /educational\s+(content|post|article)/i,
      /competitive\s+(content|positioning|comparison)/i,
    ],
  },
};

/**
 * Fast pattern-based routing (no AI call)
 */
export function quickRoute(message: string): RoutingDecision | null {
  const lowerMessage = message.toLowerCase();

  const scores: Record<AgentName, number> = {
    campaign: 0,
    content: 0,
    analytics: 0,
    research: 0,
    authority: 0,
  };

  // Score based on keywords
  for (const [agent, config] of Object.entries(routingPatterns)) {
    for (const keyword of config.keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[agent as AgentName] += 1;
      }
    }
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        scores[agent as AgentName] += 3; // Patterns are stronger signals
      }
    }
  }

  // Find winner
  const entries = Object.entries(scores) as [AgentName, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [topAgent, topScore] = sorted[0];
  const [, secondScore] = sorted[1];

  // Need clear winner with reasonable confidence
  if (topScore >= 3 && topScore > secondScore * 1.5) {
    return {
      agent: topAgent,
      confidence: Math.min(0.9, 0.5 + (topScore * 0.1)),
      reasoning: `Detected ${topAgent}-related keywords and patterns`,
      suggestedAction: getSuggestedAction(topAgent, message),
    };
  }

  return null; // Ambiguous, need AI routing
}

/**
 * AI-powered routing for ambiguous cases
 */
export async function smartRoute(message: string): Promise<RoutingDecision> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    // Fallback to content as default
    return {
      agent: 'content',
      confidence: 0.5,
      reasoning: 'API unavailable, defaulting to content agent',
      suggestedAction: 'general_help',
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `You are a routing system. Analyze this user message and decide which AI agent should handle it.

AVAILABLE AGENTS:
1. campaign - Marketing Strategist: Creates campaign plans, content calendars, marketing strategies, launch plans
2. content - Creative Writer: Writes social posts, emails, headlines, adapts content across platforms
3. analytics - Performance Analyst: Analyzes metrics, identifies patterns, provides optimization recommendations
4. research - Trends Researcher: Aggregates TCG/collectibles news from social media, Reddit, YouTube. Finds trending topics for content creation.
5. authority - Brand Authority Expert: Creates thought leadership, educational content, handles objections, competitive positioning for Relique. Positions the brand as a trusted expert in RWA collectibles.

USER MESSAGE:
"${message}"

Which agent is best suited? Return ONLY valid JSON:
{
  "agent": "campaign" | "content" | "analytics" | "research" | "authority",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation",
  "suggestedAction": "What the agent should do"
}`,
        },
      ],
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const decision = JSON.parse(jsonMatch[0]) as RoutingDecision;
      // Validate agent name
      if (['campaign', 'content', 'analytics', 'research', 'authority'].includes(decision.agent)) {
        return decision;
      }
    }
  } catch (error) {
    console.error('Smart routing error:', error);
  }

  // Fallback
  return {
    agent: 'content',
    confidence: 0.5,
    reasoning: 'Could not determine intent, defaulting to content agent',
    suggestedAction: 'general_help',
  };
}

/**
 * Main routing function - tries quick route first, falls back to AI
 */
export async function routeToAgent(message: string): Promise<RoutingDecision> {
  // Try quick pattern matching first
  const quickDecision = quickRoute(message);
  if (quickDecision && quickDecision.confidence >= 0.7) {
    return quickDecision;
  }

  // Fall back to AI routing
  return smartRoute(message);
}

/**
 * Get suggested action based on agent and message
 */
function getSuggestedAction(agent: AgentName, message: string): string {
  const lowerMessage = message.toLowerCase();

  if (agent === 'campaign') {
    if (lowerMessage.includes('calendar')) return 'create_calendar';
    if (lowerMessage.includes('launch')) return 'create_launch_campaign';
    return 'create_campaign';
  }

  if (agent === 'content') {
    if (lowerMessage.includes('thread')) return 'create_thread';
    if (lowerMessage.includes('email')) return 'create_email';
    if (lowerMessage.includes('idea')) return 'generate_ideas';
    if (lowerMessage.includes('adapt') || lowerMessage.includes('convert')) return 'adapt_content';
    return 'create_content';
  }

  if (agent === 'analytics') {
    if (lowerMessage.includes('compare')) return 'compare_periods';
    if (lowerMessage.includes('report')) return 'full_report';
    return 'analyze';
  }

  if (agent === 'research') {
    if (lowerMessage.includes('pokemon')) return 'research_pokemon';
    if (lowerMessage.includes('mtg') || lowerMessage.includes('magic')) return 'research_mtg';
    if (lowerMessage.includes('yugioh')) return 'research_yugioh';
    if (lowerMessage.includes('sports')) return 'research_sports_cards';
    if (lowerMessage.includes('content') && lowerMessage.includes('trend')) return 'research_to_content';
    if (lowerMessage.includes('summary')) return 'quick_summary';
    return 'aggregate_trends';
  }

  if (agent === 'authority') {
    if (lowerMessage.includes('objection')) return 'handle_objection';
    if (lowerMessage.includes('vs') || lowerMessage.includes('versus') || lowerMessage.includes('compare')) return 'competitive_content';
    if (lowerMessage.includes('educational') || lowerMessage.includes('explain')) return 'educational_content';
    if (lowerMessage.includes('trust') || lowerMessage.includes('vault')) return 'trust_content';
    if (lowerMessage.includes('thought leadership')) return 'thought_leadership';
    if (lowerMessage.includes('ebay')) return 'compare_ebay';
    if (lowerMessage.includes('tcgplayer')) return 'compare_tcgplayer';
    if (lowerMessage.includes('courtyard')) return 'compare_courtyard';
    return 'authority_content';
  }

  return 'chat';
}

/**
 * Get routing explanation for UI
 */
export function getRoutingExplanation(decision: RoutingDecision): string {
  const persona = agentPersonas[decision.agent];
  
  if (decision.confidence >= 0.8) {
    return `Routing to ${persona.displayName} (${persona.title})`;
  } else if (decision.confidence >= 0.6) {
    return `I think ${persona.displayName} can help with this`;
  } else {
    return `Trying ${persona.displayName} for this request`;
  }
}







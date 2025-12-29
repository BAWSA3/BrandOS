// ===== CAMPAIGN AGENT =====
// Transforms ideas into actionable marketing campaign plans

import Anthropic from '@anthropic-ai/sdk';
import { BrandDNA } from '@/lib/types';
import { 
  AgentContext, 
  AgentResponse, 
  CampaignBrief, 
  CampaignPlan 
} from './types';

// Build the campaign planning prompt
function buildCampaignPrompt(brand: BrandDNA, brief: CampaignBrief): string {
  return `You are a marketing strategist creating a campaign plan for "${brand.name}".

BRAND DNA:
- Name: ${brand.name}
- Tone Profile:
  - Minimal: ${brand.tone.minimal}/100 (higher = cleaner, simpler aesthetic)
  - Playful: ${brand.tone.playful}/100 (higher = more fun, casual)
  - Bold: ${brand.tone.bold}/100 (higher = more confident, impactful)
  - Experimental: ${brand.tone.experimental}/100 (higher = more innovative, edgy)
- Brand Keywords: ${brand.keywords.join(', ') || 'None specified'}
- DO patterns: ${brand.doPatterns.join('; ') || 'None specified'}
- DON'T patterns: ${brand.dontPatterns.join('; ') || 'None specified'}
- Voice Samples: ${brand.voiceSamples.length > 0 ? brand.voiceSamples.join(' | ') : 'None provided'}

CAMPAIGN BRIEF:
- Idea/Concept: ${brief.idea}
- Objective: ${brief.objective || 'Not specified - recommend the most appropriate one'}
- Target Audience: ${brief.targetAudience || 'Not specified - recommend based on the idea'}
- Timeline: ${brief.timeline || 'Flexible - recommend 4-6 weeks'}
- Channels: ${brief.channels?.join(', ') || 'Recommend based on audience and objectives'}
- Budget Level: ${brief.budget || 'minimal'}

Create a comprehensive marketing campaign plan that:
1. Perfectly aligns with the brand's tone and voice
2. Has clear, measurable objectives with specific targets
3. Includes a phased approach:
   - Phase 1: Awareness (build interest)
   - Phase 2: Education (explain value)
   - Phase 3: Activation (drive action)
   - Phase 4: Sustain (maintain momentum)
4. Provides a detailed week-by-week content calendar
5. Defines success metrics that can actually be tracked

The campaign should feel authentic to this brand. Use the tone profile to guide messaging:
- If minimal is high: Keep messaging clean, direct, no fluff
- If playful is high: Add personality, wit, conversational elements
- If bold is high: Make strong statements, be confident, take stands
- If experimental is high: Try unconventional approaches, be creative

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "name": "Campaign Name (creative, memorable)",
  "summary": "2-3 sentence campaign summary capturing the core concept and approach",
  "objectives": {
    "primary": "Main measurable goal",
    "secondary": ["Supporting goal 1", "Supporting goal 2"],
    "metrics": [
      { "name": "Metric name", "target": "Specific target (e.g., '1,000 visits')" }
    ]
  },
  "targetAudience": {
    "primary": {
      "description": "Detailed description of primary audience",
      "painPoints": ["Pain point 1", "Pain point 2", "Pain point 3"]
    },
    "secondary": {
      "description": "Secondary audience description",
      "painPoints": ["Pain point 1", "Pain point 2"]
    }
  },
  "keyMessages": {
    "primary": "The core message/value proposition",
    "supporting": ["Supporting message 1", "Supporting message 2", "Supporting message 3"]
  },
  "phases": [
    {
      "name": "Phase name",
      "duration": "Week range (e.g., 'Week 1-2')",
      "goal": "What this phase achieves",
      "tactics": ["Tactic 1", "Tactic 2", "Tactic 3"],
      "contentPieces": [
        { "platform": "twitter", "type": "social-twitter", "description": "Content description" }
      ]
    }
  ],
  "contentCalendar": [
    {
      "week": 1,
      "items": [
        {
          "day": "Monday",
          "platform": "twitter",
          "contentType": "Thread",
          "description": "What this content covers",
          "status": "planned"
        }
      ]
    }
  ],
  "successMetrics": [
    {
      "metric": "Metric name",
      "target": "Specific target",
      "measurement": "How to track this"
    }
  ]
}`;
}

// Parse and validate campaign plan from AI response
function parseCampaignPlan(responseText: string): CampaignPlan | null {
  try {
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.name || !parsed.summary || !parsed.phases) {
      return null;
    }
    
    return parsed as CampaignPlan;
  } catch {
    return null;
  }
}

/**
 * Create a marketing campaign plan from a brief
 */
export async function createCampaignPlan(
  context: AgentContext,
  brief: CampaignBrief
): Promise<AgentResponse<CampaignPlan>> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    // Validate input
    if (!context.brandDNA?.name) {
      return {
        success: false,
        error: 'Brand DNA is required',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    if (!brief.idea || brief.idea.trim().length === 0) {
      return {
        success: false,
        error: 'Campaign idea is required',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: buildCampaignPrompt(context.brandDNA, brief),
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    const campaignPlan = parseCampaignPlan(responseText);
    
    if (!campaignPlan) {
      return {
        success: false,
        error: 'Failed to parse campaign plan from AI response',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    // Calculate confidence based on completeness
    let confidence = 0.7; // Base confidence
    if (campaignPlan.phases.length >= 3) confidence += 0.1;
    if (campaignPlan.contentCalendar.length >= 2) confidence += 0.1;
    if (campaignPlan.successMetrics.length >= 3) confidence += 0.1;

    return {
      success: true,
      data: campaignPlan,
      confidence: Math.min(confidence, 0.95),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Campaign agent error:', error);
    
    let errorMessage = 'Campaign planning failed';
    if (error instanceof Error) {
      if (error.message.includes('credit balance is too low')) {
        errorMessage = 'API credits depleted. Please check your Anthropic account.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Quick campaign summary - lighter weight version for previews
 */
export async function getCampaignSummary(
  context: AgentContext,
  idea: string
): Promise<AgentResponse<{ name: string; summary: string; suggestedChannels: string[] }>> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are a marketing strategist. Given this campaign idea for the brand "${context.brandDNA.name}", provide a quick summary.

Idea: ${idea}

Return ONLY valid JSON:
{
  "name": "Creative campaign name",
  "summary": "2-3 sentence summary of the campaign approach",
  "suggestedChannels": ["channel1", "channel2", "channel3"]
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Failed to parse summary',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const summary = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: summary,
      confidence: 0.8,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Summary generation failed',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}


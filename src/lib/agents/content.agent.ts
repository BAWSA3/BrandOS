// ===== CONTENT AGENT =====
// Generates platform-specific, on-brand content

import Anthropic from '@anthropic-ai/sdk';
import { BrandDNA, Platform } from '@/lib/types';
import { summarizeFingerprint, formatSummaryForPrompt } from '@/lib/voice-fingerprint';
import {
  AgentContext,
  AgentResponse,
  ContentBrief,
  GeneratedContent,
  ContentBatch
} from './types';

// Platform-specific guidelines
interface PlatformGuidelines {
  maxLength: number;
  style: string;
  tips: string;
  hashtagStrategy: string;
}

const platformGuidelines: Record<Platform | 'default', PlatformGuidelines> = {
  twitter: {
    maxLength: 280,
    style: 'Punchy, conversational, thread-friendly. Strong hooks that stop the scroll.',
    tips: 'Use threads for depth. Put the hook in the first tweet. Add hashtags in a reply, not the main post.',
    hashtagStrategy: '1-2 max in reply tweet, not main content',
  },
  linkedin: {
    maxLength: 3000,
    style: 'Professional yet personal. Story-driven. Thought leadership focused.',
    tips: 'Start with a hook line. Use line breaks liberally. Personal stories outperform corporate speak. End with a soft CTA or question.',
    hashtagStrategy: '3-5 relevant hashtags at the end',
  },
  instagram: {
    maxLength: 2200,
    style: 'Visual-first, authentic, aspirational. The caption supports the image.',
    tips: 'Front-load the key message. Use emojis strategically. Line breaks create breathing room.',
    hashtagStrategy: '15-25 hashtags, mix of broad and niche',
  },
  tiktok: {
    maxLength: 4000,
    style: 'Trend-aware, authentic, Gen-Z fluent. Hook in the first 3 seconds.',
    tips: 'Pattern interrupts work. Native slang is fine. Controversy drives engagement.',
    hashtagStrategy: '3-5 trending + niche hashtags',
  },
  email: {
    maxLength: 5000,
    style: 'Personal, value-focused, scannable. Write like you\'re talking to one person.',
    tips: 'Subject line is 80% of the battle. One clear CTA per email. Scannable with headers and bullets.',
    hashtagStrategy: 'N/A',
  },
  website: {
    maxLength: 10000,
    style: 'SEO-aware, scannable, structured. Clear hierarchy and CTAs.',
    tips: 'Use headers for structure. Write for featured snippets. Include internal links.',
    hashtagStrategy: 'N/A',
  },
  default: {
    maxLength: 3000,
    style: 'Clear, on-brand, appropriate for the context.',
    tips: 'Match the brand voice. Be concise. Include a clear CTA.',
    hashtagStrategy: 'Use sparingly if at all',
  },
};

// Build the content generation prompt
function buildContentPrompt(brand: BrandDNA, brief: ContentBrief, context?: AgentContext): string {
  const guidelines = platformGuidelines[brief.platform] || platformGuidelines.default;
  
  // Calculate tone descriptors based on brand values
  const toneDescriptors: string[] = [];
  if (brand.tone.minimal >= 70) toneDescriptors.push('clean and direct');
  if (brand.tone.minimal <= 30) toneDescriptors.push('rich and detailed');
  if (brand.tone.playful >= 70) toneDescriptors.push('fun and conversational');
  if (brand.tone.playful <= 30) toneDescriptors.push('serious and professional');
  if (brand.tone.bold >= 70) toneDescriptors.push('confident and impactful');
  if (brand.tone.bold <= 30) toneDescriptors.push('subtle and understated');
  if (brand.tone.experimental >= 70) toneDescriptors.push('innovative and edgy');
  if (brand.tone.experimental <= 30) toneDescriptors.push('classic and reliable');
  
  const toneDescription = toneDescriptors.length > 0 
    ? toneDescriptors.join(', ')
    : 'balanced and professional';

  return `You are a content creator writing for "${brand.name}".

BRAND DNA:
- Name: ${brand.name}
- Overall Voice: ${toneDescription}
- Tone Profile:
  - Minimal: ${brand.tone.minimal}/100
  - Playful: ${brand.tone.playful}/100
  - Bold: ${brand.tone.bold}/100
  - Experimental: ${brand.tone.experimental}/100
- Brand Keywords: ${brand.keywords.join(', ') || 'None specified'}
- Voice Samples: ${brand.voiceSamples.length > 0 ? brand.voiceSamples.join(' | ') : 'None provided'}
- DO: ${brand.doPatterns.join('; ') || 'None specified'}
- DON'T: ${brand.dontPatterns.join('; ') || 'None specified'}

CONTENT BRIEF:
- Platform: ${brief.platform}
- Content Type: ${brief.type}
- Topic: ${brief.topic}
- Key Message: ${brief.keyMessage || 'Derive the key message from the topic'}
- Call to Action: ${brief.cta || 'Use an appropriate CTA for the platform'}
- Tone Override: ${brief.tone || 'default (use brand tone)'}
- Length Preference: ${brief.length || 'medium'}
- Include Hashtags: ${brief.includeHashtags !== false ? 'Yes' : 'No'}
${brief.campaignContext ? `- Campaign Context: ${brief.campaignContext}` : ''}

PLATFORM GUIDELINES for ${brief.platform}:
- Maximum Length: ${guidelines.maxLength} characters
- Style: ${guidelines.style}
- Tips: ${guidelines.tips}
- Hashtag Strategy: ${guidelines.hashtagStrategy}

CRITICAL REQUIREMENTS:
1. The content MUST sound like ${brand.name}, not generic marketing
2. Use the brand's actual voice - reference the tone profile and voice samples
3. Create a hook that stops the scroll
4. Include a clear CTA appropriate for the platform
5. Stay within the platform's character limits
6. The content should pass the "would a human actually engage with this?" test

AVOID:
- Generic corporate speak ("We're excited to announce...")
- Overuse of superlatives without substance
- Content that sounds AI-generated
- Weak or missing CTAs
- Burying the value below the fold
${context?.voiceFingerprint ? `
${formatSummaryForPrompt(summarizeFingerprint(context.voiceFingerprint))}

CRITICAL: Match the creator's actual voice. If any phrase sounds like "ChatGPT wrote this", rewrite it.` : ''}

Return ONLY valid JSON:
{
  "platform": "${brief.platform}",
  "contentType": "${brief.type}",
  "content": "The actual content here - ready to copy and paste. Include line breaks as \\n",
  "variations": [
    "Alternative version 1 with a different angle",
    "Alternative version 2 with a different hook"
  ],
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "postingNotes": {
    "bestTime": "Recommended posting time (e.g., 'Tuesday 9am EST')",
    "mediaNeeded": ["Description of image/video needed", "Second media option"],
    "ctaTracking": "UTM suggestion or tracking recommendation"
  },
  "brandAlignmentScore": 85,
  "brandAlignmentNotes": "Brief explanation of how this content matches the brand voice and what elements make it on-brand"
}`;
}

// Parse content response
function parseGeneratedContent(responseText: string): GeneratedContent | null {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.content || !parsed.platform) return null;
    
    return parsed as GeneratedContent;
  } catch {
    return null;
  }
}

/**
 * Generate a single piece of content
 */
export async function generateContent(
  context: AgentContext,
  brief: ContentBrief
): Promise<AgentResponse<GeneratedContent>> {
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

    if (!brief.topic || brief.topic.trim().length === 0) {
      return {
        success: false,
        error: 'Content topic is required',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: buildContentPrompt(context.brandDNA, brief, context),
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    const generatedContent = parseGeneratedContent(responseText);
    
    if (!generatedContent) {
      return {
        success: false,
        error: 'Failed to parse generated content',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    return {
      success: true,
      data: generatedContent,
      confidence: generatedContent.brandAlignmentScore / 100,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Content agent error:', error);
    
    let errorMessage = 'Content generation failed';
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
 * Generate multiple pieces of content in batch
 */
export async function generateContentBatch(
  context: AgentContext,
  briefs: ContentBrief[]
): Promise<AgentResponse<ContentBatch>> {
  const startTime = Date.now();
  
  if (briefs.length === 0) {
    return {
      success: false,
      error: 'At least one content brief is required',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }

  const pieces: GeneratedContent[] = [];
  const errors: string[] = [];
  
  // Generate content sequentially to avoid rate limits
  for (const brief of briefs) {
    const result = await generateContent(context, brief);
    if (result.success && result.data) {
      pieces.push(result.data);
    } else if (result.error) {
      errors.push(`${brief.platform}/${brief.type}: ${result.error}`);
    }
  }

  if (pieces.length === 0) {
    return {
      success: false,
      error: `All content generation failed: ${errors.join('; ')}`,
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }

  const platforms = [...new Set(pieces.map(p => p.platform))];
  const avgScore = pieces.reduce((sum, p) => sum + p.brandAlignmentScore, 0) / pieces.length;

  return {
    success: true,
    data: {
      pieces,
      summary: {
        totalPieces: pieces.length,
        platforms,
        averageBrandScore: Math.round(avgScore),
      },
    },
    confidence: avgScore / 100,
    processingTime: Date.now() - startTime,
  };
}

/**
 * Adapt existing content for a different platform
 */
export async function adaptContentForPlatform(
  context: AgentContext,
  originalContent: string,
  originalPlatform: Platform,
  targetPlatform: Platform
): Promise<AgentResponse<GeneratedContent>> {
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

    const targetGuidelines = platformGuidelines[targetPlatform] || platformGuidelines.default;

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are adapting content from ${originalPlatform} to ${targetPlatform} for "${context.brandDNA.name}".

ORIGINAL CONTENT (from ${originalPlatform}):
${originalContent}

TARGET PLATFORM: ${targetPlatform}
- Max Length: ${targetGuidelines.maxLength} characters
- Style: ${targetGuidelines.style}
- Tips: ${targetGuidelines.tips}

BRAND VOICE:
- Tone: Minimal (${context.brandDNA.tone.minimal}/100), Playful (${context.brandDNA.tone.playful}/100), Bold (${context.brandDNA.tone.bold}/100), Experimental (${context.brandDNA.tone.experimental}/100)

Adapt this content for ${targetPlatform} while maintaining the core message and brand voice.

Return ONLY valid JSON:
{
  "platform": "${targetPlatform}",
  "contentType": "general",
  "content": "The adapted content here",
  "variations": ["Alternative adaptation"],
  "hashtags": ["hashtag1", "hashtag2"],
  "postingNotes": {
    "bestTime": "Recommended time",
    "mediaNeeded": ["Media suggestions"],
    "ctaTracking": "UTM suggestion"
  },
  "brandAlignmentScore": 85,
  "brandAlignmentNotes": "How this maintains brand consistency"
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    const adaptedContent = parseGeneratedContent(responseText);
    
    if (!adaptedContent) {
      return {
        success: false,
        error: 'Failed to parse adapted content',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    return {
      success: true,
      data: adaptedContent,
      confidence: adaptedContent.brandAlignmentScore / 100,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Content adaptation failed',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Generate content ideas for a topic (lighter weight than full content)
 */
export async function generateContentIdeas(
  context: AgentContext,
  topic: string,
  platforms: Platform[],
  count: number = 5
): Promise<AgentResponse<{ ideas: { platform: Platform; hook: string; angle: string }[] }>> {
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
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Generate ${count} content ideas for "${context.brandDNA.name}" about: ${topic}

Target platforms: ${platforms.join(', ')}

Brand tone: Minimal (${context.brandDNA.tone.minimal}/100), Playful (${context.brandDNA.tone.playful}/100), Bold (${context.brandDNA.tone.bold}/100), Experimental (${context.brandDNA.tone.experimental}/100)

Return ONLY valid JSON:
{
  "ideas": [
    { "platform": "twitter", "hook": "Opening hook/first line", "angle": "The unique angle or approach" }
  ]
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
        error: 'Failed to parse content ideas',
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    const ideas = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: ideas,
      confidence: 0.8,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Idea generation failed',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}







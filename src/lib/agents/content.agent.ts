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
import {
  ContentEngineConfig,
  ContentEngineRequest,
  ContentEngineOutput,
} from './content-engine.types';

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
  youtube: {
    maxLength: 5000,
    style: 'Descriptive, keyword-rich, value-packed. Optimize for search and watch time.',
    tips: 'Front-load keywords in title. Use timestamps for long videos. Compelling thumbnail copy.',
    hashtagStrategy: '3-5 relevant hashtags in description',
  },
  threads: {
    maxLength: 500,
    style: 'Conversational, authentic, community-first. Less polished, more real.',
    tips: 'Be genuine. Short paragraphs. Engage in replies. Skip the hashtag overload.',
    hashtagStrategy: '0-2 hashtags max',
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

// ===== CONTENT ENGINE (SCHEDULED CONTENT GENERATION) =====

function buildScheduledContentSystemPrompt(
  brand: BrandDNA,
  config: ContentEngineConfig,
  request: ContentEngineRequest,
  context?: AgentContext
): string {
  const daySchedule = config.schedule[request.day];
  const dayCTA = config.ctaRotation[request.day];
  const slotConfig = request.slot === 'post1' ? daySchedule.post1 : daySchedule.post2;
  const ctaType = request.slot === 'post1' ? dayCTA.post1 : dayCTA.post2;
  const slotLabel = request.slot === 'post1' ? 'Post 1 (Anchor)' : 'Post 2 (Lighter)';

  // Build tone descriptors from brand DNA
  const toneDescriptors: string[] = [];
  if (brand.tone.minimal >= 70) toneDescriptors.push('clean and direct');
  if (brand.tone.minimal <= 30) toneDescriptors.push('rich and detailed');
  if (brand.tone.playful >= 70) toneDescriptors.push('fun and conversational');
  if (brand.tone.playful <= 30) toneDescriptors.push('serious and professional');
  if (brand.tone.bold >= 70) toneDescriptors.push('confident and impactful');
  if (brand.tone.bold <= 30) toneDescriptors.push('subtle and understated');
  if (brand.tone.experimental >= 70) toneDescriptors.push('innovative and edgy');
  if (brand.tone.experimental <= 30) toneDescriptors.push('classic and reliable');
  const toneStr = toneDescriptors.length > 0 ? toneDescriptors.join(', ') : 'balanced and professional';

  // Engagement context section
  const eng = config.engagement;
  const engLines: string[] = [];
  if (eng.followerCount) engLines.push(`- Current followers: ${eng.followerCount.toLocaleString()}`);
  if (eng.followerTarget) {
    const targetLine = eng.targetDate
      ? `- Target: ${eng.followerTarget.toLocaleString()} by ${eng.targetDate}`
      : `- Target: ${eng.followerTarget.toLocaleString()}`;
    engLines.push(targetLine);
  }
  if (eng.engagementRate) engLines.push(`- Engagement rate: ${eng.engagementRate}%`);
  if (eng.avgRetweets) engLines.push(`- Avg retweets: ${eng.avgRetweets}`);
  if (eng.rtToLikeRatio) engLines.push(`- RT-to-like ratio: ${eng.rtToLikeRatio}%`);
  if (eng.ctaScore != null && eng.ctaTarget != null) engLines.push(`- CTA effectiveness: ${eng.ctaScore}/100 (target ${eng.ctaTarget}+)`);
  if (eng.topGaps.length > 0) engLines.push(`- Top gaps to address: ${eng.topGaps.join(', ')}`);

  // Voice constraints
  const voiceLines: string[] = [];
  // Default formatting rules
  voiceLines.push(`FORMATTING: Never use bold (**), italic (*), or any markdown formatting. Output plain text only.`);
  const usesEmDashes = config.voiceConstraints.some(v => v.toLowerCase().includes('em dash') || v.includes('—'));
  if (!usesEmDashes) {
    voiceLines.push(`PUNCTUATION: Never use em dashes (—). Use commas, periods, or line breaks instead.`);
  }

  // Scanned voice profile — this is the creator's ACTUAL voice from their real posts
  if (config.voiceConstraints.length > 0) {
    voiceLines.push(`\nCRITICAL — VOICE TONE (from scanning their real posts): ${config.voiceConstraints.join(', ')}`);
    voiceLines.push(`You MUST write in this exact tone. Every sentence should feel like THEY wrote it, not an AI.`);
  }
  if ((config.doPatterns || []).length > 0) {
    voiceLines.push(`\nSTYLE PATTERNS (things they actually do in their writing — replicate these):`);
    (config.doPatterns || []).forEach(p => voiceLines.push(`  + ${p}`));
  }
  if (config.neverSay.length > 0) {
    voiceLines.push(`\nTHINGS THEY NEVER DO (avoid all of these completely):`);
    config.neverSay.forEach(p => voiceLines.push(`  - ${p}`));
  }

  // Also include brand-level patterns
  if (brand.doPatterns.length > 0) voiceLines.push(`\nBRAND DO: ${brand.doPatterns.join('; ')}`);
  if (brand.dontPatterns.length > 0) voiceLines.push(`BRAND DON'T: ${brand.dontPatterns.join('; ')}`);

  // Voice fingerprint
  let voiceFingerprintSection = '';
  if (context?.voiceFingerprint) {
    voiceFingerprintSection = `\n${formatSummaryForPrompt(summarizeFingerprint(context.voiceFingerprint))}\n\nCRITICAL: Match the creator's actual voice. If any phrase sounds like "ChatGPT wrote this", rewrite it.`;
  }

  // Full schedule context (just today's format info)
  const formatGuide = buildFormatGuide(slotConfig.format);

  const hasScannedVoice = config.voiceConstraints.length > 0 || (config.doPatterns || []).length > 0;

  return `You are the Content Engine for "${brand.name}".${hasScannedVoice ? `\n\nIMPORTANT: This creator's voice was scanned from their real posts. Your #1 job is to sound EXACTLY like them. Not like a polished AI. Not like a copywriter. Like THEM. Match their sentence length, their word choices, their energy. If they're sarcastic, be sarcastic. If they're blunt, be blunt. If they use slang, use slang. Read the voice profile below carefully and embody it completely.` : ''}
${engLines.length > 0 ? `\nCONTEXT:\n${engLines.join('\n')}\n- Every post MUST have a CTA. No exceptions.` : '\nEvery post MUST have a CTA. No exceptions.'}

BRAND VOICE:
- Overall tone: ${toneStr}
- Keywords: ${brand.keywords.length > 0 ? brand.keywords.join(', ') : 'none specified'}
${brand.voiceSamples.length > 0 ? `- Voice samples: ${brand.voiceSamples.join(' | ')}` : ''}
${voiceLines.length > 0 ? voiceLines.join('\n') : ''}
${voiceFingerprintSection}

TODAY'S ASSIGNMENT:
- Day: ${request.day}
- Slot: ${slotLabel}
- Format: ${slotConfig.format}${slotConfig.description ? ` (${slotConfig.description})` : ''}
- CTA Type: ${ctaType}
${formatGuide}

OUTPUT — use exactly this structure, nothing else before SLOT:
SLOT: ${slotLabel}
FORMAT: ${slotConfig.format}
CTA TYPE: ${ctaType}

---

[POST CONTENT]

---`;
}

function buildFormatGuide(format: string): string {
  const f = format.toLowerCase();
  if (f.includes('thread')) return '\nFORMAT GUIDE: 5-7 tweets numbered 1/ to 7/, strong hook in tweet 1. Use the CTA TYPE specified above.';
  if (f.includes('thought')) return '\nFORMAT GUIDE: A focused, concise thought or observation — one clear idea stated plainly. Use the CTA TYPE specified above.';
  if (f.includes('framework')) return '\nFORMAT GUIDE: Numbered/labeled system with clear structure. Use the CTA TYPE specified above.';
  if (f.includes('hot take')) return '\nFORMAT GUIDE: Bold claim, 2-3 lines reasoning. Use the CTA TYPE specified above.';
  if (f.includes('build log')) return '\nFORMAT GUIDE: Timestamp, what shipped, why it matters. Use the CTA TYPE specified above.';
  if (f.includes('reflection')) return '\nFORMAT GUIDE: Look back at the week, key insight or lesson, reflective tone. Use the CTA TYPE specified above.';
  if (f.includes('community')) return '\nFORMAT GUIDE: Engage the community, spotlight others, ask for participation. Use the CTA TYPE specified above.';
  if (f.includes('story')) return '\nFORMAT GUIDE: Personal narrative, real moment or experience, relatable arc. Use the CTA TYPE specified above.';
  if (f.includes('conversational')) return '\nFORMAT GUIDE: Casual, direct tone like talking to a friend. Use the CTA TYPE specified above.';
  return '';
}

function parseScheduledOutput(raw: string): ContentEngineOutput {
  const lines = raw.split('\n');
  const meta: Record<string, string> = {};
  const afterMeta: Record<string, string> = {};
  const post: string[] = [];
  let inPost = false, dashes = 0;

  for (const line of lines) {
    if (line.trim() === '---') {
      dashes++;
      inPost = dashes === 1;
      if (dashes === 2) inPost = false;
      continue;
    }
    if (dashes === 0) {
      const ci = line.indexOf(':');
      if (ci > 0) meta[line.slice(0, ci).trim().toUpperCase()] = line.slice(ci + 1).trim();
    } else if (inPost) {
      post.push(line);
    } else if (dashes >= 2) {
      const ci = line.indexOf(':');
      if (ci > 0) afterMeta[line.slice(0, ci).trim().toUpperCase()] = line.slice(ci + 1).trim();
    }
  }

  return {
    meta: {
      slot: meta['SLOT'] || '',
      format: meta['FORMAT'] || '',
      ctaType: meta['CTA TYPE'] || '',
      gapTargeted: meta['GAP TARGETED'] || '',
    },
    content: post.join('\n').trim(),
    footer: {
      postingWindow: afterMeta['POSTING WINDOW'] || '',
      hashtags: afterMeta['HASHTAGS'] || '',
    },
    raw,
  };
}

/**
 * Generate content using the content engine schedule + CTA rotation
 */
export async function generateScheduledContent(
  context: AgentContext,
  engineConfig: ContentEngineConfig,
  request: ContentEngineRequest
): Promise<AgentResponse<ContentEngineOutput>> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'API key not configured', confidence: 0, processingTime: Date.now() - startTime };
    }

    if (!context.brandDNA?.name) {
      return { success: false, error: 'Brand DNA is required', confidence: 0, processingTime: Date.now() - startTime };
    }

    const system = buildScheduledContentSystemPrompt(context.brandDNA, engineConfig, request, context);
    const topicLine = request.topic
      ? `Topic: ${request.topic}`
      : 'Pick the best topic for today based on the format and brand context.';
    const slotLabel = request.slot === 'post1' ? 'Post 1 (Anchor)' : 'Post 2 (Lighter)';
    const prompt = `Today is ${request.day}. Generate ${slotLabel} for "${context.brandDNA.name}".\n${topicLine}\nMake it feel specific, real, and true to the voice.`;

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    if (!responseText) {
      return { success: false, error: 'Empty response from model', confidence: 0, processingTime: Date.now() - startTime };
    }

    const output = parseScheduledOutput(responseText);

    return {
      success: true,
      data: output,
      confidence: output.content ? 0.85 : 0.3,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    let errorMessage = 'Scheduled content generation failed';
    if (error instanceof Error) {
      errorMessage = error.message.includes('credit balance is too low')
        ? 'API credits depleted. Please check your Anthropic account.'
        : error.message;
    }
    return { success: false, error: errorMessage, confidence: 0, processingTime: Date.now() - startTime };
  }
}



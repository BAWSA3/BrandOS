// ===== BRAND AUTHORITY AGENT =====
// Positions Relique as the trusted authority in RWA collectibles

import Anthropic from '@anthropic-ai/sdk';
import { BrandDNA, Platform } from '@/lib/types';
import { AgentResponse } from './types';
import {
  AuthorityContentType,
  AuthorityPillar,
  TargetAudience,
  ObjectionType,
  CompetitorType,
  AuthorityContent,
  AuthorityBrief,
  AuthorityContentRequest,
  ObjectionHandlingRequest,
  ObjectionHandlingResult,
  CompetitiveContentRequest,
  CompetitiveContentResult,
  EducationalContentRequest,
  EducationalContent,
  EducationalTopic,
  TrustContentRequest,
  TrustContent,
  TrustContentFormat,
  TrendToAuthorityRequest,
  TrendToAuthorityResult,
  ResearchToAuthorityParams,
  ResearchToAuthorityResult,
} from './authority.types';
import {
  RELIQUE_MESSAGING_FRAMEWORK,
  EDUCATIONAL_TOPICS,
  AUTHORITY_PROMPTS,
} from './authority.config';

// ===== ANTHROPIC CLIENT =====

const anthropic = new Anthropic();

// ===== HELPER FUNCTIONS =====

function generateId(): string {
  return `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getPillarContent(pillar: AuthorityPillar) {
  return RELIQUE_MESSAGING_FRAMEWORK.pillars[pillar];
}

function getAudienceProfile(audience: TargetAudience) {
  return RELIQUE_MESSAGING_FRAMEWORK.audiences[audience];
}

function getObjectionResponse(objectionType: ObjectionType) {
  return RELIQUE_MESSAGING_FRAMEWORK.objections[objectionType];
}

function getCompetitorPosition(competitor: CompetitorType) {
  return RELIQUE_MESSAGING_FRAMEWORK.competitors[competitor];
}

// ===== CORE AUTHORITY FUNCTIONS =====

/**
 * Generate authority content based on type, audience, and topic
 */
export async function generateAuthorityContent(
  brandDNA: BrandDNA,
  request: AuthorityContentRequest
): Promise<AgentResponse<AuthorityContent>> {
  const startTime = Date.now();

  try {
    const {
      contentType,
      audience = 'collector',
      pillar = 'security',
      topic = 'RWA collectibles',
      platform,
    } = request;

    const pillarContent = getPillarContent(pillar);
    const audienceProfile = getAudienceProfile(audience);

    const systemPrompt = `You are the Brand Authority Agent for Relique, an RWA (Real World Asset) platform for trading card collectibles.

Your role is to generate content that positions Relique as THE trusted authority in tokenized collectibles.

Brand DNA:
- Name: ${brandDNA.name}
- Tagline: ${brandDNA.tagline || 'The future of collectible ownership'}
- Tone: ${brandDNA.toneProfile?.primary || 'Expert'}, ${brandDNA.toneProfile?.secondary || 'Trustworthy'}
- Voice: ${brandDNA.voiceTraits?.join(', ') || 'Confident, knowledgeable, collector-first'}

Key Pillar - ${pillar.toUpperCase()}:
- Headline: ${pillarContent.headline}
- Emotional Hook: ${pillarContent.emotionalHook}
- Proof Points: ${pillarContent.proofPoints.join('; ')}

Target Audience - ${audience.toUpperCase()}:
- Primary Value: ${audienceProfile.primaryValue}
- Pain Points: ${audienceProfile.painPoints.join('; ')}
- Key Messages: ${audienceProfile.keyMessages.join('; ')}
- CTA: ${audienceProfile.cta}

Generate ${contentType} content that is authoritative but accessible, confident but not arrogant.`;

    const userPrompt = `Generate ${contentType} content about: "${topic}"

Content Type: ${contentType}
Target Audience: ${audience}
Primary Pillar: ${pillar}
${platform ? `Platform: ${platform}` : ''}

Requirements:
1. Position Relique as the expert/authority
2. Address audience pain points naturally
3. Include proof points where relevant
4. End with appropriate CTA for this audience
5. ${platform ? `Optimize for ${platform} format and constraints` : 'Keep format flexible'}

Return as JSON:
{
  "headline": "Attention-grabbing headline",
  "body": "Main content body (2-4 paragraphs)",
  "callToAction": "Clear CTA",
  "hashtags": ["relevant", "hashtags"],
  "keyMessages": ["key", "messages", "conveyed"],
  "proofPoints": ["proof", "points", "used"],
  "brandAlignmentScore": 85,
  "suggestedVisuals": ["visual ideas"]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: userPrompt },
      ],
      system: systemPrompt,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const content: AuthorityContent = {
      id: generateId(),
      contentType,
      audience,
      pillar,
      headline: parsed.headline,
      body: parsed.body,
      callToAction: parsed.callToAction,
      hashtags: parsed.hashtags || [],
      platform,
      keyMessages: parsed.keyMessages || [],
      proofPoints: parsed.proofPoints || [],
      brandAlignmentScore: parsed.brandAlignmentScore || 80,
      suggestedVisuals: parsed.suggestedVisuals,
    };

    return {
      success: true,
      data: content,
      confidence: 0.85,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate authority content',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Create positioning angles from a trending topic (Research Agent integration)
 */
export async function createPositioningFromTrend(
  brandDNA: BrandDNA,
  request: TrendToAuthorityRequest
): Promise<AgentResponse<TrendToAuthorityResult>> {
  const startTime = Date.now();

  try {
    const {
      trendTopic,
      trendSummary,
      vertical,
      audiences = ['collector', 'trader'],
      platforms = ['twitter', 'instagram'],
    } = request;

    const systemPrompt = `You are the Brand Authority Agent for Relique, analyzing trending topics to create authority content angles.

Brand: ${brandDNA.name}
Value Pillars:
${Object.entries(RELIQUE_MESSAGING_FRAMEWORK.pillars)
  .map(([key, val]) => `- ${key}: ${val.headline}`)
  .join('\n')}

Your task: Take this trending topic and identify how Relique can create valuable authority content around it.`;

    const userPrompt = `Trending Topic: "${trendTopic}"
Summary: ${trendSummary}
${vertical ? `Vertical: ${vertical}` : ''}

Target Audiences: ${audiences.join(', ')}
Platforms: ${platforms.join(', ')}

Analyze this trend and create:
1. 2-3 authority content angles (how can Relique add value/perspective?)
2. For each angle, suggest specific content pieces

Return as JSON:
{
  "authorityAngles": [
    {
      "topic": "Angle topic",
      "angle": "Relique's unique take",
      "audience": "primary audience",
      "pillar": "most relevant pillar",
      "keyPoints": ["key", "points"],
      "competitorDifferentiation": "how this sets us apart",
      "trendConnection": "how it connects to the trend"
    }
  ],
  "suggestedContent": [
    {
      "contentType": "thought-leadership|educational|trust-building",
      "headline": "Content headline",
      "body": "Brief content body",
      "audience": "target audience",
      "pillar": "primary pillar",
      "callToAction": "CTA",
      "hashtags": ["hashtags"],
      "keyMessages": ["messages"],
      "proofPoints": ["proofs"]
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const result: TrendToAuthorityResult = {
      trend: {
        topic: trendTopic,
        summary: trendSummary,
      },
      authorityAngles: parsed.authorityAngles.map((angle: AuthorityBrief) => ({
        ...angle,
        audience: angle.audience as TargetAudience,
        pillar: angle.pillar as AuthorityPillar,
      })),
      suggestedContent: parsed.suggestedContent.map((content: Partial<AuthorityContent>) => ({
        id: generateId(),
        contentType: content.contentType as AuthorityContentType,
        audience: content.audience as TargetAudience,
        pillar: content.pillar as AuthorityPillar,
        headline: content.headline || '',
        body: content.body || '',
        callToAction: content.callToAction || '',
        hashtags: content.hashtags || [],
        keyMessages: content.keyMessages || [],
        proofPoints: content.proofPoints || [],
        brandAlignmentScore: 80,
      })),
    };

    return {
      success: true,
      data: result,
      confidence: 0.8,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create positioning from trend',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Handle objections with tailored responses
 */
export async function handleObjection(
  brandDNA: BrandDNA,
  request: ObjectionHandlingRequest
): Promise<AgentResponse<ObjectionHandlingResult>> {
  const startTime = Date.now();

  try {
    const {
      objectionType,
      context = 'general',
      audience = 'collector',
      format = 'detailed',
    } = request;

    const objectionData = getObjectionResponse(objectionType);
    const audienceProfile = getAudienceProfile(audience);

    // For quick formats, return pre-written response
    if (format === 'short') {
      return {
        success: true,
        data: {
          objection: objectionData.objection,
          response: objectionData.shortResponse,
          proofPoints: objectionData.proofPoints.slice(0, 2),
          followUp: objectionData.followUpQuestion,
        },
        confidence: 0.95,
        processingTime: Date.now() - startTime,
      };
    }

    // For detailed/empathetic, use AI to customize
    const systemPrompt = `You are responding to an objection about Relique on behalf of the brand.

Objection Type: ${objectionType}
Base Objection: "${objectionData.objection}"
Context: ${context}
Audience: ${audience} (${audienceProfile.primaryValue})
Response Format: ${format}

Key proof points available:
${objectionData.proofPoints.map((p) => `- ${p}`).join('\n')}

Guidelines:
- Be empathetic, not defensive
- Acknowledge the concern genuinely
- Provide specific, verifiable information
- Tailor language to ${audience} audience
- End with invitation, not push`;

    const userPrompt = `Generate a ${format} response to this objection in the context of: ${context}

Return as JSON:
{
  "response": "The tailored response",
  "proofPoints": ["specific", "proof", "points"],
  "followUp": "Optional follow-up question or next step"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: {
        objection: objectionData.objection,
        response: parsed.response,
        proofPoints: parsed.proofPoints,
        followUp: parsed.followUp,
      },
      confidence: 0.85,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle objection',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Generate competitive positioning content
 */
export async function generateCompetitiveContent(
  brandDNA: BrandDNA,
  request: CompetitiveContentRequest
): Promise<AgentResponse<CompetitiveContentResult>> {
  const startTime = Date.now();

  try {
    const {
      competitor,
      audience = 'trader',
      format = 'comparison',
      platform,
    } = request;

    const competitorData = getCompetitorPosition(competitor);
    const audienceProfile = getAudienceProfile(audience);

    const systemPrompt = `You are creating competitive positioning content for Relique vs ${competitorData.name}.

Competitor: ${competitorData.name} (${competitorData.type} platform)
Our Positioning: ${competitorData.positioningStatement}

Our Advantages:
${competitorData.ourAdvantage.map((a) => `- ${a}`).join('\n')}

Their Weaknesses:
${competitorData.theirWeakness.map((w) => `- ${w}`).join('\n')}

Target Audience: ${audience}
- Primary Value: ${audienceProfile.primaryValue}
- Pain Points: ${audienceProfile.painPoints.join('; ')}

Guidelines:
- Be confident but respectful (no mudslinging)
- Focus on what matters to ${audience}
- Use specific examples and numbers
- Acknowledge competitor strengths briefly`;

    const userPrompt = `Generate ${format} content comparing Relique to ${competitorData.name}
${platform ? `Optimized for: ${platform}` : ''}

Return as JSON:
{
  "content": {
    "headline": "Compelling headline",
    "body": "Main comparison content",
    "callToAction": "Clear CTA",
    "hashtags": ["hashtags"],
    "keyMessages": ["key messages"],
    "proofPoints": ["proof points"]
  },
  "comparisonTable": [
    {
      "feature": "Feature name",
      "relique": "Our offering",
      "competitor": "Their offering",
      "advantage": "relique|competitor|neutral"
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const result: CompetitiveContentResult = {
      competitor: competitorData,
      content: {
        id: generateId(),
        contentType: 'competitive',
        audience,
        pillar: 'liquidity', // Most relevant for competitive
        headline: parsed.content.headline,
        body: parsed.content.body,
        callToAction: parsed.content.callToAction,
        hashtags: parsed.content.hashtags || [],
        platform,
        keyMessages: parsed.content.keyMessages || [],
        proofPoints: parsed.content.proofPoints || [],
        brandAlignmentScore: 85,
      },
      comparisonTable: parsed.comparisonTable,
    };

    return {
      success: true,
      data: result,
      confidence: 0.85,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate competitive content',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Generate educational content
 */
export async function generateEducationalContent(
  brandDNA: BrandDNA,
  request: EducationalContentRequest
): Promise<AgentResponse<EducationalContent>> {
  const startTime = Date.now();

  try {
    const {
      topic,
      audience = 'collector',
      depth = 'beginner',
      format = 'explainer',
    } = request;

    const topicConfig = EDUCATIONAL_TOPICS[topic];
    const audienceProfile = getAudienceProfile(audience);

    const systemPrompt = `You are creating educational content for Relique about: ${topicConfig.title}

Topic Summary: ${topicConfig.summary}
Key Points to Cover:
${topicConfig.keyPoints.map((p) => `- ${p}`).join('\n')}

Related Pillars: ${topicConfig.relatedPillars.join(', ')}

Target Audience: ${audience}
- Primary Value: ${audienceProfile.primaryValue}
Depth Level: ${depth}
Format: ${format}

Guidelines:
- Explain clearly without jargon
- Use analogies collectors understand
- Address common misconceptions
- Show how Relique makes this easy
- Empower the reader`;

    const userPrompt = `Generate ${format} educational content about "${topicConfig.title}"

Return as JSON:
{
  "headline": "Educational headline",
  "body": "Main educational content with clear structure",
  "callToAction": "Next step CTA",
  "keyMessages": ["key takeaways"],
  "proofPoints": ["supporting facts"],
  "learningObjectives": ["what reader will learn"],
  "keyTerms": [{"term": "Term", "definition": "Definition"}],
  "nextSteps": ["recommended next actions"]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const content: EducationalContent = {
      id: generateId(),
      contentType: 'educational',
      audience,
      pillar: topicConfig.relatedPillars[0] as AuthorityPillar,
      headline: parsed.headline,
      body: parsed.body,
      callToAction: parsed.callToAction,
      keyMessages: parsed.keyMessages || [],
      proofPoints: parsed.proofPoints || [],
      brandAlignmentScore: 85,
      educationalTopic: topic,
      learningObjectives: parsed.learningObjectives || [],
      keyTerms: parsed.keyTerms || [],
      nextSteps: parsed.nextSteps || [],
    };

    return {
      success: true,
      data: content,
      confidence: 0.9,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate educational content',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Generate trust-building content
 */
export async function generateTrustContent(
  brandDNA: BrandDNA,
  request: TrustContentRequest
): Promise<AgentResponse<TrustContent>> {
  const startTime = Date.now();

  try {
    const {
      format,
      audience = 'collector',
      platform,
      focusPillar = 'security',
    } = request;

    const pillarContent = getPillarContent(focusPillar);
    const audienceProfile = getAudienceProfile(audience);

    const formatDescriptions: Record<TrustContentFormat, string> = {
      'vault-tour': 'Virtual tour of our vault facilities',
      'security-feature': 'Spotlight on a specific security feature',
      'process-transparency': 'Behind-the-scenes of our processes',
      'team-spotlight': 'Meet the team protecting your cards',
      'customer-story': 'Real collector success story',
      'insurance-coverage': 'Details about our insurance protection',
      'audit-report': 'Third-party verification and audits',
    };

    const systemPrompt = `You are creating trust-building content for Relique.

Format: ${format} - ${formatDescriptions[format]}
Focus Pillar: ${focusPillar}
- Headline: ${pillarContent.headline}
- Proof Points: ${pillarContent.proofPoints.join('; ')}
- Emotional Hook: ${pillarContent.emotionalHook}

Target Audience: ${audience}
- Pain Points: ${audienceProfile.painPoints.join('; ')}

Guidelines:
- Be transparent and specific
- Include verifiable details
- Address unspoken concerns proactively
- Build confidence through information`;

    const userPrompt = `Generate ${format} trust-building content
${platform ? `Optimized for: ${platform}` : ''}

Return as JSON:
{
  "headline": "Trust-building headline",
  "body": "Detailed trust-building content",
  "callToAction": "Invitation to learn more",
  "keyMessages": ["trust messages"],
  "proofPoints": ["verifiable proofs"],
  "verificationPoints": ["how they can verify"],
  "socialProof": ["testimonials or stats if relevant"]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const content: TrustContent = {
      id: generateId(),
      contentType: 'trust-building',
      audience,
      pillar: focusPillar,
      headline: parsed.headline,
      body: parsed.body,
      callToAction: parsed.callToAction,
      platform,
      keyMessages: parsed.keyMessages || [],
      proofPoints: parsed.proofPoints || [],
      brandAlignmentScore: 90,
      trustFormat: format,
      verificationPoints: parsed.verificationPoints || [],
      socialProof: parsed.socialProof,
    };

    return {
      success: true,
      data: content,
      confidence: 0.9,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate trust content',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Get all available objection types and their short responses
 */
export function getObjectionTypes(): Record<ObjectionType, { objection: string; shortResponse: string }> {
  const result: Record<string, { objection: string; shortResponse: string }> = {};

  for (const [key, value] of Object.entries(RELIQUE_MESSAGING_FRAMEWORK.objections)) {
    result[key] = {
      objection: value.objection,
      shortResponse: value.shortResponse,
    };
  }

  return result as Record<ObjectionType, { objection: string; shortResponse: string }>;
}

/**
 * Get all competitor positions
 */
export function getCompetitorPositions(): Record<CompetitorType, { name: string; positioningStatement: string }> {
  const result: Record<string, { name: string; positioningStatement: string }> = {};

  for (const [key, value] of Object.entries(RELIQUE_MESSAGING_FRAMEWORK.competitors)) {
    result[key] = {
      name: value.name,
      positioningStatement: value.positioningStatement,
    };
  }

  return result as Record<CompetitorType, { name: string; positioningStatement: string }>;
}

/**
 * Get educational topics list
 */
export function getEducationalTopicsList(): { topic: EducationalTopic; title: string; summary: string }[] {
  return Object.entries(EDUCATIONAL_TOPICS).map(([topic, config]) => ({
    topic: topic as EducationalTopic,
    title: config.title,
    summary: config.summary,
  }));
}

/**
 * Get messaging framework summary
 */
export function getMessagingFrameworkSummary() {
  return {
    pillars: Object.entries(RELIQUE_MESSAGING_FRAMEWORK.pillars).map(([key, val]) => ({
      id: key,
      headline: val.headline,
      emotionalHook: val.emotionalHook,
    })),
    audiences: Object.entries(RELIQUE_MESSAGING_FRAMEWORK.audiences).map(([key, val]) => ({
      id: key,
      name: val.name,
      primaryValue: val.primaryValue,
    })),
    objectionCount: Object.keys(RELIQUE_MESSAGING_FRAMEWORK.objections).length,
    competitorCount: Object.keys(RELIQUE_MESSAGING_FRAMEWORK.competitors).length,
  };
}

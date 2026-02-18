import { BrandDNA, ContentType } from '@/lib/types';
import { VoiceFingerprintSummary } from '@/lib/voice-fingerprint';
import { buildVoiceFingerprintInstructions } from '@/prompts/voice-fingerprint';

export function buildBrandContext(brand: BrandDNA, fingerprintSummary?: VoiceFingerprintSummary): string {
  let context = `
BRAND DNA:
- Brand Name: ${brand.name}
- Tone Profile: Formality (${brand.tone.minimal}/100), Energy (${brand.tone.playful}/100), Confidence (${brand.tone.bold}/100), Style (${brand.tone.experimental}/100)
- Brand Keywords: ${brand.keywords.join(', ') || 'None specified'}
- DO patterns: ${brand.doPatterns.join('; ') || 'None specified'}
- DON'T patterns: ${brand.dontPatterns.join('; ') || 'None specified'}
- Voice samples: ${brand.voiceSamples.join(' | ') || 'None provided'}
`.trim();

  if (fingerprintSummary) {
    context += '\n\n' + buildVoiceFingerprintInstructions(fingerprintSummary);
  }

  return context;
}

export function buildCheckPrompt(brand: BrandDNA, content: string): string {
  return `You are a brand consistency analyzer. Analyze this content against the brand guidelines.

${buildBrandContext(brand)}

CONTENT TO CHECK:
"${content}"

Analyze how well this content matches the brand identity. Return ONLY valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "issues": ["issue 1", "issue 2"],
  "strengths": ["strength 1", "strength 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "revisedVersion": "<improved version that better matches the brand>"
}`;
}

const contentTypeInstructions: Record<ContentType, string> = {
  'general': 'Generate versatile content that matches the brand voice.',
  'social-twitter': 'Generate Twitter/X posts. Keep under 280 characters. Be punchy, direct, and shareable. Can include 1-2 relevant hashtags if appropriate.',
  'social-linkedin': 'Generate LinkedIn posts. Professional yet personable. Include a hook, value, and call-to-action. Can be 1-3 paragraphs.',
  'social-instagram': 'Generate Instagram captions. Visual and engaging. Include line breaks for readability. End with 3-5 relevant hashtags.',
  'headline': 'Generate attention-grabbing headlines. Be concise (under 10 words ideally), clear, and compelling. Create curiosity or promise value.',
  'tagline': 'Generate memorable taglines/slogans. Keep to 3-7 words. Be timeless, distinctive, and encapsulate the brand essence.',
  'email-subject': 'Generate email subject lines. Keep under 50 characters. Create urgency or curiosity. Avoid spam trigger words.',
  'email-body': 'Generate full email content. Include greeting, body, and sign-off. Be concise but warm. Include clear call-to-action.',
  'ad-copy': 'Generate advertising copy. Lead with benefit, create desire, include call-to-action. Be persuasive but authentic to the brand.',
  'product-description': 'Generate product descriptions. Highlight key features as benefits. Be specific and sensory. Address customer pain points.',
  'blog-intro': 'Generate blog introduction paragraphs. Hook the reader immediately. Preview the value they\'ll get. Create momentum to keep reading.',
};

export function buildGeneratePrompt(brand: BrandDNA, userRequest: string, contentType: ContentType = 'general', fingerprintSummary?: VoiceFingerprintSummary): string {
  const voiceWarning = fingerprintSummary
    ? `\n\nCRITICAL — VOICE AUTHENTICITY:
The content MUST sound like this specific creator wrote it. Apply every rule from the Voice Fingerprint below.
If any phrase sounds like "an AI wrote this" — rewrite it before including.
Common AI tells to AVOID: "In today's...", "Excited to announce", "It's worth noting", "At the end of the day", perfect parallel structure, excessive hedging.`
    : '';

  return `You are a brand guardian AI. Generate content that perfectly matches this brand's identity.

${buildBrandContext(brand, fingerprintSummary)}
${voiceWarning}

CONTENT TYPE: ${contentType.toUpperCase().replace('-', ' ')}
${contentTypeInstructions[contentType]}

USER REQUEST: ${userRequest}

Generate 3 distinct variations that match the brand voice exactly. Be concise. No generic marketing speak. Each option should take a slightly different angle or approach.

Format your response as:
**OPTION 1:**
[content]

**OPTION 2:**
[content]

**OPTION 3:**
[content]`;
}

export function buildToneAnalysisPrompt(brand: BrandDNA, content: string): string {
  return `You are a real-time tone analyzer. Analyze this content's tone and compare it to the target brand tone.

${buildBrandContext(brand)}

CONTENT TO ANALYZE:
"${content}"

Analyze the tone of this content and how well it matches the brand. Return ONLY valid JSON:
{
  "formality": <number 0-100, how formal vs casual the content is>,
  "energy": <number 0-100, how energetic vs reserved>,
  "confidence": <number 0-100, how bold vs humble>,
  "style": <number 0-100, how experimental vs classic>,
  "overallMatch": <number 0-100, overall brand alignment>,
  "feedback": "<one sentence of actionable feedback>"
}`;
}

export function buildCompetitorAnalysisPrompt(brand: BrandDNA, competitorName: string, competitorSamples: string[]): string {
  return `You are a brand strategist. Compare this brand to a competitor's voice.

YOUR BRAND:
${buildBrandContext(brand)}

COMPETITOR: ${competitorName}
COMPETITOR VOICE SAMPLES:
${competitorSamples.map((s, i) => `${i + 1}. "${s}"`).join('\n')}

Analyze:
1. Key differences in tone and voice
2. Your brand's unique positioning
3. Areas where you could differentiate more
4. What you might learn from the competitor

Return ONLY valid JSON:
{
  "keyDifferences": ["difference 1", "difference 2", "difference 3"],
  "uniquePositioning": "<what makes your brand distinct>",
  "differentiationOpportunities": ["opportunity 1", "opportunity 2"],
  "learnings": ["insight 1", "insight 2"],
  "competitorTone": {
    "formality": <0-100>,
    "energy": <0-100>,
    "confidence": <0-100>,
    "style": <0-100>
  },
  "summary": "<2-3 sentence strategic summary>"
}`;
}

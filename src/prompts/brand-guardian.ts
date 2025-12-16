import { BrandDNA } from '@/lib/types';

export function buildBrandContext(brand: BrandDNA): string {
  return `
BRAND DNA:
- Brand Name: ${brand.name}
- Tone Profile: Minimal (${brand.tone.minimal}/100), Playful (${brand.tone.playful}/100), Bold (${brand.tone.bold}/100), Experimental (${brand.tone.experimental}/100)
- Brand Keywords: ${brand.keywords.join(', ') || 'None specified'}
- DO patterns: ${brand.doPatterns.join('; ') || 'None specified'}
- DON'T patterns: ${brand.dontPatterns.join('; ') || 'None specified'}
- Voice samples: ${brand.voiceSamples.join(' | ') || 'None provided'}
`.trim();
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

export function buildGeneratePrompt(brand: BrandDNA, userRequest: string): string {
  return `You are a brand guardian AI. Generate content that perfectly matches this brand's identity.

${buildBrandContext(brand)}

USER REQUEST: ${userRequest}

Generate 2 distinct variations that match the brand voice exactly. Be concise. No generic marketing speak.

Format your response as:
**OPTION 1:**
[content]

**OPTION 2:**
[content]`;
}



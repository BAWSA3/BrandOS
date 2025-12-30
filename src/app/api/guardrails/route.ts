import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { BrandDNA, GuardrailResult, SafeZone } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { brandDNA, draft, safeZones } = await request.json() as {
      brandDNA: BrandDNA;
      draft: { id: string; content: string; contentType: string; creatorName?: string };
      safeZones?: SafeZone[];
    };

    if (!brandDNA?.name || !draft?.content) {
      return NextResponse.json({ error: 'Missing brand DNA or draft content' }, { status: 400 });
    }

    const safeZonesContext = safeZones?.length
      ? `\nSAFE ZONES (must respect these):\n${safeZones.map(sz => `- ${sz.element} (${sz.status}): ${sz.rules.join(', ')}`).join('\n')}`
      : '';

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are a Creator Guardrails System. Evaluate this draft against brand guidelines and provide actionable feedback.

BRAND DNA:
- Name: ${brandDNA.name}
- Keywords: ${brandDNA.keywords.join(', ') || 'None'}
- Tone: Minimal (${brandDNA.tone.minimal}/100), Playful (${brandDNA.tone.playful}/100), Bold (${brandDNA.tone.bold}/100), Experimental (${brandDNA.tone.experimental}/100)
- DO patterns: ${brandDNA.doPatterns.join('; ') || 'None'}
- DON'T patterns: ${brandDNA.dontPatterns.join('; ') || 'None'}
- Voice samples: ${brandDNA.voiceSamples.join(' | ') || 'None'}
${safeZonesContext}

CREATOR DRAFT:
Content Type: ${draft.contentType}
${draft.creatorName ? `Creator: ${draft.creatorName}` : ''}
"${draft.content}"

Evaluate the draft and provide:
1. Alignment score (0-100)
2. Status: "approved" (score >= 80), "needs-revision" (50-79), "rejected" (<50)
3. Specific violations with severity and suggestions
4. What's working well
5. A revised version if needed

Return ONLY valid JSON:
{
  "alignmentScore": 0-100,
  "status": "approved" | "needs-revision" | "rejected",
  "violations": [
    {
      "rule": "which brand rule was violated",
      "severity": "minor" | "major" | "critical",
      "suggestion": "how to fix it"
    }
  ],
  "approvedElements": ["what's working well"],
  "revisedVersion": "improved version of the draft (if status is not approved)"
}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    const result: GuardrailResult = {
      draftId: draft.id,
      alignmentScore: parsed.alignmentScore,
      status: parsed.status,
      violations: parsed.violations || [],
      approvedElements: parsed.approvedElements || [],
      revisedVersion: parsed.revisedVersion,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Guardrails API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to evaluate draft' },
      { status: 500 }
    );
  }
}


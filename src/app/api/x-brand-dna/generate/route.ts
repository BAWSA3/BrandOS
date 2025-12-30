// =============================================================================
// X BRAND DNA GENERATOR API
// Converts X profile analysis into store-ready BrandDNA
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  XProfileData,
  BrandDNA as GeminiBrandDNA,
  BioLinguistics,
  ProfileImageAnalysis,
  analyzeBioLinguistics,
} from '@/lib/gemini';
import { BrandDNA as StoreBrandDNA } from '@/lib/types';

// Types for the response
export interface GeneratedBrandDNA {
  // Store-compatible format
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  tone: {
    minimal: number;
    playful: number;
    bold: number;
    experimental: number;
  };
  keywords: string[];
  doPatterns: string[];
  dontPatterns: string[];
  voiceSamples: string[];
  // Extra metadata from analysis
  archetype: string;
  archetypeEmoji: string;
  voiceProfile: string;
  targetAudience: string;
  inferredMission: string;
}

export interface GenerateBrandDNAResponse {
  success: boolean;
  brandDNA: GeneratedBrandDNA | null;
  error?: string;
}

// Helper: Extract dominant color from profile image analysis
function extractColors(
  imageAnalysis: ProfileImageAnalysis | null,
  geminiBrandDNA: GeminiBrandDNA | null
): { primary: string; secondary: string; accent: string } {
  // Priority 1: From image analysis
  if (imageAnalysis?.dominantColors?.length >= 2) {
    const colors = imageAnalysis.dominantColors;
    return {
      primary: colors[0]?.hex || '#0047FF',
      secondary: colors[1]?.hex || '#1a1a1a',
      accent: colors[2]?.hex || generateAccentColor(colors[0]?.hex || '#0047FF'),
    };
  }

  // Priority 2: From Gemini brand DNA analysis
  if (geminiBrandDNA?.primaryColor?.hex) {
    return {
      primary: geminiBrandDNA.primaryColor.hex,
      secondary: geminiBrandDNA.secondaryColor?.hex || '#1a1a1a',
      accent: generateAccentColor(geminiBrandDNA.primaryColor.hex),
    };
  }

  // Fallback: Default brand colors
  return {
    primary: '#0047FF',
    secondary: '#1a1a1a',
    accent: '#10B981',
  };
}

// Helper: Generate complementary accent color
function generateAccentColor(baseHex: string): string {
  // Simple complementary color generation
  const hex = baseHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Shift hue by ~120 degrees for triadic complement
  const newR = Math.min(255, Math.max(0, (255 - r + 85) % 255));
  const newG = Math.min(255, Math.max(0, (255 - g + 85) % 255));
  const newB = Math.min(255, Math.max(0, (255 - b + 85) % 255));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Helper: Map voice spectrum to tone sliders
function mapToToneSliders(
  bioLinguistics: BioLinguistics,
  imageAnalysis: ProfileImageAnalysis | null,
  geminiBrandDNA: GeminiBrandDNA | null
): { minimal: number; playful: number; bold: number; experimental: number } {
  const voice = bioLinguistics.voiceSpectrum;
  const imageStyle = imageAnalysis?.styleSignals;

  // Combine bio voice analysis with image style signals
  return {
    // Minimal: High professional + low emoji usage = more minimal
    minimal: Math.round(
      (voice.professional * 0.4 +
        (100 - bioLinguistics.emojiAnalysis.count * 10) * 0.3 +
        (imageStyle?.minimal || 50) * 0.3)
    ),

    // Playful: Direct from voice spectrum + emoji personality
    playful: Math.round(
      (voice.playful * 0.5 +
        (bioLinguistics.emojiAnalysis.count > 2 ? 70 : 40) * 0.3 +
        (imageStyle?.playful || 50) * 0.2)
    ),

    // Bold: Authoritative + CTA strength + image boldness
    bold: Math.round(
      (voice.authoritative * 0.4 +
        bioLinguistics.ctaStrength * 0.3 +
        (imageStyle?.bold || 50) * 0.3)
    ),

    // Experimental: Low professional + unique value prop
    experimental: Math.round(
      ((100 - voice.professional) * 0.3 +
        (bioLinguistics.uniqueValueProp ? 60 : 30) * 0.4 +
        (geminiBrandDNA?.differentiationScore || 50) * 0.3)
    ),
  };
}

// Helper: Extract keywords from analysis
function extractKeywords(
  bioLinguistics: BioLinguistics,
  geminiBrandDNA: GeminiBrandDNA | null,
  profile: XProfileData
): string[] {
  const keywords: string[] = [];

  // From Gemini brand DNA
  if (geminiBrandDNA?.brandKeywords) {
    keywords.push(...geminiBrandDNA.brandKeywords.slice(0, 4));
  }

  // From power words in bio
  if (bioLinguistics.powerWords) {
    keywords.push(
      ...bioLinguistics.powerWords.slice(0, 3).map((pw) => pw.word)
    );
  }

  // From archetype
  if (geminiBrandDNA?.archetype) {
    keywords.push(geminiBrandDNA.archetype.toLowerCase());
  }

  // Dedupe and limit
  return [...new Set(keywords)].slice(0, 8);
}

// Helper: Generate do/don't patterns from analysis
function generatePatterns(
  bioLinguistics: BioLinguistics,
  geminiBrandDNA: GeminiBrandDNA | null
): { doPatterns: string[]; dontPatterns: string[] } {
  const doPatterns: string[] = [];
  const dontPatterns: string[] = [];
  const voice = bioLinguistics.voiceSpectrum;

  // Based on formality
  if (voice.professional > 60) {
    doPatterns.push('Use professional, credible language');
    dontPatterns.push('Avoid slang and casual abbreviations');
  } else {
    doPatterns.push('Keep it conversational and approachable');
    dontPatterns.push('Avoid corporate jargon');
  }

  // Based on energy
  if (voice.authoritative > 60) {
    doPatterns.push('Lead with expertise and authority');
    dontPatterns.push('Avoid hedging language (maybe, perhaps)');
  }

  // Based on playfulness
  if (voice.playful > 50) {
    doPatterns.push('Include personality and humor');
  } else {
    dontPatterns.push('Avoid excessive emojis or informal language');
  }

  // Based on CTA style
  if (bioLinguistics.ctaType === 'direct') {
    doPatterns.push('Use clear, direct calls-to-action');
  } else if (bioLinguistics.ctaType === 'soft') {
    doPatterns.push('Guide gently rather than pushing hard');
  }

  // From Gemini avoid keywords
  if (geminiBrandDNA?.avoidKeywords) {
    dontPatterns.push(`Avoid: ${geminiBrandDNA.avoidKeywords.slice(0, 3).join(', ')}`);
  }

  return { doPatterns, dontPatterns };
}

// Helper: Generate voice samples
function generateVoiceSamples(
  profile: XProfileData,
  geminiBrandDNA: GeminiBrandDNA | null
): string[] {
  const samples: string[] = [];

  // Bio as primary sample
  if (profile.description && profile.description.length > 20) {
    samples.push(profile.description);
  }

  // Inferred mission as a voice sample
  if (geminiBrandDNA?.inferredMission) {
    samples.push(geminiBrandDNA.inferredMission);
  }

  // Unique differentiator
  if (geminiBrandDNA?.uniqueDifferentiator) {
    samples.push(geminiBrandDNA.uniqueDifferentiator);
  }

  return samples.filter((s) => s && s.length > 10).slice(0, 3);
}

// Main handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profile,
      brandIdentity,
    }: {
      profile: XProfileData;
      brandIdentity: {
        bioLinguistics: BioLinguistics;
        profileImage: ProfileImageAnalysis | null;
        brandDNA: GeminiBrandDNA | null;
      };
    } = body;

    if (!profile || !brandIdentity) {
      return NextResponse.json(
        { success: false, error: 'Profile and brand identity data required' },
        { status: 400 }
      );
    }

    const { bioLinguistics, profileImage, brandDNA: geminiBrandDNA } = brandIdentity;

    // Generate store-compatible Brand DNA
    const colors = extractColors(profileImage, geminiBrandDNA);
    const tone = mapToToneSliders(bioLinguistics, profileImage, geminiBrandDNA);
    const keywords = extractKeywords(bioLinguistics, geminiBrandDNA, profile);
    const { doPatterns, dontPatterns } = generatePatterns(bioLinguistics, geminiBrandDNA);
    const voiceSamples = generateVoiceSamples(profile, geminiBrandDNA);

    const generatedBrandDNA: GeneratedBrandDNA = {
      id: `brand-${profile.username}-${Date.now()}`,
      name: profile.name || profile.username,
      colors,
      tone,
      keywords,
      doPatterns,
      dontPatterns,
      voiceSamples,
      // Extra metadata
      archetype: geminiBrandDNA?.archetype || 'Creator',
      archetypeEmoji: geminiBrandDNA?.archetypeEmoji || '✨',
      voiceProfile: geminiBrandDNA?.voiceProfile?.primary || 'Authentic Voice',
      targetAudience: geminiBrandDNA?.targetAudience || 'Your community',
      inferredMission: geminiBrandDNA?.inferredMission || '',
    };

    return NextResponse.json({
      success: true,
      brandDNA: generatedBrandDNA,
    } as GenerateBrandDNAResponse);
  } catch (error) {
    console.error('Generate Brand DNA Error:', error);
    return NextResponse.json(
      {
        success: false,
        brandDNA: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as GenerateBrandDNAResponse,
      { status: 500 }
    );
  }
}


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
  TweetVoiceAnalysis,
  analyzeBioLinguistics,
} from '@/lib/gemini';
import { BrandDNA as StoreBrandDNA } from '@/lib/types';
import { ExtractedColors } from '@/lib/color-extraction';

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
  // NEW: Tweet-enhanced fields (optional)
  contentPillars?: {
    name: string;
    frequency: number;
    avgEngagement: number;
  }[];
  performanceInsights?: {
    bestFormats: string[];
    optimalLength: { min: number; max: number };
    highEngagementTopics: string[];
    signaturePhrases: string[];
    hookPatterns: string[];
    voiceConsistency: number;
  };
  tweetDerivedVoice?: {
    professional: number;
    casual: number;
    authoritative: number;
    educational: number;
    personal: number;
  };
  dataSource: 'profile-only' | 'profile-and-tweets';
}

export interface GenerateBrandDNAResponse {
  success: boolean;
  brandDNA: GeneratedBrandDNA | null;
  error?: string;
}

// Helper: Extract dominant color from profile image analysis
function extractColors(
  extractedColors: ExtractedColors | null,
  imageAnalysis: ProfileImageAnalysis | null,
  geminiBrandDNA: GeminiBrandDNA | null
): { primary: string; secondary: string; accent: string } {
  // Priority 1: From programmatic color extraction (node-vibrant)
  if (extractedColors && extractedColors.primary !== '#0047FF') {
    console.log('=== USING EXTRACTED COLORS FROM PFP ===');
    return {
      primary: extractedColors.primary,
      secondary: extractedColors.secondary,
      accent: extractedColors.accent,
    };
  }

  // Priority 2: From Gemini image analysis
  if (imageAnalysis?.dominantColors?.length >= 2) {
    const colors = imageAnalysis.dominantColors;
    return {
      primary: colors[0]?.hex || '#0047FF',
      secondary: colors[1]?.hex || '#1a1a1a',
      accent: colors[2]?.hex || generateAccentColor(colors[0]?.hex || '#0047FF'),
    };
  }

  // Priority 3: From Gemini brand DNA analysis
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

// Helper: Map tweet voice to enhanced tone sliders
function mapTweetVoiceToTone(
  tweetVoice: TweetVoiceAnalysis,
  baseTone: { minimal: number; playful: number; bold: number; experimental: number }
): { minimal: number; playful: number; bold: number; experimental: number } {
  const voice = tweetVoice.voiceSpectrum;

  return {
    minimal: Math.round(
      voice.professional * 0.6 +
      (100 - voice.casual) * 0.4
    ),
    playful: Math.round(
      voice.casual * 0.5 +
      voice.approachable * 0.3 +
      (100 - voice.professional) * 0.2
    ),
    bold: Math.round(
      voice.authoritative * 0.5 +
      voice.opinionated * 0.5
    ),
    experimental: Math.round(
      (100 - voice.professional) * 0.4 +
      baseTone.experimental * 0.6
    ),
  };
}

// Helper: Extract content pillars from tweet voice analysis
function extractContentPillars(tweetVoice: TweetVoiceAnalysis | null): GeneratedBrandDNA['contentPillars'] {
  if (!tweetVoice?.contentThemes?.length) return undefined;

  return tweetVoice.contentThemes
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 5)
    .map(theme => ({
      name: theme.pillar,
      frequency: theme.frequency,
      avgEngagement: theme.avgEngagement,
    }));
}

// Helper: Extract performance insights from tweet voice analysis
function extractPerformanceInsights(tweetVoice: TweetVoiceAnalysis | null): GeneratedBrandDNA['performanceInsights'] {
  if (!tweetVoice) return undefined;

  return {
    bestFormats: tweetVoice.performancePatterns.bestFormats,
    optimalLength: tweetVoice.performancePatterns.optimalLength,
    highEngagementTopics: tweetVoice.performancePatterns.highEngagementTopics,
    signaturePhrases: tweetVoice.writingStyle.signaturePhrases,
    hookPatterns: tweetVoice.writingStyle.hookPatterns,
    voiceConsistency: tweetVoice.consistencyScore,
  };
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
        extractedColors?: ExtractedColors | null;
        brandDNA: GeminiBrandDNA | null;
        tweetVoice?: TweetVoiceAnalysis | null;
      };
    } = body;

    if (!profile || !brandIdentity) {
      return NextResponse.json(
        { success: false, error: 'Profile and brand identity data required' },
        { status: 400 }
      );
    }

    const { bioLinguistics, profileImage, extractedColors, brandDNA: geminiBrandDNA, tweetVoice } = brandIdentity;

    // Generate store-compatible Brand DNA
    const colors = extractColors(extractedColors || null, profileImage, geminiBrandDNA);
    let tone = mapToToneSliders(bioLinguistics, profileImage, geminiBrandDNA);

    // If tweet voice analysis available, use it for more accurate tone
    if (tweetVoice) {
      tone = mapTweetVoiceToTone(tweetVoice, tone);
      console.log('=== USING TWEET-ENHANCED TONE ===');
    }

    const keywords = extractKeywords(bioLinguistics, geminiBrandDNA, profile);
    const { doPatterns, dontPatterns } = generatePatterns(bioLinguistics, geminiBrandDNA);
    const voiceSamples = generateVoiceSamples(profile, geminiBrandDNA);

    // Extract tweet-enhanced data
    const contentPillars = extractContentPillars(tweetVoice || null);
    const performanceInsights = extractPerformanceInsights(tweetVoice || null);
    const tweetDerivedVoice = tweetVoice ? {
      professional: tweetVoice.voiceSpectrum.professional,
      casual: tweetVoice.voiceSpectrum.casual,
      authoritative: tweetVoice.voiceSpectrum.authoritative,
      educational: tweetVoice.voiceSpectrum.educational,
      personal: tweetVoice.voiceSpectrum.personal,
    } : undefined;

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
      // Tweet-enhanced fields
      contentPillars,
      performanceInsights,
      tweetDerivedVoice,
      dataSource: tweetVoice ? 'profile-and-tweets' : 'profile-only',
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



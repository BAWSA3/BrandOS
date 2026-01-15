// =============================================================================
// X BRAND DNA GENERATOR API
// Converts X profile analysis into store-ready BrandDNA
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  XProfileData,
  BrandDNA as GeminiBrandDNA,
  BioLinguistics,
  BioVibeAnalysis,
  ProfileImageAnalysis,
  TweetVoiceAnalysis,
  analyzeBioLinguistics,
  analyzeBioVibe,
} from '@/lib/gemini';
import { BrandDNA as StoreBrandDNA } from '@/lib/types';
import { ExtractedColors, generateHarmoniousColors } from '@/lib/color-extraction';

// =============================================================================
// CRYPTO TWITTER PERSONALITY TYPES
// =============================================================================
const PERSONALITY_TYPES = {
  alpha: {
    name: 'The Alpha',
    mbti: 'ENTJ', // Commander - bold, strategic leader
    emoji: '👑',
    traits: ['confident', 'bold predictions', 'market caller', 'trend setter'],
  },
  builder: {
    name: 'The Builder',
    mbti: 'ISTP', // Virtuoso - practical, hands-on creator
    emoji: '🛠️',
    traits: ['ships products', 'technical', 'creation focused', 'pragmatic'],
  },
  educator: {
    name: 'The Educator',
    mbti: 'ENFJ', // Protagonist - inspiring teacher
    emoji: '📚',
    traits: ['breaks down complex topics', 'thread master', 'helpful', 'patient'],
  },
  degen: {
    name: 'The Degen',
    mbti: 'ESTP', // Entrepreneur - risk-taking, action-oriented
    emoji: '🎰',
    traits: ['high risk', 'ape mentality', 'meme-friendly', 'YOLO'],
  },
  analyst: {
    name: 'The Analyst',
    mbti: 'INTJ', // Architect - strategic, analytical
    emoji: '📊',
    traits: ['data-driven', 'charts', 'technical analysis', 'methodical'],
  },
  philosopher: {
    name: 'The Philosopher',
    mbti: 'INFJ', // Advocate - insightful, visionary
    emoji: '🧠',
    traits: ['big picture', 'macro views', 'thought leader', 'visionary'],
  },
  networker: {
    name: 'The Networker',
    mbti: 'ESFJ', // Consul - social connector
    emoji: '🤝',
    traits: ['community builder', 'connects people', 'social glue', 'collaborative'],
  },
  contrarian: {
    name: 'The Contrarian',
    mbti: 'ENTP', // Debater - innovative challenger
    emoji: '🔥',
    traits: ['against the crowd', 'unpopular opinions', 'provocative', 'independent'],
  },
} as const;

type PersonalityType = keyof typeof PERSONALITY_TYPES;

// Map Gemini archetypes to personality types for consistency
function mapArchetypeToPersonalityType(archetype: string | undefined): PersonalityType {
  if (!archetype) return 'builder';

  const lower = archetype.toLowerCase();

  // Direct mappings
  if (lower.includes('alpha') || lower.includes('leader') || lower.includes('king')) return 'alpha';
  if (lower.includes('builder') || lower.includes('ship') || lower.includes('maker') || lower.includes('creator')) return 'builder';
  if (lower.includes('professor') || lower.includes('educator') || lower.includes('teacher') || lower.includes('mentor')) return 'educator';
  if (lower.includes('degen') || lower.includes('ape') || lower.includes('gambler')) return 'degen';
  if (lower.includes('analyst') || lower.includes('data') || lower.includes('chart') || lower.includes('quant')) return 'analyst';
  if (lower.includes('prophet') || lower.includes('philosopher') || lower.includes('visionary') || lower.includes('sage') || lower.includes('oracle')) return 'philosopher';
  if (lower.includes('networker') || lower.includes('connector') || lower.includes('plug') || lower.includes('community')) return 'networker';
  if (lower.includes('contrarian') || lower.includes('rebel') || lower.includes('provocateur')) return 'contrarian';

  // Default fallback
  return 'builder';
}

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
  // NEW: Personality system
  personalityType: string;
  personalityEmoji: string;
  personalitySummary: string;
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
  // CONTENT-PRIMARY: Analysis reliability indicators
  analysisMode: 'content-primary' | 'limited-tweets' | 'profile-only';
  analysisConfidence: 'high' | 'medium' | 'low';
  dataLimitations?: string[];
}

export interface GenerateBrandDNAResponse {
  success: boolean;
  brandDNA: GeneratedBrandDNA | null;
  error?: string;
}

// =============================================================================
// PERSONALITY DETECTION & SUMMARY GENERATION
// =============================================================================

// Detect personality type based on CONTENT (tweets) as primary signal
// Bio vibe is used only for personality hints, not brand positioning
function detectPersonalityType(
  bioVibe: BioVibeAnalysis,
  tweetVoice: TweetVoiceAnalysis | null,
  geminiBrandDNA: GeminiBrandDNA | null
): PersonalityType {
  // CONTENT-PRIMARY: Use tweet voice as the main signal
  // If no tweets, use neutral defaults (don't infer from bio)
  const tv = tweetVoice?.voiceSpectrum || {
    professional: 50,
    casual: 50,
    authoritative: 50,
    approachable: 50,
    educational: 40,
    promotional: 30,
    personal: 50,
    opinionated: 50,
  };

  // Bio vibe only contributes minor hints (10% weight)
  const vibeBonus = {
    playful: bioVibe.vibeSpectrum.playful > 60 ? 10 : 0,
    serious: bioVibe.vibeSpectrum.serious > 60 ? 10 : 0,
    casual: bioVibe.vibeSpectrum.casual > 60 ? 10 : 0,
  };

  // Score each personality type - TWEET VOICE IS PRIMARY (70%), Gemini DNA (20%), Bio Vibe (10%)
  const scores: Record<PersonalityType, number> = {
    alpha: 0,
    builder: 0,
    educator: 0,
    degen: 0,
    analyst: 0,
    philosopher: 0,
    networker: 0,
    contrarian: 0,
  };

  // Alpha: High confidence, authoritative, opinionated content
  scores.alpha = (tv.authoritative * 0.50) +
    (tv.opinionated * 0.35) +
    (vibeBonus.serious * 0.15);

  // Builder: Technical, professional, practical content
  scores.builder = (tv.professional * 0.50) +
    ((100 - tv.casual) * 0.30) +
    (geminiBrandDNA?.differentiationScore || 50) * 0.20;

  // Educator: Educational content, helpful, clear explanations
  scores.educator = (tv.educational * 0.60) +
    (tv.approachable * 0.25) +
    ((100 - tv.promotional) * 0.15);

  // Degen: Playful, casual, high energy content
  scores.degen = (tv.casual * 0.40) +
    ((100 - tv.professional) * 0.30) +
    (vibeBonus.playful * 0.20) +
    (bioVibe.emojiCount * 5);

  // Analyst: Data-focused, methodical, professional content
  scores.analyst = (tv.professional * 0.45) +
    ((100 - tv.casual) * 0.30) +
    (tv.authoritative * 0.25);

  // Philosopher: Big picture, thoughtful, visionary content
  scores.philosopher = (tv.educational * 0.35) +
    (tv.authoritative * 0.35) +
    (geminiBrandDNA?.differentiationScore || 50) * 0.30;

  // Networker: Community-focused, approachable, collaborative content
  scores.networker = (tv.approachable * 0.50) +
    (tv.personal * 0.30) +
    ((100 - tv.authoritative) * 0.20);

  // Contrarian: Opinionated, independent, provocative content
  scores.contrarian = (tv.opinionated * 0.55) +
    (tv.authoritative * 0.25) +
    ((100 - tv.approachable) * 0.20);

  // Find highest scoring personality
  let maxScore = 0;
  let detected: PersonalityType = 'builder';

  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detected = type as PersonalityType;
    }
  }

  return detected;
}

// Generate AI personality summary using Claude API
// CONTENT-PRIMARY: Uses tweet voice for context, not bio
async function generatePersonalitySummary(
  profile: XProfileData,
  personalityType: PersonalityType,
  archetypeName: string, // The actual Gemini archetype name to use in the summary
  bioVibe: BioVibeAnalysis,
  tweetVoice: TweetVoiceAnalysis | null,
  tone: { minimal: number; playful: number; bold: number; experimental: number }
): Promise<string> {
  const personality = PERSONALITY_TYPES[personalityType];

  // CONTENT-PRIMARY: Derive voice context from tweets, not bio
  const tv = tweetVoice?.voiceSpectrum;
  const voiceContext = tv ? {
    formality: tv.professional > 60 ? 'formal' : 'casual',
    energy: tv.authoritative > 60 ? 'high-energy' : 'measured',
    style: tv.casual > 50 ? 'conversational' : 'polished',
  } : {
    // Fallback to neutral if no tweets (don't use bio)
    formality: 'balanced',
    energy: 'measured',
    style: 'varied',
  };

  // Extract content-specific signals
  const contentPillars = tweetVoice?.contentThemes?.map(t => t.pillar).slice(0, 3) || [];
  const signaturePhrases = tweetVoice?.writingStyle?.signaturePhrases?.slice(0, 3) || [];
  const highEngagementTopics = tweetVoice?.performancePatterns?.highEngagementTopics?.slice(0, 3) || [];

  // Build context for AI - CONTENT-PRIMARY
  const context = {
    name: profile.name || profile.username,
    personality: archetypeName,
    traits: personality.traits,
    voice: voiceContext,
    followers: profile.public_metrics?.followers_count || 0,
    voiceConsistency: tweetVoice?.consistencyScore || 75,
    contentPillars,
    signaturePhrases,
    highEngagementTopics,
    tone,
  };

  try {
    // Call Claude API for summary generation
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 250,
        messages: [
          {
            role: 'user',
            content: `You are BrandOS, a Brand Guardian AI. Write a 3-sentence brand analysis for ${context.name}:

Their personality type: ${context.personality}
Key traits: ${context.traits.join(', ')}
Voice style (from their CONTENT): ${context.voice.formality}, ${context.voice.energy}, ${context.voice.style}
Content pillars (what they post about): ${context.contentPillars.length > 0 ? context.contentPillars.join(', ') : 'varied topics'}
Signature phrases they use: ${context.signaturePhrases.length > 0 ? context.signaturePhrases.join(', ') : 'none detected'}
High engagement topics: ${context.highEngagementTopics.length > 0 ? context.highEngagementTopics.join(', ') : 'varied'}
Follower count: ${context.followers.toLocaleString()}
Voice consistency: ${context.voiceConsistency}%

Structure your 3 sentences exactly like this:
Sentence 1: A positive observation about their CONTENT patterns and what makes them effective (reference their actual content themes, not their bio)
Sentence 2: Point out ONE specific weakness or gap in their CONTENT strategy based on their metrics. Be direct about what's holding them back.
Sentence 3: Give ONE concrete, actionable step they can take THIS WEEK to fix that weakness. Be specific (e.g., "Pin your best thread to your profile" not "improve your content").

Write in second person ("You..."). Be direct and specific—no fluff. Reference their actual content patterns, NOT their bio text. No quotes around the response.`,
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.content?.[0]?.text || generateFallbackSummary(personalityType, archetypeName, context);
    }
  } catch (error) {
    console.error('Claude API error:', error);
  }

  // Fallback to template-based summary
  return generateFallbackSummary(personalityType, archetypeName, context);
}

// Fallback summary templates with criticism and actionable steps
function generateFallbackSummary(
  personalityType: PersonalityType,
  archetypeName: string, // Use actual archetype name in the summary
  context: { name: string; followers: number; voiceConsistency: number; contentPillars?: string[]; signaturePhrases?: string[]; highEngagementTopics?: string[] }
): string {
  // Determine the weakness based on voice consistency
  const consistencyIssue = context.voiceConsistency < 70
    ? `your ${context.voiceConsistency}% voice consistency signals scattered messaging—people can't pin down what you're about`
    : context.voiceConsistency < 85
    ? `at ${context.voiceConsistency}% voice consistency, there's room to sharpen your message for stronger recall`
    : `even with ${context.voiceConsistency}% consistency, your growth has plateaued—time to expand your reach`;

  // Templates use the actual archetype name for consistency with displayed card
  const templates: Record<PersonalityType, string> = {
    alpha: `You are ${archetypeName}—you lead with conviction and your bold takes cut through the noise. But ${consistencyIssue}. Fix this: Write down your 3 non-negotiable topics and delete any draft that doesn't hit one of them.`,
    builder: `You are ${archetypeName}—you ship while others talk, and your technical depth has built real credibility. But ${consistencyIssue}. Fix this: Create a pinned thread showcasing your 3 best builds with clear before/after results.`,
    educator: `You are ${archetypeName}—you turn complexity into clarity, and people trust you to break things down. But ${consistencyIssue}. Fix this: Batch your educational threads into a series with consistent formatting—same hook style, same structure, same CTA.`,
    degen: `You are ${archetypeName}—you embrace the chaos and your community loves the energy. But ${consistencyIssue}. Fix this: Pick ONE chain or protocol to be known for this month. Go deep, not wide.`,
    analyst: `You are ${archetypeName}—data doesn't lie and neither do you, your methodical approach has built serious credibility. But ${consistencyIssue}. Fix this: Start every analysis with a TL;DR prediction at the top. Make your stance impossible to miss.`,
    philosopher: `You are ${archetypeName}—you see the forest while others argue about trees, your macro perspective sets you apart. But ${consistencyIssue}. Fix this: Turn your biggest idea into a 10-tweet thread with one clear takeaway. Repeat it weekly until it sticks.`,
    networker: `You are ${archetypeName}—you're the connective tissue of the timeline, approachable and community-first. But ${consistencyIssue}. Fix this: Create a "People to follow" thread featuring 5 accounts weekly. Become the curator, not just the connector.`,
    contrarian: `You are ${archetypeName}—you say what others won't and your audience values your independent thinking. But ${consistencyIssue}. Fix this: Keep a "receipts" doc of your past calls. When one hits, quote-tweet yourself with proof.`,
  };

  return templates[personalityType];
}

// Helper: Extract dominant color from profile image analysis
function extractColors(
  extractedColors: ExtractedColors | null,
  imageAnalysis: ProfileImageAnalysis | null,
  geminiBrandDNA: GeminiBrandDNA | null
): { primary: string; secondary: string; accent: string } {
  // Priority 1: From programmatic color extraction (colorthief)
  if (extractedColors && extractedColors.palette && extractedColors.palette.length > 0) {
    console.log('=== USING EXTRACTED COLORS FROM PFP ===');
    console.log('Extracted palette:', extractedColors.palette);
    return {
      primary: extractedColors.primary,
      secondary: extractedColors.secondary,
      accent: extractedColors.accent,
    };
  }

  // Priority 2: From Gemini image analysis - use harmonious color generation
  if (imageAnalysis?.dominantColors && imageAnalysis.dominantColors.length >= 1) {
    const primaryHex = imageAnalysis.dominantColors[0]?.hex || '#0047FF';
    const { secondary, accent } = generateHarmoniousColors(primaryHex);
    console.log('=== USING GEMINI COLORS WITH HARMONIOUS GENERATION ===');
    console.log('Primary:', primaryHex, 'Secondary:', secondary, 'Accent:', accent);
    return {
      primary: primaryHex,
      secondary,
      accent,
    };
  }

  // Priority 3: From Gemini brand DNA analysis - use harmonious color generation
  if (geminiBrandDNA?.primaryColor?.hex) {
    const primaryHex = geminiBrandDNA.primaryColor.hex;
    const { secondary, accent } = generateHarmoniousColors(primaryHex);
    console.log('=== USING BRAND DNA COLORS WITH HARMONIOUS GENERATION ===');
    console.log('Primary:', primaryHex, 'Secondary:', secondary, 'Accent:', accent);
    return {
      primary: primaryHex,
      secondary,
      accent,
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

    // CONTENT-PRIMARY: Generate bio vibe for personality hints only (not brand positioning)
    const bioVibe = analyzeBioVibe(profile.description || '');

    // Detect personality type - CONTENT-PRIMARY approach
    // If tweets available, use content-based detection; otherwise fall back to Gemini archetype
    const detectedPersonalityType = tweetVoice
      ? detectPersonalityType(bioVibe, tweetVoice, geminiBrandDNA)
      : mapArchetypeToPersonalityType(geminiBrandDNA?.archetype);

    const personality = PERSONALITY_TYPES[detectedPersonalityType];
    const archetypeName = geminiBrandDNA?.archetype || personality.name; // Use actual Gemini archetype name

    // Generate AI summary using content context (not bio)
    const personalitySummary = await generatePersonalitySummary(
      profile,
      detectedPersonalityType,
      archetypeName,
      bioVibe, // CONTENT-PRIMARY: Use bio vibe, not bio linguistics
      tweetVoice || null,
      tone
    );

    console.log('=== PERSONALITY MAPPED FROM ARCHETYPE ===');
    console.log('Gemini Archetype:', geminiBrandDNA?.archetype);
    console.log('Mapped To:', personality.name);
    console.log('Summary:', personalitySummary.substring(0, 100) + '...');

    // CONTENT-PRIMARY: Compute analysis mode and confidence
    const contentThemesCount = tweetVoice?.contentThemes?.length || 0;
    const voiceConsistency = tweetVoice?.consistencyScore || 0;

    let analysisMode: 'content-primary' | 'limited-tweets' | 'profile-only';
    let analysisConfidence: 'high' | 'medium' | 'low';
    const dataLimitations: string[] = [];

    if (tweetVoice && contentThemesCount >= 3 && voiceConsistency > 50) {
      // Strong content signal
      analysisMode = 'content-primary';
      analysisConfidence = voiceConsistency > 70 ? 'high' : 'medium';
    } else if (tweetVoice) {
      // Some tweets but limited content themes or low consistency
      analysisMode = 'limited-tweets';
      analysisConfidence = 'medium';
      if (contentThemesCount < 3) {
        dataLimitations.push('Limited content themes detected - consider posting more diverse content');
      }
      if (voiceConsistency < 50) {
        dataLimitations.push('Voice inconsistency detected across tweets - consider establishing consistent topics');
      }
    } else {
      // No tweet data
      analysisMode = 'profile-only';
      analysisConfidence = 'low';
      dataLimitations.push('No tweet data available - analysis based on profile only');
    }

    console.log(`=== ANALYSIS MODE: ${analysisMode} (confidence: ${analysisConfidence}) ===`);
    if (dataLimitations.length > 0) {
      console.log('Data limitations:', dataLimitations.join('; '));
    }

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
      // Personality system (Brand Guardian) - use MBTI code for clarity
      personalityType: personality.mbti,
      personalityEmoji: personality.emoji,
      personalitySummary,
      voiceProfile: geminiBrandDNA?.voiceProfile?.primary || 'Authentic Voice',
      targetAudience: geminiBrandDNA?.targetAudience || 'Your community',
      inferredMission: geminiBrandDNA?.inferredMission || '',
      // Tweet-enhanced fields
      contentPillars,
      performanceInsights,
      tweetDerivedVoice,
      dataSource: tweetVoice ? 'profile-and-tweets' : 'profile-only',
      // CONTENT-PRIMARY: Analysis reliability indicators
      analysisMode,
      analysisConfidence,
      dataLimitations: dataLimitations.length > 0 ? dataLimitations : undefined,
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





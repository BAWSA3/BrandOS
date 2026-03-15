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
  analyzeBioVibe,
} from '@/lib/gemini';
import { BrandDNA as StoreBrandDNA } from '@/lib/types';
import { ExtractedColors, generateHarmoniousColors } from '@/lib/color-extraction';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';

// =============================================================================
// CRYPTO TWITTER PERSONALITY TYPES
// =============================================================================
const PERSONALITY_TYPES = {
  foresight: {
    name: 'FORESIGHT',
    mbti: 'INTJ',
    emoji: '🔮',
    traits: ['visionary', 'thought leader', 'strategic', 'shapes narrative'],
  },
  buildexe: {
    name: 'BUILD.EXE',
    mbti: 'ISTP',
    emoji: '🚢',
    traits: ['ships products', 'technical', 'creation focused', 'pragmatic'],
  },
  signal_sage: {
    name: 'SIGNAL_SAGE',
    mbti: 'ENFJ',
    emoji: '🎓',
    traits: ['breaks down complex topics', 'thread master', 'helpful', 'knowledge authority'],
  },
  entropy: {
    name: 'ENTROPY',
    mbti: 'ESTP',
    emoji: '🎰',
    traits: ['high risk', 'risk-taker', 'meme-friendly', 'cult builder'],
  },
  null_type: {
    name: 'NULL',
    mbti: 'INTJ',
    emoji: '👻',
    traits: ['pseudonymous', 'ideas over identity', 'mysterious', 'influential'],
  },
  freq: {
    name: 'FREQ',
    mbti: 'ESFP',
    emoji: '🎪',
    traits: ['entertainer', 'community builder', 'personality-driven', 'relatable'],
  },
  relay: {
    name: 'RELAY',
    mbti: 'ESFJ',
    emoji: '🤝',
    traits: ['super connector', 'community glue', 'brings people together', 'collaborative'],
  },
  arc: {
    name: 'ARC',
    mbti: 'ENFP',
    emoji: '🐕',
    traits: ['rising star', 'growth story', 'up-only trajectory', 'main character'],
  },
} as const;

type PersonalityType = keyof typeof PERSONALITY_TYPES;

// Map Gemini archetypes to personality types for consistency
function mapArchetypeToPersonalityType(archetype: string | undefined): PersonalityType {
  if (!archetype) return 'buildexe';

  const lower = archetype.toLowerCase();

  if (lower.includes('foresight') || lower.includes('philosopher') || lower.includes('visionary') || lower.includes('alpha') || lower.includes('analyst') || lower.includes('oracle')) return 'foresight';
  if (lower.includes('build') || lower.includes('ship') || lower.includes('maker') || lower.includes('creator')) return 'buildexe';
  if (lower.includes('signal_sage') || lower.includes('educator') || lower.includes('teacher') || lower.includes('mentor') || lower.includes('professor')) return 'signal_sage';
  if (lower.includes('entropy') || lower.includes('degen') || lower.includes('ape') || lower.includes('gambler') || lower.includes('contrarian')) return 'entropy';
  if (lower.includes('null') || lower.includes('anon') || lower.includes('pseudonym')) return 'null_type';
  if (lower.includes('freq') || lower.includes('vibe') || lower.includes('entertainer')) return 'freq';
  if (lower.includes('relay') || lower.includes('networker') || lower.includes('connector') || lower.includes('plug') || lower.includes('community')) return 'relay';
  if (lower.includes('arc') || lower.includes('underdog') || lower.includes('rising')) return 'arc';

  return 'buildexe';
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
    foresight: 0,
    buildexe: 0,
    signal_sage: 0,
    entropy: 0,
    null_type: 0,
    freq: 0,
    relay: 0,
    arc: 0,
  };

  // FORESIGHT: Big picture, visionary, strategic, authoritative content
  scores.foresight = (tv.authoritative * 0.45) +
    (tv.educational * 0.25) +
    (geminiBrandDNA?.differentiationScore || 50) * 0.30;

  // BUILD.EXE: Technical, professional, practical content
  scores.buildexe = (tv.professional * 0.50) +
    ((100 - tv.casual) * 0.30) +
    (geminiBrandDNA?.differentiationScore || 50) * 0.20;

  // SIGNAL_SAGE: Educational content, helpful, clear explanations
  scores.signal_sage = (tv.educational * 0.60) +
    (tv.approachable * 0.25) +
    ((100 - tv.promotional) * 0.15);

  // ENTROPY: Playful, casual, high energy, risk-taking content
  scores.entropy = (tv.casual * 0.35) +
    ((100 - tv.professional) * 0.25) +
    (tv.opinionated * 0.20) +
    (vibeBonus.playful * 0.10) +
    (bioVibe.emojiCount * 5);

  // NULL: Mysterious, ideas-focused, less personal content
  scores.null_type = ((100 - tv.personal) * 0.40) +
    (tv.authoritative * 0.30) +
    ((100 - tv.approachable) * 0.30);

  // FREQ: Entertaining, personality-driven, community builder
  scores.freq = (tv.casual * 0.35) +
    (tv.approachable * 0.30) +
    (tv.personal * 0.20) +
    (vibeBonus.playful * 0.15);

  // RELAY: Community-focused, approachable, collaborative content
  scores.relay = (tv.approachable * 0.50) +
    (tv.personal * 0.30) +
    ((100 - tv.authoritative) * 0.20);

  // ARC: Rising star, opinionated, growing presence
  scores.arc = (tv.opinionated * 0.40) +
    (tv.casual * 0.25) +
    ((100 - tv.authoritative) * 0.15) +
    (vibeBonus.casual * 0.20);

  // Find highest scoring personality
  let maxScore = 0;
  let detected: PersonalityType = 'buildexe';

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
    foresight: `You are ${archetypeName}—you see the forest while others argue about trees, your macro perspective and strategic vision set you apart. But ${consistencyIssue}. Fix this: Turn your biggest idea into a 10-tweet thread with one clear takeaway. Repeat it weekly until it sticks.`,
    buildexe: `You are ${archetypeName}—you ship while others talk, and your technical depth has built real credibility. But ${consistencyIssue}. Fix this: Create a pinned thread showcasing your 3 best builds with clear before/after results.`,
    signal_sage: `You are ${archetypeName}—you turn complexity into clarity, and people trust you to break things down. But ${consistencyIssue}. Fix this: Batch your educational threads into a series with consistent formatting—same hook style, same structure, same CTA.`,
    entropy: `You are ${archetypeName}—you embrace the chaos and your community loves the energy. But ${consistencyIssue}. Fix this: Pick ONE chain or protocol to be known for this month. Go deep, not wide.`,
    null_type: `You are ${archetypeName}—your ideas speak louder than identity, and your mysterious presence creates intrigue. But ${consistencyIssue}. Fix this: Write down your 3 non-negotiable topics and delete any draft that doesn't hit one of them.`,
    freq: `You are ${archetypeName}—your personality is your brand, and your community vibes with your energy. But ${consistencyIssue}. Fix this: Create a recurring format (daily take, weekly roundup) that your audience can count on showing up.`,
    relay: `You are ${archetypeName}—you're the connective tissue of the timeline, approachable and community-first. But ${consistencyIssue}. Fix this: Create a "People to follow" thread featuring 5 accounts weekly. Become the curator, not just the connector.`,
    arc: `You are ${archetypeName}—your growth story is your superpower and people are watching your trajectory. But ${consistencyIssue}. Fix this: Keep a "receipts" doc of your past calls. When one hits, quote-tweet yourself with proof.`,
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
// Uses image analysis and Gemini brand DNA — bio is NOT used as a brand signal
function mapToToneSliders(
  imageAnalysis: ProfileImageAnalysis | null,
  geminiBrandDNA: GeminiBrandDNA | null
): { minimal: number; playful: number; bold: number; experimental: number } {
  const imageStyle = imageAnalysis?.styleSignals;

  // Use Gemini brand DNA scores and image signals (no bio)
  const coherence = geminiBrandDNA?.coherenceScore || 50;
  const differentiation = geminiBrandDNA?.differentiationScore || 50;
  const memorability = geminiBrandDNA?.memorabilityScore || 50;

  return {
    minimal: Math.round(
      (coherence * 0.4 +
        (imageStyle?.minimal || 50) * 0.6)
    ),
    playful: Math.round(
      ((100 - coherence) * 0.3 +
        (imageStyle?.playful || 50) * 0.4 +
        (memorability > 70 ? 60 : 40) * 0.3)
    ),
    bold: Math.round(
      (differentiation * 0.4 +
        (imageStyle?.bold || 50) * 0.6)
    ),
    experimental: Math.round(
      (differentiation * 0.5 +
        (imageStyle?.minimal ? (100 - imageStyle.minimal) : 50) * 0.2 +
        (memorability * 0.3))
    ),
  };
}

// Helper: Extract keywords from analysis
function extractKeywords(
  geminiBrandDNA: GeminiBrandDNA | null,
  profile: XProfileData
): string[] {
  const keywords: string[] = [];

  // From Gemini brand DNA
  if (geminiBrandDNA?.brandKeywords) {
    keywords.push(...geminiBrandDNA.brandKeywords.slice(0, 6));
  }

  // From archetype
  if (geminiBrandDNA?.archetype) {
    keywords.push(geminiBrandDNA.archetype.toLowerCase());
  }

  // Dedupe and limit
  return [...new Set(keywords)].slice(0, 8);
}

// Helper: Generate do/don't patterns from analysis
// Derived from Gemini brand DNA and tweet voice — not bio
function generatePatterns(
  geminiBrandDNA: GeminiBrandDNA | null,
  tweetVoice?: TweetVoiceAnalysis | null
): { doPatterns: string[]; dontPatterns: string[] } {
  const doPatterns: string[] = [];
  const dontPatterns: string[] = [];

  // Use tweet voice if available, otherwise use Gemini brand DNA voice
  const voice = tweetVoice?.voiceSpectrum;

  if (voice) {
    if (voice.professional > 60) {
      doPatterns.push('Use professional, credible language');
      dontPatterns.push('Avoid slang and casual abbreviations');
    } else {
      doPatterns.push('Keep it conversational and approachable');
      dontPatterns.push('Avoid corporate jargon');
    }

    if (voice.authoritative > 60) {
      doPatterns.push('Lead with expertise and authority');
      dontPatterns.push('Avoid hedging language (maybe, perhaps)');
    }

    if (voice.casual > 50) {
      doPatterns.push('Include personality and humor');
    } else {
      dontPatterns.push('Avoid excessive emojis or informal language');
    }
  } else {
    // Defaults when no tweet voice is available
    doPatterns.push('Stay consistent with your content voice');
    dontPatterns.push('Avoid drifting between too many different tones');
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
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profile,
      brandIdentity,
    }: {
      profile: XProfileData;
      brandIdentity: {
        bioLinguistics?: BioLinguistics;
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

    const { profileImage, extractedColors, brandDNA: geminiBrandDNA, tweetVoice } = brandIdentity;

    // Generate store-compatible Brand DNA
    const colors = extractColors(extractedColors || null, profileImage, geminiBrandDNA);
    let tone = mapToToneSliders(profileImage, geminiBrandDNA);

    // If tweet voice analysis available, use it for more accurate tone
    if (tweetVoice) {
      tone = mapTweetVoiceToTone(tweetVoice, tone);
      console.log('=== USING TWEET-ENHANCED TONE ===');
    }

    const keywords = extractKeywords(geminiBrandDNA, profile);
    const { doPatterns, dontPatterns } = generatePatterns(geminiBrandDNA, tweetVoice);
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

    // Brand = Reputation: Bio is not a brand signal. Pass empty for neutral defaults.
    const bioVibe = analyzeBioVibe('');

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
      archetype: geminiBrandDNA?.archetype || 'BUILD.EXE',
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

export const POST = withRateLimit(handlePost, rateLimiters.ai);

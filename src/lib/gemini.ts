import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Models
export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
export const geminiPro = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Types for generation results
export interface GeneratedImage {
  base64: string;
  mimeType: string;
  prompt: string;
}

export interface GeneratedContent {
  text: string;
  prompt: string;
}

export interface ColorPalette {
  colors: {
    name: string;
    hex: string;
    role: string;
  }[];
  description: string;
}

// Helper to convert base64 to data URL
export function base64ToDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

// Brand-focused prompt templates
export const brandPrompts = {
  logo: (brandName: string, style: string, description: string) => `
Create a professional logo design for "${brandName}".
Style: ${style}
Description: ${description}

Requirements:
- Clean, scalable design suitable for a brand logo
- Modern and professional aesthetic
- Works well at various sizes
- Simple enough to be memorable
- No text in the image unless specifically requested
`,

  brandImagery: (brandName: string, style: string, description: string) => `
Create brand imagery for "${brandName}".
Style: ${style}
Description: ${description}

Requirements:
- Professional quality suitable for marketing materials
- Consistent with modern brand aesthetics
- Evocative and memorable
- Can be used across various platforms
`,

  icon: (purpose: string, style: string) => `
Create a minimalist icon for: ${purpose}
Style: ${style}

Requirements:
- Simple, clean design
- Works at 24x24px and larger
- Single color friendly
- Clear meaning at small sizes
`,

  socialGraphic: (brandName: string, platform: string, message: string) => `
Create a social media graphic for "${brandName}" for ${platform}.
Message/Theme: ${message}

Requirements:
- Platform-appropriate dimensions
- Eye-catching but professional
- On-brand aesthetic
- Clear visual hierarchy
`,

  colorPalette: (brandDescription: string, mood: string, industry: string) => `
Generate a comprehensive brand color palette for a ${industry} brand.
Brand Description: ${brandDescription}
Desired Mood: ${mood}

Provide exactly 6 colors with:
1. Primary color - main brand color
2. Secondary color - complementary to primary
3. Accent color - for CTAs and highlights
4. Background color - main background
5. Surface color - cards and elevated surfaces
6. Text color - primary text

For each color, provide:
- A descriptive name
- Hex code
- Its role in the brand system

Format as JSON:
{
  "colors": [
    {"name": "Color Name", "hex": "#XXXXXX", "role": "primary/secondary/accent/background/surface/text"}
  ],
  "description": "Brief description of the palette"
}
`,

  tagline: (brandName: string, industry: string, values: string[]) => `
Generate 5 tagline options for "${brandName}", a ${industry} brand.
Brand values: ${values.join(', ')}

Requirements:
- Memorable and concise (3-7 words each)
- Captures the brand essence
- Unique and not generic
- Easy to say and remember

Format as numbered list.
`,

  brandVoice: (brandName: string, tone: string, audience: string) => `
Generate 3 example brand voice samples for "${brandName}".
Tone: ${tone}
Target Audience: ${audience}

Create samples for:
1. A product announcement
2. A customer support response
3. A social media post

Each should be 2-3 sentences and exemplify the brand voice.
`,
};

// Utility to check if API key is configured
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// Visual Engine Prompts
export const visualEnginePrompts = {
  animation: (
    brandName: string,
    tone: { minimal: number; playful: number; bold: number; experimental: number },
    context: string,
    description?: string
  ) => `
You are a motion design expert creating animation specifications for "${brandName}".

BRAND TONE (0-100 scale):
- Minimal: ${tone.minimal}/100
- Playful: ${tone.playful}/100
- Bold: ${tone.bold}/100
- Experimental: ${tone.experimental}/100

ANIMATION CONTEXT: ${context}
${description ? `ADDITIONAL NOTES: ${description}` : ''}

Based on the brand tone, generate an animation concept. Consider:
- High minimal = shorter durations, subtle movements, ease-out curves
- High playful = bouncy easings, overshoots, longer durations
- High bold = snappy, impactful, strong contrast in states
- High experimental = unconventional timing, creative keyframes

Return ONLY valid JSON:
{
  "name": "Animation name (2-4 words)",
  "description": "Brief description of the animation feel",
  "timing": {
    "duration": "e.g., 200ms, 0.3s",
    "delay": "optional delay",
    "easing": "easing name (ease-out, cubic-bezier, spring, etc.)",
    "easingCurve": "cubic-bezier values if applicable"
  },
  "keyframes": [
    { "step": "0%", "properties": { "opacity": "0", "transform": "translateY(10px)" } },
    { "step": "100%", "properties": { "opacity": "1", "transform": "translateY(0)" } }
  ],
  "cssCode": "@keyframes animationName { ... } or transition property",
  "framerMotionCode": "{ initial: {...}, animate: {...}, transition: {...} }",
  "brandAlignment": "How this animation reflects the brand tone"
}`,

  uiStyle: (
    brandName: string,
    colors: { primary: string; secondary: string; accent: string },
    tone: { minimal: number; playful: number; bold: number; experimental: number },
    componentType: string
  ) => `
You are a UI/UX designer creating component styles for "${brandName}".

BRAND COLORS:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}

BRAND TONE (0-100 scale):
- Minimal: ${tone.minimal}/100
- Playful: ${tone.playful}/100
- Bold: ${tone.bold}/100
- Experimental: ${tone.experimental}/100

COMPONENT TYPE: ${componentType}

Generate a complete style specification for this component. Consider:
- High minimal = less border-radius, subtle shadows, clean lines
- High playful = larger radius, colorful accents, friendly feel
- High bold = strong contrast, prominent shadows, impactful presence
- High experimental = unique shapes, gradients, unconventional styling

Return ONLY valid JSON:
{
  "name": "${componentType} style name",
  "description": "Brief description of the style",
  "baseStyles": {
    "borderRadius": "e.g., 4px, 12px, 9999px",
    "padding": "e.g., 12px 24px",
    "fontSize": "e.g., 14px",
    "fontWeight": "e.g., 500",
    "letterSpacing": "e.g., 0.02em (optional)"
  },
  "colors": {
    "background": "#hex",
    "text": "#hex",
    "border": "#hex (optional)",
    "shadow": "rgba(...) (optional)"
  },
  "states": {
    "hover": { "background": "#hex", "transform": "..." },
    "active": { "transform": "scale(0.98)" },
    "focus": { "boxShadow": "0 0 0 3px rgba(...)" },
    "disabled": { "opacity": "0.5", "cursor": "not-allowed" }
  },
  "cssVariables": {
    "--btn-bg": "#hex",
    "--btn-text": "#hex",
    "--btn-radius": "8px"
  },
  "tailwindClasses": "bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 ...",
  "brandAlignment": "How this style reflects the brand"
}`,

  pattern: (
    brandName: string,
    colors: { primary: string; secondary: string; accent: string },
    patternType: string,
    density?: string
  ) => `
You are a graphic designer creating background patterns for "${brandName}".

BRAND COLORS:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}

PATTERN TYPE: ${patternType}
${density ? `DENSITY: ${density}` : ''}

Generate a background pattern specification. The pattern should be:
- Subtle enough to not distract from content
- On-brand with the color palette
- Scalable and tileable

Return ONLY valid JSON:
{
  "name": "Pattern name",
  "description": "Brief description of the pattern",
  "cssCode": "Full CSS for the pattern (background, background-image, etc.)",
  "svgCode": "SVG pattern code if applicable (for geometric patterns)",
  "colors": ["#hex1", "#hex2"],
  "opacity": 0.1 to 1.0,
  "scale": "e.g., 20px, 50px (pattern repeat size)",
  "brandAlignment": "How this pattern reflects the brand"
}`,

  icons: (
    brandName: string,
    tone: { minimal: number; playful: number; bold: number; experimental: number },
    style: string,
    category: string,
    iconList: string[]
  ) => `
You are an icon designer creating a cohesive icon set for "${brandName}".

BRAND TONE (0-100 scale):
- Minimal: ${tone.minimal}/100
- Playful: ${tone.playful}/100
- Bold: ${tone.bold}/100
- Experimental: ${tone.experimental}/100

ICON STYLE: ${style}
CATEGORY: ${category}
ICONS NEEDED: ${iconList.join(', ')}

Generate icon specifications. Consider:
- High minimal = thin strokes, simple shapes, geometric
- High playful = rounded corners, friendly shapes, slight irregularity
- High bold = thick strokes, strong presence, filled elements
- High experimental = unique interpretations, creative metaphors

Return ONLY valid JSON:
{
  "name": "${category} icon set",
  "style": "${style}",
  "category": "${category}",
  "icons": [
    {
      "name": "icon-name",
      "purpose": "What this icon represents",
      "svgCode": "<svg viewBox='0 0 24 24' ...>...</svg>"
    }
  ],
  "strokeWidth": "e.g., 1.5px, 2px",
  "cornerRadius": "e.g., 2px for rounded corners",
  "brandAlignment": "How these icons reflect the brand"
}`,

  motionBrief: (
    brandName: string,
    tone: { minimal: number; playful: number; bold: number; experimental: number },
    keywords: string[]
  ) => `
You are a motion design director creating a comprehensive motion design brief for "${brandName}".

BRAND TONE (0-100 scale):
- Minimal: ${tone.minimal}/100
- Playful: ${tone.playful}/100
- Bold: ${tone.bold}/100
- Experimental: ${tone.experimental}/100

BRAND KEYWORDS: ${keywords.join(', ')}

Create a motion design system document that translates the brand personality into animation language.

Return ONLY valid JSON:
{
  "philosophy": "One paragraph describing the brand's motion philosophy",
  "principles": [
    {
      "name": "Principle name (e.g., 'Purposeful Movement')",
      "description": "What this principle means",
      "example": "Concrete example of applying this principle"
    }
  ],
  "timingGuidelines": {
    "microInteractions": "e.g., 100-200ms for hovers, button presses",
    "transitions": "e.g., 200-400ms for page elements",
    "pageAnimations": "e.g., 400-600ms for larger movements",
    "loading": "e.g., looping animations at 1-2s cycles"
  },
  "easingPreferences": {
    "primary": "Main easing function with cubic-bezier",
    "secondary": "Alternative easing for variety",
    "avoid": ["List of easings that don't fit the brand"]
  },
  "doRules": ["Motion do's for this brand"],
  "dontRules": ["Motion don'ts for this brand"],
  "codeSnippets": [
    {
      "name": "Snippet name",
      "description": "When to use this",
      "code": "CSS or Framer Motion code"
    }
  ]
}`,
};

// =============================================================================
// X BRAND SCORE ANALYSIS
// =============================================================================

export interface XProfileData {
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  created_at?: string;
  verified?: boolean;
  location?: string;
  url?: string;
}

export interface CreatorArchetype {
  primary: string;
  emoji: string;
  tagline: string;
  description: string;
  strengths: string[];
  growthTip: string;
}

export interface XBrandScore {
  overallScore: number;
  phases: {
    define: { score: number; insights: string[] };
    check: { score: number; insights: string[] };
    generate: { score: number; insights: string[] };
    scale: { score: number; insights: string[] };
  };
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
  archetype: CreatorArchetype;
  influenceTier?: 'emerging' | 'established' | 'notable' | 'influential' | 'elite';
  cryptoContext?: boolean;
}

// =============================================================================
// ENHANCED ANALYSIS WITH TWEETS (Requires X API Basic Tier)
// =============================================================================

export interface TweetData {
  text: string;
  created_at: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions?: number;
}

export interface TweetAnalysisStats {
  totalTweets: number;
  avgEngagementRate: number;
  avgLikes: number;
  avgRetweets: number;
  avgReplies: number;
  topHashtags: string[];
  postingFrequency: string;
  mostActiveHour: number;
  mostActiveDay: string;
}

export interface ContentPatterns {
  avgTweetLength: number;
  emojiUsage: number;
  questionTweets: number;
  threadStarters: number;
  mediaUsage: number;
}

export interface EnhancedBrandScore extends XBrandScore {
  // Enhanced metrics (requires tweets)
  voiceAnalysis?: {
    toneBreakdown: { professional: number; casual: number; playful: number; authoritative: number };
    consistencyScore: number;
    signaturePhrases: string[];
    avgReadingLevel: string;
  };
  contentPerformance?: {
    engagementRate: number;
    bestPerformingType: string;
    optimalPostingTime: string;
    hookEffectiveness: number;
  };
  growthMetrics?: {
    velocityTrend: 'accelerating' | 'stable' | 'declining';
    audienceQuality: number;
    viralityScore: number;
    amplificationNetwork: string[];
  };
  contentSuggestions?: string[];
}

// Helper to detect crypto/web3 signals in a profile
function detectCryptoSignals(profile: XProfileData): {
  isCrypto: boolean;
  signals: string[];
} {
  const signals: string[] = [];
  const bio = (profile.description || '').toLowerCase();
  const name = profile.name.toLowerCase();
  const username = profile.username.toLowerCase();
  const url = (profile.url || '').toLowerCase();

  // ENS domain detection
  if (bio.includes('.eth') || name.includes('.eth') || username.includes('.eth')) {
    signals.push('ENS domain present');
  }

  // Web3 keywords
  const web3Keywords = ['web3', 'crypto', 'blockchain', 'defi', 'nft', 'dao', 'token', 'degen', 'wagmi', 'gm', 'fren', 'hodl', 'ape', 'moon', 'rekt', 'ser', 'anon', 'based', 'chad'];
  web3Keywords.forEach(kw => {
    if (bio.includes(kw)) signals.push(`Web3 keyword: ${kw}`);
  });

  // Discord/Telegram links
  if (bio.includes('discord') || bio.includes('t.me') || bio.includes('telegram')) {
    signals.push('Community links (Discord/Telegram)');
  }

  // Wallet address pattern (0x...)
  if (/0x[a-fA-F0-9]{40}/.test(bio)) {
    signals.push('Wallet address in bio');
  }

  // Crypto project indicators
  if (bio.includes('founder') && (bio.includes('protocol') || bio.includes('labs') || bio.includes('dao'))) {
    signals.push('Crypto project founder');
  }

  // Chain mentions
  const chains = ['ethereum', 'solana', 'bitcoin', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'cosmos'];
  chains.forEach(chain => {
    if (bio.includes(chain)) signals.push(`Chain mention: ${chain}`);
  });

  return {
    isCrypto: signals.length >= 2,
    signals: [...new Set(signals)].slice(0, 5), // Dedupe and limit
  };
}

// Helper to detect influence tier and authority signals
type InfluenceTier = 'emerging' | 'established' | 'notable' | 'influential' | 'elite';

interface InfluenceAnalysis {
  tier: InfluenceTier;
  tierLabel: string;
  followerTierBonus: number;
  authorityScore: number;
  signals: string[];
  isIntentionallyMinimal: boolean;
}

function analyzeInfluence(profile: XProfileData): InfluenceAnalysis {
  // Support both flat and nested metrics properties
  const followers = (profile as any).followers_count || profile.public_metrics?.followers_count || 0;
  const following = (profile as any).following_count || profile.public_metrics?.following_count || 0;
  const tweets = (profile as any).tweet_count || profile.public_metrics?.tweet_count || 0;
  const listed = (profile as any).listed_count || profile.public_metrics?.listed_count || 0;
  const bioLength = (profile.description || '').length;
  
  const signals: string[] = [];
  let authorityScore = 0;
  
  // Determine influence tier
  let tier: InfluenceTier;
  let tierLabel: string;
  let followerTierBonus: number;
  
  if (followers >= 1000000) {
    tier = 'elite';
    tierLabel = 'ELITE (1M+ followers)';
    followerTierBonus = 15;
    signals.push('Elite tier: 1M+ followers - massive reach and influence');
  } else if (followers >= 500000) {
    tier = 'influential';
    tierLabel = 'INFLUENTIAL (500K-1M followers)';
    followerTierBonus = 12;
    signals.push('Influential tier: Major presence on the platform');
  } else if (followers >= 100000) {
    tier = 'notable';
    tierLabel = 'NOTABLE (100K-500K followers)';
    followerTierBonus = 8;
    signals.push('Notable tier: Significant audience and reach');
  } else if (followers >= 10000) {
    tier = 'established';
    tierLabel = 'ESTABLISHED (10K-100K followers)';
    followerTierBonus = 4;
    signals.push('Established tier: Proven ability to build audience');
  } else {
    tier = 'emerging';
    tierLabel = 'EMERGING (Under 10K followers)';
    followerTierBonus = 0;
    signals.push('Emerging tier: Building audience');
  }
  
  // Authority signals from follower/following ratio
  const ratio = followers / Math.max(following, 1);
  if (ratio >= 100) {
    authorityScore += 25;
    signals.push(`Exceptional authority ratio: ${ratio.toFixed(0)}:1 (thought leader signal)`);
  } else if (ratio >= 50) {
    authorityScore += 20;
    signals.push(`Strong authority ratio: ${ratio.toFixed(0)}:1`);
  } else if (ratio >= 10) {
    authorityScore += 10;
    signals.push(`Healthy authority ratio: ${ratio.toFixed(1)}:1`);
  } else if (ratio >= 2) {
    authorityScore += 5;
    signals.push(`Growing authority ratio: ${ratio.toFixed(1)}:1`);
  }
  
  // Listed count authority bonus (being on lists = others curate you)
  if (listed >= 50000) {
    authorityScore += 25;
    signals.push(`Exceptional curation: ${listed.toLocaleString()} lists (top-tier thought leader)`);
  } else if (listed >= 10000) {
    authorityScore += 20;
    signals.push(`High curation: ${listed.toLocaleString()} lists (recognized authority)`);
  } else if (listed >= 1000) {
    authorityScore += 10;
    signals.push(`Strong curation: ${listed.toLocaleString()} lists (valued voice)`);
  } else if (listed >= 100) {
    authorityScore += 5;
    signals.push(`Growing curation: ${listed.toLocaleString()} lists`);
  }
  
  // Content velocity (tweets per follower suggests engagement style)
  const tweetsPerFollower = tweets / Math.max(followers, 1);
  if (tweetsPerFollower < 0.01 && followers >= 100000) {
    signals.push('Low tweet volume relative to audience = high-impact, selective posting');
    authorityScore += 5;
  }
  
  // Detect intentional minimalism (large accounts with short bios)
  // Elite/influential accounts often have minimal bios BY CHOICE
  const isIntentionallyMinimal = (
    (tier === 'elite' || tier === 'influential' || tier === 'notable') &&
    bioLength < 100 &&
    bioLength > 0
  );
  
  if (isIntentionallyMinimal) {
    signals.push('Intentional minimalism: Large account with concise bio (brand confidence)');
    authorityScore += 10;
  }
  
  return {
    tier,
    tierLabel,
    followerTierBonus,
    authorityScore: Math.min(authorityScore, 50), // Cap at 50
    signals,
    isIntentionallyMinimal,
  };
}

// ============================================================================
// Account Authenticity Analysis (Bot Detection)
// ============================================================================

export type AuthenticityTier = 'authentic' | 'some_signals' | 'suspicious' | 'likely_botted';

export interface AuthenticityAnalysis {
  score: number; // 0-100 (0 = authentic, 100 = likely bot)
  tier: AuthenticityTier;
  tierLabel: string;
  signals: {
    followerRatio: { score: number; detail: string };
    accountAge: { score: number; detail: string };
    engagement: { score: number; detail: string };
  };
  isWarning: boolean;
}

export function analyzeAccountAuthenticity(
  profile: XProfileData,
  engagementRate?: number // Optional: avg engagement rate from tweets
): AuthenticityAnalysis {
  const followers = (profile as any).followers_count || profile.public_metrics?.followers_count || 0;
  const following = (profile as any).following_count || profile.public_metrics?.following_count || 0;
  const tweets = (profile as any).tweet_count || profile.public_metrics?.tweet_count || 0;
  const createdAt = (profile as any).created_at || profile.created_at;

  let totalScore = 0;
  const signals = {
    followerRatio: { score: 0, detail: '' },
    accountAge: { score: 0, detail: '' },
    engagement: { score: 0, detail: '' },
  };

  // Signal 1: Follower/Following Ratio (0-30 points)
  // Suspicious if following >> followers
  const ratio = following / Math.max(followers, 1);
  if (ratio > 10) {
    signals.followerRatio.score = 30;
    signals.followerRatio.detail = `Following ${following.toLocaleString()} but only ${followers.toLocaleString()} followers (${ratio.toFixed(1)}:1 ratio)`;
  } else if (ratio > 5) {
    signals.followerRatio.score = 20;
    signals.followerRatio.detail = `High following/follower ratio (${ratio.toFixed(1)}:1)`;
  } else if (ratio > 3) {
    signals.followerRatio.score = 10;
    signals.followerRatio.detail = `Elevated following/follower ratio (${ratio.toFixed(1)}:1)`;
  } else {
    signals.followerRatio.score = 0;
    signals.followerRatio.detail = 'Healthy follower/following ratio';
  }
  totalScore += signals.followerRatio.score;

  // Signal 2: Account Age vs Followers (0-30 points)
  // Suspicious if new account with very high followers
  if (createdAt) {
    const accountAgeMs = Date.now() - new Date(createdAt).getTime();
    const accountAgeMonths = accountAgeMs / (1000 * 60 * 60 * 24 * 30);
    const followersPerMonth = followers / Math.max(accountAgeMonths, 1);

    if (accountAgeMonths < 6 && followers > 10000) {
      signals.accountAge.score = 30;
      signals.accountAge.detail = `Account is ${Math.floor(accountAgeMonths)} months old with ${followers.toLocaleString()} followers (unusually fast growth)`;
    } else if (followersPerMonth > 5000 && followers > 50000) {
      signals.accountAge.score = 25;
      signals.accountAge.detail = `Gaining ~${Math.floor(followersPerMonth).toLocaleString()} followers/month (very rapid growth)`;
    } else if (followersPerMonth > 2000 && followers > 20000) {
      signals.accountAge.score = 15;
      signals.accountAge.detail = `Rapid follower growth (~${Math.floor(followersPerMonth).toLocaleString()}/month)`;
    } else {
      signals.accountAge.score = 0;
      signals.accountAge.detail = 'Normal growth pattern for account age';
    }
  } else {
    signals.accountAge.score = 0;
    signals.accountAge.detail = 'Account age unavailable';
  }
  totalScore += signals.accountAge.score;

  // Signal 3: Engagement Rate (0-40 points)
  // Suspicious if high followers but very low engagement
  if (engagementRate !== undefined && followers >= 10000) {
    if (engagementRate < 0.1) {
      signals.engagement.score = 40;
      signals.engagement.detail = `Very low engagement (${engagementRate.toFixed(2)}%) for ${followers.toLocaleString()} followers`;
    } else if (engagementRate < 0.5) {
      signals.engagement.score = 25;
      signals.engagement.detail = `Low engagement rate (${engagementRate.toFixed(2)}%)`;
    } else if (engagementRate < 1) {
      signals.engagement.score = 10;
      signals.engagement.detail = `Below average engagement (${engagementRate.toFixed(2)}%)`;
    } else {
      signals.engagement.score = 0;
      signals.engagement.detail = `Healthy engagement rate (${engagementRate.toFixed(2)}%)`;
    }
  } else if (followers >= 10000 && tweets > 0) {
    // Estimate based on no engagement data available
    signals.engagement.score = 0;
    signals.engagement.detail = 'Engagement rate requires tweet analysis';
  } else {
    signals.engagement.score = 0;
    signals.engagement.detail = 'Account too small for engagement analysis';
  }
  totalScore += signals.engagement.score;

  // Determine tier
  let tier: AuthenticityTier;
  let tierLabel: string;

  if (totalScore <= 20) {
    tier = 'authentic';
    tierLabel = 'Likely Authentic';
  } else if (totalScore <= 50) {
    tier = 'some_signals';
    tierLabel = 'Some Suspicious Signals';
  } else if (totalScore <= 75) {
    tier = 'suspicious';
    tierLabel = 'Possibly Botted';
  } else {
    tier = 'likely_botted';
    tierLabel = 'Likely Botted';
  }

  return {
    score: totalScore,
    tier,
    tierLabel,
    signals,
    isWarning: totalScore > 50,
  };
}

// ============================================================================
// Activity Level Analysis
// ============================================================================

export type ActivityLevel = 'very_active' | 'active' | 'moderate' | 'inactive' | 'dormant';

export interface ActivityAnalysis {
  level: ActivityLevel;
  levelLabel: string;
  postsPerWeek: number;
  detail: string;
}

export function analyzeActivityLevel(profile: XProfileData): ActivityAnalysis {
  const tweets = (profile as any).tweet_count || profile.public_metrics?.tweet_count || 0;
  const createdAtRaw = (profile as any).created_at || profile.created_at;
  
  // Validate created_at date
  const createdAtDate = createdAtRaw ? new Date(createdAtRaw) : null;
  const isValidDate = createdAtDate && !isNaN(createdAtDate.getTime());

  // If no valid date, estimate activity based on tweet count alone
  if (!isValidDate) {
    // Fallback: estimate based on total tweet count
    // These thresholds assume typical account ages
    if (tweets >= 10000) {
      return {
        level: 'very_active',
        levelLabel: 'Very Active',
        postsPerWeek: 0,
        detail: `${tweets.toLocaleString()} total posts (highly active creator)`,
      };
    } else if (tweets >= 3000) {
      return {
        level: 'active',
        levelLabel: 'Active',
        postsPerWeek: 0,
        detail: `${tweets.toLocaleString()} total posts (established creator)`,
      };
    } else if (tweets >= 500) {
      return {
        level: 'moderate',
        levelLabel: 'Moderate',
        postsPerWeek: 0,
        detail: `${tweets.toLocaleString()} total posts`,
      };
    } else if (tweets >= 50) {
      return {
        level: 'inactive',
        levelLabel: 'Light',
        postsPerWeek: 0,
        detail: `${tweets.toLocaleString()} total posts (occasional poster)`,
      };
    } else {
      return {
        level: 'dormant',
        levelLabel: 'New/Dormant',
        postsPerWeek: 0,
        detail: tweets === 0 ? 'No posts yet' : `Only ${tweets} posts`,
      };
    }
  }

  // Calculate with valid date
  const accountAgeMs = Date.now() - createdAtDate.getTime();
  const accountAgeWeeks = accountAgeMs / (1000 * 60 * 60 * 24 * 7);
  const postsPerWeek = tweets / Math.max(accountAgeWeeks, 1);

  let level: ActivityLevel;
  let levelLabel: string;
  let detail: string;

  if (postsPerWeek >= 7) {
    level = 'very_active';
    levelLabel = 'Very Active';
    detail = `Averaging ${postsPerWeek.toFixed(1)} posts/week (daily poster)`;
  } else if (postsPerWeek >= 3) {
    level = 'active';
    levelLabel = 'Active';
    detail = `Averaging ${postsPerWeek.toFixed(1)} posts/week`;
  } else if (postsPerWeek >= 1) {
    level = 'moderate';
    levelLabel = 'Moderate';
    detail = `Averaging ${postsPerWeek.toFixed(1)} posts/week`;
  } else if (postsPerWeek >= 0.25) {
    level = 'inactive';
    levelLabel = 'Light';
    detail = `About ${(postsPerWeek * 4).toFixed(1)} posts/month`;
  } else {
    level = 'dormant';
    levelLabel = 'Dormant';
    detail = 'Rarely posts (less than monthly)';
  }

  return {
    level,
    levelLabel,
    postsPerWeek,
    detail,
  };
}

export const xBrandScorePrompt = (profile: XProfileData) => {
  const cryptoAnalysis = detectCryptoSignals(profile);
  const influenceAnalysis = analyzeInfluence(profile);
  
  // Base prompt with influence tier context
  let prompt = `You are an expert brand strategist analyzing an X (Twitter) profile. Your goal is to evaluate brand effectiveness relative to their influence tier.

PROFILE DATA:
- Display Name: ${profile.name}
- Username: @${profile.username}
- Bio: ${profile.description || '(No bio set)'}
- Bio Length: ${(profile.description || '').length} characters
- Profile Image: ${profile.profile_image_url ? 'Present' : 'Missing'}
- Followers: ${profile.public_metrics.followers_count.toLocaleString()}
- Following: ${profile.public_metrics.following_count.toLocaleString()}
- Follower/Following Ratio: ${(profile.public_metrics.followers_count / Math.max(profile.public_metrics.following_count, 1)).toFixed(1)}:1
- Tweets: ${profile.public_metrics.tweet_count.toLocaleString()}
- Listed Count: ${profile.public_metrics.listed_count.toLocaleString()} (people curated this account into lists)
${profile.location ? `- Location: ${profile.location}` : '- Location: (None)'}
${profile.url ? `- Website: ${profile.url}` : '- Website: (None)'}
- Verified Badge: ${profile.verified ? 'YES ✓ (Blue checkmark present)' : 'NO (No verification badge)'}

═══════════════════════════════════════════════════════════════════════
INFLUENCE TIER: ${influenceAnalysis.tierLabel}
═══════════════════════════════════════════════════════════════════════

AUTHORITY SIGNALS DETECTED:
${influenceAnalysis.signals.map(s => `✦ ${s}`).join('\n')}

SCORING ADJUSTMENT: +${influenceAnalysis.followerTierBonus + influenceAnalysis.authorityScore} bonus points available
- Tier Bonus: +${influenceAnalysis.followerTierBonus} (for ${influenceAnalysis.tier} tier)
- Authority Bonus: +${influenceAnalysis.authorityScore} (from ratio, listed count, influence signals)

CRITICAL CONTEXT FOR ${influenceAnalysis.tier.toUpperCase()} TIER:
${influenceAnalysis.tier === 'elite' || influenceAnalysis.tier === 'influential' ? `
⚠️ THIS IS A HIGH-INFLUENCE ACCOUNT. Evaluate differently:
- Minimalist bios are often INTENTIONAL for elite accounts (brand confidence, not incompleteness)
- These accounts are discovered through REPUTATION, not bio SEO
- A short, punchy bio at this level shows restraint and clarity
- Missing links may be strategic (they don't need to drive traffic to themselves)
- Judge EFFECTIVENESS of their brand, not "optimization checklist" compliance
- Their follower count IS the social proof - they've already proven brand-market fit
- High listed count means OTHERS vouch for their value (external validation)
` : influenceAnalysis.tier === 'notable' ? `
⚠️ NOTABLE TIER - Evaluate with growth context:
- They've built significant audience - bio clarity matters but they have traction
- Listed count shows they're being recognized and curated
- Evaluate if their brand is positioned for the NEXT level
` : `
📈 EMERGING/ESTABLISHED TIER - Standard evaluation:
- Bio optimization matters more at this stage for discoverability
- CTAs and links help convert visitors to followers
- Profile completeness signals professionalism
`}`;

  // Add crypto context if detected
  if (cryptoAnalysis.isCrypto) {
    prompt += `

CRYPTO/WEB3 SIGNALS DETECTED:
${cryptoAnalysis.signals.map(s => `- ${s}`).join('\n')}

CRYPTO-SPECIFIC STANDARDS:
- ENS domains (.eth) = STRONG positive for brand consistency
- Web3 terminology (gm, wagmi, ser, fren) = appropriate for audience
- Pseudonymous identity is normal - judge consistency, not real names
- Community links (Discord/Telegram) are expected`;
  }

  prompt += `

═══════════════════════════════════════════════════════════════════════
BRAND ANALYSIS FRAMEWORK (Adjust for influence tier!)
═══════════════════════════════════════════════════════════════════════

Score each pillar 0-100, then ADD the tier/authority bonuses to the overall score.

1. DEFINE (Weight: 30%) - Brand Identity Clarity
   For ${influenceAnalysis.tier} tier, evaluate:
   ${influenceAnalysis.tier === 'elite' || influenceAnalysis.tier === 'influential' ? `
   - Is their identity CLEAR even if minimal? (Elite accounts often need fewer words)
   - Does their reputation precede them? (Are they known for something specific?)
   - Is the bio punchy and memorable vs. keyword-stuffed?
   - Does the name alone carry brand weight?` : `
   - Is the bio clear about who they are and what they offer?
   - Does the display name effectively communicate their brand?
   - Is the value proposition immediately apparent?
   - Is there a clear target audience implied?`}

2. CHECK (Weight: 25%) - Brand Consistency & Credibility  
   - Username ↔ Display name alignment
   - Tone consistency (does it feel cohesive?)
   - ${profile.verified ? '✓ VERIFIED: +10 credibility bonus' : 'Not verified (no penalty, but verified adds trust)'}
   - Professional presentation quality
   - ${influenceAnalysis.tier === 'elite' || influenceAnalysis.tier === 'influential' ? 'At this tier: consistency of reputation matters more than bio details' : 'Everything working together as unified brand?'}

3. GENERATE (Weight: 25%) - Profile Completeness & Quality
   ${influenceAnalysis.isIntentionallyMinimal ? `
   ⚠️ INTENTIONAL MINIMALISM DETECTED - Don't penalize for brevity
   - Is the SHORT bio effective and memorable?
   - Quality over quantity for elite accounts
   - Profile image present and professional?` : `
   - Profile complete (bio, image, links)?
   - Bio well-formatted and readable?
   - Call-to-action or link present?
   - Using platform features effectively?`}

4. SCALE (Weight: 20%) - Growth & Influence Signals
   - Follower/following ratio: ${(profile.public_metrics.followers_count / Math.max(profile.public_metrics.following_count, 1)).toFixed(1)}:1 ${profile.public_metrics.followers_count / Math.max(profile.public_metrics.following_count, 1) >= 10 ? '(EXCELLENT - thought leader signal)' : profile.public_metrics.followers_count / Math.max(profile.public_metrics.following_count, 1) >= 2 ? '(Healthy)' : '(Room to grow)'}
   - Listed count: ${profile.public_metrics.listed_count.toLocaleString()} ${profile.public_metrics.listed_count >= 10000 ? '(EXCEPTIONAL - high authority)' : profile.public_metrics.listed_count >= 1000 ? '(Strong curation signal)' : '(Building influence)'}
   - ${influenceAnalysis.tier === 'elite' ? 'Already at scale - evaluate sustainability' : 'Growth trajectory and potential'}

═══════════════════════════════════════════════════════════════════════
FINAL SCORING FORMULA
═══════════════════════════════════════════════════════════════════════

Base Score = (DEFINE × 0.30) + (CHECK × 0.25) + (GENERATE × 0.25) + (SCALE × 0.20)
Final Score = Base Score + Tier Bonus (${influenceAnalysis.followerTierBonus}) + Authority Bonus (${influenceAnalysis.authorityScore})
Cap at 100.

A profile like @naval with 2M+ followers, 50K+ lists, and a clean minimal bio should score 85-95, not 70.

CREATOR ARCHETYPE (Choose ONE that best fits):
1. 🎓 THE PROFESSOR - Deep knowledge authority, niche expert, educational content
2. 🔌 THE PLUG - Super connector, everyone's mutual, "DMs open" energy, networker  
3. 🎪 CHIEF VIBES OFFICER - Timeline entertainer, shitposter, meme-friendly, playful
4. 🔮 THE PROPHET - Visionary thought leader, strong opinions, called it before everyone
5. 🚢 SHIP OR DIE - Builder, maker, "less talk more shipping", product-focused
6. 🐕 UNDERDOG ARC - Rising star, up-only trajectory, main character loading
7. 🎰 THE DEGEN - High-risk high-reward energy, crypto trader, ape-first mentality
8. 👻 THE ANON - Pseudonymous legend, influence without identity, mysterious authority

For ${influenceAnalysis.tier} tier accounts: THE PROPHET or THE PROFESSOR are common fits.
For crypto/web3 profiles: THE DEGEN or THE ANON may be more appropriate.
For pseudonymous accounts with high influence: THE ANON is ideal.

Return ONLY valid JSON:
{
  "overallScore": <integer 0-100, INCLUDE tier/authority bonuses>,
  "phases": {
    "define": { "score": <0-100>, "insights": ["insight 1", "insight 2"] },
    "check": { "score": <0-100>, "insights": ["insight 1", "insight 2"] },
    "generate": { "score": <0-100>, "insights": ["insight 1", "insight 2"] },
    "scale": { "score": <0-100>, "insights": ["insight 1", "insight 2"] }
  },
  "topStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "topImprovements": ["Improvement 1", "Improvement 2", "Improvement 3"],
  "summary": "2-3 sentence assessment acknowledging their influence tier and brand effectiveness.",
  "archetype": {
    "primary": "The Professor|The Plug|Chief Vibes Officer|The Prophet|Ship or Die|Underdog Arc|The Degen|The Anon",
    "emoji": "🎓|🔌|🎪|🔮|🚢|🐕|🎰|👻",
    "tagline": "3-5 word identity label that's shareable",
    "description": "Why this archetype fits their vibe and influence level",
    "strengths": ["strength 1", "strength 2"],
    "growthTip": "Specific tip appropriate for their tier and archetype"
  },
  "influenceTier": "${influenceAnalysis.tier}"${cryptoAnalysis.isCrypto ? `,
  "cryptoContext": true` : ''}
}`;

  return prompt;
};

// =============================================================================
// ENHANCED PROMPT WITH TWEET ANALYSIS (Requires X API Basic Tier)
// =============================================================================

export interface TweetAnalysisInput {
  profile: XProfileData;
  tweets: TweetData[];
  stats: TweetAnalysisStats;
  contentPatterns: ContentPatterns;
}

export const enhancedBrandScorePrompt = (input: TweetAnalysisInput) => {
  const { profile, tweets, stats, contentPatterns } = input;
  const cryptoAnalysis = detectCryptoSignals(profile);
  
  // Get sample tweets for analysis (first 20)
  const sampleTweets = tweets.slice(0, 20).map((t, i) => 
    `${i + 1}. "${t.text.substring(0, 200)}${t.text.length > 200 ? '...' : ''}" (❤️${t.likes} 🔁${t.retweets} 💬${t.replies})`
  ).join('\n');

  return `You are an expert brand strategist analyzing an X (Twitter) profile WITH their actual tweet content for comprehensive brand analysis.

PROFILE DATA:
- Display Name: ${profile.name}
- Username: @${profile.username}
- Bio: ${profile.description || '(No bio set)'}
- Followers: ${profile.public_metrics.followers_count.toLocaleString()}
- Following: ${profile.public_metrics.following_count.toLocaleString()}
- Total Tweets: ${profile.public_metrics.tweet_count.toLocaleString()}
- Listed Count: ${profile.public_metrics.listed_count.toLocaleString()}
${profile.location ? `- Location: ${profile.location}` : ''}
${profile.url ? `- Website: ${profile.url}` : ''}
- Verified: ${profile.verified ? 'YES ✓' : 'NO'}

TWEET ANALYTICS:
- Tweets Analyzed: ${stats.totalTweets}
- Average Engagement Rate: ${stats.avgEngagementRate.toFixed(2)}%
- Average Likes: ${stats.avgLikes.toFixed(1)}
- Average Retweets: ${stats.avgRetweets.toFixed(1)}
- Average Replies: ${stats.avgReplies.toFixed(1)}
- Posting Frequency: ${stats.postingFrequency}
- Most Active Time: ${stats.mostActiveDay}s at ${stats.mostActiveHour}:00 UTC
- Top Hashtags: ${stats.topHashtags.length > 0 ? stats.topHashtags.join(', ') : 'None frequently used'}

CONTENT PATTERNS:
- Average Tweet Length: ${contentPatterns.avgTweetLength.toFixed(0)} characters
- Emoji Usage: ${contentPatterns.emojiUsage.toFixed(1)}% of tweets
- Question Tweets: ${contentPatterns.questionTweets} (engagement bait)
- Thread Starters: ${contentPatterns.threadStarters}
- Media Usage: ${contentPatterns.mediaUsage} tweets with media

SAMPLE TWEETS (Most Recent):
${sampleTweets}

${cryptoAnalysis.isCrypto ? `
CRYPTO/WEB3 CONTEXT DETECTED:
${cryptoAnalysis.signals.map(s => `- ${s}`).join('\n')}
` : ''}

Perform a DEEP ANALYSIS using BrandOS's enhanced framework:

1. DEFINE (30%) - Brand Identity & Voice
   - Bio clarity and value proposition
   - Voice consistency across tweets (is their tone consistent?)
   - Signature phrases or patterns
   - Target audience clarity
   - Professional vs personal balance
   Score 0-100 with specific insights from their ACTUAL CONTENT.

2. CHECK (25%) - Consistency Over Time
   - Does their bio match their tweet content?
   - Are they staying on-brand or drifting?
   - Topic focus consistency (how many topics do they cover?)
   - Any contradictory messaging?
   - Verified status impact on credibility
   Score 0-100 with specific insights.

3. GENERATE (25%) - Content Quality & Performance
   - Engagement rate analysis (is it good for their size?)
   - Content format effectiveness (threads, media, questions)
   - Hook quality (do tweets grab attention?)
   - CTA usage and effectiveness
   - Posting frequency optimization
   Score 0-100 with specific insights.

4. SCALE (20%) - Growth & Influence
   - Follower/following ratio health
   - Growth trajectory (based on engagement)
   - Audience quality signals
   - Viral potential (based on content type)
   - Influence indicators (listed count, retweet patterns)
   Score 0-100 with specific insights.

VOICE ANALYSIS:
Analyze their writing style and provide:
- Tone breakdown (professional %, casual %, playful %, authoritative %)
- Voice consistency score (0-100)
- 2-3 signature phrases they use
- Reading level (simple, moderate, sophisticated)

CONTENT RECOMMENDATIONS:
Based on their best-performing content, suggest 3 specific content ideas.

Return ONLY valid JSON:
{
  "overallScore": <0-100>,
  "phases": {
    "define": { "score": <0-100>, "insights": ["insight1", "insight2", "insight3"] },
    "check": { "score": <0-100>, "insights": ["insight1", "insight2", "insight3"] },
    "generate": { "score": <0-100>, "insights": ["insight1", "insight2", "insight3"] },
    "scale": { "score": <0-100>, "insights": ["insight1", "insight2", "insight3"] }
  },
  "topStrengths": ["strength1", "strength2", "strength3"],
  "topImprovements": ["improvement1", "improvement2", "improvement3"],
  "summary": "3-4 sentence comprehensive assessment with specific observations from their content",
  "archetype": {
    "primary": "The Professor|The Plug|Chief Vibes Officer|The Prophet|Ship or Die|Underdog Arc|The Degen|The Anon",
    "emoji": "🎓|🔌|🎪|🔮|🚢|🐕|🎰|👻",
    "tagline": "3-5 word shareable identity label",
    "description": "2-3 sentences explaining archetype fit with EVIDENCE from their tweets",
    "strengths": ["archetype-specific strength 1", "archetype-specific strength 2"],
    "growthTip": "Specific tip for this archetype based on their actual content performance"
  },
  "voiceAnalysis": {
    "toneBreakdown": { "professional": <0-100>, "casual": <0-100>, "playful": <0-100>, "authoritative": <0-100> },
    "consistencyScore": <0-100>,
    "signaturePhrases": ["phrase1", "phrase2"],
    "avgReadingLevel": "simple|moderate|sophisticated"
  },
  "contentPerformance": {
    "engagementRate": <number>,
    "bestPerformingType": "threads|single tweets|questions|media posts",
    "optimalPostingTime": "Day at HH:MM timezone",
    "hookEffectiveness": <0-100>
  },
  "contentSuggestions": [
    "Specific content idea 1 based on what works for them",
    "Specific content idea 2",
    "Specific content idea 3"
  ]${cryptoAnalysis.isCrypto ? `,
  "cryptoContext": true` : ''}
}`;
};

// =============================================================================
// BRAND IDENTITY DEEP ANALYSIS - What makes BrandOS unique
// =============================================================================

// Types for Brand Identity Analysis
export interface ProfileImageAnalysis {
  imageType: 'face' | 'logo' | 'illustration' | 'pfp' | 'abstract' | 'text' | 'none';
  dominantColors: { hex: string; name: string; percentage: number }[];
  styleSignals: {
    professional: number; // 0-100
    playful: number;
    minimal: number;
    bold: number;
  };
  brandSignals: string[];
  visualPersonality: string;
  recommendations: string[];
}

export interface BioLinguistics {
  structure: 'minimal' | 'bullet' | 'narrative' | 'tagline' | 'hybrid';
  wordCount: number;
  sentenceCount: number;
  powerWords: { word: string; type: 'authority' | 'action' | 'emotion' | 'trust' }[];
  emojiAnalysis: {
    count: number;
    types: string[];
    personality: string;
  };
  voiceSpectrum: {
    professional: number; // 0-100
    casual: number;
    authoritative: number;
    approachable: number;
    serious: number;
    playful: number;
  };
  ctaStrength: number; // 0-100
  ctaType: 'none' | 'soft' | 'direct' | 'urgent';
  uniqueValueProp: string | null;
  targetAudienceClarity: number; // 0-100
  firstPersonUsage: 'I' | 'we' | 'none' | 'mixed';
}

export interface NameAnalysis {
  displayName: {
    length: number;
    memorability: number; // 0-100
    pronounceability: number; // 0-100
    type: 'personal' | 'brand' | 'pseudonym' | 'hybrid';
  };
  handle: {
    length: number;
    matchesName: boolean;
    easyToType: boolean;
    underscoresOrNumbers: boolean;
  };
  alignmentScore: number; // 0-100
  searchability: number; // 0-100
  uniqueness: number; // 0-100
}

export interface BrandDNA {
  // Core Identity
  primaryColor: { hex: string; name: string };
  secondaryColor: { hex: string; name: string };
  archetype: string;
  archetypeEmoji: string;
  
  // Voice Profile
  voiceProfile: {
    primary: string; // e.g., "Authoritative Expert"
    tone: string; // e.g., "Professional with warmth"
    energy: 'high' | 'medium' | 'low' | 'calm';
  };
  
  // Positioning
  inferredMission: string;
  targetAudience: string;
  uniqueDifferentiator: string;
  contentPillars: string[];
  
  // Scores
  coherenceScore: number; // How well elements align
  differentiationScore: number; // How unique is this brand
  memorabilityScore: number; // How sticky is this brand
  trustScore: number; // How credible does it feel
  
  // Keywords
  brandKeywords: string[];
  avoidKeywords: string[];
}

export interface BrandImprovements {
  bioOptions: {
    style: string;
    bio: string;
    reasoning: string;
  }[];
  taglineOptions: string[];
  contentPillarSuggestions: {
    pillar: string;
    description: string;
    exampleTopics: string[];
  }[];
  quickWins: string[];
  strategicMoves: string[];
}

export interface CompleteBrandIdentity {
  profileImage: ProfileImageAnalysis;
  bioLinguistics: BioLinguistics;
  nameAnalysis: NameAnalysis;
  brandDNA: BrandDNA;
  improvements: BrandImprovements;
}

// =============================================================================
// PROFILE IMAGE VISION ANALYSIS
// =============================================================================

export const profileImageAnalysisPrompt = (imageDescription: string, profileContext: {
  name: string;
  username: string;
  bio: string;
  followers: number;
}) => `You are a brand identity expert analyzing a profile picture for brand signals.

PROFILE CONTEXT:
- Name: ${profileContext.name}
- Handle: @${profileContext.username}
- Bio: ${profileContext.bio || '(No bio)'}
- Followers: ${(profileContext.followers || 0).toLocaleString()}

ANALYZE THE PROFILE IMAGE:
${imageDescription}

Evaluate the profile image for brand identity signals:

1. IMAGE TYPE - What is this?
   - face (personal headshot)
   - logo (company/brand logo)
   - illustration (drawn/artistic version of person or concept)
   - pfp (NFT-style profile picture, avatar, character)
   - abstract (patterns, shapes, artistic)
   - text (text-based image)
   - none (default/missing)

2. COLOR ANALYSIS
   - Identify the 3 dominant colors with hex codes and color names
   - Estimate percentage each takes up

3. STYLE SIGNALS (0-100 each)
   - Professional: How corporate/polished does it feel?
   - Playful: How fun/casual/creative does it feel?
   - Minimal: How simple/clean is the design?
   - Bold: How attention-grabbing/distinctive is it?

4. BRAND SIGNALS
   - What does this image communicate about the person/brand?
   - List 3-5 specific signals (e.g., "Tech-forward", "Approachable", "Mysterious")

5. VISUAL PERSONALITY
   - In 2-3 sentences, describe the personality this image projects

6. RECOMMENDATIONS
   - 2-3 specific suggestions to strengthen their visual brand

Return ONLY valid JSON:
{
  "imageType": "face|logo|illustration|pfp|abstract|text|none",
  "dominantColors": [
    { "hex": "#XXXXXX", "name": "Color Name", "percentage": 0-100 },
    { "hex": "#XXXXXX", "name": "Color Name", "percentage": 0-100 },
    { "hex": "#XXXXXX", "name": "Color Name", "percentage": 0-100 }
  ],
  "styleSignals": {
    "professional": 0-100,
    "playful": 0-100,
    "minimal": 0-100,
    "bold": 0-100
  },
  "brandSignals": ["signal1", "signal2", "signal3"],
  "visualPersonality": "Description of the personality this image projects",
  "recommendations": ["recommendation1", "recommendation2"]
}`;

// =============================================================================
// BIO LINGUISTICS ANALYSIS (No AI needed - algorithmic)
// =============================================================================

export function analyzeBioLinguistics(bio: string, name: string): BioLinguistics {
  const trimmedBio = bio?.trim() || '';
  
  // Word and sentence count
  const words = trimmedBio.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const sentences = trimmedBio.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  
  // Structure detection
  let structure: BioLinguistics['structure'] = 'narrative';
  if (wordCount === 0) structure = 'minimal';
  else if (wordCount <= 5) structure = 'tagline';
  else if (trimmedBio.includes('|') || trimmedBio.includes('•') || trimmedBio.includes('→')) structure = 'bullet';
  else if (trimmedBio.includes('\n')) structure = 'hybrid';
  else if (wordCount <= 15) structure = 'minimal';
  
  // Power words detection
  const powerWordsList = {
    authority: ['expert', 'leader', 'founder', 'ceo', 'director', 'head', 'chief', 'senior', 'principal', 'award', 'recognized', 'certified', 'official', 'verified'],
    action: ['building', 'creating', 'helping', 'growing', 'scaling', 'launching', 'shipping', 'making', 'designing', 'developing', 'transforming'],
    emotion: ['passionate', 'love', 'obsessed', 'excited', 'curious', 'dedicated', 'inspired', 'driven'],
    trust: ['trusted', 'proven', 'featured', 'backed', 'supported', 'partnered', 'advised', 'mentioned', 'published']
  };
  
  const bioLower = trimmedBio.toLowerCase();
  const powerWords: BioLinguistics['powerWords'] = [];
  
  for (const [type, wordList] of Object.entries(powerWordsList)) {
    for (const word of wordList) {
      if (bioLower.includes(word)) {
        powerWords.push({ word, type: type as 'authority' | 'action' | 'emotion' | 'trust' });
      }
    }
  }
  
  // Emoji analysis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu;
  const emojis = trimmedBio.match(emojiRegex) || [];
  const emojiPersonalities: Record<string, string> = {
    '🚀': 'ambitious/growth',
    '💡': 'innovative/ideas',
    '🔥': 'passionate/energetic',
    '✨': 'creative/magical',
    '🌱': 'growth/nurturing',
    '💪': 'strong/determined',
    '🎯': 'focused/targeted',
    '🤝': 'collaborative/trustworthy',
    '👻': 'mysterious/playful',
    '🎨': 'creative/artistic',
    '💼': 'professional/business',
    '🌍': 'global/worldly',
    '❤️': 'passionate/loving',
    '🧠': 'intellectual/smart',
  };
  
  const emojiTypes = emojis.map(e => emojiPersonalities[e] || 'expressive').filter((v, i, a) => a.indexOf(v) === i);
  let emojiPersonality = 'neutral';
  if (emojis.length === 0) emojiPersonality = 'minimal/serious';
  else if (emojis.length <= 2) emojiPersonality = 'balanced';
  else if (emojis.length <= 5) emojiPersonality = 'expressive';
  else emojiPersonality = 'highly expressive/casual';
  
  // Voice spectrum calculation
  const hasAuthority = powerWords.some(p => p.type === 'authority');
  const hasAction = powerWords.some(p => p.type === 'action');
  const hasCasualIndicators = emojis.length > 2 || bioLower.includes('lol') || bioLower.includes('btw') || bioLower.includes('tbh');
  const hasPlayfulIndicators = emojis.length > 3 || bioLower.includes('!') || bioLower.includes('😂') || bioLower.includes('🤣');
  
  const voiceSpectrum = {
    professional: hasAuthority ? 70 : (structure === 'bullet' ? 60 : 40),
    casual: hasCasualIndicators ? 70 : 30,
    authoritative: hasAuthority ? 80 : (powerWords.length > 2 ? 50 : 30),
    approachable: bioLower.includes('dm') || bioLower.includes('help') || bioLower.includes('open') ? 80 : 50,
    serious: !hasPlayfulIndicators && emojis.length === 0 ? 70 : 30,
    playful: hasPlayfulIndicators ? 70 : (emojis.length > 0 ? 40 : 20),
  };
  
  // CTA analysis
  let ctaStrength = 0;
  let ctaType: BioLinguistics['ctaType'] = 'none';
  
  if (bioLower.includes('dm') || bioLower.includes('message me') || bioLower.includes('reach out')) {
    ctaStrength = 70;
    ctaType = 'soft';
  }
  if (bioLower.includes('link') || bioLower.includes('click') || bioLower.includes('check out')) {
    ctaStrength = 80;
    ctaType = 'direct';
  }
  if (bioLower.includes('join') || bioLower.includes('subscribe') || bioLower.includes('sign up') || bioLower.includes('now')) {
    ctaStrength = 90;
    ctaType = 'urgent';
  }
  
  // Unique value prop detection
  let uniqueValueProp: string | null = null;
  const helpingMatch = bioLower.match(/help(?:ing)?\s+(\w+(?:\s+\w+){0,5})\s+(?:to\s+)?(\w+(?:\s+\w+){0,5})/);
  if (helpingMatch) {
    uniqueValueProp = `Helps ${helpingMatch[1]} ${helpingMatch[2]}`;
  }
  
  // Target audience clarity
  const audienceIndicators = ['for', 'helping', 'serving', 'founders', 'creators', 'developers', 'marketers', 'designers', 'entrepreneurs', 'teams', 'companies', 'startups'];
  const hasAudienceIndicator = audienceIndicators.some(ind => bioLower.includes(ind));
  const targetAudienceClarity = hasAudienceIndicator ? 70 : (uniqueValueProp ? 50 : 30);
  
  // First person usage
  let firstPersonUsage: BioLinguistics['firstPersonUsage'] = 'none';
  const hasI = /\bi\b/i.test(trimmedBio);
  const hasWe = /\bwe\b/i.test(trimmedBio);
  if (hasI && hasWe) firstPersonUsage = 'mixed';
  else if (hasI) firstPersonUsage = 'I';
  else if (hasWe) firstPersonUsage = 'we';
  
  return {
    structure,
    wordCount,
    sentenceCount,
    powerWords,
    emojiAnalysis: {
      count: emojis.length,
      types: emojiTypes,
      personality: emojiPersonality,
    },
    voiceSpectrum,
    ctaStrength,
    ctaType,
    uniqueValueProp,
    targetAudienceClarity,
    firstPersonUsage,
  };
}

// =============================================================================
// NAME ANALYSIS (Algorithmic)
// =============================================================================

export function analyzeNameHandle(name: string, handle: string): NameAnalysis {
  const cleanHandle = handle.replace('@', '');
  
  // Display name analysis
  const nameLower = name.toLowerCase();
  const handleLower = cleanHandle.toLowerCase();
  
  // Name type detection
  let nameType: NameAnalysis['displayName']['type'] = 'personal';
  if (/\b(inc|llc|co|labs|studio|agency|hq)\b/i.test(name)) nameType = 'brand';
  else if (/^[a-z]+\.[a-z]+$/i.test(name) || /^\w+\s\w+$/i.test(name)) nameType = 'personal';
  else if (name.length <= 10 && !/\s/.test(name)) nameType = 'pseudonym';
  
  // Memorability (shorter = more memorable, unique = more memorable)
  const memorability = Math.max(0, 100 - (name.length * 2) + (nameType === 'personal' ? 10 : 0));
  
  // Pronounceability (no numbers, no special chars, reasonable length)
  const hasNumbers = /\d/.test(name);
  const hasSpecialChars = /[^a-zA-Z\s]/.test(name);
  const pronounceability = 100 - (hasNumbers ? 30 : 0) - (hasSpecialChars ? 20 : 0) - (name.length > 20 ? 20 : 0);
  
  // Handle analysis
  const handleHasNumbers = /\d/.test(cleanHandle);
  const handleHasUnderscores = /_/.test(cleanHandle);
  
  // Check if handle matches name
  const nameWords = nameLower.split(/\s+/);
  const matchesName = nameWords.some(word => handleLower.includes(word)) || 
                      handleLower.includes(nameWords.join('')) ||
                      nameWords.some(word => word.includes(handleLower));
  
  // Alignment score
  let alignmentScore = matchesName ? 80 : 40;
  if (handleLower === nameLower.replace(/\s/g, '')) alignmentScore = 100;
  
  // Searchability (unique, not common words)
  const commonWords = ['the', 'official', 'real', 'its', 'im', 'hey', 'just'];
  const isGeneric = commonWords.some(w => handleLower.includes(w));
  const searchability = isGeneric ? 40 : (cleanHandle.length <= 12 ? 80 : 60);
  
  // Uniqueness
  const uniqueness = nameType === 'pseudonym' ? 80 : (matchesName ? 60 : 70);
  
  return {
    displayName: {
      length: name.length,
      memorability: Math.min(100, Math.max(0, memorability)),
      pronounceability: Math.min(100, Math.max(0, pronounceability)),
      type: nameType,
    },
    handle: {
      length: cleanHandle.length,
      matchesName,
      easyToType: !handleHasNumbers && !handleHasUnderscores && cleanHandle.length <= 15,
      underscoresOrNumbers: handleHasNumbers || handleHasUnderscores,
    },
    alignmentScore: Math.min(100, Math.max(0, alignmentScore)),
    searchability: Math.min(100, Math.max(0, searchability)),
    uniqueness: Math.min(100, Math.max(0, uniqueness)),
  };
}

// =============================================================================
// BRAND DNA GENERATION (AI-powered)
// =============================================================================

export const brandDNAPrompt = (profile: XProfileData, bioLinguistics: BioLinguistics, nameAnalysis: NameAnalysis, imageAnalysis?: ProfileImageAnalysis) => {
  const influenceAnalysis = analyzeInfluence(profile);
  // Support both flat and nested follower count properties
  const followersCount = (profile as any).followers_count || profile.public_metrics?.followers_count || 0;

  return `You are an expert brand strategist creating a comprehensive Brand DNA profile.

PROFILE DATA:
- Name: ${profile.name}
- Handle: @${profile.username}
- Bio: ${profile.description || '(No bio)'}
- Followers: ${followersCount.toLocaleString()}
- Influence Tier: ${influenceAnalysis.tierLabel}

BIO LINGUISTICS ANALYSIS:
- Structure: ${bioLinguistics.structure}
- Word Count: ${bioLinguistics.wordCount}
- Power Words: ${bioLinguistics.powerWords.map(p => p.word).join(', ') || 'None detected'}
- Voice: Professional ${bioLinguistics.voiceSpectrum.professional}/100, Casual ${bioLinguistics.voiceSpectrum.casual}/100
- CTA Type: ${bioLinguistics.ctaType} (Strength: ${bioLinguistics.ctaStrength}/100)
- Emoji Personality: ${bioLinguistics.emojiAnalysis.personality}

NAME ANALYSIS:
- Name Type: ${nameAnalysis.displayName.type}
- Memorability: ${nameAnalysis.displayName.memorability}/100
- Handle Alignment: ${nameAnalysis.alignmentScore}/100
${imageAnalysis ? `
VISUAL ANALYSIS:
- Image Type: ${imageAnalysis.imageType}
- Colors: ${imageAnalysis.dominantColors.map(c => c.name).join(', ')}
- Style: Professional ${imageAnalysis.styleSignals.professional}/100, Playful ${imageAnalysis.styleSignals.playful}/100
- Visual Signals: ${imageAnalysis.brandSignals.join(', ')}
` : ''}

Generate a comprehensive Brand DNA profile:

1. COLORS - Based on profile image (or infer from bio tone if no image analysis)
2. ARCHETYPE - Best fit from these 8 archetypes:
   - 🎓 The Professor (knowledge authority)
   - 🔌 The Plug (super connector)
   - 🎪 Chief Vibes Officer (entertainer/shitposter)
   - 🔮 The Prophet (thought leader/visionary)
   - 🚢 Ship or Die (builder/maker)
   - 🐕 Underdog Arc (rising star)
   - 🎰 The Degen (crypto trader/risk-taker)
   - 👻 The Anon (pseudonymous influencer)
3. VOICE PROFILE - Primary voice style, tone description, energy level
4. POSITIONING - Mission, target audience, unique differentiator, content pillars
5. SCORES - Coherence, Differentiation, Memorability, Trust (0-100 each)
6. KEYWORDS - Brand keywords to use and avoid

Return ONLY valid JSON:
{
  "primaryColor": { "hex": "#XXXXXX", "name": "Color Name" },
  "secondaryColor": { "hex": "#XXXXXX", "name": "Color Name" },
  "archetype": "The Professor|The Plug|Chief Vibes Officer|The Prophet|Ship or Die|Underdog Arc|The Degen|The Anon",
  "archetypeEmoji": "🎓|🔌|🎪|🔮|🚢|🐕|🎰|👻",
  "voiceProfile": {
    "primary": "e.g., Knowledge Authority, Timeline Entertainer, etc.",
    "tone": "e.g., Professional with warmth",
    "energy": "high|medium|low|calm"
  },
  "inferredMission": "One sentence mission statement inferred from their profile",
  "targetAudience": "Who this brand speaks to",
  "uniqueDifferentiator": "What makes this brand different from others in their space",
  "contentPillars": ["Pillar 1", "Pillar 2", "Pillar 3"],
  "coherenceScore": 0-100,
  "differentiationScore": 0-100,
  "memorabilityScore": 0-100,
  "trustScore": 0-100,
  "brandKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "avoidKeywords": ["avoid1", "avoid2", "avoid3"]
}`;
};

// =============================================================================
// AI-GENERATED IMPROVEMENTS
// =============================================================================

export const brandImprovementsPrompt = (profile: XProfileData, brandDNA: BrandDNA, bioLinguistics: BioLinguistics) => {
  return `You are an expert brand copywriter helping optimize a personal/professional brand on X.

CURRENT PROFILE:
- Name: ${profile.name}
- Handle: @${profile.username}
- Current Bio: ${profile.description || '(No bio)'}
- Followers: ${profile.public_metrics.followers_count.toLocaleString()}

BRAND DNA:
- Archetype: ${brandDNA.archetype}
- Voice: ${brandDNA.voiceProfile.primary}
- Tone: ${brandDNA.voiceProfile.tone}
- Mission: ${brandDNA.inferredMission}
- Target Audience: ${brandDNA.targetAudience}
- Content Pillars: ${brandDNA.contentPillars.join(', ')}

CURRENT BIO ANALYSIS:
- Structure: ${bioLinguistics.structure}
- CTA Strength: ${bioLinguistics.ctaStrength}/100
- Voice Balance: Professional ${bioLinguistics.voiceSpectrum.professional}, Casual ${bioLinguistics.voiceSpectrum.casual}

Generate specific improvements:

1. BIO OPTIONS - 3 alternative bios (different styles: punchy, detailed, authoritative)
   - Each under 160 characters
   - Match their archetype and voice
   - Include a clear value proposition
   - Consider their audience size (${profile.public_metrics.followers_count > 100000 ? 'large audience - can be more minimal' : 'growing audience - should be more descriptive'})

2. TAGLINE OPTIONS - 5 memorable taglines (3-7 words each)

3. CONTENT PILLARS - 3 strategic content pillars with:
   - Pillar name
   - Description
   - 3 example topics

4. QUICK WINS - 3 immediately actionable improvements
5. STRATEGIC MOVES - 3 longer-term brand building strategies

Return ONLY valid JSON:
{
  "bioOptions": [
    {
      "style": "Punchy/Minimal",
      "bio": "The new bio text...",
      "reasoning": "Why this works for their brand"
    },
    {
      "style": "Value-Focused",
      "bio": "The new bio text...",
      "reasoning": "Why this works"
    },
    {
      "style": "Authority",
      "bio": "The new bio text...",
      "reasoning": "Why this works"
    }
  ],
  "taglineOptions": [
    "Tagline 1",
    "Tagline 2",
    "Tagline 3",
    "Tagline 4",
    "Tagline 5"
  ],
  "contentPillarSuggestions": [
    {
      "pillar": "Pillar Name",
      "description": "What this pillar covers",
      "exampleTopics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ],
  "quickWins": [
    "Quick actionable improvement 1",
    "Quick actionable improvement 2",
    "Quick actionable improvement 3"
  ],
  "strategicMoves": [
    "Strategic long-term move 1",
    "Strategic long-term move 2",
    "Strategic long-term move 3"
  ]
}`;
};

// =============================================================================
// UTILITY: Analyze Profile Image with Gemini Vision
// =============================================================================

export async function analyzeProfileImageWithVision(
  imageUrl: string,
  profileContext: { name: string; username: string; bio: string; followers: number }
): Promise<ProfileImageAnalysis | null> {
  try {
    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl.replace('_normal', '_400x400'));
    if (!imageResponse.ok) return null;
    
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Use Gemini Flash with vision
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
      profileImageAnalysisPrompt('Analyze this profile image.', profileContext),
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    return JSON.parse(jsonMatch[0]) as ProfileImageAnalysis;
  } catch (error) {
    console.error('Profile image vision analysis error:', error);
    return null;
  }
}

// =============================================================================
// UTILITY: Generate Complete Brand DNA
// =============================================================================

export async function generateBrandDNA(
  profile: XProfileData,
  imageAnalysis?: ProfileImageAnalysis
): Promise<BrandDNA | null> {
  try {
    const bioLinguistics = analyzeBioLinguistics(profile.description || '', profile.name);
    const nameAnalysis = analyzeNameHandle(profile.name, profile.username);
    
    const prompt = brandDNAPrompt(profile, bioLinguistics, nameAnalysis, imageAnalysis);
    
    const result = await geminiFlash.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    return JSON.parse(jsonMatch[0]) as BrandDNA;
  } catch (error) {
    console.error('Brand DNA generation error:', error);
    return null;
  }
}

// =============================================================================
// UTILITY: Generate Brand Improvements
// =============================================================================

export async function generateBrandImprovements(
  profile: XProfileData,
  brandDNA: BrandDNA
): Promise<BrandImprovements | null> {
  try {
    const bioLinguistics = analyzeBioLinguistics(profile.description || '', profile.name);
    const prompt = brandImprovementsPrompt(profile, brandDNA, bioLinguistics);

    const result = await geminiFlash.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as BrandImprovements;
  } catch (error) {
    console.error('Brand improvements generation error:', error);
    return null;
  }
}

// =============================================================================
// TWEET VOICE ANALYSIS (Requires X API Basic Tier)
// =============================================================================

export interface TweetVoiceAnalysis {
  // Writing style patterns
  writingStyle: {
    sentenceStructure: 'short_punchy' | 'long_narrative' | 'mixed';
    hookPatterns: string[];
    closingPatterns: string[];
    signaturePhrases: string[];
    readingLevel: 'simple' | 'moderate' | 'sophisticated';
  };

  // Voice spectrum (refined from actual content)
  voiceSpectrum: {
    professional: number;
    casual: number;
    authoritative: number;
    approachable: number;
    educational: number;
    promotional: number;
    personal: number;
    opinionated: number;
  };

  // Content themes derived from tweets
  contentThemes: {
    pillar: string;
    frequency: number;
    avgEngagement: number;
    exampleTweets: string[];
  }[];

  // High-performing content patterns
  performancePatterns: {
    bestFormats: ('thread' | 'single' | 'quote' | 'media' | 'question')[];
    optimalLength: { min: number; max: number };
    highEngagementTopics: string[];
    bestPostingTimes: { day: string; hour: number }[];
    viralCharacteristics: string[];
  };

  // Voice consistency
  consistencyScore: number;
  toneVariations: string[];
}

export const tweetVoiceAnalysisPrompt = (tweets: { text: string; likes: number; retweets: number; replies: number }[], stats: TweetAnalysisStats) => `
You are a brand voice analyst examining a creator's tweet history to extract their authentic voice DNA.

TWEET CORPUS (${tweets.length} tweets):
${tweets.slice(0, 30).map((t, i) => `
[${i + 1}] "${t.text.substring(0, 280)}"
    Metrics: ${t.likes} likes | ${t.retweets} RTs | ${t.replies} replies
`).join('\n')}

ENGAGEMENT STATS:
- Avg Engagement Rate: ${stats.avgEngagementRate.toFixed(2)}%
- Avg Likes: ${stats.avgLikes.toFixed(1)}
- Posting Frequency: ${stats.postingFrequency}
- Top Hashtags: ${stats.topHashtags.join(', ') || 'None'}

ANALYZE FOR:

1. WRITING STYLE PATTERNS
   - Sentence structure preferences (short_punchy, long_narrative, or mixed)
   - Common opening hooks (first 5-10 words patterns)
   - Closing patterns (CTAs, questions, statements)
   - Signature phrases they repeatedly use (2-4 distinct phrases)
   - Reading level complexity (simple, moderate, sophisticated)

2. VOICE SPECTRUM (score each 0-100)
   - Professional vs Casual balance
   - Authoritative vs Approachable
   - Educational vs Promotional
   - Personal vs Opinionated

3. CONTENT THEMES (identify 3-5 recurring pillars)
   - What topics appear repeatedly?
   - Which topics get best engagement?
   - Include 1-2 example tweet snippets for each pillar

4. PERFORMANCE PATTERNS
   - What formats work best? (thread, single, quote, media, question)
   - Optimal tweet length range
   - Topics that drive highest engagement
   - Any viral content characteristics

5. VOICE CONSISTENCY
   - How consistent is their tone across tweets? (0-100)
   - Note any significant variations

Return ONLY valid JSON:
{
  "writingStyle": {
    "sentenceStructure": "short_punchy|long_narrative|mixed",
    "hookPatterns": ["pattern1", "pattern2"],
    "closingPatterns": ["pattern1", "pattern2"],
    "signaturePhrases": ["phrase1", "phrase2", "phrase3"],
    "readingLevel": "simple|moderate|sophisticated"
  },
  "voiceSpectrum": {
    "professional": 0-100,
    "casual": 0-100,
    "authoritative": 0-100,
    "approachable": 0-100,
    "educational": 0-100,
    "promotional": 0-100,
    "personal": 0-100,
    "opinionated": 0-100
  },
  "contentThemes": [
    {
      "pillar": "Theme name",
      "frequency": 0-100,
      "avgEngagement": <number>,
      "exampleTweets": ["snippet1", "snippet2"]
    }
  ],
  "performancePatterns": {
    "bestFormats": ["thread", "single", "quote", "media", "question"],
    "optimalLength": { "min": <number>, "max": <number> },
    "highEngagementTopics": ["topic1", "topic2"],
    "bestPostingTimes": [{ "day": "Monday", "hour": 14 }],
    "viralCharacteristics": ["characteristic1"]
  },
  "consistencyScore": 0-100,
  "toneVariations": ["variation1"]
}`;

/**
 * Analyze tweet voice using Gemini AI
 * Requires X API Basic tier for tweet access
 */
export async function analyzeTweetVoice(
  tweets: { text: string; public_metrics: { like_count: number; retweet_count: number; reply_count: number } }[],
  stats: TweetAnalysisStats
): Promise<TweetVoiceAnalysis | null> {
  try {
    // Transform tweets to simpler format for prompt
    const simpleTweets = tweets.map(t => ({
      text: t.text,
      likes: t.public_metrics.like_count,
      retweets: t.public_metrics.retweet_count,
      replies: t.public_metrics.reply_count,
    }));

    const prompt = tweetVoiceAnalysisPrompt(simpleTweets, stats);

    const result = await geminiFlash.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in tweet voice analysis response');
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]) as TweetVoiceAnalysis;

    console.log('=== TWEET VOICE ANALYSIS COMPLETE ===');
    console.log(`Writing Style: ${analysis.writingStyle.sentenceStructure}`);
    console.log(`Content Themes: ${analysis.contentThemes.map(t => t.pillar).join(', ')}`);
    console.log(`Voice Consistency: ${analysis.consistencyScore}/100`);
    console.log('=====================================');

    return analysis;
  } catch (error) {
    console.error('Tweet voice analysis error:', error);
    return null;
  }
}


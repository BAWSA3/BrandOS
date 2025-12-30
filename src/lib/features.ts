/**
 * Feature Flags for BrandOS
 * 
 * These flags control access to features that require different X API tiers.
 * Set via environment variables for easy configuration.
 */

export const features = {
  /**
   * X API Tier Detection
   * Set X_API_TIER in .env.local to 'free' | 'basic' | 'pro'
   */
  xApiTier: (process.env.X_API_TIER || 'free') as 'free' | 'basic' | 'pro',

  /**
   * Tweet Analysis (requires Basic tier - $100/month)
   * Enables fetching and analyzing user's actual tweets
   */
  get tweetAnalysis(): boolean {
    return this.xApiTier === 'basic' || this.xApiTier === 'pro';
  },

  /**
   * Verified Type Detection (requires Basic tier)
   * Enables accurate blue/gold/gray checkmark detection
   */
  get verifiedTypeDetection(): boolean {
    return this.xApiTier === 'basic' || this.xApiTier === 'pro';
  },

  /**
   * Enhanced Voice Analysis (requires Basic tier + tweets)
   * Analyzes tone, consistency, and writing patterns
   */
  get voiceAnalysis(): boolean {
    return this.tweetAnalysis;
  },

  /**
   * Content Performance Metrics (requires Basic tier)
   * Engagement rates, optimal posting times, etc.
   */
  get contentPerformance(): boolean {
    return this.tweetAnalysis;
  },

  /**
   * Content Suggestions (requires Basic tier)
   * AI-generated content ideas based on performance
   */
  get contentSuggestions(): boolean {
    return this.tweetAnalysis;
  },

  /**
   * Competitor Comparison with Tweets (requires Basic tier)
   * Compare content performance, not just profile metrics
   */
  get enhancedComparison(): boolean {
    return this.tweetAnalysis;
  },
};

/**
 * Get human-readable tier info
 */
export function getTierInfo() {
  return {
    current: features.xApiTier,
    features: {
      profileAnalysis: true, // Always available
      basicScoring: true, // Always available
      creatorArchetype: true, // Always available
      tweetAnalysis: features.tweetAnalysis,
      verifiedTypeDetection: features.verifiedTypeDetection,
      voiceAnalysis: features.voiceAnalysis,
      contentPerformance: features.contentPerformance,
      contentSuggestions: features.contentSuggestions,
      enhancedComparison: features.enhancedComparison,
    },
    upgradeUrl: 'https://developer.twitter.com/en/portal/products',
    pricing: {
      free: { price: '$0', userLookups: 500, tweets: 0 },
      basic: { price: '$100/mo', userLookups: 10000, tweets: 10000 },
      pro: { price: '$5000/mo', userLookups: 'unlimited', tweets: 'unlimited' },
    },
  };
}

/**
 * Check if a specific feature is available
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  const value = features[feature];
  return typeof value === 'boolean' ? value : false;
}






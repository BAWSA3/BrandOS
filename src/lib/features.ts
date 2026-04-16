/**
 * Feature Flags for BrandOS
 *
 * Tweet-dependent features are available when SocialData.tools is configured
 * (primary provider) OR when X API Basic+ tier is active (fallback).
 */

export const features = {
  xApiTier: (process.env.X_API_TIER || 'free') as 'free' | 'basic' | 'pro',

  /** SocialData.tools is configured — unlocks tweet access without X API Basic */
  get socialDataAvailable(): boolean {
    return !!process.env.SOCIALDATA_API_KEY;
  },

  /** Tweet analysis: available via SocialData OR X API Basic+ */
  get tweetAnalysis(): boolean {
    return this.socialDataAvailable || this.xApiTier === 'basic' || this.xApiTier === 'pro';
  },

  get verifiedTypeDetection(): boolean {
    return this.xApiTier === 'basic' || this.xApiTier === 'pro';
  },

  get voiceAnalysis(): boolean {
    return this.tweetAnalysis;
  },

  get contentPerformance(): boolean {
    return this.tweetAnalysis;
  },

  get contentSuggestions(): boolean {
    return this.tweetAnalysis;
  },

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
      socialdata: { price: '~$0.0002/req', userLookups: 'unlimited', tweets: 'unlimited' },
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

import { type SubscriptionTier, getPlanLimits, canAccessFeature } from '@/lib/plans';

export type GatedFeature =
  | 'voiceFingerprint'
  | 'contentCalendar'
  | 'aiAgents'
  | 'brandSharing'
  | 'advancedAnalytics'
  | 'apiAccess'
  | 'whiteLabel'
  | 'customIntegrations'
  | 'ssoSaml';

export interface FeatureGateResult {
  allowed: boolean;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  upgradeMessage: string;
}

const FEATURE_MINIMUM_TIER: Record<GatedFeature, SubscriptionTier> = {
  voiceFingerprint: 'PRO',
  contentCalendar: 'PRO',
  aiAgents: 'PRO',
  brandSharing: 'PRO',
  advancedAnalytics: 'AGENCY',
  apiAccess: 'AGENCY',
  whiteLabel: 'AGENCY',
  customIntegrations: 'AGENCY',
  ssoSaml: 'ENTERPRISE',
};

const FEATURE_DISPLAY_NAMES: Record<GatedFeature, string> = {
  voiceFingerprint: 'Voice Fingerprint',
  contentCalendar: 'Content Calendar',
  aiAgents: 'AI Agents',
  brandSharing: 'Brand Sharing',
  advancedAnalytics: 'Advanced Analytics',
  apiAccess: 'API Access',
  whiteLabel: 'White-Label Reports',
  customIntegrations: 'Custom Integrations',
  ssoSaml: 'SSO / SAML',
};

const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  FREE: 'Free',
  CREATOR: 'Creator',
  PRO: 'Pro',
  AGENCY: 'Agency',
  ENTERPRISE: 'Enterprise',
};

export function checkFeatureAccess(
  currentTier: SubscriptionTier,
  feature: GatedFeature
): FeatureGateResult {
  const allowed = canAccessFeature(currentTier, feature);
  const requiredTier = FEATURE_MINIMUM_TIER[feature];
  const featureName = FEATURE_DISPLAY_NAMES[feature];
  const tierName = TIER_DISPLAY_NAMES[requiredTier];

  return {
    allowed,
    requiredTier,
    currentTier,
    upgradeMessage: allowed
      ? ''
      : `${featureName} requires the ${tierName} plan or higher.`,
  };
}

export function getAvailableFeatures(tier: SubscriptionTier): GatedFeature[] {
  return (Object.keys(FEATURE_MINIMUM_TIER) as GatedFeature[]).filter(
    (feature) => canAccessFeature(tier, feature)
  );
}

export function getLockedFeatures(tier: SubscriptionTier): {
  feature: GatedFeature;
  requiredTier: SubscriptionTier;
  displayName: string;
}[] {
  return (Object.keys(FEATURE_MINIMUM_TIER) as GatedFeature[])
    .filter((feature) => !canAccessFeature(tier, feature))
    .map((feature) => ({
      feature,
      requiredTier: FEATURE_MINIMUM_TIER[feature],
      displayName: FEATURE_DISPLAY_NAMES[feature],
    }));
}

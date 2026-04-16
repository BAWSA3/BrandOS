import { type SubscriptionTier, getPlanLimits, canAccessFeature, normalizeTier } from '@/lib/plans';

export type GatedFeature =
  | 'voiceFingerprint'
  | 'contentCalendar'
  | 'aiAgents'
  | 'contentEngine'
  | 'conductor'
  | 'growthPlan'
  | 'brandSharing'
  | 'advancedAnalytics'
  | 'apiAccess'
  | 'whiteLabel'
  | 'customIntegrations'
  | 'ssoSaml'
  | 'intelligenceReport';

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
  contentEngine: 'PRO',
  conductor: 'PRO',
  growthPlan: 'PRO',
  brandSharing: 'PRO',
  advancedAnalytics: 'AGENCY',
  apiAccess: 'AGENCY',
  whiteLabel: 'AGENCY',
  customIntegrations: 'AGENCY',
  ssoSaml: 'ENTERPRISE',
  intelligenceReport: 'PRO',
};

const FEATURE_DISPLAY_NAMES: Record<GatedFeature, string> = {
  voiceFingerprint: 'Voice Fingerprint',
  contentCalendar: 'Content Calendar',
  aiAgents: 'AI Agents',
  contentEngine: 'Content Engine',
  conductor: 'Conductor',
  growthPlan: 'Growth Plan',
  brandSharing: 'Brand Sharing',
  advancedAnalytics: 'Advanced Analytics',
  apiAccess: 'API Access',
  whiteLabel: 'White-Label Reports',
  customIntegrations: 'Custom Integrations',
  ssoSaml: 'SSO / SAML',
  intelligenceReport: 'Intelligence Report',
};

const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  FREE: 'Free',
  CREATOR: 'Free', // Legacy — display as Free
  PRO: 'Pro',
  AGENCY: 'Agency',
  ENTERPRISE: 'Enterprise',
};

// Map GatedFeature to the underlying PlanLimits key
const FEATURE_TO_PLAN_KEY: Record<GatedFeature, keyof import('@/lib/plans').PlanLimits> = {
  voiceFingerprint: 'voiceFingerprint',
  contentCalendar: 'contentCalendar',
  aiAgents: 'aiAgents',
  contentEngine: 'aiAgents', // Content Engine requires same tier as AI Agents
  conductor: 'aiAgents', // Conductor requires same tier as AI Agents
  growthPlan: 'aiAgents', // Growth Plan requires same tier as AI Agents
  brandSharing: 'brandSharing',
  advancedAnalytics: 'advancedAnalytics',
  apiAccess: 'apiAccess',
  whiteLabel: 'whiteLabel',
  customIntegrations: 'customIntegrations',
  ssoSaml: 'ssoSaml',
  intelligenceReport: 'intelligenceReport',
};

export function checkFeatureAccess(
  currentTier: SubscriptionTier,
  feature: GatedFeature
): FeatureGateResult {
  const normalized = normalizeTier(currentTier);
  const planKey = FEATURE_TO_PLAN_KEY[feature];
  const allowed = canAccessFeature(normalized, planKey);
  const requiredTier = FEATURE_MINIMUM_TIER[feature];
  const featureName = FEATURE_DISPLAY_NAMES[feature];
  const tierName = TIER_DISPLAY_NAMES[requiredTier];

  return {
    allowed,
    requiredTier,
    currentTier: normalized,
    upgradeMessage: allowed ? '' : `${featureName} requires the ${tierName} plan or higher.`,
  };
}

// Server-side helper: check feature access and return 403 response if denied
export function enforceFeatureAccess(
  tier: SubscriptionTier,
  feature: GatedFeature
): { allowed: true } | { allowed: false; response: Response } {
  const gate = checkFeatureAccess(tier, feature);
  if (gate.allowed) return { allowed: true };

  return {
    allowed: false,
    response: Response.json(
      {
        error: 'Feature not available on your current plan',
        feature,
        requiredTier: gate.requiredTier,
        currentTier: gate.currentTier,
        upgradeMessage: gate.upgradeMessage,
        upgradeUrl: '/pricing',
      },
      { status: 403 }
    ),
  };
}

export function getAvailableFeatures(tier: SubscriptionTier): GatedFeature[] {
  const normalized = normalizeTier(tier);
  return (Object.keys(FEATURE_MINIMUM_TIER) as GatedFeature[]).filter((feature) =>
    canAccessFeature(normalized, FEATURE_TO_PLAN_KEY[feature])
  );
}

export function getLockedFeatures(tier: SubscriptionTier): {
  feature: GatedFeature;
  requiredTier: SubscriptionTier;
  displayName: string;
}[] {
  const normalized = normalizeTier(tier);
  return (Object.keys(FEATURE_MINIMUM_TIER) as GatedFeature[])
    .filter((feature) => !canAccessFeature(normalized, FEATURE_TO_PLAN_KEY[feature]))
    .map((feature) => ({
      feature,
      requiredTier: FEATURE_MINIMUM_TIER[feature],
      displayName: FEATURE_DISPLAY_NAMES[feature],
    }));
}

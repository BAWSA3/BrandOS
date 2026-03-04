export type SubscriptionTier = 'FREE' | 'CREATOR' | 'PRO' | 'AGENCY' | 'ENTERPRISE';

export interface PlanLimits {
  brands: number;
  checksPerMonth: number;
  generationsPerMonth: number;
  historyDays: number;
  teamMembers: number;
  apiAccess: boolean;
  voiceFingerprint: boolean;
  contentCalendar: boolean;
  aiAgents: boolean;
  brandSharing: boolean | 'readonly' | 'full';
  advancedAnalytics: boolean;
  whiteLabel: boolean;
  customIntegrations: boolean;
  ssoSaml: boolean;
  platforms: number; // number of social platforms
}

export interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number; // per month when billed annually
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  limits: PlanLimits;
  popular?: boolean;
  foundersPrice?: number;
}

export const PLAN_CONFIGS: Record<SubscriptionTier, PlanConfig> = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    description: 'Get started with basic brand analysis',
    monthlyPrice: 0,
    annualPrice: 0,
    stripePriceIdMonthly: '',
    stripePriceIdAnnual: '',
    limits: {
      brands: 1,
      checksPerMonth: 5,
      generationsPerMonth: 3,
      historyDays: 7,
      teamMembers: 1,
      apiAccess: false,
      voiceFingerprint: false,
      contentCalendar: false,
      aiAgents: false,
      brandSharing: false,
      advancedAnalytics: false,
      whiteLabel: false,
      customIntegrations: false,
      ssoSaml: false,
      platforms: 1,
    },
  },
  CREATOR: {
    tier: 'CREATOR',
    name: 'Creator',
    description: 'For individual creators and solopreneurs',
    monthlyPrice: 19,
    annualPrice: 15,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CREATOR_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_CREATOR_ANNUAL || '',
    limits: {
      brands: 1,
      checksPerMonth: 50,
      generationsPerMonth: 25,
      historyDays: 30,
      teamMembers: 1,
      apiAccess: false,
      voiceFingerprint: false,
      contentCalendar: false,
      aiAgents: false,
      brandSharing: false,
      advancedAnalytics: false,
      whiteLabel: false,
      customIntegrations: false,
      ssoSaml: false,
      platforms: 1,
    },
  },
  PRO: {
    tier: 'PRO',
    name: 'Pro',
    description: 'For serious creators and small teams',
    monthlyPrice: 49,
    annualPrice: 39,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
    popular: true,
    limits: {
      brands: 3,
      checksPerMonth: 200,
      generationsPerMonth: 100,
      historyDays: -1, // unlimited
      teamMembers: 3,
      apiAccess: false,
      voiceFingerprint: true,
      contentCalendar: true,
      aiAgents: true,
      brandSharing: 'readonly',
      advancedAnalytics: false,
      whiteLabel: false,
      customIntegrations: false,
      ssoSaml: false,
      platforms: 3,
    },
  },
  AGENCY: {
    tier: 'AGENCY',
    name: 'Agency',
    description: 'For agencies and multi-brand companies',
    monthlyPrice: 149,
    annualPrice: 119,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || '',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_AGENCY_ANNUAL || '',
    limits: {
      brands: 15,
      checksPerMonth: 1000,
      generationsPerMonth: 500,
      historyDays: -1,
      teamMembers: 10,
      apiAccess: true,
      voiceFingerprint: true,
      contentCalendar: true,
      aiAgents: true,
      brandSharing: 'full',
      advancedAnalytics: true,
      whiteLabel: true,
      customIntegrations: true,
      ssoSaml: false,
      platforms: 5,
    },
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    monthlyPrice: -1, // custom
    annualPrice: -1,
    stripePriceIdMonthly: '',
    stripePriceIdAnnual: '',
    limits: {
      brands: -1, // unlimited
      checksPerMonth: -1,
      generationsPerMonth: -1,
      historyDays: -1,
      teamMembers: -1,
      apiAccess: true,
      voiceFingerprint: true,
      contentCalendar: true,
      aiAgents: true,
      brandSharing: 'full',
      advancedAnalytics: true,
      whiteLabel: true,
      customIntegrations: true,
      ssoSaml: true,
      platforms: -1,
    },
  },
};

export function getPlanConfig(tier: SubscriptionTier): PlanConfig {
  return PLAN_CONFIGS[tier];
}

export function getPlanLimits(tier: SubscriptionTier): PlanLimits {
  return PLAN_CONFIGS[tier].limits;
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof PlanLimits
): boolean {
  const limits = getPlanLimits(tier);
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return true;
  return value !== 0;
}

export const PAID_TIERS: SubscriptionTier[] = ['CREATOR', 'PRO', 'AGENCY', 'ENTERPRISE'];
export const SELF_SERVE_TIERS: SubscriptionTier[] = ['CREATOR', 'PRO', 'AGENCY'];

export const ONE_TIME_PRODUCTS = {
  BRAND_DNA_REPORT: {
    name: 'Brand DNA Deep-Dive Report',
    description: 'A comprehensive AI-generated analysis of your brand identity, voice, and strategy — delivered as a premium PDF.',
    price: 39,
    stripePriceId: process.env.STRIPE_PRICE_DNA_REPORT || '',
  },
};

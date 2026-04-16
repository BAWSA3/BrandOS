export type SubscriptionTier = 'FREE' | 'CREATOR' | 'PRO' | 'AGENCY' | 'ENTERPRISE';

// Active tiers for new signups (CREATOR is legacy, mapped to FREE)
export type ActiveTier = 'FREE' | 'PRO' | 'AGENCY' | 'ENTERPRISE';

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
  intelligenceReport: boolean;
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
      checksPerMonth: 3,
      generationsPerMonth: 2,
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
      intelligenceReport: false,
      platforms: 1,
    },
  },
  // Legacy tier — existing CREATOR subscribers get mapped to FREE limits
  // Kept for backwards compatibility with DB records
  CREATOR: {
    tier: 'CREATOR',
    name: 'Creator',
    description: 'Legacy plan — mapped to Free',
    monthlyPrice: 0,
    annualPrice: 0,
    stripePriceIdMonthly: '',
    stripePriceIdAnnual: '',
    limits: {
      brands: 1,
      checksPerMonth: 10,
      generationsPerMonth: 5,
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
      intelligenceReport: false,
      platforms: 1,
    },
  },
  PRO: {
    tier: 'PRO',
    name: 'Pro',
    description: 'Everything you need to build a standout brand',
    monthlyPrice: 29,
    annualPrice: 23,
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
      intelligenceReport: true,
      platforms: 3,
    },
  },
  AGENCY: {
    tier: 'AGENCY',
    name: 'Agency',
    description: 'For agencies and multi-brand companies',
    monthlyPrice: 99,
    annualPrice: 79,
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
      intelligenceReport: true,
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
      intelligenceReport: true,
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

export function canAccessFeature(tier: SubscriptionTier, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(tier);
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return true;
  return value !== 0;
}

export const PAID_TIERS: SubscriptionTier[] = ['PRO', 'AGENCY', 'ENTERPRISE'];
export const SELF_SERVE_TIERS: SubscriptionTier[] = ['PRO', 'AGENCY'];

// Normalize legacy CREATOR tier to FREE for feature access checks
export function normalizeTier(tier: SubscriptionTier): SubscriptionTier {
  return tier === 'CREATOR' ? 'FREE' : tier;
}

// ===== Phase 1: DB-driven plan limits (replaces PLAN_CONFIGS at cutover) =====

import prisma from '@/lib/db';
import type { PlanTier, PlanLimit } from '@prisma/client';

export type { PlanTier };

export const PLAN_TIERS = ['FREE', 'PRO', 'MAX', 'TEAM', 'ENTERPRISE'] as const;

export const PLAN_PRICING: Record<PlanTier, { monthly: number; annual: number; perSeat?: boolean; minSeats?: number }> = {
  FREE: { monthly: 0, annual: 0 },
  PRO: { monthly: 20, annual: 16 },
  MAX: { monthly: 80, annual: 64 },
  TEAM: { monthly: 25, annual: 20, perSeat: true, minSeats: 5 },
  ENTERPRISE: { monthly: -1, annual: -1 },
};

let cachedPlanLimits: Map<PlanTier, PlanLimit> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getPlanLimitsFromDB(plan: PlanTier): Promise<PlanLimit | null> {
  if (cachedPlanLimits && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPlanLimits.get(plan) ?? null;
  }

  try {
    const allLimits = await prisma.planLimit.findMany();
    cachedPlanLimits = new Map(allLimits.map((l) => [l.plan, l]));
    cacheTimestamp = Date.now();
    return cachedPlanLimits.get(plan) ?? null;
  } catch (error) {
    console.error('[Plans] Failed to load plan limits from DB:', error);
    return null;
  }
}

export function computeWorkspaceDailyCap(limits: PlanLimit, seatCount: number, isTeam: boolean): number {
  return isTeam ? limits.scansPerDay * seatCount : limits.scansPerDay;
}

export function computeXAccountCap(limits: PlanLimit, seatCount: number, isTeam: boolean): number {
  return isTeam ? limits.xAccountsPerSeat * seatCount : limits.xAccountsPerSeat;
}

export function isFeatureEnabled(limits: PlanLimit, feature: 'multiPlatform' | 'competitorWatchlist' | 'scheduledRescans' | 'priorityQueue'): boolean {
  switch (feature) {
    case 'multiPlatform': return limits.multiPlatformEnabled;
    case 'competitorWatchlist': return limits.competitorWatchlistEnabled;
    case 'scheduledRescans': return limits.scheduledRescansEnabled;
    case 'priorityQueue': return limits.priorityQueueEnabled;
  }
}

export const PAID_PLAN_TIERS: PlanTier[] = ['PRO', 'MAX', 'TEAM', 'ENTERPRISE'];

export function isPaidPlan(plan: PlanTier): boolean {
  return plan !== 'FREE';
}

export function isAtLeastPro(plan: PlanTier): boolean {
  return plan !== 'FREE';
}

export function isTeamPlan(plan: PlanTier): boolean {
  return plan === 'TEAM' || plan === 'ENTERPRISE';
}

// Map legacy SubscriptionTier → PlanTier for migration period
export function legacyTierToPlanTier(tier: SubscriptionTier): PlanTier {
  switch (tier) {
    case 'CREATOR': return 'FREE';
    case 'AGENCY': return 'TEAM';
    default: return tier as PlanTier;
  }
}

// ===== One-time products (unchanged — à la carte per Q3 decision) =====

export const ONE_TIME_PRODUCTS = {
  INTELLIGENCE_REPORT: {
    name: 'Intelligence Report',
    description:
      'Your complete brand breakdown — archetype profile, phase analysis, cohort comparison, pattern intelligence, and actionable insights. See how you rank against creators like you and what top scorers did to break through.',
    price: 4.99,
    stripePriceId: process.env.STRIPE_PRICE_INTELLIGENCE_REPORT || '',
  },
  BRAND_DNA_REPORT: {
    name: 'Brand DNA Deep-Dive Report',
    description:
      'A comprehensive AI-generated analysis of your brand identity, voice, and strategy — delivered as a premium PDF.',
    price: 39,
    stripePriceId: process.env.STRIPE_PRICE_DNA_REPORT || '',
  },
  SCORE_BOOST_AUDIT: {
    name: 'Score Boost Audit',
    description:
      'Analyze your last 50 tweets with AI-powered rewrite suggestions to boost your brand score.',
    price: 19,
    stripePriceId: process.env.STRIPE_PRICE_SCORE_BOOST || '',
  },
  ARCHETYPE_DEEP_DIVE: {
    name: 'Archetype Deep-Dive',
    description:
      'Extended archetype analysis with collaboration compatibility, content templates, and growth playbook.',
    price: 9,
    stripePriceId: process.env.STRIPE_PRICE_ARCHETYPE_DEEP_DIVE || '',
  },
};

import prisma from '@/lib/db';
import { getPlanLimits, isUnlimited, type SubscriptionTier } from '@/lib/plans';

export type UsageType = 'check' | 'generation';

export interface UsageStatus {
  type: UsageType;
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  percentUsed: number;
  canUse: boolean;
}

export interface UserUsageSummary {
  tier: SubscriptionTier;
  checks: UsageStatus;
  generations: UsageStatus;
  brands: {
    used: number;
    limit: number;
    remaining: number;
    isUnlimited: boolean;
  };
  resetsAt: Date;
}

export async function getUserUsage(userId: string): Promise<UserUsageSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { brands: true } } },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const tier = user.subscriptionTier as SubscriptionTier;
  const limits = getPlanLimits(tier);

  await maybeResetUsage(user.id, user.usageResetDate);

  const freshUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      checksUsedThisMonth: true,
      generationsUsedThisMonth: true,
      usageResetDate: true,
    },
  });

  const checksUsed = freshUser?.checksUsedThisMonth || 0;
  const gensUsed = freshUser?.generationsUsedThisMonth || 0;
  const checksLimit = limits.checksPerMonth;
  const gensLimit = limits.generationsPerMonth;

  const checksUnlimited = isUnlimited(checksLimit);
  const gensUnlimited = isUnlimited(gensLimit);
  const brandsUnlimited = isUnlimited(limits.brands);

  const resetDate = freshUser?.usageResetDate || new Date();
  const nextReset = new Date(resetDate);
  nextReset.setMonth(nextReset.getMonth() + 1);

  return {
    tier,
    checks: {
      type: 'check',
      used: checksUsed,
      limit: checksLimit,
      remaining: checksUnlimited ? Infinity : Math.max(0, checksLimit - checksUsed),
      isUnlimited: checksUnlimited,
      percentUsed: checksUnlimited ? 0 : Math.round((checksUsed / checksLimit) * 100),
      canUse: checksUnlimited || checksUsed < checksLimit,
    },
    generations: {
      type: 'generation',
      used: gensUsed,
      limit: gensLimit,
      remaining: gensUnlimited ? Infinity : Math.max(0, gensLimit - gensUsed),
      isUnlimited: gensUnlimited,
      percentUsed: gensUnlimited ? 0 : Math.round((gensUsed / gensLimit) * 100),
      canUse: gensUnlimited || gensUsed < gensLimit,
    },
    brands: {
      used: user._count.brands,
      limit: limits.brands,
      remaining: brandsUnlimited ? Infinity : Math.max(0, limits.brands - user._count.brands),
      isUnlimited: brandsUnlimited,
    },
    resetsAt: nextReset,
  };
}

export async function checkAndIncrementUsage(
  userId: string,
  type: UsageType
): Promise<{ allowed: boolean; usage: UsageStatus }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      checksUsedThisMonth: true,
      generationsUsedThisMonth: true,
      usageResetDate: true,
    },
  });

  if (!user) {
    return {
      allowed: false,
      usage: { type, used: 0, limit: 0, remaining: 0, isUnlimited: false, percentUsed: 100, canUse: false },
    };
  }

  await maybeResetUsage(userId, user.usageResetDate);

  const tier = user.subscriptionTier as SubscriptionTier;
  const limits = getPlanLimits(tier);

  const field = type === 'check' ? 'checksUsedThisMonth' : 'generationsUsedThisMonth';
  const limit = type === 'check' ? limits.checksPerMonth : limits.generationsPerMonth;
  const currentUsage = type === 'check' ? user.checksUsedThisMonth : user.generationsUsedThisMonth;
  const unlimited = isUnlimited(limit);

  if (!unlimited && currentUsage >= limit) {
    return {
      allowed: false,
      usage: {
        type,
        used: currentUsage,
        limit,
        remaining: 0,
        isUnlimited: false,
        percentUsed: 100,
        canUse: false,
      },
    };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { [field]: { increment: 1 } },
    select: { [field]: true },
  });

  const newUsage = (updated as unknown as Record<string, number>)[field];

  return {
    allowed: true,
    usage: {
      type,
      used: newUsage,
      limit,
      remaining: unlimited ? Infinity : Math.max(0, limit - newUsage),
      isUnlimited: unlimited,
      percentUsed: unlimited ? 0 : Math.round((newUsage / limit) * 100),
      canUse: unlimited || newUsage < limit,
    },
  };
}

async function maybeResetUsage(userId: string, resetDate: Date) {
  const now = new Date();
  const monthsSinceReset =
    (now.getFullYear() - resetDate.getFullYear()) * 12 +
    (now.getMonth() - resetDate.getMonth());

  if (monthsSinceReset >= 1) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        checksUsedThisMonth: 0,
        generationsUsedThisMonth: 0,
        usageResetDate: now,
      },
    });
  }
}

export async function canCreateBrand(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { brands: true } } },
  });

  if (!user) return false;

  const limits = getPlanLimits(user.subscriptionTier as SubscriptionTier);
  return isUnlimited(limits.brands) || user._count.brands < limits.brands;
}

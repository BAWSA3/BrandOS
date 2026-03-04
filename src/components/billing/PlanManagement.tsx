'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  ArrowUpRight,
  Zap,
  Sparkles,
  Crown,
  Users,
  Building2,
  BarChart3,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import UpgradeModal from './UpgradeModal';
import { PLAN_CONFIGS, type SubscriptionTier } from '@/lib/plans';
import type { UserUsageSummary } from '@/lib/usage';

interface PlanManagementProps {
  currentTier: SubscriptionTier;
  subscriptionStatus: string;
  billingInterval: string | null;
  currentPeriodEnd: string | null;
}

const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  FREE: <Zap className="h-5 w-5" />,
  CREATOR: <Sparkles className="h-5 w-5" />,
  PRO: <Crown className="h-5 w-5" />,
  AGENCY: <Users className="h-5 w-5" />,
  ENTERPRISE: <Building2 className="h-5 w-5" />,
};

const TIER_GRADIENTS: Record<SubscriptionTier, string> = {
  FREE: 'from-gray-500 to-gray-600',
  CREATOR: 'from-blue-500 to-cyan-500',
  PRO: 'from-blue-500 to-purple-600',
  AGENCY: 'from-purple-500 to-pink-500',
  ENTERPRISE: 'from-amber-500 to-orange-500',
};

export default function PlanManagement({
  currentTier,
  subscriptionStatus,
  billingInterval,
  currentPeriodEnd,
}: PlanManagementProps) {
  const [usage, setUsage] = useState<UserUsageSummary | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    setIsLoadingUsage(true);
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const handleBillingPortal = async () => {
    setIsLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Portal error:', err);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const plan = PLAN_CONFIGS[currentTier];
  const isPaid = currentTier !== 'FREE';

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Your Plan</h2>
          {isPaid && (
            <button
              onClick={handleBillingPortal}
              disabled={isLoadingPortal}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              {isLoadingPortal ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <CreditCard className="h-3 w-3" />
              )}
              Manage Billing
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${TIER_GRADIENTS[currentTier]} text-white`}>
                {TIER_ICONS[currentTier]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  {subscriptionStatus === 'ACTIVE' && isPaid && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      Active
                    </span>
                  )}
                  {subscriptionStatus === 'PAST_DUE' && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                      Past Due
                    </span>
                  )}
                  {subscriptionStatus === 'TRIALING' && (
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                      Trial
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/40">
                  {isPaid ? (
                    <>
                      ${billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice}/mo
                      {billingInterval === 'annual' ? ' (billed annually)' : ''}
                      {currentPeriodEnd && (
                        <> &middot; Renews {new Date(currentPeriodEnd).toLocaleDateString()}</>
                      )}
                    </>
                  ) : (
                    plan.description
                  )}
                </p>
              </div>
            </div>

            {currentTier !== 'ENTERPRISE' && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-700"
              >
                {isPaid ? 'Change Plan' : 'Upgrade'}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Meters */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <BarChart3 className="h-5 w-5 text-white/50" />
            Usage This Month
          </h2>
          {usage && (
            <span className="text-xs text-white/30">
              Resets {new Date(usage.resetsAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="p-6">
          {isLoadingUsage ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-white/30" />
            </div>
          ) : usage ? (
            <div className="grid gap-6 sm:grid-cols-3">
              <UsageMeter
                label="Content Checks"
                used={usage.checks.used}
                limit={usage.checks.limit}
                isUnlimited={usage.checks.isUnlimited}
                color="blue"
              />
              <UsageMeter
                label="AI Generations"
                used={usage.generations.used}
                limit={usage.generations.limit}
                isUnlimited={usage.generations.isUnlimited}
                color="purple"
              />
              <UsageMeter
                label="Brand Profiles"
                used={usage.brands.used}
                limit={usage.brands.limit}
                isUnlimited={usage.brands.isUnlimited}
                color="emerald"
              />
            </div>
          ) : (
            <p className="text-sm text-white/40">Unable to load usage data.</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      {isPaid && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={handleBillingPortal}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-sm font-medium text-white">Payment Methods</p>
                <p className="text-xs text-white/40">Update cards & billing info</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </button>
          <button
            onClick={handleBillingPortal}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-sm font-medium text-white">Invoices & History</p>
                <p className="text-xs text-white/40">Download past invoices</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </button>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentTier={currentTier}
      />
    </div>
  );
}

function UsageMeter({
  label,
  used,
  limit,
  isUnlimited,
  color,
}: {
  label: string;
  used: number;
  limit: number;
  isUnlimited: boolean;
  color: 'blue' | 'purple' | 'emerald';
}) {
  const percent = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isHigh = percent >= 80;
  const isMax = percent >= 100;

  const barColor = isMax
    ? 'bg-red-500'
    : isHigh
      ? 'bg-amber-500'
      : color === 'blue'
        ? 'bg-blue-500'
        : color === 'purple'
          ? 'bg-purple-500'
          : 'bg-emerald-500';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-white/70">{label}</span>
        <span className="text-xs text-white/40">
          {isUnlimited ? (
            <span className="text-emerald-400">Unlimited</span>
          ) : (
            <>
              <span className={isMax ? 'text-red-400' : isHigh ? 'text-amber-400' : 'text-white/70'}>
                {used}
              </span>
              {' / '}
              {limit}
            </>
          )}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: isUnlimited ? '0%' : `${Math.min(100, percent)}%` }}
        />
      </div>
      {isMax && (
        <p className="mt-1.5 text-xs text-red-400">Limit reached — upgrade to continue</p>
      )}
    </div>
  );
}

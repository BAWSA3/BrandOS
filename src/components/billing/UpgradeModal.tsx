'use client';

import { useState } from 'react';
import { X, Zap, Check, ArrowRight } from 'lucide-react';
import { PLAN_CONFIGS, SELF_SERVE_TIERS, type SubscriptionTier } from '@/lib/plans';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  reason?: string;
  highlightTier?: SubscriptionTier;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  currentTier,
  reason,
  highlightTier,
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');

  if (!isOpen) return null;

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setIsLoading(tier);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const tierOrder: SubscriptionTier[] = ['FREE', 'CREATOR', 'PRO', 'AGENCY', 'ENTERPRISE'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const upgradeTiers = SELF_SERVE_TIERS.filter(
    (t) => tierOrder.indexOf(t) > currentIndex
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1a1a1f] p-8 shadow-2xl"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Upgrade Your Plan</h2>
            {reason && (
              <p className="text-sm text-white/50">{reason}</p>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setInterval('monthly')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              interval === 'monthly'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('annual')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              interval === 'annual'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Annual <span className="text-emerald-400">Save 20%</span>
          </button>
        </div>

        <div className="grid gap-4">
          {upgradeTiers.map((tier) => {
            const plan = PLAN_CONFIGS[tier];
            const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const isHighlighted = tier === highlightTier;

            return (
              <div
                key={tier}
                className={`relative rounded-xl border p-5 transition-all ${
                  isHighlighted
                    ? 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-white/50">{plan.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <PlanBadge label={`${plan.limits.checksPerMonth} checks/mo`} />
                      <PlanBadge label={`${plan.limits.generationsPerMonth} generations/mo`} />
                      <PlanBadge label={`${plan.limits.brands} brand${plan.limits.brands > 1 ? 's' : ''}`} />
                      {plan.limits.aiAgents && <PlanBadge label="AI Agents" accent />}
                      {plan.limits.apiAccess && <PlanBadge label="API Access" accent />}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">${price}</span>
                      <span className="text-sm text-white/40">/mo</span>
                    </div>
                    <button
                      onClick={() => handleUpgrade(tier)}
                      disabled={isLoading !== null}
                      className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all ${
                        isHighlighted
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                          : 'bg-white/10 hover:bg-white/15'
                      } disabled:opacity-50`}
                    >
                      {isLoading === tier ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          Upgrade <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-white/30">
          Cancel anytime. All plans include a 14-day money-back guarantee.
        </p>
      </div>
    </div>
  );
}

function PlanBadge({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${
        accent
          ? 'bg-blue-500/10 text-blue-400'
          : 'bg-white/5 text-white/60'
      }`}
    >
      <Check className="h-3 w-3" />
      {label}
    </span>
  );
}

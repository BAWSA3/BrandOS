'use client';

import { useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import UpgradeModal from './UpgradeModal';
import { checkFeatureAccess, type GatedFeature } from '@/lib/gate';
import { PLAN_CONFIGS, type SubscriptionTier } from '@/lib/plans';

interface FeatureGateProps {
  feature: GatedFeature;
  currentTier: SubscriptionTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function FeatureGate({
  feature,
  currentTier,
  children,
  fallback,
}: FeatureGateProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const gate = checkFeatureAccess(currentTier, feature);

  if (gate.allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const requiredPlan = PLAN_CONFIGS[gate.requiredTier];

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1a1f]/90" />
        <div className="pointer-events-none opacity-30 blur-[2px]">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 ring-1 ring-white/10">
            <Lock className="h-6 w-6 text-white/70" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{gate.upgradeMessage}</p>
            <p className="mt-1 text-xs text-white/40">
              Starting at ${requiredPlan.monthlyPrice}/month
            </p>
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-700"
          >
            <Sparkles className="h-4 w-4" />
            Unlock with {requiredPlan.name}
          </button>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentTier={currentTier}
        reason={gate.upgradeMessage}
        highlightTier={gate.requiredTier}
      />
    </>
  );
}

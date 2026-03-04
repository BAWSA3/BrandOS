'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import UpgradeModal from './UpgradeModal';
import type { SubscriptionTier } from '@/lib/plans';

interface UsageLimitBannerProps {
  type: 'check' | 'generation';
  used: number;
  limit: number;
  currentTier: SubscriptionTier;
}

export default function UsageLimitBanner({
  type,
  used,
  limit,
  currentTier,
}: UsageLimitBannerProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const percentUsed = Math.round((used / limit) * 100);
  const isAtLimit = used >= limit;
  const isNearLimit = percentUsed >= 80;

  if (!isNearLimit) return null;

  const typeLabel = type === 'check' ? 'content checks' : 'AI generations';

  return (
    <>
      <div
        className={`relative flex items-center justify-between rounded-xl border px-4 py-3 ${
          isAtLimit
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-amber-500/30 bg-amber-500/5'
        }`}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle
            className={`h-5 w-5 flex-shrink-0 ${
              isAtLimit ? 'text-red-400' : 'text-amber-400'
            }`}
          />
          <div>
            <p className={`text-sm font-medium ${isAtLimit ? 'text-red-300' : 'text-amber-300'}`}>
              {isAtLimit
                ? `You've used all ${limit} ${typeLabel} this month`
                : `${used} of ${limit} ${typeLabel} used (${percentUsed}%)`}
            </p>
            <p className="text-xs text-white/40">
              {isAtLimit
                ? 'Upgrade your plan to continue using this feature.'
                : 'Consider upgrading before you hit your limit.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUpgrade(true)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all ${
              isAtLimit
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                : 'bg-amber-500/20 hover:bg-amber-500/30'
            }`}
          >
            Upgrade <ArrowRight className="h-3.5 w-3.5" />
          </button>
          {!isAtLimit && (
            <button
              onClick={() => setDismissed(true)}
              className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentTier={currentTier}
        reason={`You've used ${used} of ${limit} ${typeLabel} this month`}
      />
    </>
  );
}

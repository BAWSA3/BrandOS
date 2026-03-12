'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PLAN_CONFIGS, SELF_SERVE_TIERS, type SubscriptionTier } from '@/lib/plans';
import {
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  ArrowRight,
  Crown,
  Shield,
  Users,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

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

interface FeatureRow {
  label: string;
  free: string | boolean;
  creator: string | boolean;
  pro: string | boolean;
  agency: string | boolean;
  enterprise: string | boolean;
}

const COMPARISON_FEATURES: FeatureRow[] = [
  { label: 'brand profiles', free: '1', creator: '1', pro: '3', agency: '15', enterprise: 'unlimited' },
  { label: 'content checks / month', free: '5', creator: '50', pro: '200', agency: '1,000', enterprise: 'unlimited' },
  { label: 'ai generations / month', free: '3', creator: '25', pro: '100', agency: '500', enterprise: 'unlimited' },
  { label: 'history retention', free: '7 days', creator: '30 days', pro: 'unlimited', agency: 'unlimited', enterprise: 'unlimited' },
  { label: 'team members', free: '1', creator: '1', pro: '3', agency: '10', enterprise: 'unlimited' },
  { label: 'social platforms', free: '1', creator: '1', pro: '3', agency: '5', enterprise: 'unlimited' },
  { label: 'brand score tracking', free: true, creator: true, pro: true, agency: true, enterprise: true },
  { label: 'brand dna report', free: 'basic', creator: 'full + pdf', pro: 'full + pdf', agency: 'full + pdf', enterprise: 'custom' },
  { label: 'voice fingerprint', free: false, creator: false, pro: true, agency: true, enterprise: true },
  { label: 'content calendar', free: false, creator: false, pro: true, agency: true, enterprise: true },
  { label: 'ai agents', free: false, creator: false, pro: true, agency: true, enterprise: true },
  { label: 'brand sharing', free: false, creator: false, pro: 'read-only', agency: 'full', enterprise: 'full' },
  { label: 'advanced analytics', free: false, creator: false, pro: false, agency: true, enterprise: true },
  { label: 'api access', free: false, creator: false, pro: false, agency: true, enterprise: true },
  { label: 'white-label reports', free: false, creator: false, pro: false, agency: true, enterprise: true },
  { label: 'sso / saml', free: false, creator: false, pro: false, agency: false, enterprise: true },
  { label: 'priority support', free: false, creator: false, pro: false, agency: true, enterprise: true },
  { label: 'custom ai training', free: false, creator: false, pro: false, agency: false, enterprise: true },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const currentTier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;

  const handleCheckout = async (tier: SubscriptionTier) => {
    if (!user) {
      window.location.href = '/?signup=pricing';
      return;
    }
    setIsLoading(tier);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(null);
    }
  };

  const handleEnterprise = () => {
    window.location.href = '/enterprise';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <Link href="/" className="text-lg font-bold text-white">
          BrandOS
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/app"
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              go to app
            </Link>
          ) : (
            <Link
              href="/"
              className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-700"
            >
              get started free
            </Link>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-medium text-blue-300">
            founder&apos;s pricing — lock in these rates forever
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          plans that scale with your brand_
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/50">
          start free. upgrade when you need more. every plan includes our
          core brand engine.
        </p>

        {/* Interval toggle */}
        <div className="mt-8 inline-flex items-center rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setInterval('monthly')}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              interval === 'monthly'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            monthly
          </button>
          <button
            onClick={() => setInterval('annual')}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              interval === 'annual'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            annual
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {(['FREE', 'CREATOR', 'PRO', 'AGENCY'] as SubscriptionTier[]).map((tier) => {
            const plan = PLAN_CONFIGS[tier];
            const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const isCurrent = tier === currentTier;
            const isPro = plan.popular;

            return (
              <div
                key={tier}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                  isPro
                    ? 'border-blue-500/30 bg-gradient-to-b from-blue-500/5 to-transparent ring-1 ring-blue-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                      most popular
                    </span>
                  </div>
                )}

                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${TIER_GRADIENTS[tier]} text-white`}>
                  {TIER_ICONS[tier]}
                </div>

                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-white/40">{plan.description}</p>

                <div className="mt-4">
                  {price === 0 ? (
                    <div className="text-3xl font-extrabold text-white">free</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">${price}</span>
                      <span className="text-sm text-white/40">/month</span>
                    </div>
                  )}
                  {interval === 'annual' && price > 0 && (
                    <p className="mt-1 text-xs text-white/30">
                      ${price * 12}/year billed annually
                    </p>
                  )}
                </div>

                <div className="mt-6 flex-1">
                  <ul className="space-y-2.5">
                    <FeatureItem>{plan.limits.brands === 1 ? '1 brand' : `${plan.limits.brands} brands`}</FeatureItem>
                    <FeatureItem>{plan.limits.checksPerMonth} checks/month</FeatureItem>
                    <FeatureItem>{plan.limits.generationsPerMonth} generations/month</FeatureItem>
                    <FeatureItem>
                      {plan.limits.historyDays === -1 ? 'unlimited' : `${plan.limits.historyDays}-day`} history
                    </FeatureItem>
                    {plan.limits.voiceFingerprint && <FeatureItem>voice fingerprint</FeatureItem>}
                    {plan.limits.aiAgents && <FeatureItem>all ai agents</FeatureItem>}
                    {plan.limits.contentCalendar && <FeatureItem>content calendar</FeatureItem>}
                    {plan.limits.apiAccess && <FeatureItem>api access</FeatureItem>}
                    {plan.limits.whiteLabel && <FeatureItem>white-label reports</FeatureItem>}
                    {plan.limits.teamMembers > 1 && (
                      <FeatureItem>{plan.limits.teamMembers} team members</FeatureItem>
                    )}
                  </ul>
                </div>

                <div className="mt-6">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full rounded-xl bg-white/5 py-3 text-sm font-semibold text-white/40"
                    >
                      current plan
                    </button>
                  ) : tier === 'FREE' ? (
                    <Link
                      href="/"
                      className="block w-full rounded-xl border border-white/10 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-white/5"
                    >
                      get started
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleCheckout(tier)}
                      disabled={isLoading !== null}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all ${
                        isPro
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20'
                          : 'bg-white/10 hover:bg-white/15'
                      } disabled:opacity-50`}
                    >
                      {isLoading === tier ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          get {plan.name} <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Card */}
        <div className="mt-5 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5 p-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">enterprise_</h3>
                <p className="mt-1 text-sm text-white/50">
                  unlimited everything. sso, audit logs, custom ai training, dedicated support, and sla.
                  built for agencies and large teams.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-white/40">Starting at</div>
                <div className="text-2xl font-bold text-white">$500<span className="text-sm text-white/40">/mo</span></div>
              </div>
              <button
                onClick={handleEnterprise}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white transition-all hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20"
              >
                contact sales <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="mx-auto mb-8 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-medium text-white/60 transition-all hover:border-white/20 hover:text-white/80"
        >
          {showComparison ? 'hide' : 'show'} full feature comparison
        </button>

        {showComparison && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-sm font-medium text-white/50">Feature</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-white">Free</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-blue-400">Creator</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-purple-400">Pro</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-pink-400">Agency</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-amber-400">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-white/[0.01]' : ''}>
                    <td className="px-6 py-3 text-sm text-white/70">{row.label}</td>
                    <ComparisonCell value={row.free} />
                    <ComparisonCell value={row.creator} />
                    <ComparisonCell value={row.pro} />
                    <ComparisonCell value={row.agency} />
                    <ComparisonCell value={row.enterprise} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trust Section */}
      <div className="border-t border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <TrustBadge icon={<Shield className="h-5 w-5" />} label="14-day money-back guarantee" />
            <TrustBadge icon={<Globe className="h-5 w-5" />} label="cancel anytime" />
            <TrustBadge icon={<Zap className="h-5 w-5" />} label="instant access" />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold text-white">
          questions_
        </h2>
        <div className="space-y-4">
          <FaqItem
            q="can i change plans later?"
            a="absolutely. upgrade, downgrade, or cancel anytime from your account settings. changes take effect immediately and we'll prorate your billing."
          />
          <FaqItem
            q="what happens when i hit my usage limit?"
            a="you'll see a prompt to upgrade. your existing data and settings are never affected — you just can't run new checks or generations until the next cycle or you upgrade."
          />
          <FaqItem
            q="is there a free trial for paid plans?"
            a="we offer a generous free tier so you can try brandos firsthand. for pro and above, there's a 14-day money-back guarantee — no questions asked."
          />
          <FaqItem
            q="what payment methods do you accept?"
            a="all major credit and debit cards through stripe. enterprise customers can also pay via ach or wire transfer with annual invoicing."
          />
          <FaqItem
            q="what are founder's prices?"
            a="early adopters who sign up now lock in their current rate forever, even as we add features and raise prices."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-white/60">
      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
      {children}
    </li>
  );
}

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return (
      <td className="px-4 py-3 text-center">
        {value ? (
          <Check className="mx-auto h-4 w-4 text-emerald-400" />
        ) : (
          <X className="mx-auto h-4 w-4 text-white/20" />
        )}
      </td>
    );
  }
  return <td className="px-4 py-3 text-center text-sm text-white/60">{value}</td>;
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-white/40">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] transition-colors hover:border-white/15">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-sm font-medium text-white">{q}</span>
        <span className="ml-4 text-white/30">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="border-t border-white/5 px-6 py-4 text-sm text-white/50">
          {a}
        </div>
      )}
    </div>
  );
}

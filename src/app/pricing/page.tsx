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
  { label: 'Brand Profiles', free: '1', creator: '1', pro: '3', agency: '15', enterprise: 'Unlimited' },
  { label: 'Content Checks / month', free: '5', creator: '50', pro: '200', agency: '1,000', enterprise: 'Unlimited' },
  { label: 'AI Generations / month', free: '3', creator: '25', pro: '100', agency: '500', enterprise: 'Unlimited' },
  { label: 'History Retention', free: '7 days', creator: '30 days', pro: 'Unlimited', agency: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Team Members', free: '1', creator: '1', pro: '3', agency: '10', enterprise: 'Unlimited' },
  { label: 'Social Platforms', free: '1', creator: '1', pro: '3', agency: '5', enterprise: 'Unlimited' },
  { label: 'Brand Score Tracking', free: true, creator: true, pro: true, agency: true, enterprise: true },
  { label: 'Brand DNA Report', free: 'Basic', creator: 'Full + PDF', pro: 'Full + PDF', agency: 'Full + PDF', enterprise: 'Custom' },
  { label: 'Voice Fingerprint', free: false, creator: false, pro: true, agency: true, enterprise: true },
  { label: 'Content Calendar', free: false, creator: false, pro: true, agency: true, enterprise: true },
  { label: 'AI Agents', free: false, creator: false, pro: true, agency: true, enterprise: true },
  { label: 'Brand Sharing', free: false, creator: false, pro: 'Read-only', agency: 'Full', enterprise: 'Full' },
  { label: 'Advanced Analytics', free: false, creator: false, pro: false, agency: true, enterprise: true },
  { label: 'API Access', free: false, creator: false, pro: false, agency: true, enterprise: true },
  { label: 'White-Label Reports', free: false, creator: false, pro: false, agency: true, enterprise: true },
  { label: 'SSO / SAML', free: false, creator: false, pro: false, agency: false, enterprise: true },
  { label: 'Priority Support', free: false, creator: false, pro: false, agency: true, enterprise: true },
  { label: 'Custom AI Training', free: false, creator: false, pro: false, agency: false, enterprise: true },
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
              Go to App
            </Link>
          ) : (
            <Link
              href="/"
              className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-700"
            >
              Get Started Free
            </Link>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-medium text-blue-300">
            Founder&apos;s pricing — lock in these rates forever
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Plans that scale with your brand
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/50">
          Start free. Upgrade when you need more power. Every plan includes our
          core brand analysis engine.
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
            Monthly
          </button>
          <button
            onClick={() => setInterval('annual')}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              interval === 'annual'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Annual
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              Save 20%
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
                      MOST POPULAR
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
                    <div className="text-3xl font-extrabold text-white">Free</div>
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
                      {plan.limits.historyDays === -1 ? 'Unlimited' : `${plan.limits.historyDays}-day`} history
                    </FeatureItem>
                    {plan.limits.voiceFingerprint && <FeatureItem>Voice Fingerprint</FeatureItem>}
                    {plan.limits.aiAgents && <FeatureItem>All AI Agents</FeatureItem>}
                    {plan.limits.contentCalendar && <FeatureItem>Content Calendar</FeatureItem>}
                    {plan.limits.apiAccess && <FeatureItem>API Access</FeatureItem>}
                    {plan.limits.whiteLabel && <FeatureItem>White-Label Reports</FeatureItem>}
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
                      Current Plan
                    </button>
                  ) : tier === 'FREE' ? (
                    <Link
                      href="/"
                      className="block w-full rounded-xl border border-white/10 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-white/5"
                    >
                      Get Started
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
                          Get {plan.name} <ArrowRight className="h-4 w-4" />
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
                <h3 className="text-xl font-bold text-white">Enterprise</h3>
                <p className="mt-1 text-sm text-white/50">
                  Unlimited everything. SSO, audit logs, custom AI training, dedicated support, and SLA.
                  Built for agencies and large teams.
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
                Contact Sales <ArrowRight className="h-4 w-4" />
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
          {showComparison ? 'Hide' : 'Show'} full feature comparison
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
            <TrustBadge icon={<Globe className="h-5 w-5" />} label="Cancel anytime" />
            <TrustBadge icon={<Zap className="h-5 w-5" />} label="Instant access" />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold text-white">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <FaqItem
            q="Can I change plans later?"
            a="Absolutely. Upgrade, downgrade, or cancel at any time from your account settings. Changes take effect immediately and we'll prorate your billing."
          />
          <FaqItem
            q="What happens when I hit my usage limit?"
            a="You'll see a friendly prompt to upgrade. Your existing data and settings are never affected — you just won't be able to run new checks or generations until the next billing cycle or you upgrade."
          />
          <FaqItem
            q="Is there a free trial for paid plans?"
            a="We offer a generous free tier so you can experience BrandOS firsthand. For the Pro plan and above, we offer a 14-day money-back guarantee — no questions asked."
          />
          <FaqItem
            q="What payment methods do you accept?"
            a="We accept all major credit and debit cards through Stripe. Enterprise customers can also pay via ACH or wire transfer with annual invoicing."
          />
          <FaqItem
            q="What are Founder's prices?"
            a="Early adopters who sign up now lock in their current rate forever, even as we add features and raise prices for new customers."
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

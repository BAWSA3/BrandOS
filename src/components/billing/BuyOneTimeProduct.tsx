'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight, Check, Zap, BookOpen, BarChart3 } from 'lucide-react';
import { ONE_TIME_PRODUCTS } from '@/lib/plans';

type ProductKey = keyof typeof ONE_TIME_PRODUCTS;

const PRODUCT_ICONS: Record<ProductKey, React.ReactNode> = {
  INTELLIGENCE_REPORT: <BarChart3 className="h-5 w-5 text-white" />,
  BRAND_DNA_REPORT: <BookOpen className="h-5 w-5 text-white" />,
  SCORE_BOOST_AUDIT: <Zap className="h-5 w-5 text-white" />,
  ARCHETYPE_DEEP_DIVE: <Sparkles className="h-5 w-5 text-white" />,
};

const PRODUCT_FEATURES: Record<ProductKey, string[]> = {
  INTELLIGENCE_REPORT: [
    'Full archetype profile & phase analysis',
    'Cohort comparison vs creators like you',
    'Pattern intelligence from top scorers',
    'Strengths & growth areas breakdown',
    'Detailed phase insights',
  ],
  BRAND_DNA_REPORT: [
    'Full color & typography analysis',
    'Voice fingerprint breakdown',
    'Content pattern audit',
    'Personalized action plan',
    'PDF + email delivery',
  ],
  SCORE_BOOST_AUDIT: [
    'Last 50 tweets analyzed',
    'AI rewrite suggestions',
    'Score improvement projection',
    'Before/after comparison',
  ],
  ARCHETYPE_DEEP_DIVE: [
    'Extended archetype analysis',
    'Collaboration compatibility',
    'Content templates for your type',
    'Growth playbook',
  ],
};

const PRODUCT_GRADIENTS: Record<ProductKey, string> = {
  INTELLIGENCE_REPORT: 'from-blue-600 to-indigo-600',
  BRAND_DNA_REPORT: 'from-blue-500 to-purple-600',
  SCORE_BOOST_AUDIT: 'from-amber-500 to-orange-500',
  ARCHETYPE_DEEP_DIVE: 'from-emerald-500 to-teal-500',
};

interface BuyOneTimeProductProps {
  productKey: ProductKey;
  compact?: boolean;
}

export default function BuyOneTimeProduct({ productKey, compact }: BuyOneTimeProductProps) {
  const [isLoading, setIsLoading] = useState(false);
  const product = ONE_TIME_PRODUCTS[productKey];
  const gradient = PRODUCT_GRADIENTS[productKey];
  const features = PRODUCT_FEATURES[productKey];
  const icon = PRODUCT_ICONS[productKey];

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType: productKey }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}
          >
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{product.name}</h4>
            <p className="text-xs text-white/40">${product.price} one-time</p>
          </div>
        </div>
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/15 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              Get it <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient}`}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{product.name}</h3>
            <p className="mt-1 max-w-md text-sm text-white/50">{product.description}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {features.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60"
            >
              <Check className="h-3 w-3 text-emerald-400" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-6 py-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">${product.price}</span>
          <span className="text-sm text-white/40">one-time</span>
        </div>
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${gradient} px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50`}
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Get it now
            </>
          )}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { FileText, Sparkles, ArrowRight, Check } from 'lucide-react';
import { ONE_TIME_PRODUCTS } from '@/lib/plans';

interface BuyDNAReportProps {
  hasPurchased?: boolean;
  brandId?: string;
}

export default function BuyDNAReport({ hasPurchased, brandId }: BuyDNAReportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const product = ONE_TIME_PRODUCTS.BRAND_DNA_REPORT;

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType: 'BRAND_DNA_REPORT' }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!brandId) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/reports/brand-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      });
      const data = await res.json();
      if (data.success) setGenerated(true);
    } catch (error) {
      console.error('Generate error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (generated) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <Check className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Report Generated!</h3>
            <p className="text-sm text-white/50">
              Your Brand DNA report has been sent to your email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasPurchased) {
    return (
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Brand DNA Report — Purchased</h3>
              <p className="text-sm text-white/50">Generate your premium report anytime.</p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !brandId}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-600 disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>Generate Report <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{product.name}</h3>
              <p className="mt-1 max-w-md text-sm text-white/50">
                {product.description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            'Full color & typography analysis',
            'Voice fingerprint breakdown',
            'Content pattern audit',
            'Personalized action plan',
            'PDF + email delivery',
          ].map((item) => (
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
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Get Your Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}

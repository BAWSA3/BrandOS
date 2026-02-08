'use client';

import { useEffect, useState } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { useBrandCompleteness } from '@/components/BrandCompleteness';

export default function BrandScoreCard() {
  const brandDNA = useCurrentBrand();
  const completeness = useBrandCompleteness();
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on mount
  useEffect(() => {
    const target = completeness;
    let current = 0;
    const step = target / 40;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setAnimatedScore(Math.round(current));
    }, 20);
    return () => clearInterval(interval);
  }, [completeness]);

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div
      className="relative col-span-2 row-span-1 rounded-2xl border overflow-hidden p-6 flex items-center gap-8"
      style={{
        background: 'linear-gradient(135deg, rgba(0,47,167,0.15) 0%, rgba(0,71,255,0.08) 50%, rgba(15,15,15,0.9) 100%)',
        borderColor: 'rgba(0,71,255,0.2)',
      }}
    >
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Score Ring */}
      <div className="relative w-32 h-32 shrink-0">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="#0047FF"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: 'drop-shadow(0 0 8px rgba(0,71,255,0.5))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white tracking-tight">{animatedScore}</span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-white/40 mt-0.5">Brand Score</span>
        </div>
      </div>

      {/* Brand Info */}
      <div className="relative flex-1 space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            {brandDNA?.name || 'Your Brand'}
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Brand DNA Health</p>
        </div>

        {/* Tone bars */}
        <div className="space-y-2">
          {[
            { label: 'Formality', value: brandDNA?.tone.minimal || 0, color: '#71767B' },
            { label: 'Energy', value: brandDNA?.tone.playful || 0, color: '#00FF41' },
            { label: 'Confidence', value: brandDNA?.tone.bold || 0, color: '#0047FF' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[9px] uppercase tracking-wider text-white/30 w-16 shrink-0 font-mono">
                {label.slice(0, 3).toUpperCase()}
              </span>
              <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
                />
              </div>
              <span className="text-[10px] text-white/25 w-6 text-right font-mono">{value}</span>
            </div>
          ))}
        </div>

        {/* Keywords preview */}
        {brandDNA && brandDNA.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {brandDNA.keywords.slice(0, 4).map((kw, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[9px] rounded-full bg-[#0047FF]/10 text-[#0047FF]/70 border border-[#0047FF]/20"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

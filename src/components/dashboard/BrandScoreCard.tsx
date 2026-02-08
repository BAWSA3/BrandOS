'use client';

import { useEffect, useState } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { useBrandCompleteness } from '@/components/BrandCompleteness';

export default function BrandScoreCard() {
  const brandDNA = useCurrentBrand();
  const completeness = useBrandCompleteness();
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const target = completeness;
    let current = 0;
    const step = target / 30;
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

  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (animatedScore / 100) * circumference;

  const tone = brandDNA?.tone;
  const keywords = brandDNA?.keywords || [];

  return (
    <div style={{ background: '#1C1C1E', borderRadius: 16, padding: 24 }} className="h-full">
      <div className="flex items-start gap-6">
        {/* Score ring */}
        <div className="relative shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#2C2C2E" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="#0A84FF" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: 28, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.02em' }}>
              {animatedScore}
            </span>
          </div>
        </div>

        {/* Brand info */}
        <div className="flex-1 min-w-0">
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#F5F5F7', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {brandDNA?.name || 'Your Brand'}
          </h2>
          <p style={{ fontSize: 14, color: '#86868B', marginBottom: 16 }}>
            Brand completeness score
          </p>

          {/* Tone */}
          {tone && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#6E6E73', display: 'block', marginBottom: 6 }}>Tone</span>
              <span style={{ fontSize: 14, color: '#F5F5F7' }}>{tone}</span>
            </div>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div>
              <span style={{ fontSize: 12, color: '#6E6E73', display: 'block', marginBottom: 6 }}>Keywords</span>
              <div className="flex flex-wrap gap-1.5">
                {keywords.slice(0, 6).map((kw, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12,
                      color: '#86868B',
                      background: '#2C2C2E',
                      padding: '3px 10px',
                      borderRadius: 6,
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

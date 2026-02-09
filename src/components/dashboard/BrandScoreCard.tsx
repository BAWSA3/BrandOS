'use client';

import { useEffect, useState } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { useBrandCompleteness } from '@/components/BrandCompleteness';

// Simple archetype derivation from tone values
function deriveArchetype(tone: { minimal: number; playful: number; bold: number; experimental: number }): string {
  const { minimal, playful, bold, experimental } = tone;
  if (bold > 70 && experimental > 50) return 'Rebel';
  if (minimal > 70 && bold > 50) return 'Sage';
  if (playful > 70 && bold < 50) return 'Jester';
  if (bold > 60 && playful > 50) return 'Hero';
  if (minimal > 60 && experimental < 40) return 'Ruler';
  if (playful > 60 && minimal < 40) return 'Creator';
  if (experimental > 60) return 'Explorer';
  if (minimal > 50 && playful < 40) return 'Caregiver';
  return 'Everyperson';
}

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
  const archetype = tone ? deriveArchetype(tone) : null;

  // Calculate voice consistency from tone balance
  const voiceConsistency = tone
    ? Math.round((tone.minimal + tone.playful + tone.bold + tone.experimental) / 4)
    : 0;

  return (
    <div
      className="h-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #E8EDF5 0%, #EEF2F9 40%, #F0F4FA 100%)',
        borderRadius: 16,
        padding: 24,
        border: '1px solid rgba(10, 132, 255, 0.12)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Subtle glow */}
      <div
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(10,132,255,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex items-start gap-6">
        {/* Score ring */}
        <div className="relative shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="url(#scoreGradient)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease-out' }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0A84FF" />
                <stop offset="100%" stopColor="#30D158" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {animatedScore}
            </span>
          </div>
        </div>

        {/* Brand info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {brandDNA?.name || 'Your Brand'}
            </h2>
            {archetype && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#0A84FF',
                  background: 'rgba(10,132,255,0.12)',
                  padding: '3px 10px',
                  borderRadius: 20,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {archetype}
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Brand completeness score
          </p>

          {/* Voice consistency */}
          {tone && (
            <div style={{ marginBottom: 12 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Voice consistency</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{voiceConsistency}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${voiceConsistency}%`,
                    background: 'linear-gradient(90deg, #0A84FF, #30D158)',
                    borderRadius: 2,
                    transition: 'width 0.8s ease-out',
                  }}
                />
              </div>
            </div>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-1.5">
                {keywords.slice(0, 5).map((kw, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      background: 'rgba(0,0,0,0.05)',
                      padding: '3px 10px',
                      borderRadius: 6,
                    }}
                  >
                    {kw}
                  </span>
                ))}
                {keywords.length > 5 && (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '3px 4px' }}>
                    +{keywords.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { useBrandHealthScore } from '@/hooks/useBrandHealthScore';

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

// Mini sparkline for trend history
function HealthSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 120;
  const height = 28;
  const padding = 2;

  const points = values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke="url(#sparkGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0A84FF" />
          <stop offset="100%" stopColor="#30D158" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Trend arrow indicator
function TrendIndicator({ direction, delta }: { direction: 'up' | 'down' | 'stable'; delta: number }) {
  const colors = {
    up: '#30D158',
    down: '#FF453A',
    stable: 'var(--text-tertiary)',
  };
  const color = colors[direction];
  const absDelta = Math.abs(delta);

  return (
    <div className="flex items-center gap-1">
      {direction === 'up' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {direction === 'down' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {direction === 'stable' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <path d="M5 12h14" strokeLinecap="round" />
        </svg>
      )}
      {absDelta > 0 && (
        <span style={{ fontSize: 12, fontWeight: 600, color }}>
          {direction === 'down' ? '-' : '+'}{absDelta}
        </span>
      )}
    </div>
  );
}

// Dimension bar
function DimensionBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{score}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            background: color,
            borderRadius: 2,
            transition: 'width 0.8s ease-out',
          }}
        />
      </div>
    </div>
  );
}

export default function BrandScoreCard() {
  const brandDNA = useCurrentBrand();
  const health = useBrandHealthScore();
  const [animatedScore, setAnimatedScore] = useState(0);

  const displayScore = health.overallScore;

  useEffect(() => {
    const target = displayScore;
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
  }, [displayScore]);

  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (animatedScore / 100) * circumference;

  const tone = brandDNA?.tone;
  const keywords = brandDNA?.keywords || [];
  const archetype = tone ? deriveArchetype(tone) : null;

  const dimensionConfig = [
    { key: 'completeness', label: 'Completeness', color: '#0A84FF' },
    { key: 'consistency', label: 'Consistency', color: '#30D158' },
    { key: 'voiceMatch', label: 'Voice Match', color: '#BF5AF2' },
    { key: 'engagement', label: 'Engagement', color: '#FF9F0A' },
    { key: 'activity', label: 'Activity', color: '#64D2FF' },
  ] as const;

  const showFirstTimeCTA = !health.hasSnapshot && !health.isLoading && !health.isComputing;

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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {health.isLoading ? '--' : animatedScore}
            </span>
          </div>
          {/* Trend indicator below ring */}
          {health.hasSnapshot && (
            <div className="flex justify-center mt-1">
              <TrendIndicator direction={health.trend.direction} delta={health.trend.delta} />
            </div>
          )}
        </div>

        {/* Brand info + dimensions */}
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

          <div className="flex items-center gap-3 mb-3">
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {health.hasSnapshot ? 'Brand Health' : 'Brand completeness score'}
            </p>
            {health.hasSnapshot && (
              <button
                onClick={health.refresh}
                disabled={health.isComputing}
                style={{
                  fontSize: 11,
                  color: health.isComputing ? 'var(--text-tertiary)' : '#0A84FF',
                  background: 'rgba(10,132,255,0.08)',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: 4,
                  cursor: health.isComputing ? 'default' : 'pointer',
                  letterSpacing: '0.01em',
                }}
              >
                {health.isComputing ? 'Computing...' : 'Refresh'}
              </button>
            )}
          </div>

          {/* First-time CTA */}
          {showFirstTimeCTA && (
            <button
              onClick={health.refresh}
              disabled={health.isComputing}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(135deg, #0A84FF, #30D158)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 12,
              }}
            >
              Compute your Brand Health Score
            </button>
          )}

          {/* 5 sub-dimension bars */}
          {health.hasSnapshot && (
            <div style={{ marginBottom: 8 }}>
              {dimensionConfig.map(({ key, label, color }) => (
                <DimensionBar
                  key={key}
                  label={label}
                  score={health.dimensions[key]}
                  color={color}
                />
              ))}
            </div>
          )}

          {/* Sparkline */}
          {health.history.length >= 2 && (
            <div style={{ marginBottom: 8 }}>
              <HealthSparkline values={health.history.map(h => h.score)} />
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

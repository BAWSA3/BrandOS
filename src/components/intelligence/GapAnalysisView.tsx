'use client';

import { useState, useEffect } from 'react';

interface GapData {
  overallGapScore: number;
  hookStrength: number;
  formatMatch: number;
  toneAlignment: number;
  ctaEffectiveness: number;
  engagementVelocity: number;
  postingConsistency: number;
  strengths: string[];
  gaps: string[];
  actionItems: string[];
  rawAnalysis: string | null;
  computedAt: string;
}

interface HistoryPoint {
  overallGapScore: number;
  hookStrength: number;
  formatMatch: number;
  toneAlignment: number;
  ctaEffectiveness: number;
  engagementVelocity: number;
  postingConsistency: number;
  computedAt: string;
}

interface GapAnalysisViewProps {
  brandId: string;
}

const dimensions = [
  { key: 'hookStrength', label: 'Hook Strength', shortLabel: 'Hooks' },
  { key: 'formatMatch', label: 'Format Match', shortLabel: 'Format' },
  { key: 'toneAlignment', label: 'Tone Alignment', shortLabel: 'Tone' },
  { key: 'ctaEffectiveness', label: 'CTA Effectiveness', shortLabel: 'CTA' },
  { key: 'engagementVelocity', label: 'Engagement Velocity', shortLabel: 'Velocity' },
  { key: 'postingConsistency', label: 'Posting Consistency', shortLabel: 'Consistency' },
] as const;

export default function GapAnalysisView({ brandId }: GapAnalysisViewProps) {
  const [data, setData] = useState<GapData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGaps();
  }, [brandId]);

  async function fetchGaps() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/content-intelligence/gaps?brandId=${brandId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.analysis);
        setHistory(result.history || []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }

  function RadarChart({ values }: { values: number[] }) {
    const size = 180;
    const center = size / 2;
    const radius = 70;
    const levels = 4;

    // Generate points for each axis
    const angleStep = (2 * Math.PI) / values.length;
    const getPoint = (index: number, value: number) => {
      const angle = (index * angleStep) - Math.PI / 2;
      const r = (value / 100) * radius;
      return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
    };

    // Grid lines
    const gridPaths = Array.from({ length: levels }, (_, i) => {
      const levelRadius = ((i + 1) / levels) * radius;
      const points = values.map((_, j) => {
        const angle = (j * angleStep) - Math.PI / 2;
        return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
      });
      return `M ${points.join(' L ')} Z`;
    });

    // Data polygon
    const dataPoints = values.map((v, i) => {
      const p = getPoint(i, v);
      return `${p.x},${p.y}`;
    });
    const dataPath = `M ${dataPoints.join(' L ')} Z`;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridPaths.map((path, i) => (
          <path key={i} d={path} fill="none" stroke="var(--border)" strokeWidth="0.5" opacity={0.5} />
        ))}
        {/* Axis lines */}
        {values.map((_, i) => {
          const p = getPoint(i, 100);
          return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth="0.5" opacity={0.3} />;
        })}
        {/* Data fill */}
        <path d={dataPath} fill="rgba(0,71,255,0.12)" stroke="#0047FF" strokeWidth="1.5" />
        {/* Data points */}
        {values.map((v, i) => {
          const p = getPoint(i, v);
          return <circle key={i} cx={p.x} cy={p.y} r={3} fill="#0047FF" />;
        })}
        {/* Labels */}
        {dimensions.map((dim, i) => {
          const p = getPoint(i, 115);
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: 8, fill: 'var(--text-tertiary)', fontFamily: '"VCR OSD Mono", monospace' }}
            >
              {dim.shortLabel}
            </text>
          );
        })}
      </svg>
    );
  }

  if (isLoading) {
    return (
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-center py-12">
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', fontFamily: '"VCR OSD Mono", "JetBrains Mono", monospace' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>
          Gap Analysis
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
          No gap analysis yet. Run the intelligence pipeline first.
        </p>
      </div>
    );
  }

  const radarValues = dimensions.map(d => data[d.key] as number);

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 24,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        fontFamily: '"VCR OSD Mono", "JetBrains Mono", monospace',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Gap Analysis
        </h3>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
          {new Date(data.computedAt).toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="flex flex-col items-center">
          <RadarChart values={radarValues} />
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Overall Score: </span>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              color: data.overallGapScore >= 70 ? '#30D158' : data.overallGapScore >= 40 ? '#FFD60A' : '#FF453A',
            }}>
              {data.overallGapScore}
            </span>
          </div>
        </div>

        {/* Strengths, gaps, action items */}
        <div className="space-y-4">
          {/* Strengths */}
          <div>
            <p style={{ fontSize: 10, color: '#30D158', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
              Strengths
            </p>
            {data.strengths.map((s, i) => (
              <p key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                + {s}
              </p>
            ))}
          </div>

          {/* Gaps */}
          <div>
            <p style={{ fontSize: 10, color: '#FF453A', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
              Gaps
            </p>
            {data.gaps.map((g, i) => (
              <p key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                - {g}
              </p>
            ))}
          </div>

          {/* Action Items */}
          <div>
            <p style={{ fontSize: 10, color: '#0047FF', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
              Action Items
            </p>
            {data.actionItems.map((a, i) => (
              <p key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {i + 1}. {a}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

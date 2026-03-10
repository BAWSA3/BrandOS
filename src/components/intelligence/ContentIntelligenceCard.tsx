'use client';

import { useState, useEffect } from 'react';

interface GapAnalysisData {
  overallGapScore: number;
  hookStrength: number;
  formatMatch: number;
  toneAlignment: number;
  ctaEffectiveness: number;
  engagementVelocity: number;
  postingConsistency: number;
  gaps: string[];
  actionItems: string[];
  computedAt: string;
}

interface ContentIntelligenceCardProps {
  brandId: string;
}

export default function ContentIntelligenceCard({ brandId }: ContentIntelligenceCardProps) {
  const [analysis, setAnalysis] = useState<GapAnalysisData | null>(null);
  const [ideasCount, setIdeasCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [brandId]);

  async function fetchData() {
    try {
      const [gapRes, ideasRes] = await Promise.all([
        fetch(`/api/content-intelligence/gaps?brandId=${brandId}`),
        fetch(`/api/content-intelligence/ideas?brandId=${brandId}&limit=50`),
      ]);

      if (gapRes.ok) {
        const gapData = await gapRes.json();
        setAnalysis(gapData.analysis);
      }
      if (ideasRes.ok) {
        const ideasData = await ideasRes.json();
        setIdeasCount(ideasData.ideas?.length || 0);
      }
    } catch {
      // Silent fail — card shows empty state
    }
  }

  async function runPipeline() {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/content-intelligence/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      });
      if (!res.ok) throw new Error('Pipeline failed');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run pipeline');
    } finally {
      setIsRunning(false);
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 70) return '#30D158';
    if (score >= 40) return '#FFD60A';
    return '#FF453A';
  };

  const topGaps = analysis?.gaps?.slice(0, 3) || [];

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
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 16 }}>🧠</span>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Content Intelligence
          </h3>
        </div>
        <button
          onClick={runPipeline}
          disabled={isRunning}
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: isRunning ? 'var(--text-tertiary)' : '#0047FF',
            background: isRunning ? 'var(--surface-hover)' : 'rgba(0,71,255,0.08)',
            border: 'none',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          {isRunning ? 'Running...' : 'Run Pipeline'}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 11, color: '#FF453A', marginBottom: 8 }}>{error}</p>
      )}

      {!analysis ? (
        <div className="flex-1 flex items-center justify-center">
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            No intelligence data yet.<br />Run the pipeline to get started.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {/* Gap Score */}
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Gap Score</span>
            <span style={{
              fontSize: 28,
              fontWeight: 700,
              color: scoreColor(analysis.overallGapScore),
              letterSpacing: '-0.02em',
            }}>
              {analysis.overallGapScore}
            </span>
          </div>

          {/* Dimension bars */}
          <div className="space-y-2">
            {[
              { label: 'HOOK', value: analysis.hookStrength },
              { label: 'FMT', value: analysis.formatMatch },
              { label: 'TONE', value: analysis.toneAlignment },
              { label: 'CTA', value: analysis.ctaEffectiveness },
              { label: 'VEL', value: analysis.engagementVelocity },
              { label: 'FREQ', value: analysis.postingConsistency },
            ].map(dim => (
              <div key={dim.label} className="flex items-center gap-2">
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)', width: 32, letterSpacing: '0.05em' }}>
                  {dim.label}
                </span>
                <div style={{ flex: 1, height: 4, background: 'var(--surface-hover)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${dim.value}%`,
                    height: '100%',
                    background: scoreColor(dim.value),
                    borderRadius: 2,
                    transition: 'width 500ms ease',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 24, textAlign: 'right' }}>
                  {dim.value}
                </span>
              </div>
            ))}
          </div>

          {/* Top gaps */}
          {topGaps.length > 0 && (
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Top Gaps
              </p>
              {topGaps.map((gap, i) => (
                <p key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 2 }}>
                  • {gap}
                </p>
              ))}
            </div>
          )}

          {/* Ideas count */}
          <div className="flex items-center justify-between" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ideas Ready</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0047FF' }}>{ideasCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface ViralBenchmark {
  id: string;
  content: string;
  authorUsername: string | null;
  viralScore: number;
  niche: string;
  patterns: {
    hookType: string;
    format: string;
    tone: string;
    cta: string;
    length: string;
    topic: string;
  };
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
  scannedAt: string;
}

interface MarketScannerViewProps {
  brandId: string;
}

const patternColors: Record<string, string> = {
  'bold-claim': '#FF453A',
  'question': '#0A84FF',
  'contrarian': '#FF9F0A',
  'story': '#BF5AF2',
  'data': '#30D158',
  'list': '#64D2FF',
  'how-to': '#AC8E68',
  'observation': '#FFD60A',
};

export default function MarketScannerView({ brandId }: MarketScannerViewProps) {
  const [benchmarks, setBenchmarks] = useState<ViralBenchmark[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [niches, setNiches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBenchmarks();
  }, [brandId]);

  async function fetchBenchmarks() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/content-intelligence/benchmarks?brandId=${brandId}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data.benchmarks || []);
        const nicheSet = new Set(data.benchmarks?.map((b: ViralBenchmark) => b.niche) || []);
        setNiches(Array.from(nicheSet) as string[]);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = selectedNiche === 'all'
    ? benchmarks
    : benchmarks.filter(b => b.niche === selectedNiche);

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
          Viral Benchmarks
        </h3>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSelectedNiche('all')}
            style={{
              fontSize: 10,
              fontWeight: selectedNiche === 'all' ? 600 : 400,
              color: selectedNiche === 'all' ? '#0047FF' : 'var(--text-tertiary)',
              background: selectedNiche === 'all' ? 'rgba(0,71,255,0.08)' : 'transparent',
              border: 'none',
              borderRadius: 4,
              padding: '3px 8px',
              cursor: 'pointer',
            }}
          >
            All
          </button>
          {niches.map(n => (
            <button
              key={n}
              onClick={() => setSelectedNiche(n)}
              style={{
                fontSize: 10,
                fontWeight: selectedNiche === n ? 600 : 400,
                color: selectedNiche === n ? '#0047FF' : 'var(--text-tertiary)',
                background: selectedNiche === n ? 'rgba(0,71,255,0.08)' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
          No benchmarks yet. Run the market scanner to discover viral patterns.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(benchmark => (
            <div
              key={benchmark.id}
              style={{
                padding: 12,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface-hover)',
              }}
            >
              {/* Score + content */}
              <div className="flex gap-3">
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: benchmark.viralScore >= 70 ? '#30D158' : benchmark.viralScore >= 40 ? '#FFD60A' : '#FF453A',
                  background: benchmark.viralScore >= 70 ? 'rgba(48,209,88,0.1)' : benchmark.viralScore >= 40 ? 'rgba(255,214,10,0.1)' : 'rgba(255,69,58,0.1)',
                  flexShrink: 0,
                }}>
                  {benchmark.viralScore}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4 }}>
                    {benchmark.content.length > 200 ? benchmark.content.substring(0, 200) + '...' : benchmark.content}
                  </p>
                  {benchmark.authorUsername && (
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>@{benchmark.authorUsername}</span>
                  )}
                </div>
              </div>

              {/* Pattern pills */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <span style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: patternColors[benchmark.patterns.hookType] || '#999',
                  background: `${patternColors[benchmark.patterns.hookType] || '#999'}18`,
                  padding: '2px 6px',
                  borderRadius: 3,
                  letterSpacing: '0.03em',
                }}>
                  {benchmark.patterns.hookType}
                </span>
                <span style={{
                  fontSize: 9,
                  color: 'var(--text-tertiary)',
                  background: 'var(--surface)',
                  padding: '2px 6px',
                  borderRadius: 3,
                }}>
                  {benchmark.patterns.format}
                </span>
                <span style={{
                  fontSize: 9,
                  color: 'var(--text-tertiary)',
                  background: 'var(--surface)',
                  padding: '2px 6px',
                  borderRadius: 3,
                }}>
                  {benchmark.patterns.tone}
                </span>

                {/* Metrics */}
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                  {benchmark.metrics.likes}L · {benchmark.metrics.retweets}RT · {benchmark.metrics.replies}R
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useCurrentBrand, useBrandStore } from '@/lib/store';
import { CohesionAnalysis } from '@/lib/types';

export default function BrandCohesion() {
  const brandDNA = useCurrentBrand();
  const { history } = useBrandStore();
  const [assets, setAssets] = useState<{ type: string; content: string }[]>([]);
  const [newAsset, setNewAsset] = useState({ type: 'social', content: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CohesionAnalysis | null>(null);
  const [error, setError] = useState('');

  const assetTypes = ['social', 'headline', 'tagline', 'email', 'ad', 'website'];

  const addAsset = () => {
    if (!newAsset.content.trim()) return;
    setAssets([...assets, newAsset]);
    setNewAsset({ type: 'social', content: '' });
  };

  const loadFromHistory = () => {
    const historyAssets = history
      .filter(h => h.type === 'generate' && typeof h.output === 'string')
      .slice(0, 10)
      .map(h => ({
        type: h.contentType || 'general',
        content: h.output as string,
      }));
    setAssets(historyAssets);
  };

  const analyzeCohesion = async () => {
    if (assets.length < 2 || !brandDNA) return;
    
    setIsAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/cohesion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, assets }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze cohesion');
    }

    setIsAnalyzing(false);
  };

  const severityColors = {
    low: 'text-yellow-500',
    medium: 'text-orange-500',
    high: 'text-red-500',
  };

  return (
    <div className="space-y-8">
      {/* Add Assets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-xs uppercase tracking-widest text-muted">
            Add Brand Assets to Analyze
          </label>
          {history.length > 0 && (
            <button
              onClick={loadFromHistory}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              Load from history
            </button>
          )}
        </div>
        <div className="flex gap-2 mb-4">
          <select
            value={newAsset.type}
            onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
            className="bg-surface border border-border rounded-lg px-4 py-3 outline-none"
          >
            {assetTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="text"
            value={newAsset.content}
            onChange={(e) => setNewAsset({ ...newAsset, content: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addAsset()}
            placeholder="Paste content..."
            className="flex-1 bg-transparent border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors"
          />
          <button
            onClick={addAsset}
            disabled={!newAsset.content.trim()}
            className="px-6 py-3 bg-surface hover:bg-border/50 rounded-lg font-medium disabled:opacity-30 transition-colors"
          >
            Add
          </button>
        </div>

        {/* Asset List */}
        {assets.length > 0 && (
          <div className="space-y-2 mb-4">
            {assets.map((asset, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                <span className="text-xs uppercase text-muted w-20">{asset.type}</span>
                <span className="text-sm flex-1 truncate">{asset.content}</span>
                <button
                  onClick={() => setAssets(assets.filter((_, j) => j !== i))}
                  className="text-muted hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={analyzeCohesion}
          disabled={assets.length < 2 || isAnalyzing}
          className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
        >
          {isAnalyzing ? 'Analyzing...' : `Analyze ${assets.length} Assets as System`}
        </button>
        {assets.length < 2 && (
          <p className="text-xs text-muted mt-2 text-center">Add at least 2 assets to analyze cohesion</p>
        )}
      </div>

      {error && (
        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Analysis Result */}
      {analysis && (
        <div className="animate-fade-in space-y-6">
          {/* Score */}
          <div className="text-center p-8 border border-border rounded-lg">
            <div className="text-6xl font-light mb-2">{analysis.overallScore}</div>
            <p className="text-sm text-muted">Brand Cohesion Score</p>
          </div>

          {/* Tone Drift */}
          {analysis.toneDrift.detected && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                Tone Drift Detected
                <span className={severityColors[analysis.toneDrift.severity]}>
                  ({analysis.toneDrift.severity})
                </span>
              </h3>
              <p className="text-sm leading-relaxed">{analysis.toneDrift.details}</p>
            </div>
          )}

          {/* Repetition Issues */}
          {analysis.repetitionIssues.length > 0 && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Repetition Issues</h3>
              <ul className="space-y-2">
                {analysis.repetitionIssues.map((issue, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-yellow-500">⚠</span> {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Anchors */}
          {analysis.missingAnchors.length > 0 && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Missing Brand Anchors</h3>
              <ul className="space-y-2">
                {analysis.missingAnchors.map((anchor, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-blue-500">○</span> {anchor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Recommendations</h3>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm flex items-start gap-3 p-3 bg-surface rounded-lg">
                    <span className="text-green-500">✓</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


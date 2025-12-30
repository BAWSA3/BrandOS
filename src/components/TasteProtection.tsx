'use client';

import { useState } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { TasteProtectionResult } from '@/lib/types';

export default function TasteProtection() {
  const brandDNA = useCurrentBrand();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TasteProtectionResult | null>(null);
  const [error, setError] = useState('');

  const analyzeContent = async () => {
    if (!content.trim() || !brandDNA) return;
    
    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/taste-protect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, content }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
    }

    setIsAnalyzing(false);
  };

  const typeColors = {
    remove: 'text-red-500',
    simplify: 'text-yellow-500',
    refine: 'text-blue-500',
  };

  const typeIcons = {
    remove: '✗',
    simplify: '◇',
    refine: '◈',
  };

  return (
    <div className="space-y-8">
      {/* Philosophy */}
      <div className="p-6 bg-surface rounded-lg border border-border">
        <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Taste Protection Philosophy</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl mb-2">−</p>
            <p className="text-sm font-medium">Restraint</p>
            <p className="text-xs text-muted">over excess</p>
          </div>
          <div>
            <p className="text-2xl mb-2">✗</p>
            <p className="text-sm font-medium">Removal</p>
            <p className="text-xs text-muted">over addition</p>
          </div>
          <div>
            <p className="text-2xl mb-2">◈</p>
            <p className="text-sm font-medium">Refinement</p>
            <p className="text-xs text-muted">over decoration</p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-muted mb-4">
          Content to Protect
        </label>
        <p className="text-sm text-muted mb-4">
          Paste content that might be over-designed. We&apos;ll suggest what to remove.
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your content here... We'll identify excess and suggest what to remove for a cleaner, more refined result."
          className="w-full h-40 bg-transparent text-base border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors resize-none"
        />
        <button
          onClick={analyzeContent}
          disabled={!content.trim() || isAnalyzing}
          className="mt-4 w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
        >
          {isAnalyzing ? 'Analyzing...' : 'Protect Taste'}
        </button>
      </div>

      {error && (
        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade-in space-y-6">
          {/* Status */}
          <div className={`p-6 rounded-lg border ${
            result.analysis.isOverDesigned 
              ? 'border-yellow-500/30 bg-yellow-500/5' 
              : 'border-green-500/30 bg-green-500/5'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-2xl ${result.analysis.isOverDesigned ? 'text-yellow-500' : 'text-green-500'}`}>
                {result.analysis.isOverDesigned ? '⚠' : '✓'}
              </span>
              <h3 className="font-medium">
                {result.analysis.isOverDesigned ? 'Over-Design Detected' : 'Looking Clean'}
              </h3>
            </div>
            {result.analysis.isOverDesigned && (
              <p className="text-sm text-muted">
                This content has {result.analysis.excessElements.length + result.analysis.unnecessaryAdditions.length} elements that could be refined.
              </p>
            )}
          </div>

          {/* Excess Elements */}
          {result.analysis.excessElements.length > 0 && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Excess Elements</h3>
              <ul className="space-y-2">
                {result.analysis.excessElements.map((el, i) => (
                  <li key={i} className="text-sm flex items-start gap-2 text-red-400">
                    <span>✗</span> {el}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Unnecessary Additions */}
          {result.analysis.unnecessaryAdditions.length > 0 && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Trying Too Hard</h3>
              <ul className="space-y-2">
                {result.analysis.unnecessaryAdditions.map((el, i) => (
                  <li key={i} className="text-sm flex items-start gap-2 text-yellow-400">
                    <span>◇</span> {el}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Recommendations</h3>
              <div className="space-y-4">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="p-4 bg-surface rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={typeColors[rec.type]}>{typeIcons[rec.type]}</span>
                      <span className={`text-xs uppercase font-medium ${typeColors[rec.type]}`}>
                        {rec.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{rec.element}</p>
                    <p className="text-xs text-muted">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refined Version */}
          <div className="border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-widest text-muted">Refined Version</h3>
              <button
                onClick={() => navigator.clipboard.writeText(result.refinedVersion)}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="p-4 bg-surface rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{result.refinedVersion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


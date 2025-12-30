'use client';

import { useState } from 'react';
import { useBrandStore, useCurrentBrand } from '@/lib/store';
import { DesignIntentBlock } from '@/lib/types';

export default function DesignIntentBlocks() {
  const brandDNA = useCurrentBrand();
  const { designIntents, currentBrandId, addDesignIntent, deleteDesignIntent } = useBrandStore();
  const [directive, setDirective] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const currentIntents = currentBrandId ? designIntents[currentBrandId] || [] : [];

  const processDirective = async () => {
    if (!directive.trim() || !brandDNA) return;
    
    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/design-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, directive }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      addDesignIntent(data);
      setDirective('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process directive');
    }

    setIsProcessing(false);
  };

  const intentTypeColors: Record<string, string> = {
    visual_style: 'bg-purple-500/20 text-purple-400',
    typography: 'bg-blue-500/20 text-blue-400',
    layout: 'bg-green-500/20 text-green-400',
    motion: 'bg-orange-500/20 text-orange-400',
    color: 'bg-pink-500/20 text-pink-400',
    tone: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="space-y-8">
      {/* Input */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-muted mb-4">
          Design Intent Directive
        </label>
        <p className="text-sm text-muted mb-4">
          Describe your brand design rule in natural language. We&apos;ll convert it to enforceable rules.
        </p>
        <textarea
          value={directive}
          onChange={(e) => setDirective(e.target.value)}
          placeholder="e.g., Use soft gradient overlays in brand purple and blue tones against deep navy backgrounds. Create a sense of speed and athleticism."
          className="w-full h-32 bg-transparent text-base border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors resize-none"
        />
        <button
          onClick={processDirective}
          disabled={!directive.trim() || isProcessing}
          className="mt-4 w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
        >
          {isProcessing ? 'Converting...' : 'Convert to Design Intent Block'}
        </button>
      </div>

      {error && (
        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Intent Blocks */}
      {currentIntents.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
            Design Intent Blocks ({currentIntents.length})
          </h3>
          <div className="space-y-4">
            {currentIntents.map((intent) => (
              <div key={intent.id} className="border border-border rounded-lg p-6 animate-fade-in">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${intentTypeColors[intent.intentType] || 'bg-muted/20'}`}>
                    {intent.intentType.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => deleteDesignIntent(intent.id)}
                    className="text-muted hover:text-foreground transition-colors"
                  >
                    ×
                  </button>
                </div>
                
                <p className="text-sm italic text-muted mb-4">&ldquo;{intent.input}&rdquo;</p>
                
                {intent.colors && intent.colors.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-widest text-muted mb-2">Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {intent.colors.map((c, i) => (
                        <span key={i} className="px-2 py-1 bg-surface rounded text-sm">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {intent.effects && intent.effects.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-widest text-muted mb-2">Effects</p>
                    <div className="flex flex-wrap gap-2">
                      {intent.effects.map((e, i) => (
                        <span key={i} className="px-2 py-1 bg-surface rounded text-sm">{e}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {intent.emotionalSignals && intent.emotionalSignals.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-widest text-muted mb-2">Emotional Signals</p>
                    <div className="flex flex-wrap gap-2">
                      {intent.emotionalSignals.map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-surface rounded text-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted mb-2">Enforceable Rules</p>
                  <ul className="space-y-1">
                    {intent.rules.map((rule, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-foreground">→</span> {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


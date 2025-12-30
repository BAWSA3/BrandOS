'use client';

import { useState } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { ToneContext, ContextToneRules, ContextAdaptedContent } from '@/lib/types';

const CONTEXTS: { id: ToneContext; name: string; icon: string; description: string }[] = [
  { id: 'launch', name: 'Launch', icon: '🚀', description: 'Product or feature announcement' },
  { id: 'tease', name: 'Tease', icon: '👀', description: 'Building anticipation' },
  { id: 'apology', name: 'Apology', icon: '🙏', description: 'Addressing a mistake' },
  { id: 'crisis', name: 'Crisis', icon: '⚠️', description: 'Emergency response' },
  { id: 'celebration', name: 'Celebration', icon: '🎉', description: 'Milestone achievement' },
  { id: 'update', name: 'Update', icon: '📢', description: 'Regular announcement' },
  { id: 'educational', name: 'Educational', icon: '📚', description: 'Teaching content' },
];

export default function ContextTone() {
  const brandDNA = useCurrentBrand();
  const [selectedContext, setSelectedContext] = useState<ToneContext>('launch');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rules, setRules] = useState<ContextToneRules | null>(null);
  const [adaptation, setAdaptation] = useState<ContextAdaptedContent | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'rules' | 'adapt'>('rules');

  const loadRules = async (context: ToneContext) => {
    if (!brandDNA) return;
    
    setSelectedContext(context);
    setIsLoading(true);
    setError('');
    setRules(null);

    try {
      const response = await fetch('/api/context-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, context, action: 'get-rules' }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setRules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    }

    setIsLoading(false);
  };

  const adaptContent = async () => {
    if (!content.trim() || !brandDNA) return;
    
    setIsLoading(true);
    setError('');
    setAdaptation(null);

    try {
      const response = await fetch('/api/context-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          content,
          context: selectedContext,
          action: 'adapt',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setAdaptation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adapt content');
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Mode Toggle */}
      <div className="flex gap-1 bg-surface rounded-lg p-1 w-fit">
        <button
          onClick={() => setMode('rules')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'rules' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'
          }`}
        >
          View Rules
        </button>
        <button
          onClick={() => setMode('adapt')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'adapt' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'
          }`}
        >
          Adapt Content
        </button>
      </div>

      {/* Context Selection */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-muted mb-4">
          Select Context
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CONTEXTS.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() => mode === 'rules' ? loadRules(ctx.id) : setSelectedContext(ctx.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedContext === ctx.id
                  ? 'border-foreground bg-surface'
                  : 'border-border hover:border-muted'
              }`}
            >
              <span className="text-2xl mb-2 block">{ctx.icon}</span>
              <span className="font-medium block">{ctx.name}</span>
              <span className="text-xs text-muted">{ctx.description}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Rules Mode */}
      {mode === 'rules' && rules && (
        <div className="animate-fade-in space-y-6">
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">
              {CONTEXTS.find(c => c.id === rules.context)?.icon} {rules.context.charAt(0).toUpperCase() + rules.context.slice(1)} Context
            </h3>
            <p className="text-sm text-muted">{rules.description}</p>
          </div>

          {/* Tone Adjustments */}
          <div className="border border-border rounded-lg p-6">
            <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Tone Adjustments</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(rules.toneAdjustments).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className={`text-2xl font-light ${value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-muted'}`}>
                    {value > 0 ? '+' : ''}{value}
                  </div>
                  <div className="text-xs text-muted capitalize">{key}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Do/Don't Rules */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-6">
              <h4 className="text-xs uppercase tracking-widest text-green-500 mb-4">Do</h4>
              <ul className="space-y-2">
                {rules.doRules.map((rule, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-500">✓</span> {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border rounded-lg p-6">
              <h4 className="text-xs uppercase tracking-widest text-red-500 mb-4">Don&apos;t</h4>
              <ul className="space-y-2">
                {rules.dontRules.map((rule, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-red-500">✗</span> {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Example Phrases */}
          {rules.examplePhrases.length > 0 && (
            <div className="border border-border rounded-lg p-6">
              <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Example Phrases</h4>
              <div className="space-y-2">
                {rules.examplePhrases.map((phrase, i) => (
                  <div key={i} className="p-3 bg-surface rounded-lg text-sm italic">
                    &ldquo;{phrase}&rdquo;
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adapt Mode */}
      {mode === 'adapt' && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted mb-4">
              Content to Adapt
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Paste your content and we'll adapt the tone for a ${selectedContext} context...`}
              className="w-full h-32 bg-transparent text-base border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors resize-none"
            />
            <button
              onClick={adaptContent}
              disabled={!content.trim() || isLoading}
              className="mt-4 w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
            >
              {isLoading ? 'Adapting...' : `Adapt for ${selectedContext.charAt(0).toUpperCase() + selectedContext.slice(1)} Context`}
            </button>
          </div>

          {adaptation && (
            <div className="animate-fade-in space-y-6">
              <div className="border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs uppercase tracking-widest text-muted">
                    {CONTEXTS.find(c => c.id === adaptation.context)?.icon} Adapted for {adaptation.context}
                  </h4>
                  <button
                    onClick={() => navigator.clipboard.writeText(adaptation.adaptedContent)}
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-4 bg-surface rounded-lg mb-4">
                  <p className="text-sm whitespace-pre-wrap">{adaptation.adaptedContent}</p>
                </div>
                
                {adaptation.adjustmentsApplied.length > 0 && (
                  <div>
                    <p className="text-xs text-muted mb-2">Adjustments applied:</p>
                    <ul className="space-y-1">
                      {adaptation.adjustmentsApplied.map((adj, i) => (
                        <li key={i} className="text-xs text-muted flex items-start gap-2">
                          <span>→</span> {adj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial state for rules mode */}
      {mode === 'rules' && !rules && !isLoading && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted">Select a context above to see the tone rules.</p>
        </div>
      )}
    </div>
  );
}


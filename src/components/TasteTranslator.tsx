'use client';

import { useState } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { TasteTranslation } from '@/lib/types';

export default function TasteTranslator() {
  const brandDNA = useCurrentBrand();
  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [translation, setTranslation] = useState<TasteTranslation | null>(null);
  const [error, setError] = useState('');

  const commonFeedback = [
    "This doesn't feel premium",
    "Too corporate / stiff",
    "Not modern enough",
    "Feels cheap",
    "Too busy / cluttered",
    "Doesn't feel on-brand",
    "Too playful / not serious",
    "Lacks energy",
  ];

  const translateFeedback = async (text?: string) => {
    const feedbackText = text || feedback;
    if (!feedbackText.trim() || !brandDNA) return;
    
    setFeedback(feedbackText);
    setIsProcessing(true);
    setError('');
    setTranslation(null);

    try {
      const response = await fetch('/api/taste-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, feedback: feedbackText }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setTranslation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to translate feedback');
    }

    setIsProcessing(false);
  };

  const categoryColors: Record<string, string> = {
    premium: 'bg-amber-500/20 text-amber-400',
    modern: 'bg-blue-500/20 text-blue-400',
    playful: 'bg-pink-500/20 text-pink-400',
    minimal: 'bg-zinc-500/20 text-zinc-400',
    bold: 'bg-red-500/20 text-red-400',
    elegant: 'bg-purple-500/20 text-purple-400',
    other: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="space-y-8">
      {/* Common Feedback */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-muted mb-4">
          Common Feedback
        </label>
        <div className="flex flex-wrap gap-2">
          {commonFeedback.map((fb, i) => (
            <button
              key={i}
              onClick={() => translateFeedback(fb)}
              className="px-3 py-1.5 bg-surface hover:bg-border/50 rounded-full text-sm transition-colors"
            >
              {fb}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-muted mb-4">
          Or enter your own feedback
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && translateFeedback()}
            placeholder="e.g., This feels too corporate and cold..."
            className="flex-1 bg-transparent border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors"
          />
          <button
            onClick={() => translateFeedback()}
            disabled={!feedback.trim() || isProcessing}
            className="px-6 py-3 bg-foreground text-background rounded-lg font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
          >
            {isProcessing ? 'Translating...' : 'Translate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Translation Result */}
      {translation && (
        <div className="border border-border rounded-lg p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[translation.category]}`}>
              {translation.category}
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-widest text-muted mb-2">Feedback</h3>
            <p className="text-lg italic">&ldquo;{translation.feedback}&rdquo;</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-widest text-muted mb-2">What this means</h3>
            <p className="text-sm leading-relaxed">{translation.interpretation}</p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Actionable Rules</h3>
            <ul className="space-y-3">
              {translation.actionableRules.map((rule, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-surface rounded-lg">
                  <span className="w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}


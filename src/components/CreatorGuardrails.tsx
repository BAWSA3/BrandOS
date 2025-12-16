'use client';

import { useState } from 'react';
import { useCurrentBrand, useBrandStore } from '@/lib/store';
import { GuardrailResult, ContentType } from '@/lib/types';

const CONTENT_TYPES: { id: ContentType; name: string }[] = [
  { id: 'social-twitter', name: 'Social (Twitter)' },
  { id: 'social-instagram', name: 'Social (Instagram)' },
  { id: 'social-linkedin', name: 'Social (LinkedIn)' },
  { id: 'headline', name: 'Headline' },
  { id: 'tagline', name: 'Tagline' },
  { id: 'email-subject', name: 'Email Subject' },
  { id: 'email-body', name: 'Email Body' },
  { id: 'ad-copy', name: 'Ad Copy' },
  { id: 'blog-intro', name: 'Blog Intro' },
  { id: 'general', name: 'General' },
];

export default function CreatorGuardrails() {
  const brandDNA = useCurrentBrand();
  const { safeZones, currentBrandId } = useBrandStore();
  const currentSafeZones = currentBrandId ? safeZones[currentBrandId] || [] : [];
  
  const [draft, setDraft] = useState('');
  const [contentType, setContentType] = useState<ContentType>('general');
  const [creatorName, setCreatorName] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<GuardrailResult | null>(null);
  const [error, setError] = useState('');

  const evaluateDraft = async () => {
    if (!draft.trim() || !brandDNA) return;
    
    setIsEvaluating(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          draft: {
            id: Date.now().toString(),
            content: draft,
            contentType,
            creatorName: creatorName || undefined,
          },
          safeZones: currentSafeZones,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate draft');
    }

    setIsEvaluating(false);
  };

  const statusColors = {
    approved: 'bg-green-500/20 text-green-500 border-green-500/30',
    'needs-revision': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
  };

  const severityColors = {
    minor: 'text-yellow-500',
    major: 'text-orange-500',
    critical: 'text-red-500',
  };

  return (
    <div className="space-y-8">
      {/* Draft Input */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-muted mb-4">
          Creator Draft
        </label>
        <p className="text-sm text-muted mb-4">
          Submit content for brand alignment review. Great for reviewing work from creators, agencies, or team members.
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste the draft content to review..."
          className="w-full h-40 bg-transparent text-base border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors resize-none"
        />
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted mb-2">
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 outline-none"
          >
            {CONTENT_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted mb-2">
            Creator Name (optional)
          </label>
          <input
            type="text"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="e.g., Agency X, John D."
            className="w-full bg-transparent border border-border rounded-lg px-4 py-3 outline-none placeholder:text-muted focus:border-foreground transition-colors"
          />
        </div>
      </div>

      <button
        onClick={evaluateDraft}
        disabled={!draft.trim() || isEvaluating}
        className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
      >
        {isEvaluating ? 'Evaluating...' : 'Evaluate Against Brand Guidelines'}
      </button>

      {error && (
        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade-in space-y-6">
          {/* Status & Score */}
          <div className="flex items-center justify-between p-6 border border-border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-light">{result.alignmentScore}</div>
              <div>
                <p className="text-sm text-muted">Alignment Score</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[result.status]}`}>
                  {result.status === 'needs-revision' ? 'Needs Revision' : result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Violations */}
          {result.violations.length > 0 && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
                Violations ({result.violations.length})
              </h3>
              <div className="space-y-3">
                {result.violations.map((v, i) => (
                  <div key={i} className="p-4 bg-surface rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium">{v.rule}</span>
                      <span className={`text-xs ${severityColors[v.severity]}`}>
                        {v.severity}
                      </span>
                    </div>
                    <p className="text-sm text-muted">💡 {v.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What's Working */}
          {result.approvedElements.length > 0 && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
                What&apos;s Working
              </h3>
              <ul className="space-y-2">
                {result.approvedElements.map((el, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-500">✓</span> {el}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Revised Version */}
          {result.revisedVersion && result.status !== 'approved' && (
            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs uppercase tracking-widest text-muted">
                  Suggested Revision
                </h3>
                <button
                  onClick={() => navigator.clipboard.writeText(result.revisedVersion!)}
                  className="text-xs text-muted hover:text-foreground transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="p-4 bg-surface rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{result.revisedVersion}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


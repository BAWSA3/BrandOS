'use client';

import { useState } from 'react';
import { ExtractedBrand, ExtractedValue } from '@/lib/importTypes';

interface BrandReviewGridProps {
  extractedBrand: ExtractedBrand;
  sourcePreview?: string | null;
  onBack: () => void;
  onComplete: (brand: ExtractedBrand) => void;
}

export default function BrandReviewGrid({
  extractedBrand,
  onBack,
  onComplete,
}: BrandReviewGridProps) {
  const [brand, setBrand] = useState(extractedBrand);
  const [includedElements, setIncludedElements] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (brand.name) initial['name'] = true;
    if (brand.colors?.primary) initial['colors.primary'] = true;
    if (brand.colors?.secondary) initial['colors.secondary'] = true;
    if (brand.colors?.accent) initial['colors.accent'] = true;
    if (brand.tone?.formality) initial['tone.formality'] = true;
    if (brand.tone?.energy) initial['tone.energy'] = true;
    if (brand.tone?.confidence) initial['tone.confidence'] = true;
    if (brand.tone?.style) initial['tone.style'] = true;
    brand.keywords?.forEach((_, i) => initial[`keywords.${i}`] = true);
    brand.doPatterns?.forEach((_, i) => initial[`doPatterns.${i}`] = true);
    brand.dontPatterns?.forEach((_, i) => initial[`dontPatterns.${i}`] = true);
    brand.voiceSamples?.forEach((_, i) => initial[`voiceSamples.${i}`] = true);
    return initial;
  });

  const toggleElement = (key: string) => {
    setIncludedElements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = (keys: string[], value: boolean) => {
    setIncludedElements(prev => {
      const updated = { ...prev };
      keys.forEach(k => updated[k] = value);
      return updated;
    });
  };

  const handleComplete = () => {
    const finalBrand: ExtractedBrand = {
      ...brand,
      name: includedElements['name'] ? brand.name : undefined,
      colors: {
        primary: includedElements['colors.primary'] ? brand.colors?.primary : undefined,
        secondary: includedElements['colors.secondary'] ? brand.colors?.secondary : undefined,
        accent: includedElements['colors.accent'] ? brand.colors?.accent : undefined,
      },
      tone: {
        formality: includedElements['tone.formality'] ? brand.tone?.formality : undefined,
        energy: includedElements['tone.energy'] ? brand.tone?.energy : undefined,
        confidence: includedElements['tone.confidence'] ? brand.tone?.confidence : undefined,
        style: includedElements['tone.style'] ? brand.tone?.style : undefined,
      },
      keywords: brand.keywords?.filter((_, i) => includedElements[`keywords.${i}`]),
      doPatterns: brand.doPatterns?.filter((_, i) => includedElements[`doPatterns.${i}`]),
      dontPatterns: brand.dontPatterns?.filter((_, i) => includedElements[`dontPatterns.${i}`]),
      voiceSamples: brand.voiceSamples?.filter((_, i) => includedElements[`voiceSamples.${i}`]),
    };
    onComplete(finalBrand);
  };

  const includedCount = Object.values(includedElements).filter(Boolean).length;
  const totalCount = Object.keys(includedElements).length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="text-sm text-muted">
            {includedCount} of {totalCount} elements selected
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-light tracking-tight mb-2">Review All Elements</h1>
          <p className="text-muted">Toggle elements to include or exclude them from import</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Name & Colors */}
          <div className="bg-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted">Identity</h3>
            </div>
            
            {/* Name */}
            {brand.name && (
              <GridItem
                label="Brand Name"
                included={includedElements['name']}
                onToggle={() => toggleElement('name')}
                confidence={brand.name.confidence}
              >
                <span className="text-xl font-light">{brand.name.value}</span>
              </GridItem>
            )}
            
            {/* Colors */}
            <div className="mt-4 space-y-3">
              {brand.colors?.primary && (
                <GridItem
                  label="Primary"
                  included={includedElements['colors.primary']}
                  onToggle={() => toggleElement('colors.primary')}
                  confidence={brand.colors.primary.confidence}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: brand.colors.primary.value }} />
                    <span className="font-mono text-sm">{brand.colors.primary.value}</span>
                  </div>
                </GridItem>
              )}
              {brand.colors?.secondary && (
                <GridItem
                  label="Secondary"
                  included={includedElements['colors.secondary']}
                  onToggle={() => toggleElement('colors.secondary')}
                  confidence={brand.colors.secondary.confidence}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: brand.colors.secondary.value }} />
                    <span className="font-mono text-sm">{brand.colors.secondary.value}</span>
                  </div>
                </GridItem>
              )}
              {brand.colors?.accent && (
                <GridItem
                  label="Accent"
                  included={includedElements['colors.accent']}
                  onToggle={() => toggleElement('colors.accent')}
                  confidence={brand.colors.accent.confidence}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: brand.colors.accent.value }} />
                    <span className="font-mono text-sm">{brand.colors.accent.value}</span>
                  </div>
                </GridItem>
              )}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted">Tone</h3>
              <button
                onClick={() => {
                  const toneKeys = ['tone.formality', 'tone.energy', 'tone.confidence', 'tone.style'].filter(k => brand.tone?.[k.split('.')[1] as keyof typeof brand.tone]);
                  const allSelected = toneKeys.every(k => includedElements[k]);
                  toggleAll(toneKeys, !allSelected);
                }}
                className="text-xs text-muted hover:text-foreground"
              >
                Toggle all
              </button>
            </div>
            
            <div className="space-y-3">
              {brand.tone?.formality && (
                <GridItem
                  label="Formality"
                  included={includedElements['tone.formality']}
                  onToggle={() => toggleElement('tone.formality')}
                  confidence={brand.tone.formality.confidence}
                >
                  <ToneBar value={brand.tone.formality.value} leftLabel="Casual" rightLabel="Formal" />
                </GridItem>
              )}
              {brand.tone?.energy && (
                <GridItem
                  label="Energy"
                  included={includedElements['tone.energy']}
                  onToggle={() => toggleElement('tone.energy')}
                  confidence={brand.tone.energy.confidence}
                >
                  <ToneBar value={brand.tone.energy.value} leftLabel="Reserved" rightLabel="Energetic" />
                </GridItem>
              )}
              {brand.tone?.confidence && (
                <GridItem
                  label="Confidence"
                  included={includedElements['tone.confidence']}
                  onToggle={() => toggleElement('tone.confidence')}
                  confidence={brand.tone.confidence.confidence}
                >
                  <ToneBar value={brand.tone.confidence.value} leftLabel="Humble" rightLabel="Bold" />
                </GridItem>
              )}
              {brand.tone?.style && (
                <GridItem
                  label="Style"
                  included={includedElements['tone.style']}
                  onToggle={() => toggleElement('tone.style')}
                  confidence={brand.tone.style.confidence}
                >
                  <ToneBar value={brand.tone.style.value} leftLabel="Classic" rightLabel="Experimental" />
                </GridItem>
              )}
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted">Keywords</h3>
              {brand.keywords && brand.keywords.length > 0 && (
                <button
                  onClick={() => {
                    const keys = brand.keywords!.map((_, i) => `keywords.${i}`);
                    const allSelected = keys.every(k => includedElements[k]);
                    toggleAll(keys, !allSelected);
                  }}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Toggle all
                </button>
              )}
            </div>
            
            {brand.keywords && brand.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {brand.keywords.map((keyword, i) => (
                  <button
                    key={i}
                    onClick={() => toggleElement(`keywords.${i}`)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      includedElements[`keywords.${i}`]
                        ? 'bg-foreground text-background'
                        : 'bg-border text-muted'
                    }`}
                  >
                    {keyword.value}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No keywords detected</p>
            )}
          </div>

          {/* Patterns */}
          <div className="bg-surface rounded-xl p-6">
            <h3 className="text-sm font-medium uppercase tracking-widest text-muted mb-4">Patterns</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-green-500 mb-2 flex items-center gap-1">
                  <span>✓</span> Do
                </p>
                {brand.doPatterns && brand.doPatterns.length > 0 ? (
                  <div className="space-y-1">
                    {brand.doPatterns.map((pattern, i) => (
                      <button
                        key={i}
                        onClick={() => toggleElement(`doPatterns.${i}`)}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition-all ${
                          includedElements[`doPatterns.${i}`] ? 'bg-green-500/10' : 'opacity-40'
                        }`}
                      >
                        {pattern.value}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">None</p>
                )}
              </div>
              
              <div>
                <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                  <span>✗</span> Don&apos;t
                </p>
                {brand.dontPatterns && brand.dontPatterns.length > 0 ? (
                  <div className="space-y-1">
                    {brand.dontPatterns.map((pattern, i) => (
                      <button
                        key={i}
                        onClick={() => toggleElement(`dontPatterns.${i}`)}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition-all ${
                          includedElements[`dontPatterns.${i}`] ? 'bg-red-500/10' : 'opacity-40'
                        }`}
                      >
                        {pattern.value}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">None</p>
                )}
              </div>
            </div>
          </div>

          {/* Voice Samples */}
          <div className="col-span-2 bg-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted">Voice Samples</h3>
              {brand.voiceSamples && brand.voiceSamples.length > 0 && (
                <button
                  onClick={() => {
                    const keys = brand.voiceSamples!.map((_, i) => `voiceSamples.${i}`);
                    const allSelected = keys.every(k => includedElements[k]);
                    toggleAll(keys, !allSelected);
                  }}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Toggle all
                </button>
              )}
            </div>
            
            {brand.voiceSamples && brand.voiceSamples.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {brand.voiceSamples.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => toggleElement(`voiceSamples.${i}`)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      includedElements[`voiceSamples.${i}`]
                        ? 'border-foreground/20 bg-background'
                        : 'border-transparent opacity-40'
                    }`}
                  >
                    <p className="text-sm italic line-clamp-2">&ldquo;{sample.value}&rdquo;</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No voice samples detected</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 text-sm text-muted hover:text-foreground transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleComplete}
            className="px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Import {includedCount} Elements
          </button>
        </div>
      </div>
    </div>
  );
}

interface GridItemProps {
  label: string;
  included: boolean;
  onToggle: () => void;
  confidence: number;
  children: React.ReactNode;
}

function GridItem({ label, included, onToggle, confidence, children }: GridItemProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${included ? '' : 'opacity-40'}`}>
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          included ? 'bg-foreground border-foreground' : 'border-muted'
        }`}
      >
        {included && (
          <svg className="w-2.5 h-2.5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted">{label}</span>
          <span className={`text-xs ${confidence >= 80 ? 'text-green-500' : confidence >= 60 ? 'text-yellow-500' : 'text-orange-500'}`}>
            {confidence}%
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function ToneBar({ value, leftLabel, rightLabel }: { value: number; leftLabel: string; rightLabel: string }) {
  return (
    <div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div className="h-full bg-foreground rounded-full" style={{ width: `${value}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted">{leftLabel}</span>
        <span className="text-xs font-medium">{value}</span>
        <span className="text-xs text-muted">{rightLabel}</span>
      </div>
    </div>
  );
}








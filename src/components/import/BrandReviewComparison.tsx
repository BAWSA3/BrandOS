'use client';

import { useState } from 'react';
import { ExtractedBrand } from '@/lib/importTypes';

interface BrandReviewComparisonProps {
  extractedBrand: ExtractedBrand;
  sourcePreview?: string | null;
  onBack: () => void;
  onComplete: (brand: ExtractedBrand) => void;
}

export default function BrandReviewComparison({
  extractedBrand,
  sourcePreview,
  onBack,
  onComplete,
}: BrandReviewComparisonProps) {
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
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
          
          <h1 className="text-xl font-light">Side-by-Side Review</h1>
          
          <button
            onClick={handleComplete}
            className="px-6 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Import {includedCount} Elements
          </button>
        </div>

        {/* Comparison View */}
        <div className="grid grid-cols-2 gap-8">
          {/* Source Column */}
          <div>
            <div className="sticky top-6">
              <h2 className="text-sm font-medium uppercase tracking-widest text-muted mb-4">Source</h2>
              <div className="bg-surface rounded-xl p-4">
                {sourcePreview ? (
                  <div className="space-y-4">
                    {sourcePreview.startsWith('data:image') || sourcePreview.startsWith('http') ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={sourcePreview} alt="Source preview" className="w-full rounded-lg" />
                    ) : (
                      <div className="p-4 bg-background rounded-lg max-h-96 overflow-auto">
                        <pre className="text-xs whitespace-pre-wrap">{sourcePreview}</pre>
                      </div>
                    )}
                    <div className="text-sm text-muted">
                      <p className="font-medium">{brand.sourceDetails}</p>
                      <p className="text-xs">Imported from {brand.source}</p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-border rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-muted">No preview available</p>
                      <p className="text-xs text-muted mt-1">{brand.sourceDetails}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Confidence Score */}
              <div className="mt-4 p-4 bg-surface rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted">Overall Confidence</span>
                  <span className="text-2xl font-light">{brand.overallConfidence}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      brand.overallConfidence >= 80 ? 'bg-green-500' :
                      brand.overallConfidence >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${brand.overallConfidence}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Column */}
          <div>
            <h2 className="text-sm font-medium uppercase tracking-widest text-muted mb-4">Extracted Elements</h2>
            
            <div className="space-y-4">
              {/* Name */}
              {brand.name && (
                <ComparisonCard
                  title="Brand Name"
                  included={includedElements['name']}
                  onToggle={() => toggleElement('name')}
                  confidence={brand.name.confidence}
                >
                  <span className="text-2xl font-light">{brand.name.value}</span>
                </ComparisonCard>
              )}

              {/* Colors */}
              {(brand.colors?.primary || brand.colors?.secondary || brand.colors?.accent) && (
                <ComparisonCard
                  title="Colors"
                  included={true}
                  onToggle={() => {}}
                  showToggle={false}
                >
                  <div className="flex gap-4">
                    {brand.colors?.primary && (
                      <ColorItem
                        label="Primary"
                        color={brand.colors.primary.value}
                        confidence={brand.colors.primary.confidence}
                        included={includedElements['colors.primary']}
                        onToggle={() => toggleElement('colors.primary')}
                      />
                    )}
                    {brand.colors?.secondary && (
                      <ColorItem
                        label="Secondary"
                        color={brand.colors.secondary.value}
                        confidence={brand.colors.secondary.confidence}
                        included={includedElements['colors.secondary']}
                        onToggle={() => toggleElement('colors.secondary')}
                      />
                    )}
                    {brand.colors?.accent && (
                      <ColorItem
                        label="Accent"
                        color={brand.colors.accent.value}
                        confidence={brand.colors.accent.confidence}
                        included={includedElements['colors.accent']}
                        onToggle={() => toggleElement('colors.accent')}
                      />
                    )}
                  </div>
                </ComparisonCard>
              )}

              {/* Tone */}
              {brand.tone && (brand.tone.formality || brand.tone.energy || brand.tone.confidence || brand.tone.style) && (
                <ComparisonCard
                  title="Tone Profile"
                  included={true}
                  onToggle={() => {}}
                  showToggle={false}
                >
                  <div className="space-y-4">
                    {brand.tone.formality && (
                      <ToneItem
                        label="Formality"
                        value={brand.tone.formality.value}
                        confidence={brand.tone.formality.confidence}
                        included={includedElements['tone.formality']}
                        onToggle={() => toggleElement('tone.formality')}
                        leftLabel="Casual"
                        rightLabel="Formal"
                      />
                    )}
                    {brand.tone.energy && (
                      <ToneItem
                        label="Energy"
                        value={brand.tone.energy.value}
                        confidence={brand.tone.energy.confidence}
                        included={includedElements['tone.energy']}
                        onToggle={() => toggleElement('tone.energy')}
                        leftLabel="Reserved"
                        rightLabel="Energetic"
                      />
                    )}
                    {brand.tone.confidence && (
                      <ToneItem
                        label="Confidence"
                        value={brand.tone.confidence.value}
                        confidence={brand.tone.confidence.confidence}
                        included={includedElements['tone.confidence']}
                        onToggle={() => toggleElement('tone.confidence')}
                        leftLabel="Humble"
                        rightLabel="Bold"
                      />
                    )}
                    {brand.tone.style && (
                      <ToneItem
                        label="Style"
                        value={brand.tone.style.value}
                        confidence={brand.tone.style.confidence}
                        included={includedElements['tone.style']}
                        onToggle={() => toggleElement('tone.style')}
                        leftLabel="Classic"
                        rightLabel="Experimental"
                      />
                    )}
                  </div>
                </ComparisonCard>
              )}

              {/* Keywords */}
              {brand.keywords && brand.keywords.length > 0 && (
                <ComparisonCard
                  title="Keywords"
                  included={true}
                  onToggle={() => {}}
                  showToggle={false}
                >
                  <div className="flex flex-wrap gap-2">
                    {brand.keywords.map((k, i) => (
                      <button
                        key={i}
                        onClick={() => toggleElement(`keywords.${i}`)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          includedElements[`keywords.${i}`]
                            ? 'bg-foreground text-background'
                            : 'bg-border text-muted line-through'
                        }`}
                      >
                        {k.value}
                      </button>
                    ))}
                  </div>
                </ComparisonCard>
              )}

              {/* Voice Samples */}
              {brand.voiceSamples && brand.voiceSamples.length > 0 && (
                <ComparisonCard
                  title="Voice Samples"
                  included={true}
                  onToggle={() => {}}
                  showToggle={false}
                >
                  <div className="space-y-2">
                    {brand.voiceSamples.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => toggleElement(`voiceSamples.${i}`)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          includedElements[`voiceSamples.${i}`]
                            ? 'border-foreground/20 bg-background'
                            : 'border-transparent opacity-40 line-through'
                        }`}
                      >
                        <p className="text-sm italic">&ldquo;{s.value}&rdquo;</p>
                      </button>
                    ))}
                  </div>
                </ComparisonCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComparisonCardProps {
  title: string;
  included: boolean;
  onToggle: () => void;
  showToggle?: boolean;
  confidence?: number;
  children: React.ReactNode;
}

function ComparisonCard({ title, included, onToggle, showToggle = true, confidence, children }: ComparisonCardProps) {
  return (
    <div className={`p-4 bg-surface rounded-xl transition-all ${included ? '' : 'opacity-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {showToggle && (
            <button
              onClick={onToggle}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                included ? 'bg-foreground border-foreground' : 'border-muted'
              }`}
            >
              {included && (
                <svg className="w-2.5 h-2.5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {confidence !== undefined && (
          <span className={`text-xs ${confidence >= 80 ? 'text-green-500' : confidence >= 60 ? 'text-yellow-500' : 'text-orange-500'}`}>
            {confidence}% confidence
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

interface ColorItemProps {
  label: string;
  color: string;
  confidence: number;
  included: boolean;
  onToggle: () => void;
}

function ColorItem({ label, color, confidence, included, onToggle }: ColorItemProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex-1 p-3 rounded-lg border transition-all ${
        included ? 'border-foreground/20' : 'border-transparent opacity-40'
      }`}
    >
      <div className="w-full h-12 rounded-lg mb-2" style={{ backgroundColor: color }} />
      <p className="text-xs font-medium">{label}</p>
      <p className="text-xs font-mono text-muted">{color}</p>
      <p className={`text-xs mt-1 ${confidence >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>{confidence}%</p>
    </button>
  );
}

interface ToneItemProps {
  label: string;
  value: number;
  confidence: number;
  included: boolean;
  onToggle: () => void;
  leftLabel: string;
  rightLabel: string;
}

function ToneItem({ label, value, confidence, included, onToggle, leftLabel, rightLabel }: ToneItemProps) {
  return (
    <div className={`flex items-center gap-3 transition-all ${included ? '' : 'opacity-40'}`}>
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
          <span className="text-xs">{label}</span>
          <span className="text-xs text-muted">{value}</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-foreground rounded-full" style={{ width: `${value}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted">{leftLabel}</span>
          <span className="text-xs text-muted">{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}









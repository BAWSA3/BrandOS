'use client';

import { useState } from 'react';
import { ExtractedBrand, ExtractedValue } from '@/lib/importTypes';
import ExtractedElement, { ExtractedListItem } from './ExtractedElement';

interface BrandReviewWizardProps {
  extractedBrand: ExtractedBrand;
  sourcePreview?: string | null;
  onBack: () => void;
  onComplete: (brand: ExtractedBrand) => void;
}

type ReviewStep = 'name' | 'colors' | 'tone' | 'keywords' | 'patterns' | 'voice' | 'confirm';

const steps: { id: ReviewStep; label: string }[] = [
  { id: 'name', label: 'Brand Name' },
  { id: 'colors', label: 'Colors' },
  { id: 'tone', label: 'Tone' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'voice', label: 'Voice' },
  { id: 'confirm', label: 'Confirm' },
];

export default function BrandReviewWizard({
  extractedBrand,
  sourcePreview,
  onBack,
  onComplete,
}: BrandReviewWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [brand, setBrand] = useState(extractedBrand);
  const [includedElements, setIncludedElements] = useState<Record<string, boolean>>(() => {
    // Initialize all elements as included
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

  const updateValue = <T,>(path: string, newValue: T) => {
    setBrand(prev => {
      const updated = { ...prev };
      const parts = path.split('.');
      let current: Record<string, unknown> = updated;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined) {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }
      
      const lastPart = parts[parts.length - 1];
      if (current[lastPart] && typeof current[lastPart] === 'object' && 'value' in (current[lastPart] as Record<string, unknown>)) {
        (current[lastPart] as ExtractedValue<T>).value = newValue;
      } else {
        current[lastPart] = newValue;
      }
      
      return updated;
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Filter out non-included elements
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

  const step = steps[currentStep];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={currentStep === 0 ? onBack : handlePrev}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-foreground' : i < currentStep ? 'bg-foreground/50' : 'bg-border'
                }`}
              />
            ))}
          </div>
          
          <span className="text-sm text-muted">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Step Content */}
        <div className="animate-fade-in">
          {/* Name Step */}
          {step.id === 'name' && (
            <div>
              <h2 className="text-3xl font-light tracking-tight mb-2">Brand Name</h2>
              <p className="text-muted mb-8">Confirm or edit your brand name</p>
              
              {brand.name ? (
                <ExtractedElement
                  label="Brand Name"
                  value={brand.name}
                  type="text"
                  included={includedElements['name']}
                  onToggle={() => toggleElement('name')}
                  onEdit={(v) => updateValue('name.value', v)}
                />
              ) : (
                <div className="p-8 bg-surface rounded-xl text-center">
                  <p className="text-muted">No brand name detected</p>
                  <p className="text-sm text-muted mt-1">You can add one manually in the Define phase</p>
                </div>
              )}
            </div>
          )}

          {/* Colors Step */}
          {step.id === 'colors' && (
            <div>
              <h2 className="text-3xl font-light tracking-tight mb-2">Brand Colors</h2>
              <p className="text-muted mb-8">Review extracted colors from your brand assets</p>
              
              <div className="space-y-4">
                {brand.colors?.primary && (
                  <ExtractedElement
                    label="Primary Color"
                    value={brand.colors.primary}
                    type="color"
                    included={includedElements['colors.primary']}
                    onToggle={() => toggleElement('colors.primary')}
                    onEdit={(v) => updateValue('colors.primary.value', v)}
                  />
                )}
                {brand.colors?.secondary && (
                  <ExtractedElement
                    label="Secondary Color"
                    value={brand.colors.secondary}
                    type="color"
                    included={includedElements['colors.secondary']}
                    onToggle={() => toggleElement('colors.secondary')}
                    onEdit={(v) => updateValue('colors.secondary.value', v)}
                  />
                )}
                {brand.colors?.accent && (
                  <ExtractedElement
                    label="Accent Color"
                    value={brand.colors.accent}
                    type="color"
                    included={includedElements['colors.accent']}
                    onToggle={() => toggleElement('colors.accent')}
                    onEdit={(v) => updateValue('colors.accent.value', v)}
                  />
                )}
                {!brand.colors?.primary && !brand.colors?.secondary && !brand.colors?.accent && (
                  <div className="p-8 bg-surface rounded-xl text-center">
                    <p className="text-muted">No colors detected</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tone Step */}
          {step.id === 'tone' && (
            <div>
              <h2 className="text-3xl font-light tracking-tight mb-2">Brand Tone</h2>
              <p className="text-muted mb-8">Review the detected tone profile</p>
              
              <div className="space-y-4">
                {brand.tone?.formality && (
                  <ExtractedElement
                    label="Formality (Casual → Formal)"
                    value={brand.tone.formality}
                    type="slider"
                    included={includedElements['tone.formality']}
                    onToggle={() => toggleElement('tone.formality')}
                    onEdit={(v) => updateValue('tone.formality.value', v)}
                  />
                )}
                {brand.tone?.energy && (
                  <ExtractedElement
                    label="Energy (Reserved → Energetic)"
                    value={brand.tone.energy}
                    type="slider"
                    included={includedElements['tone.energy']}
                    onToggle={() => toggleElement('tone.energy')}
                    onEdit={(v) => updateValue('tone.energy.value', v)}
                  />
                )}
                {brand.tone?.confidence && (
                  <ExtractedElement
                    label="Confidence (Humble → Bold)"
                    value={brand.tone.confidence}
                    type="slider"
                    included={includedElements['tone.confidence']}
                    onToggle={() => toggleElement('tone.confidence')}
                    onEdit={(v) => updateValue('tone.confidence.value', v)}
                  />
                )}
                {brand.tone?.style && (
                  <ExtractedElement
                    label="Style (Classic → Experimental)"
                    value={brand.tone.style}
                    type="slider"
                    included={includedElements['tone.style']}
                    onToggle={() => toggleElement('tone.style')}
                    onEdit={(v) => updateValue('tone.style.value', v)}
                  />
                )}
                {!brand.tone?.formality && !brand.tone?.energy && !brand.tone?.confidence && !brand.tone?.style && (
                  <div className="p-8 bg-surface rounded-xl text-center">
                    <p className="text-muted">No tone data detected</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Keywords Step */}
          {step.id === 'keywords' && (
            <div>
              <h2 className="text-3xl font-light tracking-tight mb-2">Brand Keywords</h2>
              <p className="text-muted mb-8">Select the keywords that represent your brand</p>
              
              {brand.keywords && brand.keywords.length > 0 ? (
                <div className="space-y-2">
                  {brand.keywords.map((keyword, i) => (
                    <ExtractedListItem
                      key={i}
                      value={keyword.value}
                      confidence={keyword.confidence}
                      source={keyword.source}
                      included={includedElements[`keywords.${i}`]}
                      onToggle={() => toggleElement(`keywords.${i}`)}
                      onEdit={(v) => updateValue(`keywords.${i}.value`, v)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-surface rounded-xl text-center">
                  <p className="text-muted">No keywords detected</p>
                </div>
              )}
            </div>
          )}

          {/* Patterns Step */}
          {step.id === 'patterns' && (
            <div>
              <h2 className="text-3xl font-light tracking-tight mb-2">Brand Patterns</h2>
              <p className="text-muted mb-8">Review do&apos;s and don&apos;ts for your brand</p>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <span className="text-green-500">✓</span> Do
                  </h3>
                  {brand.doPatterns && brand.doPatterns.length > 0 ? (
                    <div className="space-y-2">
                      {brand.doPatterns.map((pattern, i) => (
                        <ExtractedListItem
                          key={i}
                          value={pattern.value}
                          confidence={pattern.confidence}
                          source={pattern.source}
                          included={includedElements[`doPatterns.${i}`]}
                          onToggle={() => toggleElement(`doPatterns.${i}`)}
                          onEdit={(v) => updateValue(`doPatterns.${i}.value`, v)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-surface rounded-lg text-center">
                      <p className="text-sm text-muted">None detected</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <span className="text-red-500">✗</span> Don&apos;t
                  </h3>
                  {brand.dontPatterns && brand.dontPatterns.length > 0 ? (
                    <div className="space-y-2">
                      {brand.dontPatterns.map((pattern, i) => (
                        <ExtractedListItem
                          key={i}
                          value={pattern.value}
                          confidence={pattern.confidence}
                          source={pattern.source}
                          included={includedElements[`dontPatterns.${i}`]}
                          onToggle={() => toggleElement(`dontPatterns.${i}`)}
                          onEdit={(v) => updateValue(`dontPatterns.${i}.value`, v)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-surface rounded-lg text-center">
                      <p className="text-sm text-muted">None detected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Voice Step */}
          {step.id === 'voice' && (
            <div>
              <h2 className="text-3xl font-light tracking-tight mb-2">Voice Samples</h2>
              <p className="text-muted mb-8">Review examples of your brand voice</p>
              
              {brand.voiceSamples && brand.voiceSamples.length > 0 ? (
                <div className="space-y-3">
                  {brand.voiceSamples.map((sample, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border transition-all ${
                        includedElements[`voiceSamples.${i}`] ? 'border-foreground/20 bg-surface' : 'border-border opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleElement(`voiceSamples.${i}`)}
                          className={`w-4 h-4 mt-1 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                            includedElements[`voiceSamples.${i}`] ? 'bg-foreground border-foreground' : 'border-muted'
                          }`}
                        >
                          {includedElements[`voiceSamples.${i}`] && (
                            <svg className="w-2.5 h-2.5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="text-sm italic">&ldquo;{sample.value}&rdquo;</p>
                          <p className="text-xs text-muted mt-2">{sample.confidence}% confidence · {sample.source}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-surface rounded-xl text-center">
                  <p className="text-muted">No voice samples detected</p>
                </div>
              )}
            </div>
          )}

          {/* Confirm Step */}
          {step.id === 'confirm' && (
            <div>
              <h2 className="text-3xl font-light tracking-tight mb-2">Review Complete</h2>
              <p className="text-muted mb-8">Here&apos;s a summary of what will be imported</p>
              
              <div className="p-6 bg-surface rounded-xl space-y-4">
                {includedElements['name'] && brand.name && (
                  <div className="flex justify-between">
                    <span className="text-muted">Brand Name</span>
                    <span className="font-medium">{brand.name.value}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted">Colors</span>
                  <div className="flex gap-2">
                    {includedElements['colors.primary'] && brand.colors?.primary && (
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: brand.colors.primary.value }} />
                    )}
                    {includedElements['colors.secondary'] && brand.colors?.secondary && (
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: brand.colors.secondary.value }} />
                    )}
                    {includedElements['colors.accent'] && brand.colors?.accent && (
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: brand.colors.accent.value }} />
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted">Keywords</span>
                  <span>{brand.keywords?.filter((_, i) => includedElements[`keywords.${i}`]).length || 0} selected</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted">Do Patterns</span>
                  <span>{brand.doPatterns?.filter((_, i) => includedElements[`doPatterns.${i}`]).length || 0} selected</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted">Don&apos;t Patterns</span>
                  <span>{brand.dontPatterns?.filter((_, i) => includedElements[`dontPatterns.${i}`]).length || 0} selected</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted">Voice Samples</span>
                  <span>{brand.voiceSamples?.filter((_, i) => includedElements[`voiceSamples.${i}`]).length || 0} selected</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <button
            onClick={currentStep === 0 ? onBack : handlePrev}
            className="px-6 py-3 text-sm text-muted hover:text-foreground transition-colors"
          >
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Import Brand
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
















'use client';

import { useState, useEffect } from 'react';
import { useBrandStore, useCurrentBrand } from '@/lib/store';
import { brandTemplates } from '@/lib/templates';
import ToneSlider from './ToneSlider';
import BrandOSLogo from './BrandOSLogo';

type Step = 'welcome' | 'name' | 'template' | 'colors' | 'tone' | 'keywords' | 'samples' | 'complete';

const steps: { id: Step; title: string; subtitle: string }[] = [
  { id: 'welcome', title: 'Welcome to BrandOS', subtitle: 'Let\'s set up your brand in minutes' },
  { id: 'name', title: 'Name Your Brand', subtitle: 'What should we call your brand?' },
  { id: 'template', title: 'Choose a Starting Point', subtitle: 'Pick a template or start fresh' },
  { id: 'colors', title: 'Brand Colors', subtitle: 'Define your visual identity' },
  { id: 'tone', title: 'Brand Tone', subtitle: 'How should your brand sound?' },
  { id: 'keywords', title: 'Brand Keywords', subtitle: 'Words that define your brand' },
  { id: 'samples', title: 'Voice Samples', subtitle: 'Show us your best writing' },
  { id: 'complete', title: 'You\'re All Set!', subtitle: 'Your brand is ready to use' },
];

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isAnimating, setIsAnimating] = useState(false);
  const { setBrandDNA } = useBrandStore();
  const brandDNA = useCurrentBrand();
  
  // Local state for inputs
  const [keywordInput, setKeywordInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex) / (steps.length - 1)) * 100;

  const goToStep = (step: Step) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(step);
      setIsAnimating(false);
    }, 200);
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      goToStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(steps[prevIndex].id);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = brandTemplates.find(t => t.id === templateId);
    if (template?.preview) {
      setBrandDNA(template.preview);
      nextStep();
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      setBrandDNA({ keywords: [...(brandDNA?.keywords || []), keywordInput.trim()] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setBrandDNA({ keywords: brandDNA?.keywords?.filter((_, i) => i !== index) });
  };

  const addSample = () => {
    if (sampleInput.trim()) {
      setBrandDNA({ voiceSamples: [...(brandDNA?.voiceSamples || []), sampleInput.trim()] });
      setSampleInput('');
    }
  };

  const removeSample = (index: number) => {
    setBrandDNA({ voiceSamples: brandDNA?.voiceSamples?.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-500/5 to-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-surface">
        <div 
          className="h-full bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="fixed top-6 right-6 text-sm text-muted hover:text-foreground transition-colors"
      >
        Skip for now
      </button>

      {/* Step indicator */}
      <div className="fixed top-6 left-6 flex items-center gap-2">
        {steps.slice(0, -1).map((step, index) => (
          <div
            key={step.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index < currentStepIndex 
                ? 'bg-foreground' 
                : index === currentStepIndex 
                  ? 'bg-foreground w-6' 
                  : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className={`relative z-10 w-full max-w-xl px-6 transition-all duration-200 ${
        isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}>
        {/* Welcome */}
        {currentStep === 'welcome' && (
          <div className="text-center">
            <div className="mb-8">
              <BrandOSLogo size="xl" />
            </div>
            <h2 className="text-3xl font-light tracking-tight mb-4">
              Let&apos;s set up your brand
            </h2>
            <p className="text-muted text-lg mb-12 max-w-md mx-auto">
              Answer a few quick questions to capture your brand identity. This takes about 2 minutes.
            </p>

            <button
              onClick={nextStep}
              className="px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Begin Setup
            </button>
          </div>
        )}

        {/* Name */}
        {currentStep === 'name' && (
          <div className="text-center">
            <h2 className="text-3xl font-light tracking-tight mb-2">{steps[1].title}</h2>
            <p className="text-muted mb-8">{steps[1].subtitle}</p>
            
            <input
              type="text"
              value={brandDNA?.name || ''}
              onChange={(e) => setBrandDNA({ name: e.target.value })}
              placeholder="Enter your brand name"
              className="w-full text-center text-3xl font-light bg-transparent border-b-2 border-border pb-4 outline-none focus:border-foreground transition-colors placeholder:text-muted/50"
              autoFocus
            />
            
            <div className="flex justify-center gap-4 mt-12">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!brandDNA?.name?.trim()}
                className="px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Template */}
        {currentStep === 'template' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-tight mb-2">{steps[2].title}</h2>
              <p className="text-muted">{steps[2].subtitle}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {brandTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="p-4 text-left border border-border rounded-xl hover:border-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex gap-2 mb-3">
                    {Object.values(template.preview.colors || {}).map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-background shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted">{template.description}</p>
                </button>
              ))}
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Skip, start fresh
              </button>
            </div>
          </div>
        )}

        {/* Colors */}
        {currentStep === 'colors' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-tight mb-2">{steps[3].title}</h2>
              <p className="text-muted">{steps[3].subtitle}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
              {[
                { key: 'primary', label: 'Primary' },
                { key: 'secondary', label: 'Secondary' },
                { key: 'accent', label: 'Accent' },
              ].map(({ key, label }) => (
                <div key={key} className="text-center">
                  <label className="block cursor-pointer group">
                    <div 
                      className="w-full aspect-square rounded-xl border-2 border-border transition-all group-hover:scale-105 group-hover:shadow-lg mb-3"
                      style={{ backgroundColor: brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000' }}
                    />
                    <input
                      type="color"
                      value={brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000'}
                      onChange={(e) => setBrandDNA({ 
                        colors: { ...brandDNA?.colors!, [key]: e.target.value } 
                      })}
                      className="sr-only"
                    />
                  </label>
                  <p className="text-sm text-muted">{label}</p>
                  <p className="text-xs font-mono text-muted/60">
                    {brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000'}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Tone */}
        {currentStep === 'tone' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-tight mb-2">{steps[4].title}</h2>
              <p className="text-muted">{steps[4].subtitle}</p>
            </div>
            
            <div className="space-y-8 mb-8">
              <ToneSlider
                label="Formality"
                value={brandDNA?.tone?.minimal || 50}
                onChange={(v) => setBrandDNA({ tone: { ...brandDNA?.tone!, minimal: v } })}
                leftLabel="Casual"
                rightLabel="Formal"
              />
              <ToneSlider
                label="Energy"
                value={brandDNA?.tone?.playful || 50}
                onChange={(v) => setBrandDNA({ tone: { ...brandDNA?.tone!, playful: v } })}
                leftLabel="Reserved"
                rightLabel="Energetic"
              />
              <ToneSlider
                label="Confidence"
                value={brandDNA?.tone?.bold || 50}
                onChange={(v) => setBrandDNA({ tone: { ...brandDNA?.tone!, bold: v } })}
                leftLabel="Humble"
                rightLabel="Bold"
              />
              <ToneSlider
                label="Style"
                value={brandDNA?.tone?.experimental || 30}
                onChange={(v) => setBrandDNA({ tone: { ...brandDNA?.tone!, experimental: v } })}
                leftLabel="Classic"
                rightLabel="Experimental"
              />
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Keywords */}
        {currentStep === 'keywords' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-tight mb-2">{steps[5].title}</h2>
              <p className="text-muted">{steps[5].subtitle}</p>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="Type a keyword and press Enter"
                className="flex-1 px-4 py-3 bg-surface rounded-lg outline-none placeholder:text-muted/50"
              />
              <button
                onClick={addKeyword}
                disabled={!keywordInput.trim()}
                className="px-4 py-3 bg-foreground text-background rounded-lg disabled:opacity-30"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4 min-h-[60px]">
              {brandDNA?.keywords?.map((keyword, i) => (
                <span
                  key={i}
                  onClick={() => removeKeyword(i)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full text-sm cursor-pointer hover:bg-border transition-colors"
                >
                  {keyword}
                  <span className="text-muted">×</span>
                </span>
              ))}
              {(!brandDNA?.keywords || brandDNA.keywords.length === 0) && (
                <p className="text-muted text-sm">No keywords yet. Add words that describe your brand.</p>
              )}
            </div>
            
            <p className="text-xs text-muted text-center mb-8">
              Suggestions: innovative, premium, friendly, bold, minimal, playful, trustworthy
            </p>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {brandDNA?.keywords?.length ? 'Continue' : 'Skip'}
              </button>
            </div>
          </div>
        )}

        {/* Voice Samples */}
        {currentStep === 'samples' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-tight mb-2">{steps[6].title}</h2>
              <p className="text-muted">{steps[6].subtitle}</p>
            </div>
            
            <textarea
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              placeholder="Paste an example of your brand's writing... A tagline, marketing copy, or any text that represents your voice."
              rows={3}
              className="w-full px-4 py-3 bg-surface rounded-lg outline-none placeholder:text-muted/50 resize-none mb-4"
            />
            
            <button
              onClick={addSample}
              disabled={!sampleInput.trim()}
              className="w-full py-2 border border-border rounded-lg text-sm hover:border-foreground transition-colors disabled:opacity-30 mb-4"
            >
              Add Sample
            </button>
            
            <div className="space-y-2 mb-8 max-h-40 overflow-y-auto">
              {brandDNA?.voiceSamples?.map((sample, i) => (
                <div
                  key={i}
                  onClick={() => removeSample(i)}
                  className="p-3 bg-surface rounded-lg text-sm cursor-pointer hover:bg-border transition-colors group"
                >
                  <p className="italic text-muted line-clamp-2">&ldquo;{sample}&rdquo;</p>
                  <p className="text-xs text-muted/50 group-hover:text-foreground mt-1">Click to remove</p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {brandDNA?.voiceSamples?.length ? 'Finish Setup' : 'Skip & Finish'}
              </button>
            </div>
          </div>
        )}

        {/* Complete */}
        {currentStep === 'complete' && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-light tracking-tight mb-2">{steps[7].title}</h2>
            <p className="text-muted mb-8">{steps[7].subtitle}</p>
            
            {/* Brand Preview */}
            <div className="p-6 bg-surface rounded-xl mb-8 text-left">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-1">
                  {Object.values(brandDNA?.colors || {}).map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-background"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div>
                  <p className="font-medium">{brandDNA?.name}</p>
                  <p className="text-xs text-muted">
                    {brandDNA?.keywords?.slice(0, 3).join(' • ') || 'No keywords'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-center text-xs">
                <div>
                  <p className="text-muted">Formality</p>
                  <p className="font-medium">{brandDNA?.tone?.minimal}%</p>
                </div>
                <div>
                  <p className="text-muted">Energy</p>
                  <p className="font-medium">{brandDNA?.tone?.playful}%</p>
                </div>
                <div>
                  <p className="text-muted">Confidence</p>
                  <p className="font-medium">{brandDNA?.tone?.bold}%</p>
                </div>
                <div>
                  <p className="text-muted">Style</p>
                  <p className="font-medium">{brandDNA?.tone?.experimental}%</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={onComplete}
                className="w-full px-8 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Start Checking Content
              </button>
              <p className="text-xs text-muted">
                You can always refine your brand settings later
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



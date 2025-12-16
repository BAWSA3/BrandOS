'use client';

import { useState } from 'react';
import { useBrandStore } from '@/lib/store';
import { CheckResult } from '@/lib/types';
import ToneSlider from '@/components/ToneSlider';
import ScoreRing from '@/components/ScoreRing';

type Tab = 'brand' | 'check' | 'generate';

export default function Home() {
  const { brandDNA, setBrandDNA } = useBrandStore();
  const [activeTab, setActiveTab] = useState<Tab>('brand');
  
  // Check state
  const [contentToCheck, setContentToCheck] = useState('');
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Generate state
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Keywords state
  const [keywordInput, setKeywordInput] = useState('');
  const [doPatternInput, setDoPatternInput] = useState('');
  const [dontPatternInput, setDontPatternInput] = useState('');

  const handleCheck = async () => {
    if (!contentToCheck.trim() || !brandDNA?.name) return;
    
    setIsChecking(true);
    setCheckResult(null);
    
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, content: contentToCheck }),
      });
      
      if (!res.ok) throw new Error('Check failed');
      
      const result = await res.json();
      setCheckResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleGenerate = async () => {
    if (!generatePrompt.trim() || !brandDNA?.name) return;
    
    setIsGenerating(true);
    setGeneratedContent('');
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, prompt: generatePrompt }),
      });
      
      if (!res.ok) throw new Error('Generation failed');
      
      const result = await res.json();
      setGeneratedContent(result.content);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    setBrandDNA({ keywords: [...(brandDNA?.keywords || []), keywordInput.trim()] });
    setKeywordInput('');
  };

  const removeKeyword = (index: number) => {
    setBrandDNA({ keywords: brandDNA?.keywords?.filter((_, i) => i !== index) });
  };

  const addDoPattern = () => {
    if (!doPatternInput.trim()) return;
    setBrandDNA({ doPatterns: [...(brandDNA?.doPatterns || []), doPatternInput.trim()] });
    setDoPatternInput('');
  };

  const removeDoPattern = (index: number) => {
    setBrandDNA({ doPatterns: brandDNA?.doPatterns?.filter((_, i) => i !== index) });
  };

  const addDontPattern = () => {
    if (!dontPatternInput.trim()) return;
    setBrandDNA({ dontPatterns: [...(brandDNA?.dontPatterns || []), dontPatternInput.trim()] });
    setDontPatternInput('');
  };

  const removeDontPattern = (index: number) => {
    setBrandDNA({ dontPatterns: brandDNA?.dontPatterns?.filter((_, i) => i !== index) });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-sm font-medium tracking-tight">brandos</h1>
          <nav className="flex gap-1">
            {(['brand', 'check', 'generate'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm rounded-full transition-all ${
                  activeTab === tab
                    ? 'bg-foreground text-background'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {tab === 'brand' ? 'Brand DNA' : tab === 'check' ? 'Check' : 'Generate'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14">
        {/* Brand DNA Tab */}
        {activeTab === 'brand' && (
          <div className="animate-fade-in">
            {/* Hero */}
            <section className="py-24 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">
                Define your brand.
              </h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Capture the essence of your brand identity. Every word, every tone, every detail matters.
              </p>
            </section>

            {/* Brand Configuration */}
            <section className="max-w-2xl mx-auto px-6 py-16">
              {/* Brand Name */}
              <div className="mb-16">
                <label className="block text-xs uppercase tracking-widest text-muted mb-4">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandDNA?.name || ''}
                  onChange={(e) => setBrandDNA({ name: e.target.value })}
                  placeholder="Enter brand name"
                  className="w-fit min-w-[200px] bg-transparent text-3xl font-light tracking-tight border-none outline-none placeholder:text-border"
                />
              </div>

              {/* Tone Spectrum */}
              <div className="mb-16">
                <h3 className="text-xs uppercase tracking-widest text-muted mb-8">
                  Tone Spectrum
                </h3>
                <div className="flex flex-wrap gap-x-12 gap-y-8">
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
              </div>

              {/* Keywords */}
              <div className="mb-16">
                <h3 className="text-xs uppercase tracking-widest text-muted mb-4">
                  Brand Keywords
                </h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                    placeholder="Add a keyword"
                    className="flex-1 bg-transparent text-base border-b border-border pb-2 outline-none placeholder:text-muted"
                  />
                  <button
                    onClick={addKeyword}
                    className="text-muted hover:text-foreground transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {brandDNA?.keywords?.map((keyword, i) => (
                    <span
                      key={i}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full text-sm cursor-pointer hover:bg-border transition-colors"
                      onClick={() => removeKeyword(i)}
                    >
                      {keyword}
                      <span className="text-muted group-hover:text-foreground">×</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Do Patterns */}
              <div className="mb-16">
                <h3 className="text-xs uppercase tracking-widest text-muted mb-2">
                  Do
                </h3>
                <p className="text-sm text-muted mb-4">Patterns and phrases your brand embraces</p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={doPatternInput}
                    onChange={(e) => setDoPatternInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addDoPattern()}
                    placeholder="e.g., Use active voice"
                    className="flex-1 bg-transparent text-base border-b border-border pb-2 outline-none placeholder:text-muted"
                  />
                  <button
                    onClick={addDoPattern}
                    className="text-muted hover:text-foreground transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  {brandDNA?.doPatterns?.map((pattern, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between py-2 border-b border-border cursor-pointer hover:border-foreground transition-colors"
                      onClick={() => removeDoPattern(i)}
                    >
                      <span className="text-sm">{pattern}</span>
                      <span className="text-muted opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Don't Patterns */}
              <div className="mb-16">
                <h3 className="text-xs uppercase tracking-widest text-muted mb-2">
                  Don&apos;t
                </h3>
                <p className="text-sm text-muted mb-4">Patterns and phrases to avoid</p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={dontPatternInput}
                    onChange={(e) => setDontPatternInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addDontPattern()}
                    placeholder="e.g., Avoid jargon"
                    className="flex-1 bg-transparent text-base border-b border-border pb-2 outline-none placeholder:text-muted"
                  />
                  <button
                    onClick={addDontPattern}
                    className="text-muted hover:text-foreground transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  {brandDNA?.dontPatterns?.map((pattern, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between py-2 border-b border-border cursor-pointer hover:border-foreground transition-colors"
                      onClick={() => removeDontPattern(i)}
                    >
                      <span className="text-sm">{pattern}</span>
                      <span className="text-muted opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Check Tab */}
        {activeTab === 'check' && (
          <div className="animate-fade-in">
            {/* Hero */}
            <section className="py-24 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">
                Check your content.
              </h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Analyze how well your content aligns with {brandDNA?.name || 'your brand'}&apos;s identity.
              </p>
            </section>

            <section className="max-w-2xl mx-auto px-6 py-16">
              {/* Content Input */}
              <div className="mb-8">
                <label className="block text-xs uppercase tracking-widest text-muted mb-4">
                  Content to Analyze
                </label>
                <textarea
                  value={contentToCheck}
                  onChange={(e) => setContentToCheck(e.target.value)}
                  placeholder="Paste your content here..."
                  rows={6}
                  className="w-full bg-transparent text-base border border-border rounded-lg p-4 outline-none resize-none placeholder:text-muted focus:border-foreground transition-colors"
                />
              </div>

              <button
                onClick={handleCheck}
                disabled={isChecking || !contentToCheck.trim() || !brandDNA?.name}
                className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
              >
                {isChecking ? 'Analyzing...' : 'Analyze Content'}
              </button>

              {/* Results */}
              {checkResult && (
                <div className="mt-16 animate-fade-in">
                  <div className="flex justify-center mb-12">
                    <ScoreRing score={checkResult.score} />
                  </div>

                  <div className="grid gap-8">
                    {/* Strengths */}
                    {checkResult.strengths?.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Strengths</h4>
                        <div className="space-y-2">
                          {checkResult.strengths.map((s, i) => (
                            <p key={i} className="text-sm py-2 border-b border-border">{s}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Issues */}
                    {checkResult.issues?.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Issues</h4>
                        <div className="space-y-2">
                          {checkResult.issues.map((issue, i) => (
                            <p key={i} className="text-sm py-2 border-b border-border">{issue}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {checkResult.suggestions?.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Suggestions</h4>
                        <div className="space-y-2">
                          {checkResult.suggestions.map((s, i) => (
                            <p key={i} className="text-sm py-2 border-b border-border">{s}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Revised Version */}
                    {checkResult.revisedVersion && (
                      <div>
                        <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Suggested Revision</h4>
                        <div className="p-4 bg-surface rounded-lg">
                          <p className="text-sm leading-relaxed">{checkResult.revisedVersion}</p>
        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(checkResult.revisedVersion)}
                          className="mt-3 text-xs text-muted hover:text-foreground transition-colors"
                        >
                          Copy to clipboard
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="animate-fade-in">
            {/* Hero */}
            <section className="py-24 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">
                Generate on-brand content.
              </h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Create content that perfectly matches {brandDNA?.name || 'your brand'}&apos;s voice and identity.
              </p>
            </section>

            <section className="max-w-2xl mx-auto px-6 py-16">
              {/* Prompt Input */}
              <div className="mb-8">
                <label className="block text-xs uppercase tracking-widest text-muted mb-4">
                  What do you need?
                </label>
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="e.g., Write a tagline for our new product launch..."
                  rows={4}
                  className="w-full bg-transparent text-base border border-border rounded-lg p-4 outline-none resize-none placeholder:text-muted focus:border-foreground transition-colors"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !generatePrompt.trim() || !brandDNA?.name}
                className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
              >
                {isGenerating ? 'Generating...' : 'Generate Content'}
              </button>

              {/* Generated Content */}
              {generatedContent && (
                <div className="mt-16 animate-fade-in">
                  <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Generated Options</h4>
                  <div className="p-6 bg-surface rounded-lg">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {generatedContent}
                    </div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedContent)}
                    className="mt-3 text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Copy to clipboard
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-border py-8 mt-16">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-xs text-muted">
              brandos — AI-powered brand consistency
            </p>
        </div>
        </footer>
      </main>
    </div>
  );
}

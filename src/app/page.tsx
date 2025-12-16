'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useBrandStore, useCurrentBrand } from '@/lib/store';
import { CheckResult, ContentType, ToneAnalysis } from '@/lib/types';
import { brandTemplates, contentTypeLabels } from '@/lib/templates';
import ToneSlider from '@/components/ToneSlider';
import ScoreRing from '@/components/ScoreRing';
import VisualConcepts from '@/components/VisualConcepts';
import DesignIntentBlocks from '@/components/DesignIntentBlocks';
import TasteTranslator from '@/components/TasteTranslator';
import BrandCohesion from '@/components/BrandCohesion';
import PlatformAdapter from '@/components/PlatformAdapter';
import CreatorGuardrails from '@/components/CreatorGuardrails';
import SafeZones from '@/components/SafeZones';
import BrandMemory from '@/components/BrandMemory';
import TasteProtection from '@/components/TasteProtection';
import ContextTone from '@/components/ContextTone';
import ExportCenter from '@/components/ExportCenter';

type Tab = 'brand' | 'check' | 'generate' | 'visual' | 'dashboard' | 'competitors' | 'history' | 'export' 
  | 'intents' | 'taste' | 'cohesion' | 'platforms' | 'guardrails' | 'safezones' | 'memory' | 'protect' | 'context';

export default function Home() {
  const { 
    setBrandDNA, 
    brands, 
    currentBrandId, 
    createBrand, 
    deleteBrand, 
    switchBrand,
    history,
    addHistoryItem,
    clearHistory,
    theme,
    toggleTheme,
  } = useBrandStore();
  
  const brandDNA = useCurrentBrand();
  
  const [activeTab, setActiveTab] = useState<Tab>('brand');
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showProTools, setShowProTools] = useState(false);
  
  // Check state
  const [contentToCheck, setContentToCheck] = useState('');
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysis | null>(null);
  const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);
  
  // Generate state
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [contentType, setContentType] = useState<ContentType>('general');

  // Competitor state
  const [competitorName, setCompetitorName] = useState('');
  const [competitorSampleInput, setCompetitorSampleInput] = useState('');
  const [competitorSamples, setCompetitorSamples] = useState<string[]>([]);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<{
    keyDifferences: string[];
    uniquePositioning: string;
    differentiationOpportunities: string[];
    learnings: string[];
    competitorTone: { formality: number; energy: number; confidence: number; style: number };
    summary: string;
  } | null>(null);
  const [isAnalyzingCompetitor, setIsAnalyzingCompetitor] = useState(false);
  const [competitorError, setCompetitorError] = useState('');

  // Input states
  const [keywordInput, setKeywordInput] = useState('');
  const [doPatternInput, setDoPatternInput] = useState('');
  const [dontPatternInput, setDontPatternInput] = useState('');
  const [voiceSampleInput, setVoiceSampleInput] = useState('');
  
  // Refs
  const exportRef = useRef<HTMLDivElement>(null);
  const toneDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time tone analysis (debounced)
  const analyzeTone = useCallback(async (content: string) => {
    if (!content.trim() || content.length < 20 || !brandDNA?.name) {
      setToneAnalysis(null);
      return;
    }
    
    setIsAnalyzingTone(true);
    
    try {
      const res = await fetch('/api/analyze-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, content }),
      });
      
      if (res.ok) {
        const result = await res.json();
        setToneAnalysis(result);
      }
    } catch (error) {
      console.error('Tone analysis error:', error);
    } finally {
      setIsAnalyzingTone(false);
    }
  }, [brandDNA]);

  useEffect(() => {
    if (toneDebounceRef.current) {
      clearTimeout(toneDebounceRef.current);
    }
    
    if (contentToCheck.length >= 20) {
      toneDebounceRef.current = setTimeout(() => {
        analyzeTone(contentToCheck);
      }, 1000);
    } else {
      setToneAnalysis(null);
    }
    
    return () => {
      if (toneDebounceRef.current) {
        clearTimeout(toneDebounceRef.current);
      }
    };
  }, [contentToCheck, analyzeTone]);

  const handleCheck = async () => {
    if (!contentToCheck.trim() || !brandDNA?.name) return;
    
    setIsChecking(true);
    setCheckResult(null);
    setCheckError('');
    
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, content: contentToCheck }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        setCheckError(result.error || 'Analysis failed. Please try again.');
        return;
      }
      
      setCheckResult(result);
      
      addHistoryItem({
        type: 'check',
        brandId: brandDNA.id,
        brandName: brandDNA.name,
        input: contentToCheck,
        output: result,
      });
    } catch (error) {
      console.error(error);
      setCheckError('Network error. Please check your connection.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleGenerate = async () => {
    if (!generatePrompt.trim() || !brandDNA?.name) return;
    
    setIsGenerating(true);
    setGeneratedContent('');
    setGenerateError('');
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, prompt: generatePrompt, contentType }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        setGenerateError(result.error || 'Generation failed. Please try again.');
        return;
      }
      
      setGeneratedContent(result.content);
      
      addHistoryItem({
        type: 'generate',
        brandId: brandDNA.id,
        brandName: brandDNA.name,
        input: generatePrompt,
        contentType,
        output: result.content,
      });
    } catch (error) {
      console.error(error);
      setGenerateError('Network error. Please check your connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompetitorAnalysis = async () => {
    if (!competitorName.trim() || competitorSamples.length === 0 || !brandDNA?.name) return;
    
    setIsAnalyzingCompetitor(true);
    setCompetitorAnalysis(null);
    setCompetitorError('');
    
    try {
      const res = await fetch('/api/analyze-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, competitorName, competitorSamples }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        setCompetitorError(result.error || 'Analysis failed. Please try again.');
        return;
      }
      
      setCompetitorAnalysis(result);
    } catch (error) {
      console.error(error);
      setCompetitorError('Network error. Please check your connection.');
    } finally {
      setIsAnalyzingCompetitor(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = brandTemplates.find(t => t.id === templateId);
    if (template?.preview) {
      setBrandDNA(template.preview);
      setShowTemplates(false);
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

  const addVoiceSample = () => {
    if (!voiceSampleInput.trim()) return;
    setBrandDNA({ voiceSamples: [...(brandDNA?.voiceSamples || []), voiceSampleInput.trim()] });
    setVoiceSampleInput('');
  };

  const removeVoiceSample = (index: number) => {
    setBrandDNA({ voiceSamples: brandDNA?.voiceSamples?.filter((_, i) => i !== index) });
  };

  const addCompetitorSample = () => {
    if (!competitorSampleInput.trim()) return;
    setCompetitorSamples([...competitorSamples, competitorSampleInput.trim()]);
    setCompetitorSampleInput('');
  };

  const removeCompetitorSample = (index: number) => {
    setCompetitorSamples(competitorSamples.filter((_, i) => i !== index));
  };

  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const exportAsJSON = () => {
    if (!brandDNA) return;
    const data = JSON.stringify(brandDNA, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandDNA.name.toLowerCase().replace(/\s+/g, '-')}-brand-guidelines.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!brandDNA) return;
    
    setIsSharing(true);
    setShareUrl('');
    
    try {
      const res = await fetch('/api/brands/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: brandDNA }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setShareUrl(data.shareUrl);
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Dashboard calculations
  const dashboardStats = {
    totalChecks: history.filter(h => h.type === 'check').length,
    totalGenerations: history.filter(h => h.type === 'generate').length,
    averageScore: history.filter(h => h.type === 'check').length > 0
      ? Math.round(
          history
            .filter(h => h.type === 'check')
            .reduce((sum, h) => sum + (h.output as CheckResult).score, 0) /
          history.filter(h => h.type === 'check').length
        )
      : 0,
    recentScores: history
      .filter(h => h.type === 'check')
      .slice(0, 10)
      .map(h => ({
        date: formatDate(h.timestamp),
        score: (h.output as CheckResult).score,
      }))
      .reverse(),
  };

  const contentTypes = Object.entries(contentTypeLabels) as [ContentType, typeof contentTypeLabels[string]][];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowBrandMenu(!showBrandMenu)}
              className="flex items-center gap-2 text-sm font-medium tracking-tight hover:text-muted transition-colors"
            >
              <span>brandos</span>
              <span className="text-muted">•</span>
              <span className="text-muted">{brandDNA?.name || 'Select Brand'}</span>
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showBrandMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in">
                <div className="p-2 max-h-64 overflow-y-auto">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        brand.id === currentBrandId ? 'bg-surface' : 'hover:bg-surface'
                      }`}
                    >
                      <span
                        className="flex-1 text-sm"
                        onClick={() => {
                          switchBrand(brand.id);
                          setShowBrandMenu(false);
                        }}
                      >
                        {brand.name || 'Unnamed Brand'}
                      </span>
                      {brands.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBrand(brand.id);
                          }}
                          className="text-muted hover:text-foreground p-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-2">
                  <button
                    onClick={() => {
                      createBrand();
                      setShowBrandMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    New Brand
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="flex gap-1 items-center">
              {/* All Main Tabs */}
              {([
                { id: 'brand', label: 'Brand' },
                { id: 'check', label: 'Check' },
                { id: 'generate', label: 'Generate' },
                { id: 'visual', label: 'Visual' },
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'competitors', label: 'Compare' },
                { id: 'history', label: 'History' },
                { id: 'export', label: 'Export' },
              ] as { id: Tab; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-foreground text-background'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              
              {/* Pro Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProTools(!showProTools)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-all whitespace-nowrap flex items-center gap-1 ${
                    ['intents', 'taste', 'cohesion', 'platforms', 'guardrails', 'safezones', 'memory', 'protect', 'context'].includes(activeTab)
                      ? 'bg-foreground text-background'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Pro Tools
                  <svg className={`w-3 h-3 transition-transform ${showProTools ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showProTools && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-xl z-50 py-2">
                    {([
                      { id: 'intents', label: 'Design Intents', icon: '◈' },
                      { id: 'taste', label: 'Taste Translation', icon: '◇' },
                      { id: 'cohesion', label: 'Brand Cohesion', icon: '◎' },
                      { id: 'platforms', label: 'Platform Adapt', icon: '▤' },
                      { id: 'guardrails', label: 'Creator Guardrails', icon: '⊡' },
                      { id: 'safezones', label: 'Safe Zones', icon: '⬡' },
                      { id: 'memory', label: 'Brand Memory', icon: '◉' },
                      { id: 'protect', label: 'Taste Protection', icon: '−' },
                      { id: 'context', label: 'Context Tone', icon: '◐' },
                    ] as { id: Tab; label: string; icon: string }[]).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowProTools(false);
                        }}
                        className={`w-full px-4 py-2 text-sm text-left transition-colors flex items-center gap-3 ${
                          activeTab === tab.id
                            ? 'bg-surface text-foreground'
                            : 'text-muted hover:text-foreground hover:bg-surface'
                        }`}
                      >
                        <span className="w-4 text-center">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted hover:text-foreground transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Click outside to close menus */}
      {(showBrandMenu || showTemplates || showProTools) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowBrandMenu(false);
            setShowTemplates(false);
            setShowProTools(false);
          }}
        />
      )}

      {/* Main Content */}
      <main className="pt-14">
        {/* Brand DNA Tab */}
        {activeTab === 'brand' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">
                Define your brand.
              </h2>
              <p className="text-muted text-lg max-w-md mx-auto mb-8">
                Capture the essence of your brand identity.
              </p>
              
              {/* Templates Button */}
              <div className="relative inline-block">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="px-4 py-2 text-sm border border-border rounded-full hover:border-foreground transition-colors"
                >
                  Start from Template
                </button>
                
                {showTemplates && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in z-50">
                    <div className="p-2 max-h-96 overflow-y-auto">
                      {brandTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          className="w-full text-left px-4 py-3 hover:bg-surface rounded-md transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-1">
                              {Object.values(template.preview.colors || {}).map((color, i) => (
                                <div
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-background"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{template.name}</p>
                              <p className="text-xs text-muted">{template.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

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
                  className="w-full bg-transparent text-3xl font-light tracking-tight border-none outline-none placeholder:text-border"
                />
              </div>

              {/* Brand Colors */}
              <div className="mb-16">
                <h3 className="text-xs uppercase tracking-widest text-muted mb-8">
                  Brand Colors
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { key: 'primary', label: 'Primary' },
                    { key: 'secondary', label: 'Secondary' },
                    { key: 'accent', label: 'Accent' },
                  ].map(({ key, label }) => (
                    <div key={key} className="group">
                      <label className="block text-xs text-muted mb-3">{label}</label>
                      <div className="relative">
                        <div 
                          className="h-16 rounded-lg border border-border transition-all group-hover:scale-[1.02] group-hover:shadow-lg cursor-pointer"
                          style={{ backgroundColor: brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000' }}
                          onClick={() => {
                            const input = document.getElementById(`color-${key}`) as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          {/* Edit indicator */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="px-2 py-1 bg-background/80 rounded text-xs">Click to edit</span>
                          </div>
                        </div>
                        <input
                          id={`color-${key}`}
                          type="color"
                          value={brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000'}
                          onChange={(e) => setBrandDNA({ 
                            colors: { ...brandDNA?.colors!, [key]: e.target.value } 
                          })}
                          className="absolute bottom-0 left-0 w-full h-8 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000'}
                          onChange={(e) => {
                            let value = e.target.value.trim();
                            // Allow typing and editing
                            if (value === '' || value === '#') {
                              setBrandDNA({ colors: { ...brandDNA?.colors!, [key]: value || '#' } });
                              return;
                            }
                            // Auto-add # if missing
                            if (!value.startsWith('#')) {
                              value = '#' + value;
                            }
                            // Validate hex format
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                              setBrandDNA({ colors: { ...brandDNA?.colors!, [key]: value } });
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            let pasted = e.clipboardData.getData('text').trim();
                            // Clean up pasted value - remove spaces, quotes, etc.
                            pasted = pasted.replace(/['";\s]/g, '');
                            // Add # if missing
                            if (!pasted.startsWith('#') && /^[0-9A-Fa-f]{3,6}$/.test(pasted)) {
                              pasted = '#' + pasted;
                            }
                            // Validate and apply
                            if (/^#[0-9A-Fa-f]{3,6}$/.test(pasted)) {
                              // Expand 3-char hex to 6-char
                              if (pasted.length === 4) {
                                pasted = '#' + pasted[1] + pasted[1] + pasted[2] + pasted[2] + pasted[3] + pasted[3];
                              }
                              setBrandDNA({ colors: { ...brandDNA?.colors!, [key]: pasted } });
                            }
                          }}
                          className="flex-1 text-xs font-mono bg-transparent border-b border-border pb-1 outline-none focus:border-foreground transition-colors"
                          placeholder="#000000"
                        />
                        <button
                          onClick={() => {
                            const color = brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000';
                            navigator.clipboard.writeText(color);
                          }}
                          className="text-xs text-muted hover:text-foreground transition-colors"
                          title="Copy color"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Brand Keywords</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                    placeholder="Add a keyword"
                    className="flex-1 bg-transparent text-base border-b border-border pb-2 outline-none placeholder:text-muted"
                  />
                  <button onClick={addKeyword} className="text-muted hover:text-foreground transition-colors">
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

              {/* Do/Don't Patterns */}
              <div className="grid grid-cols-2 gap-8 mb-16">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Do</h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={doPatternInput}
                      onChange={(e) => setDoPatternInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDoPattern()}
                      placeholder="Add pattern"
                      className="flex-1 bg-transparent text-sm border-b border-border pb-2 outline-none placeholder:text-muted"
                    />
                    <button onClick={addDoPattern} className="text-muted hover:text-foreground">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-1">
                    {brandDNA?.doPatterns?.map((pattern, i) => (
                      <div key={i} className="group flex items-center gap-2 py-1.5 cursor-pointer" onClick={() => removeDoPattern(i)}>
                        <span className="text-green-500 text-xs">✓</span>
                        <span className="text-sm flex-1">{pattern}</span>
                        <span className="text-muted opacity-0 group-hover:opacity-100">×</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Don&apos;t</h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={dontPatternInput}
                      onChange={(e) => setDontPatternInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDontPattern()}
                      placeholder="Add pattern"
                      className="flex-1 bg-transparent text-sm border-b border-border pb-2 outline-none placeholder:text-muted"
                    />
                    <button onClick={addDontPattern} className="text-muted hover:text-foreground">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-1">
                    {brandDNA?.dontPatterns?.map((pattern, i) => (
                      <div key={i} className="group flex items-center gap-2 py-1.5 cursor-pointer" onClick={() => removeDontPattern(i)}>
                        <span className="text-red-500 text-xs">✗</span>
                        <span className="text-sm flex-1">{pattern}</span>
                        <span className="text-muted opacity-0 group-hover:opacity-100">×</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Voice Samples */}
              <div className="mb-16">
                <h3 className="text-xs uppercase tracking-widest text-muted mb-4">Voice Samples</h3>
                <textarea
                  value={voiceSampleInput}
                  onChange={(e) => setVoiceSampleInput(e.target.value)}
                  placeholder="Paste an example of your brand's writing..."
                  rows={3}
                  className="w-full bg-transparent text-sm border border-border rounded-lg p-3 outline-none placeholder:text-muted focus:border-foreground transition-colors resize-none mb-3"
                />
                <button
                  onClick={addVoiceSample}
                  disabled={!voiceSampleInput.trim()}
                  className="px-4 py-2 text-sm border border-border rounded-full hover:border-foreground disabled:opacity-30 transition-colors"
                >
                  Add Sample
                </button>
                <div className="space-y-3 mt-4">
                  {brandDNA?.voiceSamples?.map((sample, i) => (
                    <div key={i} className="group relative p-3 bg-surface rounded-lg cursor-pointer hover:bg-border transition-colors" onClick={() => removeVoiceSample(i)}>
                      <p className="text-sm pr-6 italic">&ldquo;{sample}&rdquo;</p>
                      <span className="absolute top-2 right-2 text-muted opacity-0 group-hover:opacity-100">×</span>
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
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Check your content.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Real-time brand alignment analysis.
              </p>
            </section>

            <section className="max-w-2xl mx-auto px-6 py-16">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs uppercase tracking-widest text-muted">Content to Analyze</label>
                  {isAnalyzingTone && (
                    <span className="text-xs text-muted animate-pulse">Analyzing tone...</span>
                  )}
                </div>
                <textarea
                  value={contentToCheck}
                  onChange={(e) => setContentToCheck(e.target.value)}
                  placeholder="Start typing or paste your content here..."
                  rows={6}
                  className="w-full bg-transparent text-base border border-border rounded-lg p-4 outline-none resize-none placeholder:text-muted focus:border-foreground transition-colors"
                />
              </div>

              {/* Real-time Tone Analysis */}
              {toneAnalysis && (
                <div className="mb-8 p-4 bg-surface rounded-lg animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-widest text-muted">Live Tone Analysis</span>
                    <span className="text-2xl font-light">{toneAnalysis.overallMatch}<span className="text-sm text-muted">%</span></span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { label: 'Formality', value: toneAnalysis.formality, target: brandDNA?.tone?.minimal || 50 },
                      { label: 'Energy', value: toneAnalysis.energy, target: brandDNA?.tone?.playful || 50 },
                      { label: 'Confidence', value: toneAnalysis.confidence, target: brandDNA?.tone?.bold || 50 },
                      { label: 'Style', value: toneAnalysis.style, target: brandDNA?.tone?.experimental || 50 },
                    ].map(({ label, value, target }) => (
                      <div key={label} className="text-center">
                        <div className="text-xs text-muted mb-1">{label}</div>
                        <div className="text-lg font-light">{value}</div>
                        <div className="text-xs text-muted">target: {target}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted">{toneAnalysis.feedback}</p>
                </div>
              )}

              <button
                onClick={handleCheck}
                disabled={isChecking || !contentToCheck.trim() || !brandDNA?.name}
                className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
              >
                {isChecking ? 'Analyzing...' : 'Full Analysis'}
              </button>

              {checkError && (
                <div className="mt-6 p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
                  <p className="text-sm text-red-500">{checkError}</p>
                </div>
              )}

              {checkResult && (
                <div className="mt-16 animate-fade-in">
                  <div className="flex justify-center mb-12">
                    <ScoreRing score={checkResult.score} />
                  </div>
                  <div className="grid gap-8">
                    {checkResult.strengths?.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Strengths</h4>
                        {checkResult.strengths.map((s, i) => (
                          <p key={i} className="text-sm py-2 border-b border-border">{s}</p>
                        ))}
                      </div>
                    )}
                    {checkResult.issues?.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Issues</h4>
                        {checkResult.issues.map((s, i) => (
                          <p key={i} className="text-sm py-2 border-b border-border">{s}</p>
                        ))}
                      </div>
                    )}
                    {checkResult.suggestions?.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Suggestions</h4>
                        {checkResult.suggestions.map((s, i) => (
                          <p key={i} className="text-sm py-2 border-b border-border">{s}</p>
                        ))}
                      </div>
                    )}
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
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Generate content.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Create on-brand content for any channel.
              </p>
            </section>

            <section className="max-w-3xl mx-auto px-6 py-16">
              {/* Content Type Selector */}
              <div className="mb-8">
                <label className="block text-xs uppercase tracking-widest text-muted mb-4">Content Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {contentTypes.map(([type, info]) => (
                    <button
                      key={type}
                      onClick={() => setContentType(type)}
                      className={`p-3 text-left rounded-lg border transition-all ${
                        contentType === type
                          ? 'border-foreground bg-surface'
                          : 'border-border hover:border-muted'
                      }`}
                    >
                      <div className="text-sm font-medium">{info.label}</div>
                      <div className="text-xs text-muted">{info.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="mb-8">
                <label className="block text-xs uppercase tracking-widest text-muted mb-4">Your Request</label>
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder={contentTypeLabels[contentType]?.placeholder || 'Describe what you need...'}
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

              {generateError && (
                <div className="mt-6 p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
                  <p className="text-sm text-red-500">{generateError}</p>
                </div>
              )}

              {generatedContent && (
                <div className="mt-16 animate-fade-in">
                  <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Generated Options</h4>
                  <div className="p-6 bg-surface rounded-lg">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{generatedContent}</div>
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

        {/* Visual Tab */}
        {activeTab === 'visual' && <VisualConcepts />}

        {/* Design Intent Blocks Tab */}
        {activeTab === 'intents' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Design Intents.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Convert natural language directives into structured, enforceable brand rules.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              <DesignIntentBlocks />
            </section>
          </div>
        )}

        {/* Taste Translation Tab */}
        {activeTab === 'taste' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Taste Translation.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Turn subjective feedback into concrete, actionable design rules.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              <TasteTranslator />
            </section>
          </div>
        )}

        {/* Brand Cohesion Tab */}
        {activeTab === 'cohesion' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Brand Cohesion.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Analyze your brand as a system. Detect drift, repetition, and missing anchors.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              <BrandCohesion />
            </section>
          </div>
        )}

        {/* Platform Adapter Tab */}
        {activeTab === 'platforms' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Platform Adaptation.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Adapt your content for each platform while preserving brand identity.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              <PlatformAdapter />
            </section>
          </div>
        )}

        {/* Creator Guardrails Tab */}
        {activeTab === 'guardrails' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Creator Guardrails.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Review drafts from creators and agencies against your brand guidelines.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              <CreatorGuardrails />
            </section>
          </div>
        )}

        {/* Safe Zones Tab */}
        {activeTab === 'safezones' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Safe Zones.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Define what&apos;s locked, flexible, and experimental in your brand.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              <SafeZones />
            </section>
          </div>
        )}

        {/* Brand Memory Tab */}
        {activeTab === 'memory' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Brand Memory.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Track what worked and what failed. Build institutional memory.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              <BrandMemory />
            </section>
          </div>
        )}

        {/* Taste Protection Tab */}
        {activeTab === 'protect' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Taste Protection.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                AI optimized for restraint. Suggests removal over addition.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              <TasteProtection />
            </section>
          </div>
        )}

        {/* Context-Aware Tone Tab */}
        {activeTab === 'context' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Context Tone.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Adapt your brand voice for launches, apologies, crises, and more.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              <ContextTone />
            </section>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Dashboard.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Track your brand consistency over time.
              </p>
            </section>

            <section className="max-w-4xl mx-auto px-6 py-16">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6 mb-16">
                <div className="p-6 bg-surface rounded-lg text-center">
                  <div className="text-4xl font-light mb-2">{dashboardStats.totalChecks}</div>
                  <div className="text-xs uppercase tracking-widest text-muted">Content Checks</div>
                </div>
                <div className="p-6 bg-surface rounded-lg text-center">
                  <div className="text-4xl font-light mb-2">{dashboardStats.totalGenerations}</div>
                  <div className="text-xs uppercase tracking-widest text-muted">Generations</div>
                </div>
                <div className="p-6 bg-surface rounded-lg text-center">
                  <div className="text-4xl font-light mb-2">{dashboardStats.averageScore}<span className="text-lg text-muted">%</span></div>
                  <div className="text-xs uppercase tracking-widest text-muted">Average Score</div>
                </div>
              </div>

              {/* Score History Chart */}
              {dashboardStats.recentScores.length > 0 && (
                <div className="mb-16">
                  <h3 className="text-xs uppercase tracking-widest text-muted mb-8">Recent Check Scores</h3>
                  <div className="h-48 flex items-end gap-2">
                    {dashboardStats.recentScores.map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-foreground rounded-t transition-all hover:opacity-80"
                          style={{ height: `${item.score * 1.8}px` }}
                          title={`${item.score}%`}
                        />
                        <span className="text-xs text-muted">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashboardStats.totalChecks === 0 && dashboardStats.totalGenerations === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted">No activity yet. Start by checking or generating content.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Competitors Tab */}
        {activeTab === 'competitors' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Compare.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Analyze how your brand voice differs from competitors.
              </p>
            </section>

            <section className="max-w-2xl mx-auto px-6 py-16">
              <div className="mb-8">
                <label className="block text-xs uppercase tracking-widest text-muted mb-4">Competitor Name</label>
                <input
                  type="text"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  placeholder="e.g., Nike, Apple, Slack..."
                  className="w-full bg-transparent text-xl font-light border-b border-border pb-2 outline-none placeholder:text-muted focus:border-foreground transition-colors"
                />
              </div>

              <div className="mb-8">
                <label className="block text-xs uppercase tracking-widest text-muted mb-4">Competitor Voice Samples</label>
                <textarea
                  value={competitorSampleInput}
                  onChange={(e) => setCompetitorSampleInput(e.target.value)}
                  placeholder="Paste examples of their copy, taglines, or messaging..."
                  rows={3}
                  className="w-full bg-transparent text-sm border border-border rounded-lg p-3 outline-none placeholder:text-muted focus:border-foreground transition-colors resize-none mb-3"
                />
                <button
                  onClick={addCompetitorSample}
                  disabled={!competitorSampleInput.trim()}
                  className="px-4 py-2 text-sm border border-border rounded-full hover:border-foreground disabled:opacity-30 transition-colors"
                >
                  Add Sample
                </button>
                <div className="space-y-2 mt-4">
                  {competitorSamples.map((sample, i) => (
                    <div key={i} className="group flex items-start gap-2 p-3 bg-surface rounded-lg cursor-pointer" onClick={() => removeCompetitorSample(i)}>
                      <span className="text-sm flex-1 italic">&ldquo;{sample}&rdquo;</span>
                      <span className="text-muted opacity-0 group-hover:opacity-100">×</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCompetitorAnalysis}
                disabled={isAnalyzingCompetitor || !competitorName.trim() || competitorSamples.length === 0 || !brandDNA?.name}
                className="w-full py-3 bg-foreground text-background rounded-full text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
              >
                {isAnalyzingCompetitor ? 'Analyzing...' : 'Analyze Competitor'}
              </button>

              {competitorError && (
                <div className="mt-6 p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
                  <p className="text-sm text-red-500">{competitorError}</p>
                </div>
              )}

              {competitorAnalysis && (
                <div className="mt-16 animate-fade-in">
                  <div className="p-6 bg-surface rounded-lg mb-8">
                    <p className="text-lg font-light leading-relaxed">{competitorAnalysis.summary}</p>
                  </div>

                  {/* Tone Comparison */}
                  <div className="mb-8">
                    <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Tone Comparison</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: 'Formality', yours: brandDNA?.tone?.minimal || 50, theirs: competitorAnalysis.competitorTone.formality },
                        { label: 'Energy', yours: brandDNA?.tone?.playful || 50, theirs: competitorAnalysis.competitorTone.energy },
                        { label: 'Confidence', yours: brandDNA?.tone?.bold || 50, theirs: competitorAnalysis.competitorTone.confidence },
                        { label: 'Style', yours: brandDNA?.tone?.experimental || 50, theirs: competitorAnalysis.competitorTone.style },
                      ].map(({ label, yours, theirs }) => (
                        <div key={label} className="text-center p-4 border border-border rounded-lg">
                          <div className="text-xs text-muted mb-2">{label}</div>
                          <div className="flex justify-center gap-4">
                            <div>
                              <div className="text-lg font-light">{yours}</div>
                              <div className="text-xs text-muted">You</div>
                            </div>
                            <div className="text-muted">vs</div>
                            <div>
                              <div className="text-lg font-light">{theirs}</div>
                              <div className="text-xs text-muted">Them</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Key Differences</h4>
                      {competitorAnalysis.keyDifferences.map((d, i) => (
                        <p key={i} className="text-sm py-2 border-b border-border">{d}</p>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Differentiation Opportunities</h4>
                      {competitorAnalysis.differentiationOpportunities.map((d, i) => (
                        <p key={i} className="text-sm py-2 border-b border-border">{d}</p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Your Unique Positioning</h4>
                    <p className="text-sm p-4 bg-surface rounded-lg">{competitorAnalysis.uniquePositioning}</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">History.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">Review your previous checks and generations.</p>
            </section>

            <section className="max-w-2xl mx-auto px-6 py-16">
              {history.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted">No history yet.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-xs uppercase tracking-widest text-muted">{history.length} items</span>
                    <button onClick={clearHistory} className="text-xs text-muted hover:text-foreground transition-colors">Clear All</button>
                  </div>
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item.id} className="p-4 bg-surface rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              item.type === 'check' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                            }`}>
                              {item.type}
                            </span>
                            {item.contentType && item.contentType !== 'general' && (
                              <span className="text-xs text-muted">{contentTypeLabels[item.contentType]?.label}</span>
                            )}
                          </div>
                          <span className="text-xs text-muted">{formatDate(item.timestamp)}</span>
                        </div>
                        <p className="text-sm line-clamp-2 mb-2">{item.input}</p>
                        {item.type === 'check' && (
                          <div className="text-xl font-light">{(item.output as CheckResult).score}<span className="text-sm text-muted">/100</span></div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="animate-fade-in">
            <section className="py-20 px-6 text-center border-b border-border">
              <h2 className="text-5xl font-light tracking-tight mb-4">Export.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Generate brand kits, pitch decks, and more.
              </p>
            </section>

            <section className="max-w-4xl mx-auto px-6 py-16">
              <ExportCenter />
              
              {/* Legacy Quick Export */}
              <div className="mt-16 pt-16 border-t border-border">
                <h3 className="text-xs uppercase tracking-widest text-muted mb-6">Quick Export</h3>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <button onClick={exportAsJSON} className="py-4 border border-border rounded-lg hover:border-foreground transition-colors">
                    <span className="block text-sm font-medium mb-1">Export JSON</span>
                    <span className="text-xs text-muted">Machine-readable</span>
                  </button>
                  <button onClick={() => window.print()} className="py-4 border border-border rounded-lg hover:border-foreground transition-colors">
                    <span className="block text-sm font-medium mb-1">Print / PDF</span>
                    <span className="text-xs text-muted">Print-ready</span>
                  </button>
                  <button onClick={handleShare} disabled={isSharing} className="py-4 border border-border rounded-lg hover:border-foreground transition-colors disabled:opacity-50">
                    <span className="block text-sm font-medium mb-1">{isSharing ? 'Creating...' : 'Share Link'}</span>
                    <span className="text-xs text-muted">Shareable URL</span>
                  </button>
                </div>

                {/* Share URL */}
                {shareUrl && (
                  <div className="mb-8 p-4 bg-surface rounded-lg animate-fade-in">
                    <p className="text-xs uppercase tracking-widest text-muted mb-2">Share URL</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 bg-transparent text-sm font-mono border border-border rounded px-3 py-2"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(shareUrl)}
                        className="px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-80 transition-opacity"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* API Docs Link */}
                <div className="text-center">
                  <a href="/api-docs" className="text-sm text-muted hover:text-foreground transition-colors">
                    View API Documentation →
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}

        <footer className="border-t border-border py-8 mt-16 print:hidden">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-xs text-muted">brandos — AI-powered brand consistency</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

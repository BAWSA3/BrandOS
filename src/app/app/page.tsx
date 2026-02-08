'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import PhaseNavigation, { Phase, SubTab, getPhaseFromTab, getDefaultTabForPhase } from '@/components/PhaseNavigation';
import OnboardingWizard from '@/components/OnboardingWizard';
import BrandCompleteness, { useBrandCompleteness } from '@/components/BrandCompleteness';
import QuickActions from '@/components/QuickActions';
import { BrandKitCanvas, LogoSection, ColorSection, TypographySection, ImagerySection, IconSection, TemplateSection, AIStudio } from '@/components/brandkit';
import { BrandImportHub } from '@/components/import';
import { ExtractedBrand } from '@/lib/importTypes';
import PhasesBreakdown from '@/components/PhasesBreakdown';
import AnimatedBackground from '@/components/AnimatedBackground';
import DataPersistenceWarning from '@/components/DataPersistenceWarning';
import { useToast } from '@/components/ToastProvider';
import { BetaBadgeInline } from '@/components/BetaBadge';
import { InnerCircleBadge, useInnerCircle, InnerCircleStyles } from '@/components/InnerCircleBadge';
import { InviteCodeDisplay } from '@/components/InviteCodeDisplay';
import ChangelogModal from '@/components/ChangelogModal';
import analytics from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import { useBrandSync } from '@/hooks/useBrandSync';
import { useHistorySync } from '@/hooks/useHistorySync';
import AuthButton from '@/components/AuthButton';
import { SaveResultsPrompt } from '@/components/SaveResultsPrompt';
import ContentWorkflow from '@/components/workflow/ContentWorkflow';

function HomeContent() {
  const searchParams = useSearchParams();
  const {
    setBrandDNA,
    brands,
    currentBrandId,
    createBrand,
    deleteBrand,
    switchBrand,
    history,
    clearHistory,
    theme,
    phaseProgress,
    completeOnboarding,
    markFirstCheck,
    markFirstGeneration,
    setLastActivePhase,
  } = useBrandStore();

  const brandDNA = useCurrentBrand();
  const brandCompleteness = useBrandCompleteness();
  const toast = useToast();
  const { isInnerCircle, pendingInviteCode } = useInnerCircle();
  const { user, isLoading: authLoading } = useAuth();
  const { isSyncing, syncError } = useBrandSync();
  const { saveHistoryItem } = useHistorySync();

  // State for showing save results prompt (for unauthenticated users)
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  // Check for phases breakdown query param (from landing page)
  const showPhasesParam = searchParams.get('showPhases') === 'true';
  // Check for imported param (from X Brand Score claim flow)
  const importedParam = searchParams.get('imported') === 'true';

  // Phase-based navigation
  const [activePhase, setActivePhase] = useState<Phase>(phaseProgress.lastActivePhase || 'define');
  const [activeTab, setActiveTab] = useState<SubTab>(getDefaultTabForPhase(phaseProgress.lastActivePhase || 'define'));
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!phaseProgress.hasCompletedOnboarding);
  const [showImportHub, setShowImportHub] = useState(false);
  const [showPhasesBreakdown, setShowPhasesBreakdown] = useState(showPhasesParam && !phaseProgress.hasCompletedOnboarding);
  const [showImportedWelcome, setShowImportedWelcome] = useState(importedParam);
  
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

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);

  // Input states
  const [keywordInput, setKeywordInput] = useState('');
  const [doPatternInput, setDoPatternInput] = useState('');
  const [dontPatternInput, setDontPatternInput] = useState('');
  const [voiceSampleInput, setVoiceSampleInput] = useState('');
  
  // Refs
  const exportRef = useRef<HTMLDivElement>(null);
  const toneDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Handle phase changes
  const handlePhaseChange = (phase: Phase) => {
    setActivePhase(phase);
    setActiveTab(getDefaultTabForPhase(phase));
    setLastActivePhase(phase);
    analytics.phaseVisited(phase);
  };

  const handleTabChange = (tab: SubTab) => {
    setActiveTab(tab);
    const phase = getPhaseFromTab(tab);
    if (phase !== activePhase) {
      setActivePhase(phase);
      setLastActivePhase(phase);
    }
  };

  // Quick action navigation
  const handleQuickNavigate = (phase: Phase, tab: SubTab) => {
    handlePhaseChange(phase);
    setActiveTab(tab);
  };

  // Onboarding handlers
  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
    handlePhaseChange('check'); // Move to Check phase after onboarding
    analytics.onboardingCompleted();
    // Show save prompt for unauthenticated users
    if (!user) {
      setShowSavePrompt(true);
    }
  };

  const handleOnboardingSkip = () => {
    completeOnboarding();
    analytics.onboardingSkipped();
    setShowOnboarding(false);
  };

  // Phases breakdown handlers
  const handlePhasesGetStarted = () => {
    setShowPhasesBreakdown(false);
    setShowImportHub(true);
  };

  const handlePhasesSkip = () => {
    setShowPhasesBreakdown(false);
    setShowImportHub(true);
  };

  // Handle waitlist signup
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || isSubmittingWaitlist) return;

    setIsSubmittingWaitlist(true);
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: waitlistEmail,
          source: 'dashboard',
          brandData: {
            displayName: brandDNA?.name,
          },
        }),
      });
      setWaitlistSubmitted(true);
    } catch (error) {
      console.error('Waitlist submission error:', error);
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  // Handle imported brand DNA welcome
  useEffect(() => {
    if (importedParam && showImportedWelcome) {
      // Ensure we're on the Define phase to show the imported data
      setActivePhase('define');
      setActiveTab('brand');
      // Don't show regular onboarding since they already have data
      setShowOnboarding(false);
      
      // Auto-dismiss the welcome message after 5 seconds
      const timer = setTimeout(() => {
        setShowImportedWelcome(false);
        // Clean up the URL param without refreshing
        window.history.replaceState({}, '', '/app');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [importedParam, showImportedWelcome]);

  // Import handlers
  const handleStartFresh = () => {
    setShowImportHub(false);
    setShowOnboarding(true);
  };

  const handleImportComplete = (extractedBrand: ExtractedBrand) => {
    // Apply extracted brand data to current brand
    if (extractedBrand.name?.value) {
      setBrandDNA({ name: extractedBrand.name.value });
    }
    if (extractedBrand.colors) {
      setBrandDNA({
        colors: {
          primary: extractedBrand.colors.primary?.value || brandDNA?.colors?.primary || '#000000',
          secondary: extractedBrand.colors.secondary?.value || brandDNA?.colors?.secondary || '#ffffff',
          accent: extractedBrand.colors.accent?.value || brandDNA?.colors?.accent || '#6366f1',
        },
      });
    }
    if (extractedBrand.tone) {
      setBrandDNA({
        tone: {
          minimal: extractedBrand.tone.formality?.value ?? brandDNA?.tone?.minimal ?? 50,
          playful: extractedBrand.tone.energy?.value ?? brandDNA?.tone?.playful ?? 50,
          bold: extractedBrand.tone.confidence?.value ?? brandDNA?.tone?.bold ?? 50,
          experimental: extractedBrand.tone.style?.value ?? brandDNA?.tone?.experimental ?? 30,
        },
      });
    }
    if (extractedBrand.keywords && extractedBrand.keywords.length > 0) {
      setBrandDNA({ keywords: extractedBrand.keywords.map(k => k.value) });
    }
    if (extractedBrand.doPatterns && extractedBrand.doPatterns.length > 0) {
      setBrandDNA({ doPatterns: extractedBrand.doPatterns.map(p => p.value) });
    }
    if (extractedBrand.dontPatterns && extractedBrand.dontPatterns.length > 0) {
      setBrandDNA({ dontPatterns: extractedBrand.dontPatterns.map(p => p.value) });
    }
    if (extractedBrand.voiceSamples && extractedBrand.voiceSamples.length > 0) {
      setBrandDNA({ voiceSamples: extractedBrand.voiceSamples.map(s => s.value) });
    }

    // Mark onboarding as complete and show define phase
    completeOnboarding();
    setShowImportHub(false);
    handlePhaseChange('define');
  };

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
        const errorMsg = result.error || 'Analysis failed. Please try again.';
        setCheckError(errorMsg);
        toast.error('Analysis failed', errorMsg);
        return;
      }
      
      setCheckResult(result);
      toast.success('Analysis complete!', `Your content scored ${result.score}/100`);
      analytics.contentChecked(result.score);
      
      // Mark first check complete
      if (!phaseProgress.hasCompletedFirstCheck) {
        markFirstCheck();
      }
      
      saveHistoryItem({
        type: 'check',
        brandId: brandDNA.id,
        brandName: brandDNA.name,
        input: contentToCheck,
        output: result,
      });
    } catch (error) {
      console.error(error);
      setCheckError('Network error. Please check your connection.');
      toast.error('Network error', 'Please check your connection and try again.');
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
        const errorMsg = result.error || 'Generation failed. Please try again.';
        setGenerateError(errorMsg);
        toast.error('Generation failed', errorMsg);
        return;
      }
      
      setGeneratedContent(result.content);
      toast.success('Content generated!', 'Your on-brand content is ready.');
      analytics.contentGenerated(contentType);
      
      // Mark first generation complete
      if (!phaseProgress.hasCompletedFirstGeneration) {
        markFirstGeneration();
      }
      
      saveHistoryItem({
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
      toast.error('Network error', 'Please check your connection and try again.');
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
      setBrandDNA({ ...template.preview, name: template.name });
      setShowTemplates(false);
    }
  };

  // Handle template query parameter (e.g., /app?template=phantom-gaming)
  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
      const template = brandTemplates.find(t => t.id === templateParam);
      if (template?.preview) {
        // Create a new brand with this template
        createBrand(template.name);
        // Apply template settings after a short delay to ensure brand is created
        setTimeout(() => {
          setBrandDNA(template.preview);
          completeOnboarding();
          setShowOnboarding(false);
          setShowImportHub(false);
          handlePhaseChange('define');
        }, 100);
      }
    }
  }, []);

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
    toast.success('Brand exported!', 'Your brand guidelines have been downloaded.');
    analytics.brandExported();
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
        toast.success('Share link created!', 'Copy and share with your team.');
        analytics.brandShared();
      } else {
        toast.error('Failed to create share link', 'Please try again.');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Share failed', 'Please check your connection.');
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

  // Show phases breakdown for new users coming from landing page
  if (showPhasesBreakdown) {
    return (
      <PhasesBreakdown
        onGetStarted={handlePhasesGetStarted}
        onSkip={handlePhasesSkip}
      />
    );
  }

  // Show import hub for new users (first step) or when explicitly requested
  if (showImportHub || (!phaseProgress.hasCompletedOnboarding && !showOnboarding && !showPhasesBreakdown)) {
    return (
      <BrandImportHub
        onStartFresh={handleStartFresh}
        onImportComplete={handleImportComplete}
      />
    );
  }

  // Show onboarding wizard after choosing "Start Fresh"
  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />;
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-[#faf8f5] text-[#1a1a1a]'}`}>
      {/* Inner Circle styles for shimmer animation */}
      {isInnerCircle && <InnerCircleStyles />}

      {/* Animated Background with Blue Orbs */}
      <AnimatedBackground variant="default" orbCount={3} />
      
      {/* Imported Brand DNA Welcome Toast */}
      {showImportedWelcome && (
        <div 
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in"
          style={{ animation: 'slideDown 0.5s ease-out' }}
        >
          <div 
            className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(212, 165, 116, 0.05) 100%)',
              border: '1px solid rgba(212, 165, 116, 0.3)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(212, 165, 116, 0.2)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <h4 
                className="font-semibold mb-0.5"
                style={{ 
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '13px',
                  letterSpacing: '0.1em',
                  color: '#D4A574',
                }}
              >
                BRAND DNA IMPORTED
              </h4>
              <p 
                className="text-sm"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: "'Helvetica Neue', sans-serif",
                }}
              >
                Welcome to BrandOS! Your brand identity is ready to use.
              </p>
            </div>
            <button
              onClick={() => {
                setShowImportedWelcome(false);
                window.history.replaceState({}, '', '/app');
              }}
              className="ml-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Subtle noise overlay */}
      <div className="noise-overlay" />
      
      {/* Phase Navigation */}
      <PhaseNavigation
        activePhase={activePhase}
        activeTab={activeTab}
        onPhaseChange={handlePhaseChange}
        onTabChange={handleTabChange}
        brandCompleteness={brandCompleteness}
        hasChecked={phaseProgress.hasCompletedFirstCheck}
        hasGenerated={phaseProgress.hasCompletedFirstGeneration}
      />

      {/* Brand Switcher and Auth Button (floating) */}
      <div className="fixed top-20 right-6 z-40 flex items-center gap-3">
        {/* Sync indicator */}
        {user && isSyncing && (
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Syncing...</span>
          </div>
        )}

        {/* Auth Button */}
        <AuthButton showInnerCircle={!isInnerCircle} />

        <div className="relative">
          <button
            onClick={() => setShowBrandMenu(!showBrandMenu)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm backdrop-blur-xl rounded-full transition-all ${theme === 'dark' ? 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)]' : 'bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.08)] hover:bg-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)]'}`}
          >
            <span className="text-white/50 text-xs font-mono uppercase tracking-wider">Brand</span>
            <span className="font-medium text-white">{brandDNA?.name || 'Select'}</span>
            <BetaBadgeInline />
            {isInnerCircle && <InnerCircleBadge variant="inline" />}
            <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showBrandMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-[rgba(20,20,20,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden animate-fade-in">
              <div className="p-2 max-h-64 overflow-y-auto">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      brand.id === currentBrandId 
                        ? 'bg-[rgba(0,71,255,0.15)] border border-[rgba(0,71,255,0.3)]' 
                        : 'hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    <span
                      className="flex-1 text-sm text-white"
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
                        className="text-white/40 hover:text-white p-1 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-[rgba(255,255,255,0.1)] p-2">
                <button
                  onClick={() => {
                    createBrand();
                    setShowBrandMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all"
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
        
      </div>

      {/* Click outside to close menus */}
      {(showBrandMenu || showTemplates) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setShowBrandMenu(false);
            setShowTemplates(false);
          }}
        />
      )}

      {/* Quick Actions FAB */}
      <QuickActions
        onNavigate={handleQuickNavigate}
        canCheck={brandCompleteness >= 30}
        canGenerate={phaseProgress.hasCompletedFirstCheck}
      />

      {/* Data Persistence Warning */}
      <DataPersistenceWarning onExport={exportAsJSON} />

      {/* Save Results Prompt - for unauthenticated users who have completed the journey */}
      {!user && !authLoading && phaseProgress.hasCompletedOnboarding && showSavePrompt && (
        <SaveResultsPrompt
          inviteCode={pendingInviteCode || undefined}
          onDismiss={() => setShowSavePrompt(false)}
        />
      )}

      {/* Changelog Modal - shows automatically for new versions */}
      {phaseProgress.hasCompletedOnboarding && <ChangelogModal />}

      {/* Join Waitlist Panel */}
      {!waitlistSubmitted && (
        <div
          className="fixed bottom-6 left-6 z-40 animate-fade-in"
          style={{
            maxWidth: '320px',
          }}
        >
          <div
            className="rounded-xl p-5"
            style={{
              background: theme === 'dark' ? 'rgba(26,26,26,0.95)' : 'rgba(255,255,255,0.95)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <h3
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: '#D4A574',
                marginBottom: '6px',
              }}
            >
              JOIN THE WAITLIST
            </h3>
            <p
              style={{
                fontSize: '12px',
                color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                marginBottom: '12px',
                lineHeight: '1.4',
              }}
            >
              Get early access to premium BrandOS features
            </p>
            <form onSubmit={handleWaitlistSubmit} className="flex gap-2">
              <input
                type="email"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  color: theme === 'dark' ? '#FFFFFF' : '#1a1a1a',
                }}
              />
              <button
                type="submit"
                disabled={isSubmittingWaitlist}
                className="px-4 py-2.5 rounded-lg cursor-pointer border-none transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  color: '#050505',
                  background: 'linear-gradient(135deg, #E8C49A 0%, #D4A574 100%)',
                  opacity: isSubmittingWaitlist ? 0.7 : 1,
                }}
              >
                {isSubmittingWaitlist ? '...' : 'JOIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Waitlist Success Message */}
      {waitlistSubmitted && (
        <div
          className="fixed bottom-6 left-6 z-40 animate-fade-in"
          style={{
            maxWidth: '320px',
          }}
        >
          <div
            className="rounded-xl p-5 text-center"
            style={{
              background: theme === 'dark' ? 'rgba(26,26,26,0.95)' : 'rgba(255,255,255,0.95)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <span
              style={{
                color: '#10B981',
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '12px',
              }}
            >
              ✓ YOU&apos;RE ON THE LIST!
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-4">
        {/* ======================= DEFINE PHASE ======================= */}
        
        {/* Brand DNA Tab */}
        {activeTab === 'brand' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Phase 1: Define
              </div>
              <h2 className="text-5xl font-light tracking-tight mb-4">
                Define your brand.
              </h2>
              <p className="text-muted text-lg max-w-md mx-auto mb-8">
                Capture the essence of your brand identity.
              </p>
              
              {/* Brand Completeness */}
              <div className="max-w-md mx-auto mb-8">
                <BrandCompleteness size="sm" showDetails={false} />
              </div>
              
              {/* Import/Template Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowImportHub(true)}
                  className="px-4 py-2 text-sm border border-border rounded-full hover:border-foreground transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Existing Brand
                </button>
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
                      <label className="block cursor-pointer">
                        <div 
                          className="h-16 rounded-lg border border-border transition-all group-hover:scale-[1.02] group-hover:shadow-lg"
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
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000'}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                              setBrandDNA({ 
                                colors: { ...brandDNA?.colors!, [key]: value } 
                              });
                            }
                          }}
                          className="flex-1 text-xs font-mono bg-transparent border-b border-border pb-1 outline-none focus:border-foreground transition-colors"
                          placeholder="#000000"
                        />
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

              {/* Next Step CTA */}
              {brandCompleteness >= 30 && (
                <div className="p-6 bg-surface rounded-xl text-center">
                  <p className="text-sm text-muted mb-4">Your brand is {brandCompleteness}% complete. Ready to check some content?</p>
                  <button
                    onClick={() => handlePhaseChange('check')}
                    className="px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Go to Check →
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Safe Zones Tab */}
        {activeTab === 'safezones' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Phase 1: Define
              </div>
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

        {/* Design Intents Tab */}
        {activeTab === 'intents' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Phase 1: Define
              </div>
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

        {/* ======================= CHECK PHASE ======================= */}

        {/* Check Tab */}
        {activeTab === 'check' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Phase 2: Check
              </div>
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
                          onClick={() => {
                            navigator.clipboard.writeText(checkResult.revisedVersion);
                            toast.success('Copied!', 'Revised content copied to clipboard.');
                          }}
                          className="mt-3 text-xs text-muted hover:text-foreground transition-colors"
                        >
                          Copy to clipboard
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Next Step CTA */}
                  {phaseProgress.hasCompletedFirstCheck && !phaseProgress.hasCompletedFirstGeneration && (
                    <div className="mt-12 p-6 bg-surface rounded-xl text-center">
                      <p className="text-sm text-muted mb-4">Great! Now let&apos;s generate some on-brand content.</p>
                      <button
                        onClick={() => handlePhaseChange('generate')}
                        className="px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Go to Generate →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Cohesion Tab */}
        {activeTab === 'cohesion' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Phase 2: Check
              </div>
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

        {/* Guardrails Tab */}
        {activeTab === 'guardrails' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Phase 2: Check
              </div>
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

        {/* Protect Tab */}
        {activeTab === 'protect' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Phase 2: Check
              </div>
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

        {/* Taste Tab */}
        {activeTab === 'taste' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Phase 2: Check
              </div>
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

        {/* ======================= GENERATE PHASE ======================= */}

        {/* Generate Tab — Content Workflow */}
        {activeTab === 'generate' && (
          <div className="animate-fade-in">
            <ContentWorkflow />
          </div>
        )}

        {/* Platforms Tab */}
        {activeTab === 'platforms' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Phase 3: Generate
              </div>
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

        {/* Context Tab */}
        {activeTab === 'context' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Phase 3: Generate
              </div>
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

        {/* Visual Tab */}
        {activeTab === 'visual' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Phase 3: Generate
              </div>
            </section>
            <VisualConcepts />
          </div>
        )}

        {/* ======================= BRAND KIT PHASE ======================= */}

        {/* AI Studio Tab */}
        {activeTab === 'kit-ai-studio' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></span>
                Phase 4: Brand Kit
              </div>
              <h2 className="text-5xl font-light tracking-tight mb-4">AI Studio.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Generate brand assets with Gemini AI.
              </p>
            </section>
            <section className="px-6 py-16">
              <AIStudio />
            </section>
          </div>
        )}

        {/* Brand Kit Canvas Tab */}
        {activeTab === 'kit-canvas' && (
          <div className="animate-fade-in">
            <BrandKitCanvas />
          </div>
        )}

        {/* Brand Kit Logos Tab */}
        {activeTab === 'kit-logos' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                Phase 4: Brand Kit
              </div>
              <h2 className="text-5xl font-light tracking-tight mb-4">Logos & Marks.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Upload and manage your logo variants with usage guidelines.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              {currentBrandId && <LogoSection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* Brand Kit Colors Tab */}
        {activeTab === 'kit-colors' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                Phase 4: Brand Kit
              </div>
              <h2 className="text-5xl font-light tracking-tight mb-4">Extended Colors.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Build your complete color palette with semantic naming and accessibility checks.
              </p>
            </section>
            <section className="max-w-3xl mx-auto px-6 py-16">
              {currentBrandId && <ColorSection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* Brand Kit Typography Tab */}
        {activeTab === 'kit-typography' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                Phase 4: Brand Kit
              </div>
              <h2 className="text-5xl font-light tracking-tight mb-4">Typography.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Define your type system with fonts, scales, and pairings.
              </p>
            </section>
            <section className="max-w-4xl mx-auto px-6 py-16">
              {currentBrandId && <TypographySection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* Brand Kit Imagery Tab */}
        {activeTab === 'kit-imagery' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                Phase 4: Brand Kit
              </div>
              <h2 className="text-5xl font-light tracking-tight mb-4">Imagery & Mood.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Create mood boards and define your visual style with do/don&apos;t examples.
              </p>
            </section>
            <section className="max-w-4xl mx-auto px-6 py-16">
              {currentBrandId && <ImagerySection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* Brand Kit Icons Tab */}
        {activeTab === 'kit-icons' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                Phase 4: Brand Kit
              </div>
              <h2 className="text-5xl font-light tracking-tight mb-4">Icon Library.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Organize and categorize your brand icons with usage guidelines.
              </p>
            </section>
            <section className="max-w-4xl mx-auto px-6 py-16">
              {currentBrandId && <IconSection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* Brand Kit Templates Tab */}
        {activeTab === 'kit-templates' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                Phase 4: Brand Kit
              </div>
              <h2 className="text-5xl font-light tracking-tight mb-4">Templates.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Create templates for social media, email, ads, and more.
              </p>
            </section>
            <section className="max-w-4xl mx-auto px-6 py-16">
              {currentBrandId && <TemplateSection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* ======================= SCALE PHASE ======================= */}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Phase 5: Scale
              </div>
              <h2 className="text-5xl font-light tracking-tight mb-4">Dashboard.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">
                Track your brand consistency over time.
              </p>
            </section>

            <section className="max-w-4xl mx-auto px-6 py-16">
              {/* Brand Health Summary */}
              <div className="mb-12 p-6 bg-surface rounded-xl">
                <BrandCompleteness size="md" showDetails={true} />
              </div>

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

              {/* Inner Circle Invite Codes */}
              {isInnerCircle && (
                <div className="mb-16">
                  <h3 className="text-xs uppercase tracking-widest text-muted mb-6">Your Invite Codes</h3>
                  <InviteCodeDisplay username={user?.xUsername || brandDNA?.name || 'user'} />
                </div>
              )}

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
                  <p className="text-muted mb-4">No activity yet. Start by checking or generating content.</p>
                  <button
                    onClick={() => handlePhaseChange('check')}
                    className="px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Start Checking Content
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Phase 5: Scale
              </div>
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
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Phase 5: Scale
              </div>
              <h2 className="text-5xl font-light tracking-tight mb-4">Export.</h2>
              <p className="text-muted text-lg max-w-md mx-auto">Download your brand guidelines.</p>
            </section>

            <section className="max-w-2xl mx-auto px-6 py-16">
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
                <div className="mb-16 p-4 bg-surface rounded-lg animate-fade-in">
                  <p className="text-xs uppercase tracking-widest text-muted mb-2">Share URL</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-transparent text-sm font-mono border border-border rounded px-3 py-2"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        toast.success('Link copied!', 'Share URL copied to clipboard.');
                      }}
                      className="px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-80 transition-opacity"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-2">Anyone with this link can view and import your brand guidelines.</p>
                </div>
              )}

              {/* API Docs Link */}
              <div className="mb-16 text-center">
                <a href="/api-docs" className="text-sm text-muted hover:text-foreground transition-colors">
                  View API Documentation →
                </a>
              </div>

              <div ref={exportRef} className="border border-border rounded-lg p-8 print:border-none">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-light tracking-tight mb-2">{brandDNA?.name}</h3>
                  <p className="text-sm text-muted">Brand Guidelines</p>
                </div>

                {brandDNA?.colors && (
                  <div className="mb-12">
                    <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Brand Colors</h4>
                    <div className="flex gap-4">
                      {Object.entries(brandDNA.colors).map(([key, value]) => (
                        <div key={key} className="flex-1">
                          <div className="h-20 rounded-lg mb-2" style={{ backgroundColor: value }} />
                          <p className="text-xs text-muted capitalize">{key}</p>
                          <p className="text-xs font-mono">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {brandDNA?.tone && (
                  <div className="mb-12">
                    <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Tone Profile</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(brandDNA.tone).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-border">
                          <span className="text-sm capitalize">{key}</span>
                          <span className="text-sm text-muted">{value}/100</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {brandDNA?.keywords && brandDNA.keywords.length > 0 && (
                  <div className="mb-12">
                    <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {brandDNA.keywords.map((k, i) => (
                        <span key={i} className="px-3 py-1 bg-surface rounded-full text-sm">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8 mb-12">
                  {brandDNA?.doPatterns && brandDNA.doPatterns.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Do</h4>
                      {brandDNA.doPatterns.map((p, i) => (
                        <p key={i} className="text-sm flex items-start gap-2 mb-2">
                          <span className="text-green-500">✓</span>{p}
                        </p>
                      ))}
                    </div>
                  )}
                  {brandDNA?.dontPatterns && brandDNA.dontPatterns.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Don&apos;t</h4>
                      {brandDNA.dontPatterns.map((p, i) => (
                        <p key={i} className="text-sm flex items-start gap-2 mb-2">
                          <span className="text-red-500">✗</span>{p}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {brandDNA?.voiceSamples && brandDNA.voiceSamples.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-muted mb-4">Voice Samples</h4>
                    {brandDNA.voiceSamples.map((s, i) => (
                      <blockquote key={i} className="p-4 bg-surface rounded-lg text-sm italic mb-3">&ldquo;{s}&rdquo;</blockquote>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Competitors Tab */}
        {activeTab === 'competitors' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Phase 5: Scale
              </div>
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

        {/* Memory Tab */}
        {activeTab === 'memory' && (
          <div className="animate-fade-in">
            <section className="py-16 px-6 text-center border-b border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-xs text-muted mb-6">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Phase 5: Scale
              </div>
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

        <footer className="border-t border-[rgba(255,255,255,0.1)] py-12 mt-16 print:hidden relative z-10">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="font-helvetica text-white/80">brand</span>
              <span className="font-pixel text-[#0047FF]">OS</span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
              AI-powered brand consistency
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  );
}

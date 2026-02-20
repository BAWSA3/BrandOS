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
import VoiceFingerprint from '@/components/VoiceFingerprint';
import VoiceFingerprintMini from '@/components/VoiceFingerprintMini';
import { AuthenticityScore, AuthenticityFlag, summarizeFingerprint } from '@/lib/voice-fingerprint';
import OnboardingWizard from '@/components/OnboardingWizard';
import BrandCompleteness, { useBrandCompleteness } from '@/components/BrandCompleteness';
import { BrandKitCanvas, LogoSection, ColorSection, TypographySection, ImagerySection, IconSection, TemplateSection, AIStudio } from '@/components/brandkit';
import { BrandImportHub } from '@/components/import';
import { ExtractedBrand } from '@/lib/importTypes';
import PhasesBreakdown from '@/components/PhasesBreakdown';
import { useToast } from '@/components/ToastProvider';
import { useInnerCircle, InnerCircleStyles } from '@/components/InnerCircleBadge';
import ChangelogModal from '@/components/ChangelogModal';
import analytics from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import { useBrandSync } from '@/hooks/useBrandSync';
import { useHistorySync } from '@/hooks/useHistorySync';
import ContentWorkflow from '@/components/workflow/ContentWorkflow';
import ContentCalendar from '@/components/calendar/ContentCalendar';
import DashboardHome from '@/components/dashboard/DashboardHome';
import { InviteCodeDisplay } from '@/components/InviteCodeDisplay';
import { AsciiSkyLoadingScreen } from '@/components/ascii-sky';

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
    voiceFingerprints,
  } = useBrandStore();

  const brandDNA = useCurrentBrand();
  const brandCompleteness = useBrandCompleteness();
  const currentFingerprint = currentBrandId ? voiceFingerprints[currentBrandId] : null;
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
  const [activePhase, setActivePhase] = useState<Phase>(phaseProgress.lastActivePhase || 'home');
  const [activeTab, setActiveTab] = useState<SubTab>(getDefaultTabForPhase(phaseProgress.lastActivePhase || 'home'));
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!phaseProgress.hasCompletedOnboarding);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
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
  
  // Authenticity state (for Check phase)
  const [authenticityScore, setAuthenticityScore] = useState<AuthenticityScore | null>(null);
  const [isRewritingFlags, setIsRewritingFlags] = useState(false);

  // Generate state
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [contentType, setContentType] = useState<ContentType>('general');
  const [generateAuthScore, setGenerateAuthScore] = useState<AuthenticityScore | null>(null);
  const [isCheckingGenAuth, setIsCheckingGenAuth] = useState(false);

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
    setShowLoadingScreen(true); // Show loading screen transition before dashboard
    handlePhaseChange('home'); // Land on Dashboard Home after onboarding
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
    setAuthenticityScore(null);

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          content: contentToCheck,
          voiceFingerprint: currentFingerprint || undefined,
        }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        const errorMsg = result.error || 'Analysis failed. Please try again.';
        setCheckError(errorMsg);
        toast.error('Analysis failed', errorMsg);
        return;
      }
      
      setCheckResult(result);
      if (result.authenticityScore) {
        setAuthenticityScore(result.authenticityScore);
      }
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
    setGenerateAuthScore(null);

    try {
      const fpSummary = currentFingerprint ? summarizeFingerprint(currentFingerprint) : undefined;
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          prompt: generatePrompt,
          contentType,
          voiceFingerprint: fpSummary,
        }),
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

      // Auto-check authenticity if fingerprint exists
      if (currentFingerprint && result.content) {
        setIsCheckingGenAuth(true);
        try {
          const authRes = await fetch('/api/voice-fingerprint/check-authenticity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result.content, fingerprint: currentFingerprint }),
          });
          if (authRes.ok) {
            const { score } = await authRes.json();
            setGenerateAuthScore(score);
          }
        } catch {} finally {
          setIsCheckingGenAuth(false);
        }
      }
      
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

  // Show ASCII sky loading screen (on initial load + after onboarding)
  if (showLoadingScreen) {
    return (
      <AsciiSkyLoadingScreen
        onComplete={() => setShowLoadingScreen(false)}
        brandName={brandDNA?.name}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--text-primary)' }}>
      {/* Inner Circle styles */}
      {isInnerCircle && <InnerCircleStyles />}
      
      {/* Imported Brand DNA Welcome Toast */}
      {showImportedWelcome && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--border)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Brand DNA imported successfully</span>
            <button
              onClick={() => { setShowImportedWelcome(false); window.history.replaceState({}, '', '/app'); }}
              className="ml-2 p-1 rounded-md hover:bg-black/5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Phase Navigation */}
      <PhaseNavigation
        activePhase={activePhase}
        activeTab={activeTab}
        onPhaseChange={handlePhaseChange}
        onTabChange={handleTabChange}
        brandCompleteness={brandCompleteness}
        hasChecked={phaseProgress.hasCompletedFirstCheck}
        hasGenerated={phaseProgress.hasCompletedFirstGeneration}
        userName={user?.name || undefined}
        userAvatar={user?.avatar}
        brandName={brandDNA?.name || undefined}
        onAvatarClick={() => setShowBrandMenu(!showBrandMenu)}
      />

      {/* Brand Switcher Popover (triggered from nav avatar) */}
      {showBrandMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowBrandMenu(false)} />
          <div
            className="fixed top-[60px] right-6 z-50 w-56 animate-fade-in"
            style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: 'var(--shadow-modal)', border: '1px solid var(--border)' }}
          >
            {user && (
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name || user.xUsername}</p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>@{user.xUsername}</p>
              </div>
            )}
            <div className="p-1.5 max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  style={{ background: brand.id === currentBrandId ? 'rgba(10,132,255,0.1)' : 'transparent' }}
                  onClick={() => { switchBrand(brand.id); setShowBrandMenu(false); }}
                >
                  <span style={{ fontSize: 13, color: brand.id === currentBrandId ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {brand.name || 'Unnamed Brand'}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-1.5" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { createBrand(); setShowBrandMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Brand
              </button>
            </div>
          </div>
        </>
      )}

      {/* Changelog Modal */}
      {phaseProgress.hasCompletedOnboarding && <ChangelogModal />}

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* ======================= HOME DASHBOARD ======================= */}

        {activeTab === 'home' && (
          <div className="animate-fade-in">
            <DashboardHome onNavigatePhase={handlePhaseChange} />
          </div>
        )}

        {/* ======================= DEFINE PHASE ======================= */}
        
        {/* Brand DNA Tab */}
        {activeTab === 'brand' && (
          <div className="animate-fade-in">
            <section className="pb-8">
              <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                Define
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
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
            <section className="max-w-3xl mx-auto">
              <SafeZones />
            </section>
          </div>
        )}

        {/* Voice Print Tab */}
        {activeTab === 'voiceprint' && (
          <div className="animate-fade-in">
            <section className="max-w-3xl mx-auto">
              <VoiceFingerprint />
            </section>
          </div>
        )}

        {/* Design Intents Tab */}
        {activeTab === 'intents' && (
          <div className="animate-fade-in">
            <section className="max-w-3xl mx-auto">
              <DesignIntentBlocks />
            </section>
          </div>
        )}

        {/* ======================= CHECK PHASE ======================= */}

        {/* Check Tab */}
        {activeTab === 'check' && (
          <div className="animate-fade-in">
            <section className="pb-8">
              <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                Check
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
                Real-time brand alignment analysis.
              </p>
            </section>

            <section className="max-w-2xl mx-auto">
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

              {/* Voice Print indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <VoiceFingerprintMini
                  fingerprint={currentFingerprint}
                  onClick={() => { handlePhaseChange('define'); setActiveTab('voiceprint'); }}
                />
                {currentFingerprint && (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    Authenticity scoring enabled
                  </span>
                )}
              </div>

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
                  <div className="flex justify-center gap-12 mb-12">
                    <div className="text-center">
                      <ScoreRing score={checkResult.score} />
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>Brand Alignment</div>
                    </div>
                    {authenticityScore && (
                      <div className="text-center">
                        <ScoreRing score={authenticityScore.overall} />
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                          Authenticity
                          <span
                            style={{
                              display: 'inline-block',
                              marginLeft: 6,
                              padding: '1px 6px',
                              fontSize: 10,
                              borderRadius: 8,
                              background:
                                authenticityScore.verdict === 'authentic' || authenticityScore.verdict === 'mostly_authentic'
                                  ? 'rgba(52, 199, 89, 0.15)'
                                  : authenticityScore.verdict === 'needs_work'
                                    ? 'rgba(255, 159, 10, 0.15)'
                                    : 'rgba(255, 69, 58, 0.15)',
                              color:
                                authenticityScore.verdict === 'authentic' || authenticityScore.verdict === 'mostly_authentic'
                                  ? '#34C759'
                                  : authenticityScore.verdict === 'needs_work'
                                    ? '#FF9F0A'
                                    : '#FF453A',
                            }}
                          >
                            {authenticityScore.verdict.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Authenticity Flags */}
                  {authenticityScore && authenticityScore.flags.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs uppercase tracking-widest text-muted">Authenticity Flags</h4>
                        <button
                          onClick={async () => {
                            if (!currentFingerprint || !authenticityScore) return;
                            setIsRewritingFlags(true);
                            try {
                              const res = await fetch('/api/voice-fingerprint/rewrite', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  content: contentToCheck,
                                  fingerprint: currentFingerprint,
                                  flags: authenticityScore.flags,
                                }),
                              });
                              if (res.ok) {
                                const { rewrittenContent, newScore } = await res.json();
                                setContentToCheck(rewrittenContent);
                                if (newScore) setAuthenticityScore(newScore);
                                toast.success('Flags fixed!', 'Content rewritten in your voice.');
                              }
                            } catch {
                              toast.error('Rewrite failed', 'Please try again.');
                            } finally {
                              setIsRewritingFlags(false);
                            }
                          }}
                          disabled={isRewritingFlags}
                          style={{
                            fontSize: 12,
                            padding: '4px 12px',
                            borderRadius: 16,
                            border: '1px solid var(--accent, #0A84FF)',
                            background: 'transparent',
                            color: 'var(--accent, #0A84FF)',
                            cursor: isRewritingFlags ? 'default' : 'pointer',
                            opacity: isRewritingFlags ? 0.5 : 1,
                          }}
                        >
                          {isRewritingFlags ? 'Rewriting...' : 'Rewrite All Flagged'}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {authenticityScore.flags.map((flag) => (
                          <div
                            key={flag.id}
                            style={{
                              padding: 12,
                              borderRadius: 10,
                              border: `1px solid ${
                                flag.severity === 'high'
                                  ? 'rgba(255, 69, 58, 0.3)'
                                  : flag.severity === 'medium'
                                    ? 'rgba(255, 159, 10, 0.3)'
                                    : 'var(--border)'
                              }`,
                              background:
                                flag.severity === 'high'
                                  ? 'rgba(255, 69, 58, 0.05)'
                                  : flag.severity === 'medium'
                                    ? 'rgba(255, 159, 10, 0.05)'
                                    : 'var(--surface)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 8,
                                  background:
                                    flag.severity === 'high'
                                      ? 'rgba(255, 69, 58, 0.15)'
                                      : flag.severity === 'medium'
                                        ? 'rgba(255, 159, 10, 0.15)'
                                        : 'var(--surface)',
                                  color:
                                    flag.severity === 'high'
                                      ? '#FF453A'
                                      : flag.severity === 'medium'
                                        ? '#FF9F0A'
                                        : 'var(--text-tertiary)',
                                }}
                              >
                                {flag.severity}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-quaternary)' }}>
                                {flag.dimension}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, fontStyle: 'italic' }}>
                              &ldquo;{flag.text}&rdquo;
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>{flag.reason}</p>
                            <div style={{ padding: '8px 10px', background: 'rgba(10, 132, 255, 0.06)', borderRadius: 8, fontSize: 12 }}>
                              <span style={{ color: 'var(--text-tertiary)' }}>Suggestion: </span>
                              <span style={{ color: 'var(--text-secondary)' }}>{flag.suggestion}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
            <section className="max-w-3xl mx-auto">
              <BrandCohesion />
            </section>
          </div>
        )}

        {/* Guardrails Tab */}
        {activeTab === 'guardrails' && (
          <div className="animate-fade-in">
            <section className="max-w-3xl mx-auto">
              <CreatorGuardrails />
            </section>
          </div>
        )}

        {/* Protect Tab */}
        {activeTab === 'protect' && (
          <div className="animate-fade-in">
            <section className="max-w-3xl mx-auto">
              <TasteProtection />
            </section>
          </div>
        )}

        {/* Taste Tab */}
        {activeTab === 'taste' && (
          <div className="animate-fade-in">
            <section className="max-w-3xl mx-auto">
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

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="animate-fade-in">
            <ContentCalendar />
          </div>
        )}

        {/* Platforms Tab */}
        {activeTab === 'platforms' && (
          <div className="animate-fade-in">
            <section className="pb-8">
              <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>Platforms</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Adapt content for each platform while preserving brand identity.</p>
            </section>
            <section className="max-w-3xl mx-auto">
              <PlatformAdapter />
            </section>
          </div>
        )}

        {/* Context Tab */}
        {activeTab === 'context' && (
          <div className="animate-fade-in">
            <section className="pb-8">
              <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>Context Tone</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Adapt your brand voice for launches, apologies, crises, and more.</p>
            </section>
            <section className="max-w-3xl mx-auto">
              <ContextTone />
            </section>
          </div>
        )}

        {/* Visual Tab */}
        {activeTab === 'visual' && (
          <div className="animate-fade-in">
            <VisualConcepts />
          </div>
        )}

        {/* ======================= BRAND KIT PHASE ======================= */}

        {/* AI Studio Tab */}
        {activeTab === 'kit-ai-studio' && (
          <div className="animate-fade-in">
            <section className="pb-8">
              <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>AI Studio</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Generate brand assets with AI.</p>
            </section>
            <AIStudio />
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
            <section className="max-w-3xl mx-auto">
              {currentBrandId && <LogoSection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* Brand Kit Colors Tab */}
        {activeTab === 'kit-colors' && (
          <div className="animate-fade-in">
            <section className="max-w-3xl mx-auto">
              {currentBrandId && <ColorSection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* Brand Kit Typography Tab */}
        {activeTab === 'kit-typography' && (
          <div className="animate-fade-in">
            <section className="max-w-4xl mx-auto">
              {currentBrandId && <TypographySection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* Brand Kit Imagery Tab */}
        {activeTab === 'kit-imagery' && (
          <div className="animate-fade-in">
            <section className="max-w-4xl mx-auto">
              {currentBrandId && <ImagerySection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* Brand Kit Icons Tab */}
        {activeTab === 'kit-icons' && (
          <div className="animate-fade-in">
            <section className="max-w-4xl mx-auto">
              {currentBrandId && <IconSection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* Brand Kit Templates Tab */}
        {activeTab === 'kit-templates' && (
          <div className="animate-fade-in">
            <section className="max-w-4xl mx-auto">
              {currentBrandId && <TemplateSection brandId={currentBrandId} />}
            </section>
          </div>
        )}

        {/* ======================= SCALE PHASE ======================= */}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <section className="pb-8">
              <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>Analytics</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Track your brand consistency over time.</p>
            </section>

            <section className="max-w-4xl mx-auto">
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
            <section className="pb-8">
              <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>History</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Review your previous checks and generations.</p>
            </section>

            <section className="max-w-2xl mx-auto">
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
            <section className="pb-8">
              <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>Export</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Download your brand guidelines.</p>
            </section>

            <section className="max-w-2xl mx-auto">
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
            <section className="pb-8">
              <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>Compare</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Analyze how your brand voice differs from competitors.</p>
            </section>

            <section className="max-w-2xl mx-auto">
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
            <section className="pb-8">
              <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>Brand Memory</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Track what worked and what failed. Build institutional memory.</p>
            </section>
            <section className="max-w-3xl mx-auto">
              <BrandMemory />
            </section>
          </div>
        )}

        <footer className="py-10 mt-12 print:hidden" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-center">
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-quaternary)' }}>
              Brand<span style={{ color: 'var(--accent)' }}>OS</span>
            </span>
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

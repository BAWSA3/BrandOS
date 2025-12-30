'use client';

import { useMemo } from 'react';
import BrandOSLogo from './BrandOSLogo';

export type Phase = 'define' | 'check' | 'generate' | 'scale';
export type SubTab =
  // Define phase
  | 'brand' | 'safezones' | 'intents'
  // Check phase
  | 'check' | 'cohesion' | 'guardrails' | 'protect' | 'taste'
  // Generate phase (includes Brand Kit for beta)
  | 'generate' | 'platforms' | 'context' | 'visual'
  | 'kit-canvas' | 'kit-logos' | 'kit-colors' | 'kit-typography' | 'kit-imagery' | 'kit-icons' | 'kit-templates' | 'kit-ai-studio'
  // Scale phase
  | 'dashboard' | 'history' | 'export' | 'competitors' | 'memory';

interface PhaseConfig {
  id: Phase;
  label: string;
  number: string;
  description: string;
  tabs: { id: SubTab; label: string; description?: string }[];
  unlockCondition: (brandCompleteness: number, hasChecked: boolean, hasGenerated: boolean) => boolean;
}

const phases: PhaseConfig[] = [
  {
    id: 'define',
    label: 'Define',
    number: '01',
    description: 'Set up your brand DNA',
    tabs: [
      { id: 'brand', label: 'Brand DNA', description: 'Name, colors, tone, keywords' },
      { id: 'safezones', label: 'Safe Zones', description: 'Lock/unlock elements' },
      { id: 'intents', label: 'Design Intents', description: 'Natural language rules' },
    ],
    unlockCondition: () => true,
  },
  {
    id: 'check',
    label: 'Check',
    number: '02',
    description: 'Analyze content alignment',
    tabs: [
      { id: 'check', label: 'Content Check', description: 'Score your content' },
      { id: 'cohesion', label: 'Cohesion', description: 'Analyze consistency' },
      { id: 'guardrails', label: 'Guardrails', description: 'Creator review' },
      { id: 'protect', label: 'Protect', description: 'Prevent over-design' },
      { id: 'taste', label: 'Taste', description: 'Translate feedback' },
    ],
    unlockCondition: (completeness) => completeness >= 30,
  },
  {
    id: 'generate',
    label: 'Generate',
    number: '03',
    description: 'Create on-brand content',
    tabs: [
      { id: 'generate', label: 'Generate', description: 'AI content creation' },
      { id: 'platforms', label: 'Platforms', description: 'Adapt for channels' },
      { id: 'context', label: 'Context', description: 'Situational tone' },
      { id: 'visual', label: 'Visual', description: 'Design inspiration' },
      { id: 'kit-ai-studio', label: 'AI Studio', description: 'Generate with Gemini' },
      { id: 'kit-canvas', label: 'Canvas', description: 'Visual brand layout' },
      { id: 'kit-logos', label: 'Logos', description: 'Logo variants & rules' },
      { id: 'kit-colors', label: 'Colors', description: 'Extended palette' },
      { id: 'kit-typography', label: 'Typography', description: 'Fonts & scales' },
      { id: 'kit-imagery', label: 'Imagery', description: 'Photo & mood' },
      { id: 'kit-icons', label: 'Icons', description: 'Icon library' },
      { id: 'kit-templates', label: 'Templates', description: 'Content templates' },
    ],
    unlockCondition: (completeness, hasChecked) => completeness >= 30 && hasChecked,
  },
  {
    id: 'scale',
    label: 'Scale',
    number: '04',
    description: 'Track and export',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', description: 'Brand analytics' },
      { id: 'history', label: 'History', description: 'Past activity' },
      { id: 'export', label: 'Export', description: 'Download & share' },
      { id: 'competitors', label: 'Compare', description: 'Competitor analysis' },
      { id: 'memory', label: 'Memory', description: 'Brand learnings' },
    ],
    unlockCondition: () => true,
  },
];

interface PhaseNavigationProps {
  activePhase: Phase;
  activeTab: SubTab;
  onPhaseChange: (phase: Phase) => void;
  onTabChange: (tab: SubTab) => void;
  brandCompleteness: number;
  hasChecked: boolean;
  hasGenerated: boolean;
}

export default function PhaseNavigation({
  activePhase,
  activeTab,
  onPhaseChange,
  onTabChange,
  brandCompleteness,
  hasChecked,
  hasGenerated,
}: PhaseNavigationProps) {
  const currentPhaseIndex = phases.findIndex(p => p.id === activePhase);

  const phaseStates = useMemo(() => {
    return phases.map((phase, index) => {
      const isUnlocked = phase.unlockCondition(brandCompleteness, hasChecked, hasGenerated);
      const isActive = phase.id === activePhase;
      const isComplete = index < currentPhaseIndex || 
        (phase.id === 'define' && brandCompleteness >= 70) ||
        (phase.id === 'check' && hasChecked) ||
        (phase.id === 'generate' && hasGenerated);
      
      return { ...phase, isUnlocked, isActive, isComplete };
    });
  }, [activePhase, brandCompleteness, hasChecked, hasGenerated, currentPhaseIndex]);

  return (
    <div className="border-b border-[rgba(255,255,255,0.1)] bg-[rgba(10,10,10,0.8)] backdrop-blur-xl sticky top-0 z-50">
      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <BrandOSLogo size="sm" />

          {/* Phase Pills - Numbered Navigation */}
          <nav className="flex items-center gap-2">
            {phaseStates.map((phase, index) => (
              <div key={phase.id} className="flex items-center">
                {/* Phase Pill */}
                <button
                  onClick={() => phase.isUnlocked && onPhaseChange(phase.id)}
                  disabled={!phase.isUnlocked}
                  className={`
                    relative flex items-center gap-3 px-4 py-2.5 rounded-full
                    transition-all duration-200 ease-out
                    ${phase.isActive 
                      ? 'bg-[#0047FF] text-white shadow-[0_0_20px_rgba(0,71,255,0.4)]' 
                      : phase.isUnlocked
                        ? 'bg-[rgba(255,255,255,0.05)] text-white/70 border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
                        : 'bg-transparent text-white/30 cursor-not-allowed'
                    }
                  `}
                >
                  {/* Number */}
                  <span className={`
                    font-mono text-[10px] tracking-[0.1em]
                    ${phase.isActive ? 'text-white/80' : 'text-white/40'}
                  `}>
                    {phase.number}
                  </span>

                  {/* Label */}
                  <span className="text-sm font-medium hidden sm:inline">
                    {phase.label}
                  </span>

                  {/* Completion indicator */}
                  {phase.isComplete && !phase.isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-[#0a0a0a]" />
                  )}
                  
                  {/* Lock icon */}
                  {!phase.isUnlocked && (
                    <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </button>
                
                {/* Connector Arrow */}
                {index < phases.length - 1 && (
                  <div className="mx-2 hidden sm:flex items-center">
                    <svg 
                      className={`w-4 h-4 ${index < currentPhaseIndex ? 'text-white/40' : 'text-white/20'}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Brand Completeness Mini Ring */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                />
                {/* Progress circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#0047FF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${brandCompleteness} 100`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white/70">
                {brandCompleteness}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-tabs for active phase */}
        <div className="flex items-center gap-1 pb-3 overflow-x-auto nav-scroll">
          {phaseStates.find(p => p.id === activePhase)?.tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-[rgba(255,255,255,0.1)] text-white font-medium'
                  : 'text-white/50 hover:text-white/80 hover:bg-[rgba(255,255,255,0.05)]'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
          
          {/* Hints for locked phases */}
          {activePhase === 'define' && brandCompleteness < 30 && (
            <span className="ml-auto text-[10px] text-white/40 flex items-center gap-1.5 font-mono tracking-wide">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              COMPLETE 30% TO UNLOCK CHECK
            </span>
          )}
          
          {activePhase === 'check' && !hasChecked && (
            <span className="ml-auto text-[10px] text-white/40 flex items-center gap-1.5 font-mono tracking-wide">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              RUN FIRST CHECK TO UNLOCK GENERATE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to get phase from tab
export function getPhaseFromTab(tab: SubTab): Phase {
  const definesTabs: SubTab[] = ['brand', 'safezones', 'intents'];
  const checkTabs: SubTab[] = ['check', 'cohesion', 'guardrails', 'protect', 'taste'];
  const generateTabs: SubTab[] = ['generate', 'platforms', 'context', 'visual', 'kit-ai-studio', 'kit-canvas', 'kit-logos', 'kit-colors', 'kit-typography', 'kit-imagery', 'kit-icons', 'kit-templates'];

  if (definesTabs.includes(tab)) return 'define';
  if (checkTabs.includes(tab)) return 'check';
  if (generateTabs.includes(tab)) return 'generate';
  return 'scale';
}

// Helper to get default tab for phase
export function getDefaultTabForPhase(phase: Phase): SubTab {
  switch (phase) {
    case 'define': return 'brand';
    case 'check': return 'check';
    case 'generate': return 'generate';
    case 'scale': return 'dashboard';
  }
}

export { phases };

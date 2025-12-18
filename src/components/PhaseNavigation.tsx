'use client';

import { useMemo } from 'react';
import BrandOSLogo from './BrandOSLogo';

export type Phase = 'define' | 'check' | 'generate' | 'brandkit' | 'scale';
export type SubTab = 
  // Define phase
  | 'brand' | 'safezones' | 'intents'
  // Check phase  
  | 'check' | 'cohesion' | 'guardrails' | 'protect' | 'taste'
  // Generate phase
  | 'generate' | 'platforms' | 'context' | 'visual'
  // Brand Kit phase
  | 'kit-canvas' | 'kit-logos' | 'kit-colors' | 'kit-typography' | 'kit-imagery' | 'kit-icons' | 'kit-templates'
  // Scale phase
  | 'dashboard' | 'history' | 'export' | 'competitors' | 'memory';

interface PhaseConfig {
  id: Phase;
  label: string;
  description: string;
  icon: React.ReactNode;
  tabs: { id: SubTab; label: string; description?: string }[];
  unlockCondition: (brandCompleteness: number, hasChecked: boolean, hasGenerated: boolean) => boolean;
}

const phases: PhaseConfig[] = [
  {
    id: 'define',
    label: 'Define',
    description: 'Set up your brand DNA',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    tabs: [
      { id: 'brand', label: 'Brand DNA', description: 'Name, colors, tone, keywords' },
      { id: 'safezones', label: 'Safe Zones', description: 'Lock/unlock elements' },
      { id: 'intents', label: 'Design Intents', description: 'Natural language rules' },
    ],
    unlockCondition: () => true, // Always unlocked
  },
  {
    id: 'check',
    label: 'Check',
    description: 'Analyze content alignment',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
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
    description: 'Create on-brand content',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    tabs: [
      { id: 'generate', label: 'Generate', description: 'AI content creation' },
      { id: 'platforms', label: 'Platforms', description: 'Adapt for channels' },
      { id: 'context', label: 'Context', description: 'Situational tone' },
      { id: 'visual', label: 'Visual', description: 'Design inspiration' },
    ],
    unlockCondition: (completeness, hasChecked) => completeness >= 30 && hasChecked,
  },
  {
    id: 'brandkit',
    label: 'Brand Kit',
    description: 'Visual brand assets',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    tabs: [
      { id: 'kit-canvas', label: 'Canvas', description: 'Visual brand layout' },
      { id: 'kit-logos', label: 'Logos', description: 'Logo variants & rules' },
      { id: 'kit-colors', label: 'Colors', description: 'Extended palette' },
      { id: 'kit-typography', label: 'Typography', description: 'Fonts & scales' },
      { id: 'kit-imagery', label: 'Imagery', description: 'Photo & mood' },
      { id: 'kit-icons', label: 'Icons', description: 'Icon library' },
      { id: 'kit-templates', label: 'Templates', description: 'Content templates' },
    ],
    unlockCondition: (completeness, _hasChecked, hasGenerated) => completeness >= 50 || hasGenerated,
  },
  {
    id: 'scale',
    label: 'Scale',
    description: 'Track and export',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    tabs: [
      { id: 'dashboard', label: 'Dashboard', description: 'Brand analytics' },
      { id: 'history', label: 'History', description: 'Past activity' },
      { id: 'export', label: 'Export', description: 'Download & share' },
      { id: 'competitors', label: 'Compare', description: 'Competitor analysis' },
      { id: 'memory', label: 'Memory', description: 'Brand learnings' },
    ],
    unlockCondition: () => true, // Always available
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
    <div className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      {/* Phase Stepper */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <BrandOSLogo size="sm" />

          {/* Phase Steps */}
          <nav className="flex items-center gap-1">
            {phaseStates.map((phase, index) => (
              <div key={phase.id} className="flex items-center">
                <button
                  onClick={() => phase.isUnlocked && onPhaseChange(phase.id)}
                  disabled={!phase.isUnlocked}
                  className={`
                    relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
                    transition-all duration-200
                    ${phase.isActive 
                      ? 'bg-foreground text-background' 
                      : phase.isUnlocked
                        ? 'text-muted hover:text-foreground hover:bg-surface'
                        : 'text-muted/40 cursor-not-allowed'
                    }
                  `}
                >
                  {/* Completion indicator */}
                  {phase.isComplete && !phase.isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  
                  {/* Lock icon for locked phases */}
                  {!phase.isUnlocked && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  
                  <span className="hidden sm:inline">{phase.icon}</span>
                  <span className="hidden md:inline">{phase.label}</span>
                  <span className="md:hidden">{phase.label.slice(0, 3)}</span>
                </button>
                
                {/* Connector line */}
                {index < phases.length - 1 && (
                  <div className={`w-4 sm:w-6 h-px mx-0.5 transition-colors duration-200 ${
                    index < currentPhaseIndex ? 'bg-foreground' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </nav>

          {/* Brand Completeness Mini */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-16 sm:w-24 h-1.5 bg-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-foreground rounded-full transition-all duration-500"
                  style={{ width: `${brandCompleteness}%` }}
                />
              </div>
              <span className="text-xs text-muted">{brandCompleteness}%</span>
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
                px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-surface text-foreground font-medium'
                  : 'text-muted hover:text-foreground hover:bg-surface/50'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
          
          {/* Hints for locked phases */}
          {activePhase === 'define' && brandCompleteness < 30 && (
            <span className="ml-auto text-xs text-muted flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Complete 30% to unlock Check
            </span>
          )}
          
          {activePhase === 'check' && !hasChecked && (
            <span className="ml-auto text-xs text-muted flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run your first check to unlock Generate
            </span>
          )}

          {activePhase === 'generate' && !hasGenerated && (
            <span className="ml-auto text-xs text-muted flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generate content to unlock Brand Kit
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
  const generateTabs: SubTab[] = ['generate', 'platforms', 'context', 'visual'];
  const brandKitTabs: SubTab[] = ['kit-canvas', 'kit-logos', 'kit-colors', 'kit-typography', 'kit-imagery', 'kit-icons', 'kit-templates'];
  
  if (definesTabs.includes(tab)) return 'define';
  if (checkTabs.includes(tab)) return 'check';
  if (generateTabs.includes(tab)) return 'generate';
  if (brandKitTabs.includes(tab)) return 'brandkit';
  return 'scale';
}

// Helper to get default tab for phase
export function getDefaultTabForPhase(phase: Phase): SubTab {
  switch (phase) {
    case 'define': return 'brand';
    case 'check': return 'check';
    case 'generate': return 'generate';
    case 'brandkit': return 'kit-canvas';
    case 'scale': return 'dashboard';
  }
}

export { phases };

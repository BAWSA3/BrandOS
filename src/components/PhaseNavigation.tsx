'use client';

import { useMemo } from 'react';
import BrandOSLogo from './BrandOSLogo';

export type Phase = 'home' | 'define' | 'check' | 'generate' | 'scale';
export type SubTab =
  // Home phase
  | 'home'
  // Define phase
  | 'brand' | 'safezones' | 'intents' | 'voiceprint'
  // Check phase
  | 'check' | 'cohesion' | 'guardrails' | 'protect' | 'taste'
  // Generate phase (consolidated)
  | 'generate' | 'platforms' | 'context' | 'visual'
  | 'kit-canvas' | 'kit-logos' | 'kit-colors' | 'kit-typography' | 'kit-imagery' | 'kit-icons' | 'kit-templates' | 'kit-ai-studio'
  // Scale phase
  | 'dashboard' | 'history' | 'export' | 'competitors' | 'memory';

interface PhaseConfig {
  id: Phase;
  label: string;
  description: string;
  tabs: { id: SubTab; label: string }[];
  unlockCondition: (brandCompleteness: number, hasChecked: boolean, hasGenerated: boolean) => boolean;
}

const phases: PhaseConfig[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Your command center',
    tabs: [{ id: 'home', label: 'Dashboard' }],
    unlockCondition: () => true,
  },
  {
    id: 'define',
    label: 'Define',
    description: 'Build your system',
    tabs: [
      { id: 'brand', label: 'Brand DNA' },
      { id: 'voiceprint', label: 'Voice Print' },
      { id: 'safezones', label: 'Safe Zones' },
      { id: 'intents', label: 'Design Intents' },
    ],
    unlockCondition: () => true,
  },
  {
    id: 'check',
    label: 'Check',
    description: 'Score against your DNA',
    tabs: [
      { id: 'check', label: 'Content Check' },
      { id: 'cohesion', label: 'Cohesion' },
      { id: 'guardrails', label: 'Guardrails' },
    ],
    unlockCondition: (completeness) => completeness >= 30,
  },
  {
    id: 'generate',
    label: 'Generate',
    description: 'Create from your DNA',
    tabs: [
      { id: 'generate', label: 'Create' },
      { id: 'kit-canvas', label: 'Brand Kit' },
      { id: 'kit-ai-studio', label: 'AI Studio' },
      { id: 'platforms', label: 'Platforms' },
    ],
    unlockCondition: (completeness, hasChecked) => completeness >= 30 && hasChecked,
  },
  {
    id: 'scale',
    label: 'Scale',
    description: 'Let your system run',
    tabs: [
      { id: 'dashboard', label: 'Analytics' },
      { id: 'history', label: 'History' },
      { id: 'export', label: 'Export' },
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
  userName?: string;
  userAvatar?: string | null;
  brandName?: string;
  onAvatarClick?: () => void;
}

export default function PhaseNavigation({
  activePhase,
  activeTab,
  onPhaseChange,
  onTabChange,
  brandCompleteness,
  hasChecked,
  hasGenerated,
  userName,
  userAvatar,
  brandName,
  onAvatarClick,
}: PhaseNavigationProps) {
  const phaseStates = useMemo(() => {
    return phases.map((phase) => {
      const isUnlocked = phase.unlockCondition(brandCompleteness, hasChecked, hasGenerated);
      const isActive = phase.id === activePhase;
      return { ...phase, isUnlocked, isActive };
    });
  }, [activePhase, brandCompleteness, hasChecked, hasGenerated]);

  const activePhaseConfig = phaseStates.find(p => p.id === activePhase);
  const showSubTabs = activePhaseConfig && activePhaseConfig.tabs.length > 1;

  return (
    <div className="sticky top-0 z-50">
      {/* Main navigation bar */}
      <nav
        style={{
          height: 56,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="shrink-0">
            <BrandOSLogo size="sm" variant="landing" />
          </div>

          {/* Center: Phase tabs */}
          <div className="flex items-center gap-1">
            {phaseStates.map((phase) => (
              <button
                key={phase.id}
                onClick={() => phase.isUnlocked && onPhaseChange(phase.id)}
                disabled={!phase.isUnlocked}
                style={{
                  padding: '6px 16px',
                  fontSize: 14,
                  fontWeight: phase.isActive ? 600 : 400,
                  color: phase.isActive
                    ? 'var(--text-primary)'
                    : phase.isUnlocked
                      ? 'var(--text-secondary)'
                      : 'var(--text-quaternary)',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: phase.isUnlocked ? 'pointer' : 'default',
                  position: 'relative',
                  transition: 'color 200ms ease',
                }}
                onMouseEnter={(e) => {
                  if (phase.isUnlocked && !phase.isActive) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (phase.isUnlocked && !phase.isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span className="flex items-center gap-1.5">
                  {phase.label}
                  {!phase.isUnlocked && (
                    <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </span>
                {/* Active indicator line */}
                {phase.isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: 16,
                      right: 16,
                      height: 2,
                      background: '#0A84FF',
                      borderRadius: 1,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Right: Avatar / Brand */}
          <div className="flex items-center gap-3 shrink-0">
            {brandName && (
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                {brandName}
              </span>
            )}
            <button
              onClick={onAvatarClick}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: userAvatar ? 'transparent' : 'var(--surface-tertiary)',
                border: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              {userAvatar ? (
                <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Sub-tabs (only when phase has multiple tabs) */}
      {showSubTabs && (
        <div
          style={{
            height: 40,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center gap-1">
            {activePhaseConfig?.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  padding: '4px 12px',
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 500 : 400,
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  background: activeTab === tab.id ? 'var(--surface-hover)' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get phase from tab
export function getPhaseFromTab(tab: SubTab): Phase {
  if (tab === 'home') return 'home';
  const definesTabs: SubTab[] = ['brand', 'voiceprint', 'safezones', 'intents'];
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
    case 'home': return 'home';
    case 'define': return 'brand';
    case 'check': return 'check';
    case 'generate': return 'generate';
    case 'scale': return 'dashboard';
  }
}

export { phases };

'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import BrandOSLogo from './BrandOSLogo';
import { WorldPath } from './world';

export type Phase = 'home' | 'define' | 'check' | 'generate' | 'scale';
export type SubTab =
  // Home phase
  | 'home'
  // Define phase
  | 'brand' | 'safezones' | 'intents' | 'voiceprint'
  // Check phase
  | 'check' | 'cohesion' | 'guardrails' | 'protect' | 'taste'
  // Generate phase (consolidated)
  | 'generate' | 'calendar' | 'platforms' | 'context' | 'visual'
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
      { id: 'calendar', label: 'Calendar' },
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

const PHASE_SEASON_COLORS: Record<string, string> = {
  home: '#E8A838',
  define: '#E8A838',
  check: '#00FF88',
  generate: '#FF6B35',
  scale: '#00D4FF',
};

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
  const [worldExpanded, setWorldExpanded] = useState(false);

  const phaseStates = useMemo(() => {
    return phases.map((phase) => {
      const isUnlocked = phase.unlockCondition(brandCompleteness, hasChecked, hasGenerated);
      const isActive = phase.id === activePhase;
      return { ...phase, isUnlocked, isActive };
    });
  }, [activePhase, brandCompleteness, hasChecked, hasGenerated]);

  const activePhaseConfig = phaseStates.find(p => p.id === activePhase);
  const showSubTabs = activePhaseConfig && activePhaseConfig.tabs.length > 1;
  const accentColor = PHASE_SEASON_COLORS[activePhase] || '#E8A838';

  return (
    <div className="sticky top-0 z-50">
      {/* Top bar with logo, mini phase indicators, and avatar */}
      <nav
        style={{
          height: 48,
          background: '#0A0A12',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="shrink-0 flex items-center gap-3">
            <BrandOSLogo size="sm" variant="landing" />
          </div>

          {/* Center: Compact phase pills */}
          <div className="flex items-center gap-1">
            {/* Home button */}
            <button
              onClick={() => onPhaseChange('home')}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: "'VCR OSD Mono', monospace",
                letterSpacing: '0.08em',
                fontWeight: activePhase === 'home' ? 600 : 400,
                color: activePhase === 'home' ? '#E8A838' : 'rgba(255,255,255,0.35)',
                background: activePhase === 'home' ? 'rgba(232,168,56,0.1)' : 'transparent',
                border: activePhase === 'home' ? '1px solid rgba(232,168,56,0.2)' : '1px solid transparent',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              ◆ HOME
            </button>

            <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />

            {/* Phase buttons */}
            {phaseStates.filter(p => p.id !== 'home').map((phase) => (
              <button
                key={phase.id}
                onClick={() => phase.isUnlocked && onPhaseChange(phase.id)}
                disabled={!phase.isUnlocked}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontFamily: "'VCR OSD Mono', monospace",
                  letterSpacing: '0.08em',
                  fontWeight: phase.isActive ? 600 : 400,
                  color: phase.isActive
                    ? PHASE_SEASON_COLORS[phase.id]
                    : phase.isUnlocked
                      ? 'rgba(255,255,255,0.35)'
                      : 'rgba(255,255,255,0.12)',
                  background: phase.isActive ? `${PHASE_SEASON_COLORS[phase.id]}10` : 'transparent',
                  border: phase.isActive ? `1px solid ${PHASE_SEASON_COLORS[phase.id]}25` : '1px solid transparent',
                  borderRadius: 4,
                  cursor: phase.isUnlocked ? 'pointer' : 'default',
                  transition: 'all 200ms ease',
                  position: 'relative',
                }}
              >
                {!phase.isUnlocked && (
                  <span style={{ marginRight: 3, opacity: 0.5 }}>⬡</span>
                )}
                {phase.label.toUpperCase()}
              </button>
            ))}

            <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />

            {/* World toggle */}
            <button
              onClick={() => setWorldExpanded(prev => !prev)}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                fontFamily: "'VCR OSD Mono', monospace",
                color: worldExpanded ? accentColor : 'rgba(255,255,255,0.25)',
                background: worldExpanded ? `${accentColor}10` : 'transparent',
                border: worldExpanded ? `1px solid ${accentColor}25` : '1px solid transparent',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              title="Toggle world view"
            >
              {worldExpanded ? '▼' : '▲'} MAP
            </button>
          </div>

          {/* Right: Avatar / Brand */}
          <div className="flex items-center gap-3 shrink-0">
            {brandName && (
              <span style={{ fontSize: 11, fontFamily: "'VCR OSD Mono', monospace", color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
                {brandName}
              </span>
            )}
            <button
              onClick={onAvatarClick}
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: userAvatar ? 'transparent' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Expandable World Path mini-map */}
      <AnimatePresence>
        {worldExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 160, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ overflow: 'hidden' }}
          >
            <WorldPath
              activePhase={activePhase}
              brandCompleteness={brandCompleteness}
              hasChecked={hasChecked}
              hasGenerated={hasGenerated}
              onPhaseChange={(phase) => {
                onPhaseChange(phase);
              }}
              height={160}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-tabs */}
      {showSubTabs && (
        <div
          style={{
            height: 36,
            background: '#0A0A12',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center gap-1">
            {activePhaseConfig?.tabs.map((tab) => {
              const isActiveTab = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    fontFamily: "'VCR OSD Mono', monospace",
                    letterSpacing: '0.05em',
                    fontWeight: isActiveTab ? 500 : 400,
                    color: isActiveTab ? accentColor : 'rgba(255,255,255,0.3)',
                    background: isActiveTab ? `${accentColor}08` : 'transparent',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
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
  const generateTabs: SubTab[] = ['generate', 'calendar', 'platforms', 'context', 'visual', 'kit-ai-studio', 'kit-canvas', 'kit-logos', 'kit-colors', 'kit-typography', 'kit-imagery', 'kit-icons', 'kit-templates'];

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

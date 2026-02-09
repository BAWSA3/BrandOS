'use client';

import type { Phase } from '@/components/PhaseNavigation';

interface PhaseQuickAccessProps {
  brandCompleteness: number;
  hasChecked: boolean;
  hasGenerated: boolean;
  onNavigate: (phase: Phase) => void;
}

const phaseItems: { id: Phase; label: string; description: string }[] = [
  { id: 'define', label: 'Define', description: 'Build your brand system' },
  { id: 'check', label: 'Check', description: 'Score against your DNA' },
  { id: 'generate', label: 'Generate', description: 'Create from your DNA' },
  { id: 'scale', label: 'Scale', description: 'Let your system run' },
];

export default function PhaseQuickAccess({ brandCompleteness, hasChecked, hasGenerated, onNavigate }: PhaseQuickAccessProps) {
  const isUnlocked = (id: Phase): boolean => {
    if (id === 'define') return true;
    if (id === 'check') return brandCompleteness >= 30;
    if (id === 'generate') return brandCompleteness >= 30 && hasChecked;
    if (id === 'scale') return true;
    return true;
  };

  return (
    <div style={{ background: '#1C1C1E', borderRadius: 16, padding: 24 }} className="h-full">
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#86868B', marginBottom: 16, letterSpacing: '-0.01em' }}>
        Quick Access
      </h3>
      <div className="space-y-2">
        {phaseItems.map((item) => {
          const unlocked = isUnlocked(item.id);
          return (
            <button
              key={item.id}
              onClick={() => unlocked && onNavigate(item.id)}
              disabled={!unlocked}
              className="w-full text-left flex items-center justify-between py-3 px-3 rounded-xl transition-colors"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: unlocked ? 'pointer' : 'default',
                opacity: unlocked ? 1 : 0.35,
              }}
              onMouseEnter={(e) => { if (unlocked) e.currentTarget.style.background = '#2C2C2E'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#F5F5F7', marginBottom: 2 }}>{item.label}</p>
                <p style={{ fontSize: 12, color: '#6E6E73' }}>{item.description}</p>
              </div>
              <svg className="w-4 h-4 shrink-0" style={{ color: '#48484A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

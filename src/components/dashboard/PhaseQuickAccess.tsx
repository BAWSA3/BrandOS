'use client';

import type { Phase } from '@/components/PhaseNavigation';

interface PhaseQuickAccessProps {
  brandCompleteness: number;
  hasChecked: boolean;
  hasGenerated: boolean;
  onNavigate: (phase: Phase) => void;
}

const phaseItems: {
  id: Phase;
  num: string;
  label: string;
  description: string;
  icon: JSX.Element;
}[] = [
  {
    id: 'define',
    num: '01',
    label: 'Define',
    description: 'Build your brand system',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    id: 'check',
    num: '02',
    label: 'Check',
    description: 'Score against your DNA',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'generate',
    num: '03',
    label: 'Generate',
    description: 'Create from your DNA',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    id: 'scale',
    num: '04',
    label: 'Scale',
    description: 'Let your system run',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
];

export default function PhaseQuickAccess({
  brandCompleteness,
  hasChecked,
  hasGenerated,
  onNavigate,
}: PhaseQuickAccessProps) {
  const getPhaseState = (id: Phase): { unlocked: boolean; progress: number } => {
    if (id === 'define') return { unlocked: true, progress: Math.min(brandCompleteness, 100) };
    if (id === 'check') return { unlocked: brandCompleteness >= 30, progress: hasChecked ? 100 : 0 };
    if (id === 'generate') return { unlocked: brandCompleteness >= 30 && hasChecked, progress: hasGenerated ? 100 : 0 };
    if (id === 'scale') return { unlocked: true, progress: 0 };
    return { unlocked: true, progress: 0 };
  };

  return (
    <div
      style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      className="h-full"
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: 16,
          letterSpacing: '-0.01em',
        }}
      >
        Quick Access
      </h3>
      <div className="space-y-2">
        {phaseItems.map((item) => {
          const { unlocked, progress } = getPhaseState(item.id);
          return (
            <button
              key={item.id}
              onClick={() => unlocked && onNavigate(item.id)}
              disabled={!unlocked}
              className="w-full text-left flex items-center gap-3 py-3 px-3 rounded-xl transition-all"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: unlocked ? 'pointer' : 'default',
                opacity: unlocked ? 1 : 0.35,
              }}
              onMouseEnter={(e) => {
                if (unlocked) e.currentTarget.style.background = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Phase number + icon */}
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: unlocked ? 'rgba(10,132,255,0.08)' : 'rgba(0,0,0,0.03)',
                  color: unlocked ? '#0A84FF' : 'var(--text-quaternary)',
                }}
              >
                {item.icon}
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text-tertiary)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {item.num}
                  </span>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.label}
                  </p>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                  {item.description}
                </p>

                {/* Progress indicator */}
                {unlocked && progress > 0 && (
                  <div
                    style={{
                      height: 2,
                      background: 'rgba(0,0,0,0.06)',
                      borderRadius: 1,
                      marginTop: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: '#0A84FF',
                        borderRadius: 1,
                        transition: 'width 0.5s ease-out',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Arrow / lock */}
              {unlocked ? (
                <svg
                  className="w-4 h-4 shrink-0"
                  style={{ color: '#48484A' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: '#48484A' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

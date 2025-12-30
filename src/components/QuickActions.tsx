'use client';

import { useState } from 'react';
import { Phase, SubTab } from './PhaseNavigation';

interface QuickActionsProps {
  onNavigate: (phase: Phase, tab: SubTab) => void;
  canCheck: boolean;
  canGenerate: boolean;
}

export default function QuickActions({ onNavigate, canCheck, canGenerate }: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      id: 'check',
      label: 'Quick Check',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      phase: 'check' as Phase,
      tab: 'check' as SubTab,
      enabled: canCheck,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'generate',
      label: 'Generate',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      phase: 'generate' as Phase,
      tab: 'generate' as SubTab,
      enabled: canGenerate,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'brand',
      label: 'Edit Brand',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
      phase: 'define' as Phase,
      tab: 'brand' as SubTab,
      enabled: true,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Action buttons */}
      <div className={`flex flex-col-reverse gap-2 transition-all duration-300 ${
        isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              if (action.enabled) {
                onNavigate(action.phase, action.tab);
                setIsExpanded(false);
              }
            }}
            disabled={!action.enabled}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-full text-white text-sm font-medium
              shadow-lg transition-all duration-200
              ${action.enabled 
                ? `${action.color} hover:scale-105 active:scale-95` 
                : 'bg-gray-400 cursor-not-allowed opacity-50'
              }
            `}
          >
            {action.icon}
            <span>{action.label}</span>
            {!action.enabled && (
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-14 h-14 rounded-full bg-foreground text-background
          shadow-xl hover:shadow-2xl transition-all duration-300
          flex items-center justify-center
          hover:scale-110 active:scale-95
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
        `}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Hint tooltip */}
      {!isExpanded && (
        <div className="absolute bottom-full mb-2 right-0 opacity-0 hover:opacity-100 transition-opacity">
          <div className="px-3 py-1.5 bg-foreground text-background text-xs rounded-lg whitespace-nowrap">
            Quick actions
          </div>
        </div>
      )}
    </div>
  );
}

// Keyboard shortcut handler component
export function KeyboardShortcuts({ 
  onCheck, 
  onGenerate, 
  onBrand,
  canCheck,
  canGenerate,
}: {
  onCheck: () => void;
  onGenerate: () => void;
  onBrand: () => void;
  canCheck: boolean;
  canGenerate: boolean;
}) {
  // This would be integrated with useEffect in the parent component
  // to handle Cmd+K or other keyboard shortcuts
  return null;
}


















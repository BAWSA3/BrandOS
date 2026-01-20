'use client';

import { useState, useEffect } from 'react';

interface BetaBadgeProps {
  variant?: 'badge' | 'banner';
  dismissible?: boolean;
  storageKey?: string;
}

export default function BetaBadge({ 
  variant = 'badge',
  dismissible = true,
  storageKey = 'brandos-beta-banner-dismissed'
}: BetaBadgeProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start true to prevent flash
  
  useEffect(() => {
    // Check if dismissed on client
    const dismissed = localStorage.getItem(storageKey);
    setIsDismissed(dismissed === 'true');
  }, [storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(storageKey, 'true');
  };

  if (variant === 'badge') {
    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
          color: '#a78bfa',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
        Beta
      </span>
    );
  }

  // Banner variant
  if (isDismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] py-2 px-4"
      style={{
        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(99, 102, 241, 0.15) 100%)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="relative max-w-6xl mx-auto flex items-center justify-center gap-3 text-sm">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
            color: '#a78bfa',
            border: '1px solid rgba(139, 92, 246, 0.4)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Beta
        </span>
        <span className="text-white/80">
          Welcome to the BrandOS beta! You&apos;re among the first to try it.
        </span>
        <a
          href="mailto:feedback@mybrandos.app"
          className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
        >
          Share feedback
        </a>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Inline badge for use in headers/navs
export function BetaBadgeInline() {
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ml-2"
      style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
        color: '#a78bfa',
        border: '1px solid rgba(139, 92, 246, 0.3)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
      Beta
    </span>
  );
}

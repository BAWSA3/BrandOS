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
  storageKey = 'brandos-beta-banner-dismissed',
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
          background:
            'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
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

  // In the page flow (not fixed) so it pushes headers down instead of sitting
  // on top of them; Klein with white text for contrast (was white on lavender).
  return (
    <div className="relative z-[60] py-2 px-4" style={{ background: '#0047FF' }}>
      <div className="relative max-w-6xl mx-auto flex items-center justify-center gap-x-3 pr-8 text-xs sm:text-sm text-white whitespace-nowrap">
        <span
          className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ border: '1px solid rgba(255,255,255,0.9)' }}
        >
          Beta
        </span>
        {/* One line on phones so the hero keeps the first screen */}
        <span className="sm:hidden">You&apos;re early.</span>
        <span className="hidden sm:inline">
          Welcome to the BrandOS beta! You&apos;re among the first to try it.
        </span>
        <a
          href="mailto:feedback@mybrandos.app"
          className="text-white underline underline-offset-2 hover:opacity-80"
        >
          Share feedback
        </a>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:bg-white/15"
            aria-label="Dismiss"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
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
        background:
          'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
        color: '#a78bfa',
        border: '1px solid rgba(139, 92, 246, 0.3)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
      Beta
    </span>
  );
}

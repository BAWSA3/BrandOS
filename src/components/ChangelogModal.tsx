'use client';

import { useState, useEffect } from 'react';

// =============================================================================
// Changelog Data - Update this when releasing new features
// =============================================================================

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  type: 'major' | 'minor' | 'patch';
}

export const changelog: ChangelogEntry[] = [
  {
    version: '0.2.0',
    date: 'January 2026',
    title: 'Beta Launch! 🚀',
    highlights: [
      'Brand DNA analysis from your X profile',
      'Discover your brand archetype',
      'Get personalized improvement recommendations',
      'Share your brand score with others',
      'Import existing brands from guidelines',
    ],
    type: 'major',
  },
  {
    version: '0.1.5',
    date: 'January 2026',
    title: 'Polish & Feedback',
    highlights: [
      'Added feedback button for beta testers',
      'Toast notifications for better UX',
      'Improved error messages',
      'Data persistence warning',
    ],
    type: 'minor',
  },
];

// Get the latest version from changelog
const LATEST_VERSION = changelog[0]?.version || '0.1.0';
const CHANGELOG_STORAGE_KEY = 'brandos-changelog-seen';

// =============================================================================
// Component
// =============================================================================

interface ChangelogModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function ChangelogModal({ forceOpen, onClose }: ChangelogModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenVersion, setHasSeenVersion] = useState<string | null>(null);

  useEffect(() => {
    // Check what version the user has seen
    const seenVersion = localStorage.getItem(CHANGELOG_STORAGE_KEY);
    setHasSeenVersion(seenVersion);

    // Show modal if user hasn't seen the latest version
    if (seenVersion !== LATEST_VERSION && !forceOpen) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }

    // If forceOpen is true, always show
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(CHANGELOG_STORAGE_KEY, LATEST_VERSION);
    onClose?.();
  };

  if (!isOpen) return null;

  const latestEntry = changelog[0];
  const isFirstVisit = hasSeenVersion === null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[151] w-[440px] max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl animate-modal-in"
        style={{
          background: 'linear-gradient(180deg, rgba(20, 20, 20, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div 
          className="p-6 text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
          }}
        >
          {/* Animated sparkle icon */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div 
              className="absolute inset-0 rounded-2xl animate-pulse"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              ✨
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-1">
            {isFirstVisit ? "Welcome to BrandOS Beta!" : "What's New"}
          </h2>
          <p className="text-white/50 text-sm">
            {isFirstVisit 
              ? "Thanks for joining the beta! Here's what you can do:"
              : `Version ${latestEntry.version} • ${latestEntry.date}`
            }
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 max-h-[50vh] overflow-y-auto">
          {/* Latest Release */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: latestEntry.type === 'major' 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : latestEntry.type === 'minor' 
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(156, 163, 175, 0.2)',
                  color: latestEntry.type === 'major' 
                    ? '#22c55e' 
                    : latestEntry.type === 'minor' 
                    ? '#3b82f6'
                    : '#9ca3af',
                }}
              >
                {latestEntry.type === 'major' ? 'New' : latestEntry.type === 'minor' ? 'Update' : 'Fix'}
              </span>
              <span className="text-white font-medium">{latestEntry.title}</span>
            </div>
            
            <ul className="space-y-2">
              {latestEntry.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <svg 
                    className="w-4 h-4 mt-0.5 flex-shrink-0" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="#22c55e" 
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-white/80">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Previous versions (collapsed) */}
          {changelog.length > 1 && (
            <details className="mt-4">
              <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60 transition-colors">
                Previous updates
              </summary>
              <div className="mt-3 space-y-4">
                {changelog.slice(1).map((entry, i) => (
                  <div key={i} className="pl-3 border-l border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-white/50">v{entry.version}</span>
                      <span className="text-xs text-white/30">{entry.date}</span>
                    </div>
                    <p className="text-sm text-white/70">{entry.title}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
            }}
          >
            {isFirstVisit ? "Let's Go!" : "Got it"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

// =============================================================================
// Hook to manually trigger changelog
// =============================================================================

export function useChangelog() {
  const [showChangelog, setShowChangelog] = useState(false);

  const openChangelog = () => setShowChangelog(true);
  const closeChangelog = () => setShowChangelog(false);

  return {
    showChangelog,
    openChangelog,
    closeChangelog,
    ChangelogModal: showChangelog ? (
      <ChangelogModal forceOpen onClose={closeChangelog} />
    ) : null,
  };
}

'use client';

import { useState, useEffect } from 'react';

interface DataPersistenceWarningProps {
  storageKey?: string;
  onExport?: () => void;
}

export default function DataPersistenceWarning({ 
  storageKey = 'brandos-data-warning-dismissed',
  onExport
}: DataPersistenceWarningProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start true to prevent flash
  const [showReminder, setShowReminder] = useState(false);
  
  useEffect(() => {
    // Check if dismissed on client
    const dismissed = localStorage.getItem(storageKey);
    const lastReminder = localStorage.getItem(`${storageKey}-reminder`);
    
    setIsDismissed(dismissed === 'true');
    
    // Show reminder every 7 days even if dismissed
    if (dismissed === 'true' && lastReminder) {
      const daysSinceReminder = (Date.now() - parseInt(lastReminder)) / (1000 * 60 * 60 * 24);
      if (daysSinceReminder > 7) {
        setShowReminder(true);
        localStorage.setItem(`${storageKey}-reminder`, Date.now().toString());
      }
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowReminder(false);
    localStorage.setItem(storageKey, 'true');
    localStorage.setItem(`${storageKey}-reminder`, Date.now().toString());
  };

  if (isDismissed && !showReminder) return null;

  return (
    <div 
      className="fixed bottom-24 left-6 z-50 w-[340px] rounded-2xl shadow-2xl animate-slide-up"
      style={{
        background: 'rgba(15, 15, 15, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-white/10">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(251, 191, 36, 0.15)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm mb-1">
            {showReminder ? 'Reminder: Export Your Brand' : 'Browser-Only Storage'}
          </h3>
          <p className="text-white/60 text-xs leading-relaxed">
            {showReminder 
              ? "It's been a while! Make sure to export your brand data so you don't lose it."
              : "Your brand data is saved only in this browser. Export it to keep a backup or use on other devices."
            }
          </p>
        </div>
        <button 
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Actions */}
      <div className="p-4 flex gap-3">
        {onExport && (
          <button
            onClick={() => {
              onExport();
              handleDismiss();
            }}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(251, 191, 36, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(251, 191, 36, 0.3)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Now
            </span>
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          Got it
        </button>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

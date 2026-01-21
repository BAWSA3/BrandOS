'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface SaveResultsPromptProps {
  onDismiss?: () => void;
  inviteCode?: string;
}

export function SaveResultsPrompt({ onDismiss, inviteCode }: SaveResultsPromptProps) {
  const { signInWithX, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Store invite code and any brand data in localStorage before OAuth redirect
  useEffect(() => {
    if (inviteCode) {
      localStorage.setItem('pendingInviteCode', inviteCode);
      // Also set as a cookie for the callback to read
      document.cookie = `pendingInviteCode=${inviteCode}; path=/; max-age=3600; samesite=lax`;
    }
  }, [inviteCode]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      // Store current brand data before redirect
      const brandosStorage = localStorage.getItem('brandos-storage');
      if (brandosStorage) {
        localStorage.setItem('pendingBrandSync', brandosStorage);
      }

      await signInWithX({
        inviteCode,
        redirectTo: `${window.location.origin}/api/auth/callback?next=/app`,
      });
    } catch (err) {
      console.error('[SaveResultsPrompt] Sign in error:', err);
      setError('Failed to sign in. Please try again.');
      setIsSigningIn(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
      >
        <div
          className="rounded-2xl p-6 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.98) 0%, rgba(15, 15, 20, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1DA1F2 0%, #0D8BDB 100%)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Save Your Results</h3>
                <p className="text-white/60 text-sm">Sign up to keep your brand data</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Benefits */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Your brand DNA saved to the cloud</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Access from any device</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Invite friends with your referral codes</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn || isLoading}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #1DA1F2 0%, #0D8BDB 100%)',
              }}
            >
              {isSigningIn ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Sign up with X</span>
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="py-3 px-4 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              Later
            </button>
          </div>

          {/* Terms */}
          <p className="text-white/40 text-xs text-center mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SaveResultsPrompt;

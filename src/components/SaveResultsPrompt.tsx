'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="w-full max-w-[600px] mt-16 flex flex-col items-center"
    >
      {/* Panel Card */}
      <div
        style={{
          width: '100%',
          padding: '48px 40px',
          borderRadius: '24px',
          background: 'rgba(26, 26, 26, 0.6)',
          border: '1px solid rgba(212, 165, 116, 0.15)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Decorative line */}
        <div
          style={{
            width: '80px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(212, 165, 116, 0.6), transparent)',
            marginBottom: '32px',
          }}
        />

        {/* X Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(29, 161, 242, 0.2) 0%, rgba(13, 139, 219, 0.1) 100%)',
            border: '1px solid rgba(29, 161, 242, 0.3)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#1DA1F2">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>

        <h3
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '14px',
            letterSpacing: '0.25em',
            color: '#D4A574',
            marginBottom: '16px',
            textTransform: 'uppercase',
          }}
        >
          Save Your Results
        </h3>

        <p
          style={{
            fontSize: '17px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '24px',
            textAlign: 'center',
            maxWidth: '420px',
            lineHeight: '1.6',
          }}
        >
          Sign up with X to keep your Brand DNA and access it from any device.
        </p>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Cloud sync</span>
          </div>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Multi-device</span>
          </div>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Invite friends</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm w-full max-w-[400px]">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full max-w-[400px]">
          <motion.button
            onClick={handleSignIn}
            disabled={isSigningIn || isLoading}
            whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(29, 161, 242, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-4 px-6 rounded-xl cursor-pointer flex items-center justify-center gap-2"
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '13px',
              letterSpacing: '0.1em',
              color: '#fff',
              background: 'linear-gradient(135deg, #1DA1F2 0%, #0D8BDB 100%)',
              border: 'none',
              boxShadow: '0 4px 24px rgba(29, 161, 242, 0.3)',
              opacity: isSigningIn || isLoading ? 0.7 : 1,
            }}
          >
            {isSigningIn ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>CONNECTING...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>SIGN UP WITH X</span>
              </>
            )}
          </motion.button>
          <motion.button
            onClick={handleDismiss}
            whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            className="py-4 px-6 rounded-xl cursor-pointer"
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '13px',
              letterSpacing: '0.1em',
              color: 'rgba(255, 255, 255, 0.5)',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            LATER
          </motion.button>
        </div>

        {/* Terms */}
        <p
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.3)',
            marginTop: '20px',
            textAlign: 'center',
          }}
        >
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Bottom decorative element */}
      <div
        style={{
          marginTop: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '11px',
          fontFamily: "'VCR OSD Mono', monospace",
          letterSpacing: '0.15em',
        }}
      >
        <div style={{ width: '30px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
        POWERED BY BRANDOS
        <div style={{ width: '30px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
      </div>
    </motion.div>
  );
}

export default SaveResultsPrompt;

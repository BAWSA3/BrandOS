'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface SignupPromptProps {
  xUsername?: string;
  brandScore?: number;
  archetype?: string;
  archetypeEmoji?: string;
  inviteCode?: string;
}

export default function SignupPrompt({
  xUsername,
  brandScore,
  archetype,
  archetypeEmoji,
  inviteCode,
}: SignupPromptProps) {
  const { signInWithX, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'x' | 'email'>('x');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Store invite code before OAuth redirect
  useEffect(() => {
    if (inviteCode) {
      localStorage.setItem('pendingInviteCode', inviteCode);
      document.cookie = `pendingInviteCode=${inviteCode}; path=/; max-age=3600; samesite=lax`;
    }
  }, [inviteCode]);

  const handleXSignIn = async () => {
    setIsSubmitting(true);
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
      console.error('[SignupPrompt] X sign in error:', err);
      setError('Failed to connect with X. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'brand-score',
          xUsername,
          brandData: {
            score: brandScore,
            archetype,
            archetypeEmoji,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      setSuccess(true);
    } catch (err) {
      console.error('[SignupPrompt] Email signup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '48px 40px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '24px',
            color: '#10B981',
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '14px',
            letterSpacing: '0.15em',
            color: '#10B981',
            marginBottom: '12px',
          }}
        >
          YOU'RE IN!
        </h3>
        <p
          style={{
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: 1.6,
          }}
        >
          Check your email for next steps. We'll help you make the most of your Brand DNA.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        width: '100%',
        maxWidth: '480px',
        padding: '40px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h3
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '12px',
            letterSpacing: '0.2em',
            color: '#0047FF',
            marginBottom: '12px',
          }}
        >
          SAVE YOUR RESULTS
        </h3>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.5,
          }}
        >
          Create an account to keep your Brand DNA and track your progress.
        </p>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => setActiveTab('x')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'x' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: activeTab === 'x' ? '#fff' : 'rgba(255, 255, 255, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          CONTINUE WITH X
        </button>
        <button
          onClick={() => setActiveTab('email')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'email' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: activeTab === 'email' ? '#fff' : 'rgba(255, 255, 255, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          USE EMAIL
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#EF4444' }}>{error}</span>
        </div>
      )}

      {/* X Sign In */}
      {activeTab === 'x' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={handleXSignIn}
            disabled={isSubmitting || authLoading}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#000',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#000';
            }}
          >
            {isSubmitting ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle opacity="0.25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path
                  opacity="0.75"
                  fill="white"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            )}
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '13px',
                letterSpacing: '0.1em',
                color: '#fff',
              }}
            >
              {isSubmitting ? 'CONNECTING...' : 'SIGN UP WITH X'}
            </span>
          </button>

          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.3)',
              textAlign: 'center',
              marginTop: '16px',
              lineHeight: 1.5,
            }}
          >
            We'll sync your profile and save your Brand DNA to your account.
          </p>
        </motion.div>
      )}

      {/* Email Sign Up */}
      {activeTab === 'email' && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleEmailSignup}
        >
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                fontSize: '15px',
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 71, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#0047FF',
              border: 'none',
              borderRadius: '10px',
              cursor: isSubmitting || !email ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: isSubmitting || !email ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && email) e.currentTarget.style.background = '#0038CC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0047FF';
            }}
          >
            {isSubmitting ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle opacity="0.25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path
                  opacity="0.75"
                  fill="white"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : null}
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '13px',
                letterSpacing: '0.1em',
                color: '#fff',
              }}
            >
              {isSubmitting ? 'SIGNING UP...' : 'SIGN UP WITH EMAIL'}
            </span>
          </button>

          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.3)',
              textAlign: 'center',
              marginTop: '16px',
              lineHeight: 1.5,
            }}
          >
            We'll send you a welcome email with your Brand DNA summary.
          </p>
        </motion.form>
      )}

      {/* Terms */}
      <p
        style={{
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.25)',
          textAlign: 'center',
          marginTop: '24px',
        }}
      >
        By signing up, you agree to our Terms of Service and Privacy Policy
      </p>
    </motion.div>
  );
}

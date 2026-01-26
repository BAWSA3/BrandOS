'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InviteCode {
  code: string;
  maxUses: number;
  usedCount: number;
}

interface InviteCodeDisplayProps {
  username: string;
  onGenerate?: () => void;
}

export function InviteCodeDisplay({ username, onGenerate }: InviteCodeDisplayProps) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate invite codes on mount if none exist
  useEffect(() => {
    const generateCodes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, count: 3 }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate codes');
        }

        setCodes(data.codes);
        onGenerate?.();
      } catch (err) {
        console.error('[InviteCodeDisplay] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate codes');
      } finally {
        setIsLoading(false);
      }
    };

    generateCodes();
  }, [username, onGenerate]);

  // Copy code to clipboard
  const handleCopy = useCallback(async (code: string) => {
    try {
      const inviteUrl = `https://mybrandos.app?invite=${code}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('[InviteCodeDisplay] Copy failed:', err);
    }
  }, []);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          textAlign: 'center',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '24px',
            height: '24px',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            borderTopColor: '#F59E0B',
            borderRadius: '50%',
            margin: '0 auto 12px',
          }}
        />
        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          GENERATING YOUR INVITE CODES...
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: '#EF4444',
          }}
        >
          {error}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        padding: '20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '20px' }}>👑</span>
        <div>
          <div
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.15em',
              color: '#F59E0B',
              marginBottom: '2px',
            }}
          >
            INNER CIRCLE EXCLUSIVE
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            Share your access
          </div>
        </div>
      </div>

      {/* Invite codes list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {codes.map((inviteCode, index) => (
          <motion.div
            key={inviteCode.code}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Code */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  color: '#FFFFFF',
                }}
              >
                {inviteCode.code}
              </div>
              <div
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  color:
                    inviteCode.usedCount >= inviteCode.maxUses
                      ? 'rgba(239, 68, 68, 0.8)'
                      : 'rgba(255, 255, 255, 0.4)',
                }}
              >
                {inviteCode.usedCount}/{inviteCode.maxUses} USED
              </div>
            </div>

            {/* Copy button */}
            <motion.button
              onClick={() => handleCopy(inviteCode.code)}
              disabled={inviteCode.usedCount >= inviteCode.maxUses}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background:
                  copiedCode === inviteCode.code
                    ? '#10B981'
                    : inviteCode.usedCount >= inviteCode.maxUses
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color:
                  inviteCode.usedCount >= inviteCode.maxUses
                    ? 'rgba(255, 255, 255, 0.3)'
                    : copiedCode === inviteCode.code
                      ? '#FFFFFF'
                      : '#1a1a1a',
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                cursor:
                  inviteCode.usedCount >= inviteCode.maxUses ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {copiedCode === inviteCode.code ? (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  COPIED!
                </>
              ) : inviteCode.usedCount >= inviteCode.maxUses ? (
                'EXHAUSTED'
              ) : (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  COPY
                </>
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Helper text */}
      <div
        style={{
          marginTop: '16px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
        }}
      >
        Share this link with a friend to give them Inner Circle access
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {copiedCode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            style={{
              position: 'absolute',
              bottom: '-60px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 20px',
              background: '#10B981',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            Invite link copied!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default InviteCodeDisplay;

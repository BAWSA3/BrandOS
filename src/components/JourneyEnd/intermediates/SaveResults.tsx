'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

interface SaveResultsProps {
  username: string;
  onSave: (email: string) => void;
  onSkip: () => void;
  theme: string;
}

export default function SaveResults({
  username,
  onSave,
  onSkip,
  theme,
}: SaveResultsProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);

    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSuccess(true);
    setTimeout(() => {
      onSave(email);
    }, 1500);

    setIsLoading(false);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          background: '#0F1115',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
            }}
          >
            {success ? '✓' : '📧'}
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '22px',
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center',
            margin: '0 0 8px 0',
          }}
        >
          {success ? 'Saved!' : 'Save Your Brand DNA'}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            margin: '0 0 24px 0',
            lineHeight: 1.5,
          }}
        >
          {success ? (
            'Check your inbox for your full brand report'
          ) : (
            <>
              Get your full report + weekly tips
              <br />
              delivered to your inbox
            </>
          )}
        </motion.p>

        {!success && (
          <>
            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: error ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#FFFFFF',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    cursor: isLoading ? 'wait' : 'pointer',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '80px',
                  }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#FFFFFF',
                        borderRadius: '50%',
                      }}
                    />
                  ) : (
                    'SAVE'
                  )}
                </motion.button>
              </div>

              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#EF4444',
                    marginBottom: '16px',
                  }}
                >
                  {error}
                </motion.p>
              )}
            </motion.form>

            {/* Skip link */}
            <motion.button
              onClick={onSkip}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ opacity: 1 }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Skip and view dashboard →
            </motion.button>
          </>
        )}

        {/* Benefits list */}
        {!success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '9px',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.1em',
                marginBottom: '12px',
              }}
            >
              WHAT YOU'LL GET
            </div>
            {[
              'Full PDF brand report',
              'Weekly brand optimization tips',
              'Early access to new features',
            ].map((benefit, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: i < 2 ? '8px' : 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {benefit}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Success auto-continue indicator */}
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '24px',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '12px',
                height: '12px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: '#10B981',
                borderRadius: '50%',
              }}
            />
            Redirecting to dashboard...
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

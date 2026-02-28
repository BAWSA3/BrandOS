'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OnchainBadge } from './OnchainBadge';

type AttestStatus = 'idle' | 'loading' | 'success' | 'error';

interface AttestResult {
  uid: string;
  txHash: string;
  explorerUrl: string;
  alreadyExists?: boolean;
}

interface AttestButtonProps {
  label: string;
  sublabel?: string;
  onAttest: () => Promise<AttestResult>;
  disabled?: boolean;
  existingAttestation?: AttestResult | null;
  variant?: 'primary' | 'compact';
}

export function AttestButton({
  label,
  sublabel,
  onAttest,
  disabled = false,
  existingAttestation,
  variant = 'primary',
}: AttestButtonProps) {
  const [status, setStatus] = useState<AttestStatus>(
    existingAttestation ? 'success' : 'idle'
  );
  const [result, setResult] = useState<AttestResult | null>(existingAttestation || null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (status === 'loading' || disabled) return;

    setStatus('loading');
    setError(null);

    try {
      const attestResult = await onAttest();
      setResult(attestResult);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Attestation failed');
      setStatus('error');
    }
  }

  if (status === 'success' && result) {
    return (
      <div className="flex flex-col gap-2">
        <OnchainBadge
          uid={result.uid}
          explorerUrl={result.explorerUrl}
          variant="card"
          label={result.alreadyExists ? 'Already attested' : 'Attested onchain'}
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex flex-col gap-1.5">
        <motion.button
          onClick={handleClick}
          disabled={disabled || status === 'loading'}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: '#60a5fa',
          }}
          whileHover={!disabled ? { scale: 1.02 } : undefined}
          whileTap={!disabled ? { scale: 0.98 } : undefined}
        >
          {status === 'loading' ? (
            <LoadingDots />
          ) : (
            <>
              <ChainIcon size={14} />
              <span>{label}</span>
            </>
          )}
        </motion.button>
        <AnimatePresence>
          {status === 'error' && error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[10px] text-red-400/80 px-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        onClick={handleClick}
        disabled={disabled || status === 'loading'}
        className="relative flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#93c5fd',
        }}
        whileHover={!disabled ? {
          scale: 1.02,
          boxShadow: '0 0 24px rgba(59, 130, 246, 0.2), 0 0 48px rgba(16, 185, 129, 0.1)',
        } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
      >
        <span
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
            animation: status === 'loading' ? 'attestShimmer 1.5s ease-in-out infinite' : 'none',
            transform: 'translateX(-100%)',
          }}
        />

        {status === 'loading' ? (
          <span className="relative flex items-center gap-2">
            <LoadingDots />
            <span>Creating attestation...</span>
          </span>
        ) : (
          <span className="relative flex items-center gap-2">
            <ChainIcon size={18} />
            <span>{label}</span>
          </span>
        )}
      </motion.button>

      {sublabel && status === 'idle' && (
        <p className="text-[11px] text-white/40 text-center">{sublabel}</p>
      )}

      <AnimatePresence>
        {status === 'error' && error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400/80 text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes attestShimmer {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function ChainIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function LoadingDots() {
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </span>
  );
}

export default AttestButton;

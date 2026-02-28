'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OnchainBadge } from './OnchainBadge';

interface AttestationSummary {
  uid: string;
  txHash: string;
  chain: string;
  explorerUrl: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface OnchainStatus {
  totalAttestations: number;
  walletAddress: string | null;
  brandDna: { count: number; latest: AttestationSummary[] };
  contentChecks: { count: number; latest: AttestationSummary[] };
  brandScores: { count: number; latest: AttestationSummary[] };
}

export function OnchainActivity() {
  const [data, setData] = useState<OnchainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/onchain/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="w-4 h-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
        <span className="text-xs text-white/40">Loading onchain activity...</span>
      </div>
    );
  }

  if (!data || data.totalAttestations === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
        }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: 'rgba(59, 130, 246, 0.1)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-white/60">No onchain activity yet</span>
          <span className="text-[10px] text-white/30">Mint your Brand DNA or score to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
        }}
        whileHover={{ scale: 1.005 }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
        >
          <span className="text-white font-bold text-xs">{data.totalAttestations}</span>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-xs font-semibold text-white/80">Onchain Attestations</span>
          <span className="text-[10px] text-white/40">
            {data.brandDna.count} brand{data.brandDna.count !== 1 ? 's' : ''} ·{' '}
            {data.contentChecks.count} check{data.contentChecks.count !== 1 ? 's' : ''} ·{' '}
            {data.brandScores.count} score{data.brandScores.count !== 1 ? 's' : ''}
          </span>
        </div>
        <motion.svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.3)" strokeWidth="2"
          animate={{ rotate: expanded ? 180 : 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-1.5 overflow-hidden"
          >
            {[...data.brandDna.latest, ...data.contentChecks.latest, ...data.brandScores.latest]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 8)
              .map((att) => (
                <OnchainBadge
                  key={att.uid}
                  uid={att.uid}
                  explorerUrl={att.explorerUrl}
                  label={formatAttestationType(att.metadata)}
                  variant="card"
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatAttestationType(metadata: Record<string, unknown> | null): string {
  if (!metadata) return 'Attestation';
  if ('brandName' in metadata && 'version' in metadata) return `Brand DNA v${metadata.version}`;
  if ('brandAlignmentScore' in metadata) return `Content Check (${metadata.brandAlignmentScore}/100)`;
  if ('overallScore' in metadata) return `Brand Score (${metadata.overallScore}/100)`;
  return 'Attestation';
}

export default OnchainActivity;

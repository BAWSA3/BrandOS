'use client';

import { motion } from 'motion/react';

interface OnchainBadgeProps {
  uid: string;
  explorerUrl: string;
  label?: string;
  variant?: 'inline' | 'card';
}

export function OnchainBadge({
  uid,
  explorerUrl,
  label = 'Attested Onchain',
  variant = 'inline',
}: OnchainBadgeProps) {
  const shortUid = uid.slice(0, 6) + '...' + uid.slice(-4);

  if (variant === 'card') {
    return (
      <motion.a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-white/90">{label}</span>
          <span className="text-[10px] text-white/50 font-mono truncate">
            {shortUid}
          </span>
        </div>
        <svg
          className="ml-auto w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </motion.a>
    );
  }

  return (
    <motion.a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full overflow-hidden cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      }}
    >
      <span className="relative flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>{label}</span>
      </span>
      <span className="font-mono text-white/40 group-hover:text-white/60 transition-colors">
        {shortUid}
      </span>
    </motion.a>
  );
}

export default OnchainBadge;

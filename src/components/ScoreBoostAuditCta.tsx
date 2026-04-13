'use client';

/**
 * Score Boost Audit CTA — post-scan upsell
 *
 * Surfaces the user's weakest phase by name and drives them into
 * Stripe Checkout for the $19 Score Boost Audit. Renders inside
 * the reveal state of XBrandScoreHero.
 *
 * Flow:
 *   click → POST /api/audit/checkout { handle }
 *     → returns Stripe hosted-checkout URL
 *     → window.location.href = url (redirect)
 */

import { useState } from 'react';
import { motion } from 'motion/react';

type PhaseKey = 'define' | 'check' | 'generate' | 'scale';

interface Props {
  handle: string;
  phaseScores: Record<PhaseKey, number>;
}

const PHASE_LABEL: Record<PhaseKey, string> = {
  define: 'DEFINE',
  check: 'CHECK',
  generate: 'GENERATE',
  scale: 'SCALE',
};

function getWeakestPhase(scores: Record<PhaseKey, number>): PhaseKey {
  return (Object.entries(scores) as [PhaseKey, number][]).reduce(
    (weakest, [phase, score]) =>
      score < scores[weakest] ? phase : weakest,
    'define' as PhaseKey
  );
}

export default function ScoreBoostAuditCta({ handle, phaseScores }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weakest = getWeakestPhase(phaseScores);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/audit/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not start checkout');
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message || 'Network error');
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75 }}
      className="capture-hide"
      style={{
        width: '100%',
        marginTop: '12px',
        padding: '16px 20px',
        background: '#0A0A0A',
        border: '1px solid #1F1F1F',
        borderRadius: '6px',
      }}
    >
      <p
        style={{
          fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.12em',
          color: '#737373',
          margin: '0 0 8px 0',
        }}
      >
        // weakest phase: {PHASE_LABEL[weakest]} ({phaseScores[weakest]}/100)
      </p>
      <p
        style={{
          fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
          fontSize: '14px',
          letterSpacing: '0.02em',
          color: '#ffffff',
          margin: '0 0 4px 0',
          fontWeight: 600,
        }}
      >
        Your {PHASE_LABEL[weakest]} phase is holding you back.
      </p>
      <p
        style={{
          fontSize: '13px',
          lineHeight: 1.5,
          color: '#A3A3A3',
          margin: '0 0 14px 0',
        }}
      >
        Get a tweet-by-tweet audit with evidence-backed suggestions,
        phase breakdown, and a personalized action plan. Downloadable as
        a markdown file you can drop into Claude or ChatGPT as your
        voice guide.
      </p>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: loading ? '#2E6AFF' : '#ffffff',
          color: loading ? '#ffffff' : '#0A0A0A',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'wait' : 'pointer',
          fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
          fontSize: '12px',
          letterSpacing: '0.1em',
          fontWeight: 600,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.background = '#2E6AFF';
          if (!loading) e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.background = '#ffffff';
          if (!loading) e.currentTarget.style.color = '#0A0A0A';
        }}
      >
        {loading ? 'OPENING CHECKOUT...' : 'GET YOUR SCORE BOOST AUDIT — $19'}
      </button>
      {error && (
        <p
          style={{
            fontSize: '11px',
            color: '#EF4444',
            marginTop: '8px',
            marginBottom: 0,
          }}
        >
          {error}
        </p>
      )}
    </motion.div>
  );
}

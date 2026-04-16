'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

// =============================================================================
// Brand Identity Card — Public, shareable creator profile
// =============================================================================

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const SANS = "'Helvetica Neue', sans-serif";
const KLEIN = '#0047FF';

interface PhaseScores {
  define: number;
  check: number;
  generate: number;
  scale: number;
}

interface CardData {
  username: string;
  tier: string;
  report: {
    archetype: {
      name: string;
      emoji: string;
      tagline: string;
      description: string;
      tier: number;
      tierLabel: string;
      color: string;
      strengths: string[];
    };
    score: {
      current: number;
      percentile: number | null;
      cohortAverage: number | null;
      cohortSize: number | null;
      influenceTier: string;
    };
    phases: {
      scores: PhaseScores;
    } | null;
    strengths: string[] | null;
    scannedAt: string;
    totalScans: number;
  };
}

function AsciiBar({ value, width = 16 }: { value: number; width?: number }) {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return KLEIN;
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

export default function BrandCardClient({ username }: { username: string }) {
  const [data, setData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/intelligence/report?username=${encodeURIComponent(username)}&include=public`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Could not load card');
          return;
        }
        setData(json);
      } catch {
        setError('Failed to load. Try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontFamily: MONO, fontSize: '12px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}
        >
          LOADING @{username}...
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: '12px', color: '#EF4444', letterSpacing: '0.1em' }}>
          [ERROR] {error || 'No data found'}
        </div>
        <a
          href="/"
          style={{
            fontFamily: MONO,
            fontSize: '11px',
            color: KLEIN,
            textDecoration: 'none',
            letterSpacing: '0.1em',
          }}
        >
          GET YOUR SCORE →
        </a>
      </div>
    );
  }

  const r = data.report;
  const phases = r.phases?.scores;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#0A0A0A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>
            BRANDOS IDENTITY CARD
          </span>
        </div>

        {/* Main content */}
        <div style={{ padding: '32px 28px' }}>
          {/* Archetype + Score row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>
                @{data.username}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '32px', color: r.archetype.color, lineHeight: 1 }}>
                {r.archetype.emoji} {r.archetype.name}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginTop: '6px' }}>
                {r.archetype.tierLabel} · TIER {r.archetype.tier}
              </div>
              <div style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontStyle: 'italic' }}>
                {r.archetype.tagline}
              </div>
            </div>

            {/* Score circle */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: `3px solid ${scoreColor(r.score.current)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: '28px', color: '#fff', fontWeight: 500, lineHeight: 1 }}>
                {r.score.current}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>
                SCORE
              </div>
            </div>
          </div>

          {/* Phase breakdown */}
          {phases && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '12px' }}>
                PHASE ANALYSIS
              </div>
              {(['define', 'check', 'generate', 'scale'] as const).map((phase, i) => (
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '5px 0',
                    fontFamily: MONO,
                    fontSize: '11px',
                  }}
                >
                  <span style={{ width: '70px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {phase}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', whiteSpace: 'pre', fontSize: '10px' }}>
                    [{AsciiBar({ value: phases[phase] })}]
                  </span>
                  <span style={{ color: '#fff', minWidth: '24px' }}>{phases[phase]}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Strengths */}
          {r.strengths && r.strengths.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '10px' }}>
                TOP STRENGTHS
              </div>
              {r.strengths.slice(0, 3).map((s, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: SANS,
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.6)',
                    padding: '4px 0',
                    display: 'flex',
                    gap: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ fontFamily: MONO, color: '#10B981', fontSize: '10px', flexShrink: 0 }}>[+]</span>
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* Influence tier */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
            }}
          >
            <div>
              <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>
                INFLUENCE
              </div>
              <div style={{ fontFamily: MONO, fontSize: '13px', color: '#fff', textTransform: 'uppercase', marginTop: '2px' }}>
                {r.score.influenceTier}
              </div>
            </div>
            {r.score.percentile != null && (
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>
                  PERCENTILE
                </div>
                <div style={{ fontFamily: MONO, fontSize: '13px', color: KLEIN, marginTop: '2px' }}>
                  Top {100 - r.score.percentile}%
                </div>
              </div>
            )}
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '12px' }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>
                SCANS
              </div>
              <div style={{ fontFamily: MONO, fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                {r.totalScans}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>
            BRANDOS.APP
          </span>
          <span style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.15)' }}>
            VERIFIED {new Date(r.scannedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
          </span>
        </div>
      </motion.div>

      {/* CTA below card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          marginTop: '32px',
        }}
      >
        <a
          href="/"
          style={{
            padding: '12px 32px',
            background: KLEIN,
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontFamily: MONO,
            fontSize: '11px',
            letterSpacing: '0.1em',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          GET YOUR BRAND SCORE
        </a>
        <span style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
          FREE · 30 SECONDS · NO SIGNUP
        </span>
      </motion.div>
    </div>
  );
}

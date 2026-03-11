'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreData {
  username: string;
  displayName: string;
  score: number;
  archetype: string;
  define: number;
  check: number;
  generate: number;
  scale: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#0047FF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function getTier(score: number): string {
  if (score >= 80) return 'ELITE';
  if (score >= 70) return 'STRONG';
  if (score >= 60) return 'SOLID';
  if (score >= 50) return 'BUILDING';
  return 'EMERGING';
}

function renderBar(value: number): string {
  const filled = Math.round((value / 100) * 20);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled);
}

export default function ScanPageClient({ data }: { data: ScoreData }) {
  const [copied, setCopied] = useState(false);
  const scoreColor = getScoreColor(data.score);
  const phases = [
    { label: 'DEFINE', score: data.define, color: '#E8A838', desc: 'Brand clarity & recognition' },
    { label: 'CHECK', score: data.check, color: '#10B981', desc: 'Voice consistency' },
    { label: 'GENERATE', score: data.generate, color: '#9D4EDD', desc: 'AI-readiness' },
    { label: 'SCALE', score: data.scale, color: '#0047FF', desc: 'Growth potential' },
  ];

  // Find weakest phase
  const weakest = phases.reduce((min, p) => p.score < min.score ? p : min, phases[0]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `my brand DNA score: ${data.score}/100. archetype: THE ${data.archetype.toUpperCase()}.\n\nweakest dimension: ${weakest.label} (${weakest.score}/100)\n\nthink you can beat it? get yours free:`;

  function shareToX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
    }}>
      {/* Terminal header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#0047FF', fontSize: '12px', letterSpacing: '0.15em' }}>BRANDOS</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>//</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.1em' }}>SCAN RESULTS</span>
        </div>
        <a
          href="/"
          style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.1em', textDecoration: 'none' }}
        >
          mybrandos.app
        </a>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Comment block */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            color: 'rgba(255,255,255,0.15)',
            fontSize: '11px',
            marginBottom: '32px',
          }}
        >
          {'/* ═══════════════════════════════════════════════════════ */'}
          <br />
          {'/*  BRAND DNA SCAN: @'}{data.username}{'                              */'}
          <br />
          {'/* ═══════════════════════════════════════════════════════ */'}
        </motion.div>

        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            marginBottom: '40px',
          }}
        >
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '70px',
            border: `3px solid ${scoreColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            flexShrink: 0,
          }}>
            <div style={{ color: scoreColor, fontSize: '48px', fontWeight: 700 }}>{data.score}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '0.15em' }}>BRAND SCORE</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '4px' }}>
              {'> '}{data.displayName}
            </div>
            <div style={{ color: '#0047FF', fontSize: '24px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
              THE {data.archetype}
            </div>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: `${scoreColor}20`,
              border: `1px solid ${scoreColor}40`,
              borderRadius: '4px',
              color: scoreColor,
              fontSize: '10px',
              letterSpacing: '0.12em',
            }}>
              {getTier(data.score)}
            </div>
          </div>
        </motion.div>

        {/* Phase breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ marginBottom: '40px' }}
        >
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.12em', marginBottom: '16px' }}>
            PHASE BREAKDOWN
          </div>
          {phases.map((phase, i) => (
            <motion.div
              key={phase.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ color: phase.color, fontSize: '11px', letterSpacing: '0.1em', width: '80px' }}>
                {phase.label}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', flex: 1, letterSpacing: '0.02em' }}>
                {renderBar(phase.score)}
              </span>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600, width: '36px', textAlign: 'right' }}>
                {phase.score}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Blurred premium sections — FOMO */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{ marginBottom: '40px' }}
        >
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.12em', marginBottom: '16px' }}>
            UNLOCK MORE
          </div>

          {[
            { label: 'GROWTH PLAN', desc: `Your #1 gap is ${weakest.label} (${weakest.score}). We built a plan to fix it.`, icon: '📈' },
            { label: 'CONTENT ENGINE', desc: '7 AI-generated posts targeting your weakest dimensions.', icon: '⚡' },
            { label: 'VOICE FINGERPRINT', desc: 'Deep voice analysis + consistency scoring across platforms.', icon: '🧬' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                marginBottom: '8px',
                filter: 'blur(2px)',
                opacity: 0.6,
                pointerEvents: 'none',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span>{item.icon}</span>
                <span style={{ color: '#0047FF', fontSize: '11px', letterSpacing: '0.1em' }}>{item.label}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{item.desc}</div>
            </div>
          ))}

          {/* Unlock CTA overlay */}
          <div style={{
            marginTop: '-180px',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '180px',
          }}>
            <a
              href="/score"
              style={{
                padding: '16px 32px',
                background: '#0047FF',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                letterSpacing: '0.12em',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              UNLOCK WITH FREE SCAN
            </a>
          </div>
        </motion.div>

        {/* Share buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <button
            onClick={shareToX}
            style={{
              flex: 1,
              padding: '16px',
              background: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '12px', letterSpacing: '0.1em', color: '#000', fontFamily: "'VCR OSD Mono', monospace" }}>
              SHARE ON X
            </span>
          </button>
          <button
            onClick={copyLink}
            style={{
              padding: '16px 24px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px',
              letterSpacing: '0.1em',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            {copied ? 'COPIED!' : 'COPY LINK'}
          </button>
        </motion.div>

        {/* Scan yours CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          style={{
            textAlign: 'center',
            padding: '32px',
            background: 'rgba(0, 71, 255, 0.06)',
            border: '1px solid rgba(0, 71, 255, 0.15)',
            borderRadius: '8px',
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '0.1em', marginBottom: '16px' }}>
            {'>'} want to know YOUR brand score?
          </div>
          <a
            href="/score"
            style={{
              display: 'inline-block',
              padding: '16px 40px',
              background: '#0047FF',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              letterSpacing: '0.12em',
              textDecoration: 'none',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            SCAN MY BRAND FREE
          </a>
        </motion.div>

        {/* Footer */}
        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>
            {'// powered by AI brand intelligence'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>
            brandos v2.0
          </span>
        </div>
      </div>
    </div>
  );
}

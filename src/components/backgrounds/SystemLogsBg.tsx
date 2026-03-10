'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

// System log lines - terminal aesthetic
const LOG_LINES = [
  { text: '[BRANDOS] v2.0.0 initializing...', type: 'system' },
  { text: '[CORE] Loading brand engine modules', type: 'info' },
  { text: '[DNA] Identity matrix: READY', type: 'success' },
  { text: '[CHECK] Voice consistency analyzer: ONLINE', type: 'success' },
  { text: '[GENERATE] Content engine: STANDBY', type: 'info' },
  { text: '[SCALE] Growth protocols: ARMED', type: 'success' },
  { text: '────────────────────────────────────', type: 'divider' },
  { text: '[SYS] Awaiting user input...', type: 'system' },
  { text: '[AUTH] Session: anonymous', type: 'info' },
  { text: '[API] X/Twitter connection: ACTIVE', type: 'success' },
  { text: '[AI] Gemini model: CONNECTED', type: 'success' },
  { text: '────────────────────────────────────', type: 'divider' },
  { text: '[BRANDOS] System ready', type: 'system' },
  { text: '[HINT] Enter @username to begin analysis', type: 'info' },
];

const RIGHT_LOGS = [
  { text: '/* ═══════════════════════════ */', type: 'comment' },
  { text: '/*  BRANDOS CORE SYSTEM        */', type: 'comment' },
  { text: '/*  Build: 2024.03.09          */', type: 'comment' },
  { text: '/*  Status: OPERATIONAL        */', type: 'comment' },
  { text: '/* ═══════════════════════════ */', type: 'comment' },
  { text: '', type: 'empty' },
  { text: '> npm run brand:analyze', type: 'command' },
  { text: '> Processing request...', type: 'info' },
  { text: '', type: 'empty' },
  { text: 'Modules loaded: 47', type: 'info' },
  { text: 'Cache: WARM', type: 'success' },
  { text: 'Latency: 12ms', type: 'info' },
];

const BOTTOM_LOGS = [
  '█░░░░░░░░░ 10%',
  '███░░░░░░░ 30%',
  '█████░░░░░ 50%',
  '███████░░░ 70%',
  '█████████░ 90%',
  '██████████ READY',
];

function getLogColor(type: string): string {
  switch (type) {
    case 'success': return 'rgba(0, 200, 100, 0.7)';
    case 'system': return 'rgba(0, 71, 255, 0.8)';
    case 'command': return 'rgba(180, 140, 255, 0.7)';
    case 'comment': return 'rgba(0, 0, 0, 0.35)';
    case 'divider': return 'rgba(0, 0, 0, 0.25)';
    default: return 'rgba(0, 0, 0, 0.5)';
  }
}

export default function SystemLogsBg() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progressIndex, setProgressIndex] = useState(0);

  // Animate lines appearing one by one
  useEffect(() => {
    if (visibleLines < LOG_LINES.length) {
      const timer = setTimeout(() => {
        setVisibleLines(v => v + 1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  // Animate progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressIndex(i => (i + 1) % BOTTOM_LOGS.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Left side logs */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '4%',
          fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
          fontSize: 'clamp(9px, 1vw, 12px)',
          lineHeight: 1.8,
        }}
      >
        {LOG_LINES.slice(0, visibleLines).map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              color: getLogColor(line.type),
              whiteSpace: 'pre',
            }}
          >
            {line.text}
          </motion.div>
        ))}
        {visibleLines < LOG_LINES.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ color: 'rgba(0, 71, 255, 0.5)' }}
          >
            █
          </motion.span>
        )}
      </div>

      {/* Right side logs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        style={{
          position: 'absolute',
          top: '12%',
          right: '4%',
          fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
          fontSize: 'clamp(9px, 1vw, 11px)',
          lineHeight: 1.8,
          textAlign: 'right',
        }}
      >
        {RIGHT_LOGS.map((line, index) => (
          <div
            key={index}
            style={{
              color: getLogColor(line.type),
              whiteSpace: 'pre',
              opacity: 0.8,
            }}
          >
            {line.text}
          </div>
        ))}
      </motion.div>

      {/* Bottom progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1, delay: 2 }}
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '11px',
          color: '#000',
          letterSpacing: '0.1em',
        }}
      >
        {BOTTOM_LOGS[progressIndex]}
      </motion.div>

      {/* Decorative corner elements - aligned */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '6%',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '10px',
          color: '#000',
          lineHeight: 1.5,
        }}
      >
        <div>┌──────────────────┐</div>
        <div>│  BRAND ANALYSIS  │</div>
        <div>│  MODULE: ACTIVE  │</div>
        <div>└──────────────────┘</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: 1, delay: 0.8 }}
        style={{
          position: 'absolute',
          bottom: '12%',
          right: '6%',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '10px',
          color: '#000',
          lineHeight: 1.5,
        }}
      >
        <div>┌──────────────────┐</div>
        <div>│  DNA SEQUENCER   │</div>
        <div>│  STATUS: READY   │</div>
        <div>└──────────────────┘</div>
      </motion.div>
    </div>
  );
}

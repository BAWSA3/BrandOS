'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface CodeParallaxBackgroundProps {
  theme?: string;
}

// Floating code snippets for the background - positioned to avoid overlap
const CODE_SNIPPETS = [
  {
    code: `interface BrandDNA {
  identity: string;
  voice: ToneProfile;
  values: string[];
}`,
    position: { top: '30%', left: '2%' },
    opacity: 0.08,
    delay: 0,
  },
  {
    code: `type Score = {
  overall: number;
  phases: PhaseScores;
};`,
    position: { top: '8%', right: '3%' },
    opacity: 0.08,
    delay: 0.3,
  },
];

// Terminal log lines - minimal to avoid clutter
const LOG_LINES_LEFT = [
  { text: '// BRANDOS v2.0', type: 'header' },
  { text: '// ANALYSIS ACTIVE', type: 'info' },
];

const LOG_LINES_RIGHT = [
  '/* DNA SEQUENCER */',
  '/* STATUS: OK    */',
];

function getLogColor(type: string): string {
  switch (type) {
    case 'header': return 'rgba(0, 71, 255, 0.6)';
    case 'divider': return 'rgba(0, 0, 0, 0.2)';
    case 'info': return 'rgba(0, 0, 0, 0.35)';
    default: return 'rgba(0, 0, 0, 0.3)';
  }
}

export default function CodeParallaxBackground({ theme = 'dark' }: CodeParallaxBackgroundProps) {
  const [visibleLines, setVisibleLines] = useState(0);

  // Animate log lines appearing
  useEffect(() => {
    if (visibleLines < LOG_LINES_LEFT.length) {
      const timer = setTimeout(() => {
        setVisibleLines(v => v + 1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      {/* Subtle grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating code snippets */}
      {CODE_SNIPPETS.map((snippet, index) => (
        <motion.pre
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: snippet.opacity }}
          transition={{ duration: 1.5, delay: snippet.delay }}
          style={{
            position: 'absolute',
            ...snippet.position,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 'clamp(9px, 1vw, 11px)',
            lineHeight: 1.7,
            color: '#000000',
            margin: 0,
            whiteSpace: 'pre',
            userSelect: 'none',
          }}
        >
          {snippet.code}
        </motion.pre>
      ))}

      {/* Left side - animated terminal logs (subtle) */}
      <div
        style={{
          position: 'absolute',
          top: '4%',
          left: '2%',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '8px',
          lineHeight: 1.8,
          opacity: 0.4,
        }}
      >
        {LOG_LINES_LEFT.slice(0, visibleLines).map((line, index) => (
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
        {visibleLines < LOG_LINES_LEFT.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ color: 'rgba(0, 71, 255, 0.5)' }}
          >
            █
          </motion.span>
        )}
      </div>

      {/* Right side - comment block (subtle) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1, delay: 1.2 }}
        style={{
          position: 'absolute',
          top: '50%',
          right: '2%',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '8px',
          lineHeight: 1.8,
          color: 'rgba(0, 0, 0, 0.6)',
        }}
      >
        {LOG_LINES_RIGHT.map((line, index) => (
          <div key={index} style={{ whiteSpace: 'pre' }}>
            {line}
          </div>
        ))}
      </motion.div>

      {/* Bottom decorative terminal boxes - subtle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '3%',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '8px',
          color: '#000',
          lineHeight: 1.5,
        }}
      >
        <div>┌────────────────┐</div>
        <div>│ ANALYSIS: OK   │</div>
        <div>└────────────────┘</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ duration: 1, delay: 0.8 }}
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '3%',
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '8px',
          color: '#000',
          lineHeight: 1.5,
        }}
      >
        <div>┌────────────────┐</div>
        <div>│ DNA: READY     │</div>
        <div>└────────────────┘</div>
      </motion.div>

      {/* Scanline overlay for retro feel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.01) 2px, rgba(0,0,0,0.01) 3px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

'use client';

import { motion } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';

// ── Rotating content sets for each element ──

const CODE_BLOCK_SETS = [
  // Set 0 — left side
  [
    `interface BrandDNA {
  identity: string;
  voice: ToneProfile;
  values: string[];
}`,
    `type Reputation = {
  knownFor: string[];
  audience: Community;
  signal: number;
};`,
    `const creator = {
  archetype: "Prophet",
  pillars: ContentPillar[],
  voice: consistent,
};`,
    `interface Identity {
  content: PostHistory;
  patterns: string[];
  growth: Trajectory;
}`,
  ],
  // Set 1 — right side
  [
    `type Score = {
  overall: number;
  define: number;
  check: number;
  generate: number;
  scale: number;
};`,
    `type Analysis = {
  voice: Spectrum;
  topics: string[];
  cadence: Frequency;
  reach: TierLevel;
};`,
    `interface Metrics {
  followers: number;
  ratio: number;
  listed: number;
  verified: boolean;
};`,
    `type BrandPillar = {
  theme: string;
  posts: number;
  engagement: Rate;
  consistency: Score;
};`,
  ],
];

const LOG_SETS = [
  [
    { text: '// ═══════════════════════════════════════', type: 'divider' },
    { text: '// BRANDOS v2.0 — SYSTEM INITIALIZED', type: 'comment' },
    { text: '// ═══════════════════════════════════════', type: 'divider' },
    { text: '', type: 'empty' },
    { text: 'const status = {', type: 'code' },
    { text: '  engine: "READY",', type: 'code' },
    { text: '  api: "CONNECTED",', type: 'code' },
    { text: '  model: "ACTIVE"', type: 'code' },
    { text: '};', type: 'code' },
  ],
  [
    { text: '// ═══════════════════════════════════════', type: 'divider' },
    { text: '// SCANNING CONTENT PILLARS...', type: 'comment' },
    { text: '// ═══════════════════════════════════════', type: 'divider' },
    { text: '', type: 'empty' },
    { text: 'const pillars = await scan({', type: 'code' },
    { text: '  depth: "full",', type: 'code' },
    { text: '  mode: "content-first",', type: 'code' },
    { text: '  signal: "reputation"', type: 'code' },
    { text: '});', type: 'code' },
  ],
  [
    { text: '// ═══════════════════════════════════════', type: 'divider' },
    { text: '// VOICE PATTERN DETECTED', type: 'comment' },
    { text: '// ═══════════════════════════════════════', type: 'divider' },
    { text: '', type: 'empty' },
    { text: 'const voice = {', type: 'code' },
    { text: '  tone: "authoritative",', type: 'code' },
    { text: '  consistency: 0.87,', type: 'code' },
    { text: '  archetype: "resolved"', type: 'code' },
    { text: '};', type: 'code' },
  ],
  [
    { text: '// ═══════════════════════════════════════', type: 'divider' },
    { text: '// REPUTATION ENGINE ONLINE', type: 'comment' },
    { text: '// ═══════════════════════════════════════', type: 'divider' },
    { text: '', type: 'empty' },
    { text: 'const brand = {', type: 'code' },
    { text: '  score: calculating,', type: 'code' },
    { text: '  tier: "resolving...",', type: 'code' },
    { text: '  dna: "sequencing"', type: 'code' },
    { text: '};', type: 'code' },
  ],
];

const RIGHT_COMMENT_SETS = [
  [
    '/* ─────────────────────── */',
    '/*  BRAND DNA SEQUENCER    */',
    '/*  Status: OPERATIONAL    */',
    '/*  Mode: ANALYSIS         */',
    '/* ─────────────────────── */',
  ],
  [
    '/* ─────────────────────── */',
    '/*  CONTENT SCANNER        */',
    '/*  Pillars: DETECTED      */',
    '/*  Voice: CONSISTENT      */',
    '/* ─────────────────────── */',
  ],
  [
    '/* ─────────────────────── */',
    '/*  REPUTATION ENGINE      */',
    '/*  Signal: STRONG          */',
    '/*  Tier: RESOLVING...     */',
    '/* ─────────────────────── */',
  ],
  [
    '/* ─────────────────────── */',
    '/*  ARCHETYPE MODULE       */',
    '/*  Match: COMPUTING       */',
    '/*  Confidence: HIGH       */',
    '/* ─────────────────────── */',
  ],
];

const BOTTOM_BOX_SETS = [
  // Left boxes
  [
    ['┌──────────────────┐', '│  BRAND ANALYSIS  │', '│  MODULE: ACTIVE  │', '└──────────────────┘'],
    ['┌──────────────────┐', '│  VOICE SCANNER   │', '│  TONE: LOCKED    │', '└──────────────────┘'],
    ['┌──────────────────┐', '│  PILLAR ENGINE   │', '│  THEMES: 3       │', '└──────────────────┘'],
    ['┌──────────────────┐', '│  SCORE ENGINE    │', '│  COMPUTING...    │', '└──────────────────┘'],
  ],
  // Right boxes
  [
    ['┌──────────────────┐', '│  DNA SEQUENCER   │', '│  STATUS: READY   │', '└──────────────────┘'],
    ['┌──────────────────┐', '│  GROWTH TRACKER  │', '│  TREND: UP       │', '└──────────────────┘'],
    ['┌──────────────────┐', '│  CONTENT INDEX   │', '│  POSTS: SCANNED  │', '└──────────────────┘'],
    ['┌──────────────────┐', '│  REPUTATION DB   │', '│  SIGNAL: STRONG  │', '└──────────────────┘'],
  ],
];

// ── Positions for code blocks ──
const CODE_POSITIONS = [
  { top: '32%', left: '4%' },
  { top: '6%', right: '5%' },
];
const CODE_OPACITIES = [0.3, 0.25];

// ── Shared typewriter hook ──
function useTypewriter(texts: string[], cycleDuration: number, typeSpeed = 35, deleteSpeed = 20) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting'>('typing');

  useEffect(() => {
    const text = texts[index];

    if (phase === 'typing') {
      if (displayed.length < text.length) {
        const timer = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), typeSpeed);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setPhase('deleting'), cycleDuration);
        return () => clearTimeout(timer);
      }
    }

    if (phase === 'deleting') {
      if (displayed.length > 0) {
        const timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), deleteSpeed);
        return () => clearTimeout(timer);
      } else {
        setIndex((index + 1) % texts.length);
        setPhase('typing');
      }
    }
  }, [displayed, phase, index, texts, cycleDuration, typeSpeed, deleteSpeed]);

  return displayed;
}

// ── Line-by-line typewriter for multi-line blocks ──
function useLineTypewriter(
  sets: string[][],
  cycleDuration: number,
  lineDelay = 150,
) {
  const [setIndex, setSetIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'holding' | 'clearing'>('typing');
  const lines = sets[setIndex];

  useEffect(() => {
    if (phase === 'typing') {
      if (visibleLines < lines.length) {
        const timer = setTimeout(() => setVisibleLines(v => v + 1), lineDelay);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setPhase('clearing'), cycleDuration);
        return () => clearTimeout(timer);
      }
    }

    if (phase === 'clearing') {
      if (visibleLines > 0) {
        const timer = setTimeout(() => setVisibleLines(v => v - 1), lineDelay / 2);
        return () => clearTimeout(timer);
      } else {
        setSetIndex((setIndex + 1) % sets.length);
        setPhase('typing');
      }
    }
  }, [visibleLines, phase, setIndex, lines.length, sets.length, cycleDuration, lineDelay]);

  return { lines, visibleLines };
}

function getLogColor(type: string): string {
  switch (type) {
    case 'comment': return 'rgba(0, 71, 255, 0.85)';
    case 'divider': return 'rgba(0, 0, 0, 0.4)';
    case 'code': return 'rgba(0, 0, 0, 0.65)';
    default: return 'rgba(0, 0, 0, 0.5)';
  }
}

// ── Typed Log Block (left side terminal) ──
function TypedLogBlock() {
  const [setIndex, setSetIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'holding' | 'clearing'>('typing');
  const logSet = LOG_SETS[setIndex];

  useEffect(() => {
    if (phase === 'typing') {
      if (visibleLines < logSet.length) {
        const timer = setTimeout(() => setVisibleLines(v => v + 1), 140);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setPhase('clearing'), 7000);
        return () => clearTimeout(timer);
      }
    }

    if (phase === 'clearing') {
      if (visibleLines > 0) {
        const timer = setTimeout(() => setVisibleLines(v => v - 1), 60);
        return () => clearTimeout(timer);
      } else {
        setSetIndex((setIndex + 1) % LOG_SETS.length);
        setPhase('typing');
      }
    }
  }, [visibleLines, phase, setIndex, logSet.length]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '6%',
        left: '4%',
        fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
        fontSize: 'clamp(9px, 1vw, 11px)',
        lineHeight: 1.8,
      }}
    >
      {logSet.slice(0, visibleLines).map((line, i) => (
        <motion.div
          key={`${setIndex}-${i}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{ color: getLogColor(line.type), whiteSpace: 'pre' }}
        >
          {line.text}
        </motion.div>
      ))}
      {phase === 'typing' && visibleLines < logSet.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color: 'rgba(0, 71, 255, 0.6)' }}
        >
          █
        </motion.span>
      )}
    </div>
  );
}

// ── Typed Code Block (interface/type definitions) ──
function TypedCodeBlock({ setIndex: blockIndex }: { setIndex: number }) {
  const texts = CODE_BLOCK_SETS[blockIndex];
  const displayed = useTypewriter(texts, 8000, 25, 15);
  const position = CODE_POSITIONS[blockIndex];
  const opacity = CODE_OPACITIES[blockIndex];

  // Find the longest text to hold space
  const longest = texts.reduce((a, b) => a.length > b.length ? a : b);

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
      }}
    >
      {/* Invisible spacer */}
      <pre
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 'clamp(9px, 1.1vw, 12px)',
          lineHeight: 1.7,
          margin: 0,
          whiteSpace: 'pre',
          visibility: 'hidden',
        }}
        aria-hidden="true"
      >
        {longest}
      </pre>
      {/* Visible typed text */}
      <motion.pre
        initial={{ opacity: 0 }}
        animate={{ opacity }}
        transition={{ duration: 1.5 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 'clamp(9px, 1.1vw, 12px)',
          lineHeight: 1.7,
          color: '#000000',
          margin: 0,
          whiteSpace: 'pre',
          userSelect: 'none',
        }}
      >
        {displayed}
        <motion.span
          animate={{ opacity: [opacity, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        >
          █
        </motion.span>
      </motion.pre>
    </div>
  );
}

// ── Typed Comment Block (right side) ──
function TypedCommentBlock() {
  const { lines, visibleLines } = useLineTypewriter(RIGHT_COMMENT_SETS, 6000, 180);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ duration: 1, delay: 1.2 }}
      style={{
        position: 'absolute',
        top: '35%',
        right: '5%',
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: 'clamp(9px, 1vw, 11px)',
        lineHeight: 1.8,
        color: 'rgba(0, 0, 0, 0.7)',
      }}
    >
      {lines.slice(0, visibleLines).map((line, i) => (
        <motion.div
          key={`${line}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{ whiteSpace: 'pre' }}
        >
          {line}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Typed Box (bottom decorative boxes) ──
function TypedBox({ side }: { side: 0 | 1 }) {
  const sets = BOTTOM_BOX_SETS[side];
  const { lines, visibleLines } = useLineTypewriter(sets, 5500, 120);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      transition={{ duration: 1, delay: side === 0 ? 0.5 : 0.8 }}
      style={{
        position: 'absolute',
        bottom: '12%',
        ...(side === 0 ? { left: '6%' } : { right: '6%' }),
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: '10px',
        color: '#000',
        lineHeight: 1.5,
      }}
    >
      {lines.slice(0, visibleLines).map((line, i) => (
        <motion.div
          key={`${line}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {line}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Main Component ──
export default function HybridCodeBg() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* TypeScript code blocks — typed, cycle every ~8s */}
      <TypedCodeBlock setIndex={0} />
      <TypedCodeBlock setIndex={1} />

      {/* Left terminal logs — cycle every ~7s */}
      <TypedLogBlock />

      {/* Right comment block — cycle every ~6s */}
      <TypedCommentBlock />

      {/* Bottom decorative boxes — cycle every ~5.5s */}
      <TypedBox side={0} />
      <TypedBox side={1} />
    </div>
  );
}

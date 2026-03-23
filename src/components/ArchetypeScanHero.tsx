'use client';

import { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { normalizeArchetypeName } from '@/lib/archetype-names';
import { ARCHETYPE_DATA, getArchetypeInfo } from '@/lib/archetype-descriptions';
import ArchetypeCard from '@/components/ArchetypeCard';
import { domToPng } from 'modern-screenshot';

// ============================================================================
// Types
// ============================================================================
type FlowState = 'input' | 'journey' | 'reveal';

interface ProfileData {
  name: string;
  username: string;
  profile_image_url: string;
  followers_count: number;
  verified: boolean;
}

interface ArchetypeResult {
  profile: ProfileData;
  archetype: {
    primary: string;
    emoji: string;
    tagline: string;
    description: string;
    strengths: string[];
    growthTip: string;
  };
  tier: number;
  tierLabel: string;
  color: string;
  rarity: number;
  traits: string[];
  evolutionPaths: string[];
  isReturning: boolean;
}

// ============================================================================
// Dark Mode Background — terminal text elements (dark version of HybridCodeBg)
// ============================================================================
// ── Dark typewriter hook ──
function useDarkTypewriter(texts: string[], cycleDuration: number, typeSpeed = 35, deleteSpeed = 20) {
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

  return { displayed, isTyping: phase === 'typing' && displayed.length < texts[index].length };
}

// ── Dark line-by-line typewriter ──
function DarkTypedLogBlock({ logs, position, color }: {
  logs: { text: string; color?: string }[][];
  position: React.CSSProperties;
  color: string;
}) {
  const [setIndex, setSetIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'holding' | 'clearing'>('typing');
  const logSet = logs[setIndex];

  useEffect(() => {
    if (phase === 'typing') {
      if (visibleLines < logSet.length) {
        const timer = setTimeout(() => setVisibleLines((v) => v + 1), 140);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setPhase('clearing'), 7000);
        return () => clearTimeout(timer);
      }
    }
    if (phase === 'clearing') {
      if (visibleLines > 0) {
        const timer = setTimeout(() => setVisibleLines((v) => v - 1), 60);
        return () => clearTimeout(timer);
      } else {
        setSetIndex((setIndex + 1) % logs.length);
        setPhase('typing');
      }
    }
  }, [visibleLines, phase, setIndex, logSet.length, logs.length]);

  return (
    <div style={{ position: 'absolute', ...position, fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(9px, 1vw, 11px)', lineHeight: 1.8 }}>
      {logSet.slice(0, visibleLines).map((line, i) => (
        <motion.div key={`${setIndex}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} style={{ color: line.color || color, whiteSpace: 'pre', background: 'none' }}>
          {line.text}
        </motion.div>
      ))}
      {phase === 'typing' && visibleLines < logSet.length && (
        <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ color: 'rgba(0, 71, 255, 0.5)' }}>█</motion.span>
      )}
    </div>
  );
}

function DarkTypedCodeBlock({ texts, position, opacity: targetOpacity }: {
  texts: string[];
  position: React.CSSProperties;
  opacity: number;
}) {
  const { displayed, isTyping } = useDarkTypewriter(texts, 8000, 25, 15);
  const longest = texts.reduce((a, b) => (a.length > b.length ? a : b));

  return (
    <div style={{ position: 'absolute', ...position }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(9px, 1.1vw, 12px)', lineHeight: 1.7, whiteSpace: 'pre', visibility: 'hidden', background: 'none', margin: 0, padding: 0 }} aria-hidden="true">{longest}</div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: targetOpacity }} transition={{ duration: 1.5 }} style={{ position: 'absolute', top: 0, left: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(9px, 1.1vw, 12px)', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', margin: 0, whiteSpace: 'pre', userSelect: 'none', background: 'none', padding: 0 }}>
        {displayed}
        <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ color: 'rgba(255,255,255,0.3)' }}>{isTyping ? '█' : ''}</motion.span>
      </motion.div>
    </div>
  );
}

const DARK_LOG_SETS = [
  [
    { text: '// ═══════════════════════════════════', color: 'rgba(255,255,255,0.15)' },
    { text: '// IDENTITY_PROTOCOL v1.0 — ACTIVE', color: 'rgba(0, 71, 255, 0.5)' },
    { text: '// ═══════════════════════════════════', color: 'rgba(255,255,255,0.15)' },
    { text: '' },
    { text: 'const protocol = {', color: 'rgba(255,255,255,0.25)' },
    { text: '  engine: "READY",', color: 'rgba(255,255,255,0.25)' },
    { text: '  archetypes: 8,', color: 'rgba(255,255,255,0.25)' },
    { text: '  mode: "DECRYPT"', color: 'rgba(255,255,255,0.25)' },
    { text: '};', color: 'rgba(255,255,255,0.25)' },
  ],
  [
    { text: '// ═══════════════════════════════════', color: 'rgba(255,255,255,0.15)' },
    { text: '// SCANNING CREATOR SIGNAL...', color: 'rgba(0, 71, 255, 0.5)' },
    { text: '// ═══════════════════════════════════', color: 'rgba(255,255,255,0.15)' },
    { text: '' },
    { text: 'const scan = await decrypt({', color: 'rgba(255,255,255,0.25)' },
    { text: '  depth: "full",', color: 'rgba(255,255,255,0.25)' },
    { text: '  archetypes: true,', color: 'rgba(255,255,255,0.25)' },
    { text: '  tier: "auto"', color: 'rgba(255,255,255,0.25)' },
    { text: '});', color: 'rgba(255,255,255,0.25)' },
  ],
];

const DARK_CODE_LEFT = [
  `interface CreatorDNA {
  archetype: Archetype;
  signal: Pattern[];
  identity: string;
  tier: 1 | 2 | 3 | 4 | 5;
}`,
  `type Identity = {
  content: PostHistory;
  patterns: string[];
  evolution: Trajectory;
};`,
  `const creator = {
  archetype: "NULL",
  signal: Pattern[],
  decrypted: true,
};`,
];

const DARK_CODE_RIGHT = [
  `type Archetype =
  | "ARC"
  | "ENTROPY"
  | "NULL"
  | "FREQ"
  | "RELAY"
  | "BUILD.EXE"
  | "SOURCE"
  | "FORESIGHT";`,
  `type EvolutionPath = {
  from: Archetype;
  to: Archetype[];
  trigger: ScoreChange;
  minDays: 30;
};`,
  `interface ArchetypeMatrix {
  tiers: 5;
  identities: 8;
  terminal: ["SAGE", "FORESIGHT"];
  entry: "ARC";
};`,
];

function DarkCodeBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Top-left: animated terminal logs */}
      <DarkTypedLogBlock logs={DARK_LOG_SETS} position={{ top: '6%', left: '4%' }} color="rgba(255,255,255,0.25)" />

      {/* Middle-left: animated TypeScript interface */}
      <DarkTypedCodeBlock texts={DARK_CODE_LEFT} position={{ top: '42%', left: '3%' }} opacity={0.25} />

      {/* Top-right: animated archetype type */}
      <DarkTypedCodeBlock texts={DARK_CODE_RIGHT} position={{ top: '10%', right: '4%' }} opacity={0.2} />

      {/* Middle-right: animated comment block */}
      <DarkTypedLogBlock
        logs={[
          [
            { text: '/* ─────────────────────── */', color: 'rgba(255,255,255,0.12)' },
            { text: '/*  ARCHETYPE SCANNER      */', color: 'rgba(0, 71, 255, 0.4)' },
            { text: '/*  Identities: 8          */', color: 'rgba(0, 71, 255, 0.4)' },
            { text: '/*  Tiers: 5               */', color: 'rgba(0, 71, 255, 0.4)' },
            { text: '/* ─────────────────────── */', color: 'rgba(255,255,255,0.12)' },
          ],
          [
            { text: '/* ─────────────────────── */', color: 'rgba(255,255,255,0.12)' },
            { text: '/*  EVOLUTION ENGINE        */', color: 'rgba(0, 71, 255, 0.4)' },
            { text: '/*  Paths: MAPPED           */', color: 'rgba(0, 71, 255, 0.4)' },
            { text: '/*  Status: READY           */', color: 'rgba(0, 71, 255, 0.4)' },
            { text: '/* ─────────────────────── */', color: 'rgba(255,255,255,0.12)' },
          ],
        ]}
        position={{ top: '45%', right: '5%' }}
        color="rgba(255,255,255,0.2)"
      />

      {/* Bottom-left box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        style={{ position: 'absolute', bottom: '12%', left: '6%', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.12)', whiteSpace: 'pre', background: 'none', margin: 0, padding: 0 }}
      >
{`┌─────────────────────┐
│  IDENTITY_MATRIX    │
│  STATUS: STANDBY    │
└─────────────────────┘`}
      </motion.div>

      {/* Bottom-right box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        style={{ position: 'absolute', bottom: '12%', right: '6%', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.12)', whiteSpace: 'pre', textAlign: 'right', background: 'none', margin: 0, padding: 0 }}
      >
{`┌─────────────────────┐
│  ARCHETYPE_DB       │
│  ENTRIES: 8         │
└─────────────────────┘`}
      </motion.div>
    </div>
  );
}

// ============================================================================
// Rotating Taglines — Identity-themed
// ============================================================================
const ROTATING_TAGLINES = [
  "Drop your handle. We'll decode the rest.",
  'Your content reveals your identity.',
  '8 archetypes. Which one are you?',
  'The timeline already knows who you are.',
];

function RotatingTagline() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting'>('typing');

  useEffect(() => {
    const text = ROTATING_TAGLINES[currentIndex];

    if (phase === 'typing') {
      if (displayed.length < text.length) {
        const timer = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 50);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setPhase('deleting'), 3500);
        return () => clearTimeout(timer);
      }
    }

    if (phase === 'deleting') {
      if (displayed.length > 0) {
        const timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
        return () => clearTimeout(timer);
      } else {
        setCurrentIndex((currentIndex + 1) % ROTATING_TAGLINES.length);
        setPhase('typing');
      }
    }
  }, [displayed, phase, currentIndex]);

  const longest = ROTATING_TAGLINES.reduce((a, b) => (a.length > b.length ? a : b));

  return (
    <div
      className="hero-tagline"
      style={{
        marginTop: '100px',
        marginBottom: '16px',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* Invisible spacer */}
      <span
        className="hero-tagline-text hero-tagline-spacer"
        style={{ visibility: 'hidden' }}
        aria-hidden="true"
      >
        {longest}|
      </span>
      {/* Visible text */}
      <span
        className="hero-tagline-text"
        style={{
          color: 'rgba(255,255,255,0.6)',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'max-content',
        }}
      >
        {displayed}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          style={{ marginLeft: '2px', fontWeight: 300 }}
        >
          |
        </motion.span>
      </span>
    </div>
  );
}

// ============================================================================
// Typewriter Placeholder
// ============================================================================
function TypewriterPlaceholder({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span
      style={{
        position: 'absolute',
        left: '32px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontFamily: "'VCR OSD Mono', monospace",
        fontSize: '1.125rem',
        color: 'rgba(255,255,255,0.25)',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {displayed}
    </span>
  );
}

// ============================================================================
// Journey Phases — Identity Decryption
// ============================================================================
const DECRYPT_PHASES = [
  {
    title: 'DECRYPTING IDENTITY',
    command: '> identity.decrypt(signal_pattern)',
    items: [
      'Reading signal patterns...',
      'Extracting behavioral fingerprint...',
      'Cross-referencing archetype matrix...',
    ],
  },
  {
    title: 'PATTERN RECOGNITION',
    command: '> pattern.match(archetype_db)',
    items: [
      'Isolating dominant traits...',
      'Calculating archetype affinity...',
      'Narrowing classification...',
    ],
  },
  {
    title: 'ARCHETYPE LOCK',
    command: '> archetype.lock(confirmed)',
    items: [
      'Identity pattern confirmed.',
      'Archetype signature locked.',
    ],
  },
];

function DecryptPhase({
  phase,
  isActive,
  isComplete,
}: {
  phase: (typeof DECRYPT_PHASES)[number];
  isActive: boolean;
  isComplete: boolean;
}) {
  const [visibleItems, setVisibleItems] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    setVisibleItems(0);
    const timers: NodeJS.Timeout[] = [];
    phase.items.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleItems(i + 1), (i + 1) * 700));
    });
    return () => timers.forEach(clearTimeout);
  }, [isActive, phase.items]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isActive || isComplete ? 1 : 0.25, y: 0 }}
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: '20px',
        width: '100%',
        maxWidth: '440px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ color: isComplete ? '#10B981' : isActive ? '#fff' : '#333', fontSize: '11px' }}>
          {isComplete ? '✓' : isActive ? '▶' : '○'}
        </span>
        <span style={{ fontSize: '11px', letterSpacing: '0.15em', color: isComplete ? '#10B981' : isActive ? '#ddd' : '#333', fontWeight: 700 }}>
          {phase.title}
        </span>
      </div>
      <div style={{ fontSize: '10px', color: '#2a2a2a', marginBottom: '6px', paddingLeft: '20px' }}>{phase.command}</div>
      <AnimatePresence>
        {isActive && phase.items.map((item, i) =>
          i < visibleItems && (
            <motion.div key={item} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: '11px', color: '#666', paddingLeft: '20px', marginBottom: '3px' }}>
              <span style={{ color: '#222', marginRight: '8px' }}>│</span>{item}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AsciiBar({ progress }: { progress: number }) {
  const width = 24;
  const filled = Math.round((progress / 100) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'center' }}>
      <span style={{ color: '#fff' }}>[{bar}]</span> <span style={{ color: '#555' }}>{progress}%</span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
interface ArchetypeScanHeroProps {
  initialUsername?: string;
  autoStart?: boolean;
}

// =============================================================================
// Premium Card Wrapper — 3D tilt, archetype glow, holographic shimmer
// =============================================================================

function PremiumCardWrapper({ children, color }: { children: React.ReactNode; color: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // Spring-based tilt for buttery smooth movement
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 60, damping: 30, mass: 1.2 });
  const springY = useSpring(tiltY, { stiffness: 60, damping: 30, mass: 1.2 });

  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    tiltX.set((y - 0.5) * -10);
    tiltY.set((x - 0.5) * 10);
    setGlare({ x: x * 100, y: y * 100 });
  }, [tiltX, tiltY]);

  const handleMouseLeave = useCallback(() => {
    tiltX.set(0);
    tiltY.set(0);
    setGlare({ x: 50, y: 50 });
    setIsHovered(false);
  }, [tiltX, tiltY]);

  return (
    <motion.div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        rotateX: springX,
        rotateY: springY,
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? `0 12px 40px rgba(0,0,0,0.5), 0 0 30px ${color}25, 0 0 60px ${color}15`
          : `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${color}15`,
        animation: isHovered ? 'none' : 'cardFloat 3s ease-in-out infinite',
        cursor: 'default',
      }}
    >
      {/* The actual card */}
      {children}

      {/* Holographic shimmer overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: isHovered ? 0.12 : 0.04,
          transition: 'opacity 0.3s ease',
          background: `linear-gradient(
            ${105 + (glare.x - 50) * 0.5}deg,
            transparent 20%,
            rgba(255,100,100,0.3) 30%,
            rgba(255,255,100,0.3) 40%,
            rgba(100,255,100,0.3) 50%,
            rgba(100,100,255,0.3) 60%,
            rgba(255,100,255,0.3) 70%,
            transparent 80%
          )`,
          backgroundSize: '200% 200%',
          backgroundPosition: `${glare.x}% ${glare.y}%`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Light glare spot */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: isHovered ? 0.15 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.4) 0%, transparent 50%)`,
        }}
      />

      {/* Edge glow */}
      <div
        style={{
          position: 'absolute',
          inset: -1,
          borderRadius: '9px',
          pointerEvents: 'none',
          border: `1px solid ${isHovered ? `${color}40` : `${color}15`}`,
          transition: 'border-color 0.3s ease',
        }}
      />

      <style>{`
        @keyframes cardFloat {
          0%, 100% { transform: rotateX(0deg) rotateY(0deg) translateY(0px); }
          50% { transform: rotateX(0deg) rotateY(0deg) translateY(-4px); }
        }
      `}</style>
    </motion.div>
  );
}

export default function ArchetypeScanHero({ initialUsername, autoStart }: ArchetypeScanHeroProps) {
  const searchParams = useSearchParams();
  const [flowState, setFlowState] = useState<FlowState>('input');
  const [username, setUsername] = useState(initialUsername || '');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ArchetypeResult | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [showEvolutionHook, setShowEvolutionHook] = useState(false);
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [apiComplete, setApiComplete] = useState(false);
  const apiCompleteRef = useRef(false);
  const apiResultRef = useRef<ArchetypeResult | null>(null);
  const autoStartTriggered = useRef(false);

  useEffect(() => {
    if (initialUsername && autoStart && !autoStartTriggered.current && flowState === 'input') {
      autoStartTriggered.current = true;
      setUsername(initialUsername);
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUsername, autoStart]);

  useEffect(() => {
    if (flowState !== 'journey') return;
    const phaseTimers: NodeJS.Timeout[] = [];
    const progressTimer = setInterval(() => {
      setJourneyProgress((prev) => {
        if (prev >= 100) return 100;
        if (prev >= 85 && !apiCompleteRef.current) return prev + 0.5;
        return prev + 1.8;
      });
    }, 100);
    setCurrentPhase(1);
    phaseTimers.push(setTimeout(() => setCurrentPhase(2), 2800));
    phaseTimers.push(setTimeout(() => setCurrentPhase(3), 5200));
    return () => { clearInterval(progressTimer); phaseTimers.forEach(clearTimeout); };
  }, [flowState]);

  useEffect(() => {
    if (flowState !== 'journey') return;
    if (journeyProgress >= 100 && apiComplete && apiResultRef.current) {
      setTimeout(() => { setResult(apiResultRef.current); setFlowState('reveal'); }, 500);
    }
  }, [flowState, journeyProgress, apiComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Enter a handle to identify'); return; }
    setError('');
    setIsValidating(true);
    try {
      const profileResponse = await fetch('/api/x-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim() }) });
      const profileData = await profileResponse.json();
      if (!profileResponse.ok || !profileData.profile) { setError(profileData?.error || `@${username.trim()} not found`); setIsValidating(false); return; }
      setIsValidating(false);
      setFlowState('journey');
      setCurrentPhase(0);
      setJourneyProgress(0);
      apiCompleteRef.current = false;
      setApiComplete(false);
      apiResultRef.current = null;
      const scanResponse = await fetch('/api/archetype-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim() }) });
      if (!scanResponse.ok) throw new Error('Scan failed');
      const scanResult: ArchetypeResult = await scanResponse.json();
      // Merge profile data from validation (API may not have it for cached users)
      if (!scanResult.profile.profile_image_url && profileData.profile) {
        scanResult.profile.profile_image_url = profileData.profile.profile_image_url || '';
        scanResult.profile.name = profileData.profile.name || scanResult.profile.name;
        scanResult.profile.followers_count = profileData.profile.public_metrics?.followers_count || 0;
        scanResult.profile.verified = profileData.profile.verified || false;
      }
      apiResultRef.current = scanResult;
      apiCompleteRef.current = true;
      setApiComplete(true);
    } catch { setError('Decryption failed. Try again.'); setFlowState('input'); setIsValidating(false); }
  };

  const handleShareToX = useCallback(() => {
    if (!result) return;
    const info = getArchetypeInfo(result.archetype.primary);
    const shareUrl = `https://mybrandos.app/archetype/${result.profile.username}?a=${encodeURIComponent(result.archetype.primary)}&t=${result.tier}&tl=${encodeURIComponent(result.tierLabel)}&n=${encodeURIComponent(result.profile.name)}`;
    const text = `I'm ${result.archetype.primary} — "${info?.tagline || result.archetype.tagline}"\n\nTop ${result.rarity}% of creators.\n\nDiscover your Creator Archetype:`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  }, [result]);

  const captureCardImage = useCallback(async (): Promise<string | null> => {
    const card = document.getElementById('archetype-card');
    if (!card) return null;

    // Clone the card into an off-screen container at native size (no transforms)
    const clone = card.cloneNode(true) as HTMLElement;
    clone.removeAttribute('id');
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;z-index:-1;pointer-events:none;';
    container.appendChild(clone);
    document.body.appendChild(container);

    try {
      const dataUrl = await domToPng(clone, { scale: 2, quality: 1, timeout: 30000 });
      return dataUrl;
    } finally {
      document.body.removeChild(container);
    }
  }, []);

  const handleCopyCard = useCallback(async () => {
    if (!result || isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const dataUrl = await captureCardImage();
      if (!dataUrl) throw new Error('No image');
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeType = 'image/png';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })]);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy card image:', err);
      const shareUrl = `https://mybrandos.app/archetype/${result.profile.username}?a=${encodeURIComponent(result.archetype.primary)}&t=${result.tier}&tl=${encodeURIComponent(result.tierLabel)}&n=${encodeURIComponent(result.profile.name)}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
    setIsGeneratingImage(false);
  }, [result, isGeneratingImage, captureCardImage]);

  const handleDownloadCard = useCallback(async () => {
    if (!result || isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const dataUrl = await captureCardImage();
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `brandos-${result.archetype.primary.toLowerCase()}-${result.profile.username}.png`;
        a.click();
      }
    } catch (err) { console.error('Failed to capture card:', err); }
    setIsGeneratingImage(false);
  }, [result, isGeneratingImage, captureCardImage]);

  const handleEvolutionSignup = async () => {
    if (!email.trim() || !result) return;
    setEmailStatus('sending');
    try {
      const archetypeName = normalizeArchetypeName(result.archetype.primary);
      const info = getArchetypeInfo(archetypeName);

      const response = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), source: 'archetype-scan', xUsername: result.profile.username, brandData: { score: 0, archetype: archetypeName, archetypeEmoji: info?.emoji || result.archetype.emoji, archetypeTagline: result.archetype.tagline, archetypeDescription: result.archetype.description, archetypeIconUrl: `https://mybrandos.app/archetypes/${encodeURIComponent(archetypeName)}.png`, archetypeStrengths: result.archetype.strengths, evolutionPaths: result.evolutionPaths, traits: result.traits, tier: result.tier, tierLabel: result.tierLabel } }) });
      if (response.ok || response.status === 409) { setEmailStatus('success'); } else { throw new Error('Signup failed'); }
    } catch { setEmailStatus('error'); }
  };

  // ============================================================================
  // Render — Dark mode version of homepage design
  // ============================================================================
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: flowState === 'input' ? 'hidden' : 'visible',
        background: '#131316',
        padding: flowState === 'input' ? '0' : '48px 24px',
      }}
    >
      {/* Dark code background (INPUT state) */}
      {flowState === 'input' && <DarkCodeBg />}

      {/* Vignette overlay — darkened edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* CRT Scanlines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Film grain texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Subtle center glow */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 71, 255, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Corner brackets — same as homepage but white/dim */}
      <AnimatePresence>
        {flowState === 'input' && (
          <>
            {[
              { top: 16, left: 16, borderTop: '1px solid rgba(255,255,255,0.2)', borderLeft: '1px solid rgba(255,255,255,0.2)' },
              { top: 16, right: 16, borderTop: '1px solid rgba(255,255,255,0.2)', borderRight: '1px solid rgba(255,255,255,0.2)' },
              { bottom: 16, left: 16, borderBottom: '1px solid rgba(255,255,255,0.2)', borderLeft: '1px solid rgba(255,255,255,0.2)' },
              { bottom: 16, right: 16, borderBottom: '1px solid rgba(255,255,255,0.2)', borderRight: '1px solid rgba(255,255,255,0.2)' },
            ].map((pos, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                style={{ position: 'fixed', width: 30, height: 30, pointerEvents: 'none', zIndex: 20, ...pos }}
              />
            ))}

            {/* Version label — top-right */}
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} transition={{ delay: 1.2 }} style={{ position: 'fixed', top: 22, right: 54, fontFamily: "'PP NeueBit', monospace", fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none', zIndex: 20 }}>
              v1.0
            </motion.span>

            {/* Blue accent line — top */}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.0, duration: 0.8, ease: 'easeOut' }} style={{ position: 'fixed', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0, 71, 255, 0.3), transparent)', pointerEvents: 'none', zIndex: 20, transformOrigin: 'center' }} />

            {/* Bottom center */}
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }} transition={{ delay: 1.4 }} style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', fontFamily: "'PP NeueBit', monospace", fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20 }}>
              ── 8 ARCHETYPES // 1 IDENTITY ──
            </motion.span>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ================================================================ */}
        {/* INPUT STATE — Dark mirror of homepage */}
        {/* ================================================================ */}
        {flowState === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '100%', width: '100%', height: '100vh', maxHeight: '100vh', position: 'relative', zIndex: 10, padding: '24px', boxSizing: 'border-box' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0px', padding: 'clamp(16px, 4vw, 48px) clamp(16px, 4vw, 32px) 0px clamp(16px, 4vw, 32px)', width: '100%', height: '100%' }}
            >
              {/* Logo — white SVG for dark bg */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="hero-logo-wrapper"
                style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'visible', marginTop: '-60px' }}
              >
                <img
                  src="/brandos-hero-logo-white.svg"
                  alt="BrandOS"
                  className="hero-logo-img"
                  style={{ height: 'auto', objectFit: 'contain' }}
                />
              </motion.div>

              {/* Rotating tagline — identity-themed */}
              <RotatingTagline />

              {/* Input form — same layout, dark colors */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '420px' }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  style={{ position: 'relative', width: '100%' }}
                >
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontFamily: "'VCR OSD Mono', monospace", fontSize: '1.125rem', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none', zIndex: 1 }}>
                    &gt;
                  </span>
                  {!username && <TypewriterPlaceholder text="enter @username" />}
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                    placeholder=""
                    maxLength={15}
                    className="terminal-input"
                    style={{
                      width: '100%', fontSize: '1.125rem', padding: '1rem 1rem 1rem 32px', textAlign: 'left', borderRadius: '10px',
                      border: `1px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.1)'}`, background: 'rgba(255,255,255,0.04)',
                      backdropFilter: 'blur(8px)', color: '#ffffff', outline: 'none', transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 71, 255, 0.5)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 71, 255, 0.15)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#EF4444' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={isValidating}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                  whileHover={!isValidating ? { scale: 1.02 } : {}}
                  whileTap={!isValidating ? { scale: 0.98 } : {}}
                  style={{
                    width: '100%', fontFamily: "'VCR OSD Mono', monospace", fontSize: '13px', letterSpacing: '0.15em', color: '#ffffff',
                    background: '#0047FF', border: 'none', padding: '1rem', borderRadius: '10px', cursor: isValidating ? 'wait' : 'pointer',
                    opacity: isValidating ? 0.7 : 1, boxShadow: '0 4px 24px rgba(0, 71, 255, 0.4), 0 0 48px rgba(0, 71, 255, 0.2)', transition: 'opacity 0.3s ease',
                  }}
                >
                  {isValidating ? 'DECRYPTING...' : 'IDENTIFY MY ARCHETYPE →'}
                </motion.button>

                {error && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: "'VCR OSD Mono', monospace", fontSize: '12px', color: '#EF4444', margin: 0 }}>
                    {error}
                  </motion.p>
                )}
              </motion.form>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} style={{ fontFamily: "'PP NeueBit', monospace", fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '1.5rem' }}>
              ── WORKS WITH ANY PUBLIC X ACCOUNT ──
            </motion.p>
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* JOURNEY STATE */}
        {/* ================================================================ */}
        {flowState === 'journey' && (
          <motion.div key="journey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px', padding: '0 24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', color: '#555', marginBottom: '4px' }}>{'>'} IDENTITY_PROTOCOL INITIATED</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: '#333' }}>{'>'} SUBJECT: @{username}</p>
            </motion.div>
            <div style={{ width: '100%', height: '1px', background: '#1a1a1a', marginBottom: '28px' }} />
            {DECRYPT_PHASES.map((phase, i) => <DecryptPhase key={phase.title} phase={phase} isActive={currentPhase === i + 1} isComplete={currentPhase > i + 1} />)}
            <div style={{ marginTop: '20px', width: '100%', maxWidth: '300px' }}><AsciiBar progress={Math.min(Math.round(journeyProgress), 100)} /></div>
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* REVEAL STATE */}
        {/* ================================================================ */}
        {flowState === 'reveal' && result && (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', padding: '0 24px', color: '#fff' }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', color: '#444', marginBottom: '24px' }}>
              IDENTITY_DECRYPTED // @{result.profile.username}
            </motion.p>

            {/* The card — premium interactive wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1.5 }}
              transition={{ delay: 0.4, duration: 0.6, type: 'spring', damping: 20 }}
              style={{ marginBottom: '100px', transformOrigin: 'center center', perspective: '1000px' }}
            >
              <PremiumCardWrapper color={result.color}>
                <ArchetypeCard
                  username={result.profile.username}
                  displayName={result.profile.name}
                  profileImageUrl={result.profile.profile_image_url}
                  archetype={result.archetype.primary}
                  description={result.archetype.description}
                  traits={result.traits}
                  rarity={result.rarity}
                  strengths={result.archetype.strengths}
                />
              </PremiumCardWrapper>
            </motion.div>

            {/* Share buttons */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '28px' }}>
              <motion.button onClick={handleCopyCard} disabled={isGeneratingImage} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ padding: '12px 24px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', background: '#fff', color: '#000', border: 'none', borderRadius: '4px', cursor: isGeneratingImage ? 'wait' : 'pointer', opacity: isGeneratingImage ? 0.5 : 1 }}>{shareStatus === 'copied' ? 'COPIED!' : 'COPY'}</motion.button>
              <motion.button onClick={handleDownloadCard} disabled={isGeneratingImage} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ padding: '12px 24px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', background: 'transparent', color: '#fff', border: '1px solid #252525', borderRadius: '4px', cursor: isGeneratingImage ? 'wait' : 'pointer', opacity: isGeneratingImage ? 0.5 : 1 }}>{isGeneratingImage ? 'GENERATING...' : 'DOWNLOAD'}</motion.button>
            </motion.div>

            {/* Evolution Hook */}
            {(
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} style={{ width: '100%', maxWidth: '460px', textAlign: 'center' }}>
                {!showEvolutionHook && emailStatus !== 'success' && (
                  <button onClick={() => setShowEvolutionHook(true)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: result.color, background: 'none', border: 'none', cursor: 'pointer', padding: '12px', letterSpacing: '0.05em', textDecoration: 'underline', textUnderlineOffset: '4px', textShadow: `0 0 12px ${result.color}60, 0 0 24px ${result.color}30` }}>
                    WHAT CAN I EVOLVE TO? →
                  </button>
                )}
                <AnimatePresence>
                  {showEvolutionHook && emailStatus !== 'success' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.15em', color: '#444', marginBottom: '12px' }}>EVOLUTION PATH PREVIEW</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 800, fontStyle: 'italic', color: result.color }}>{result.archetype.primary}</span>
                          <span style={{ color: '#333', fontSize: '14px' }}>→</span>
                          {result.evolutionPaths.slice(0, 3).map((path) => { const p = getArchetypeInfo(path); return (<span key={path} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: p?.color || '#666', border: `1px solid ${(p?.color || '#666')}25`, padding: '3px 8px', borderRadius: '2px' }}>{p?.emoji} {path}</span>); })}
                        </div>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#555', lineHeight: 1.5 }}>Drop your email to get notified when your full evolution roadmap is ready — including what triggers each shift.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={{ flex: 1, padding: '12px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: '4px', outline: 'none', color: '#fff' }} />
                        <motion.button onClick={handleEvolutionSignup} disabled={emailStatus === 'sending' || !email.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ padding: '12px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, background: result.color, color: '#fff', border: 'none', borderRadius: '4px', cursor: emailStatus === 'sending' ? 'wait' : 'pointer', opacity: emailStatus === 'sending' ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                          {emailStatus === 'sending' ? '...' : 'UNLOCK'}
                        </motion.button>
                      </div>
                      {emailStatus === 'error' && <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#EF4444', marginTop: '8px' }}>Something went wrong. Try again.</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
                {emailStatus === 'success' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${result.color}20`, borderRadius: '8px', padding: '20px' }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#10B981', marginBottom: '4px' }}>✓ YOU&apos;RE IN</p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#555' }}>We&apos;ll send your evolution roadmap when it&apos;s ready.</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {emailStatus === 'success' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '20px', textAlign: 'center' }}>
                <a href="https://mybrandos.app" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#0047FF', textDecoration: 'none', letterSpacing: '0.05em', textShadow: '0 0 12px rgba(0,71,255,0.4), 0 0 24px rgba(0,71,255,0.2)', borderBottom: '1px solid rgba(0,71,255,0.3)', paddingBottom: '2px' }}>CHECK YOUR BRAND SCORE →</a>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} style={{ marginTop: '20px' }}>
              <button onClick={() => { setFlowState('input'); setResult(null); setUsername(''); setShowEvolutionHook(false); setEmailStatus('idle'); setEmail(''); }} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#333', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}>DECODE ANOTHER →</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

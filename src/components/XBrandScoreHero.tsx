'use client';

import { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from 'motion/react';
import dynamic from 'next/dynamic';
import BrandDNAPreview, { GeneratedBrandDNA } from './BrandDNAPreview';
import ShareableScoreCard, { ShareCardData } from './ShareableScoreCard';
import ShareableBentoCard, { mapToBentoData } from './ShareableBentoCard';
import BentoRevealGrid from './BentoRevealGrid';
import BrandOSDashboard, { BrandOSDashboardData } from './BrandOSDashboard';
import ImprovementRoadmap, { ImprovementRoadmapData } from './ImprovementRoadmap';
import { domToPng } from 'modern-screenshot';

// Dynamically import DNA scene to avoid SSR issues with Three.js
const DNAJourneyScene = dynamic(() => import('./DNAJourneyScene'), {
  ssr: false,
  loading: () => null,
});

// ============================================================================
// Types
// ============================================================================
interface XProfileData {
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  verified: boolean;
  location?: string;
  url?: string;
}

interface BrandScoreResult {
  overallScore: number;
  phases: {
    define: { score: number; insights: string[] };
    check: { score: number; insights: string[] };
    generate: { score: number; insights: string[] };
    scale: { score: number; insights: string[] };
  };
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
}

type FlowState = 'input' | 'journey' | 'reveal' | 'signup';

interface XBrandScoreHeroProps {
  theme: string;
}

// ============================================================================
// Helper Functions for BrandOS Dashboard
// ============================================================================

function formatFollowersDisplay(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toString();
}

function getArchetypePixelEmoji(archetype?: string): string {
  const emojiMap: Record<string, string> = {
    'The Prophet': '/emojis/Creatures & Nature/👽 - Alien.svg',
    'The Alpha': '/emojis/Symbols & Objects/⚡ - High Voltage.svg',
    'The Builder': '/emojis/Activities & Objects/🚀 - Rocket.svg',
    'The Educator': '/emojis/Faces & Emotions/🤓 - Nerd Face.svg',
    'The Degen': '/emojis/Faces & Emotions/🤪 - Zany Face.svg',
    'The Analyst': '/emojis/Creatures & Nature/👀 - Eyes.svg',
    'The Philosopher': '/emojis/Faces & Emotions/🤓 - Nerd Face.svg',
    'The Networker': '/emojis/Gestures & Hands/🤝 - Handshake.svg',
    'The Contrarian': '/emojis/Creatures & Nature/🔥 - Fire.svg',
    'The Creator': '/emojis/Activities & Objects/🚀 - Rocket.svg',
  };
  return emojiMap[archetype || ''] || '/emojis/Faces & Emotions/🤓 - Nerd Face.svg';
}

function getPersonalityTypeCode(archetype?: string): string {
  const typeMap: Record<string, string> = {
    'The Prophet': 'INTJ',
    'The Alpha': 'ENTJ',
    'The Builder': 'ISTP',
    'The Educator': 'ENFJ',
    'The Degen': 'ESTP',
    'The Analyst': 'INTP',
    'The Philosopher': 'INFJ',
    'The Networker': 'ESFJ',
    'The Contrarian': 'ENTP',
    'The Creator': 'ENFP',
  };
  return typeMap[archetype || ''] || 'INTJ';
}

// Strip emoji characters from archetype names (AI sometimes includes them)
function stripEmoji(str: string): string {
  return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
}

// ============================================================================
// Magnetic Button Component - Premium hover effect
// ============================================================================
interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

function MagneticButton({ children, style, onClick, type = 'button', disabled }: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    // Magnetic pull strength (adjust for more/less effect)
    const strength = 0.3;
    x.set(deltaX * strength);
    y.set(deltaY * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        x: springX,
        y: springY,
      }}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.button>
  );
}

// ============================================================================
// Animated Text Reveal Component - Letter by letter animation
// ============================================================================
interface AnimatedTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  staggerDelay?: number;
}

function AnimatedText({ text, style, delay = 0, staggerDelay = 0.03 }: AnimatedTextProps) {
  const letters = text.split('');

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay,
        staggerChildren: staggerDelay,
      },
    },
  };

  const child = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(10px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.span
      style={{ display: 'inline-flex', ...style }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={child}
          style={{ display: 'inline-block' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.span>
  );
}

// ============================================================================
// Typewriter Effect Component - Character-by-character animation
// ============================================================================
interface TypewriterTextProps {
  text: string;
  speed?: number;
}

function TypewriterText({ text, speed = 25 }: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  // Blinking cursor effect
  useEffect(() => {
    if (currentIndex < text.length) {
      const blinkInterval = setInterval(() => {
        setCursorVisible(prev => !prev);
      }, 400);
      return () => clearInterval(blinkInterval);
    }
  }, [currentIndex, text.length]);

  return (
    <>
      {displayText}
      {currentIndex < text.length && (
        <span style={{ opacity: cursorVisible ? 0.7 : 0 }}>|</span>
      )}
    </>
  );
}

// ============================================================================
// Phase Configuration - Enhanced with detailed analysis items
// ============================================================================
interface PhaseItem {
  label: string;
  description: string;
  dataKey?: keyof XProfileData | 'ratio' | 'account_age' | 'influence_tier';
}

interface PhaseConfigItem {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  explanation: string;
  items: PhaseItem[];
}

// Phase colors matching DNA ladder rungs in GlassDNA.tsx
const PHASE_COLORS = [
  '#E8A838', // Phase 1 (Define) - Golden Amber
  '#00ff88', // Phase 2 (Check) - Green
  '#9d4edd', // Phase 3 (Generate) - Purple
  '#ff6b35', // Phase 4 (Scale) - Orange
];

const phaseConfig: PhaseConfigItem[] = [
  {
    id: 'define',
    number: 1,
    title: 'DEFINE',
    subtitle: 'Extracting your brand DNA',
    explanation: 'Identifying the patterns, voice, and signals in your profile that make your content recognizably yours.',
    items: [
      {
        label: 'Name Sync',
        description: 'Locking onto identity... confirming brand-name alignment.',
        dataKey: 'name'
      },
      {
        label: 'Bio Extract',
        description: 'Parsing bio data... isolating core value proposition.',
        dataKey: 'description'
      },
      {
        label: 'Edge Finder',
        description: 'Scanning for differentiators... what makes you, you.'
      },
      {
        label: 'Audience Ping',
        description: 'Triangulating audience... mapping who\'s listening.'
      },
    ],
  },
  {
    id: 'check',
    number: 2,
    title: 'CHECK',
    subtitle: 'Checking brand coherence',
    explanation: 'Measuring how consistently your profile projects a unified brand—not scattered or contradictory signals.',
    items: [
      {
        label: 'Handle Lock',
        description: 'Syncing handle to identity... confirming recognition match.',
        dataKey: 'username'
      },
      {
        label: 'Tone Scan',
        description: 'Analyzing voice patterns... measuring consistency levels.'
      },
      {
        label: 'Polish Check',
        description: 'Scanning presentation metrics... assessing brand polish.'
      },
      {
        label: 'Content Flow',
        description: 'Reviewing post patterns... detecting consistency signals.'
      },
    ],
  },
  {
    id: 'generate',
    number: 3,
    title: 'GENERATE',
    subtitle: 'Priming content engine',
    explanation: 'Calibrating your profile data to power AI generation that captures your authentic voice—not generic outputs.',
    items: [
      {
        label: 'Field Scan',
        description: 'Verifying profile data points... checking completion status.',
        dataKey: 'location'
      },
      {
        label: 'Bio Parse',
        description: 'Deconstructing bio structure... analyzing readability index.'
      },
      {
        label: 'Link Trace',
        description: 'Tracing external pathways... confirming traffic routes.',
        dataKey: 'url'
      },
      {
        label: 'Activity Pulse',
        description: 'Measuring content cadence... evaluating engagement signals.',
        dataKey: 'tweet_count'
      },
    ],
  },
  {
    id: 'scale',
    number: 4,
    title: 'SCALE',
    subtitle: 'Initializing growth protocols',
    explanation: 'Your Brand DNA is compiled and ready. Activating the systems that will scale your presence while maintaining brand integrity.',
    items: [
      {
        label: 'Tier Scan',
        description: 'Classifying influence level... determining account tier.',
        dataKey: 'influence_tier'
      },
      {
        label: 'Reach Scan',
        description: 'Mapping audience perimeter... quantifying brand reach.',
        dataKey: 'followers_count'
      },
      {
        label: 'Network Ping',
        description: 'Pinging connection nodes... measuring interaction density.',
        dataKey: 'following_count'
      },
      {
        label: 'Age Verify',
        description: 'Validating account tenure... confirming establishment level.',
        dataKey: 'account_age'
      },
    ],
  },
];

// ============================================================================
// Confetti Component
// ============================================================================
function Confetti({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
    rotation: number;
  }>>([]);

  useEffect(() => {
    if (isActive) {
      const colors = ['#D4A574', '#E8A838', '#F5DEB3', '#ffffff', '#10B981', '#FFD700'];
      const newParticles = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: '50%',
            y: '40%',
            scale: 0,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            scale: [0, 1.2, 0.8],
            opacity: [1, 1, 0],
            rotate: particle.rotation,
          }}
          transition={{
            duration: 2.5,
            delay: particle.delay,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          style={{
            position: 'absolute',
            width: '10px',
            height: '10px',
            background: particle.color,
            borderRadius: particle.id % 2 === 0 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Score Gauge Component
// ============================================================================
function ScoreGauge({ score, isVisible, theme }: { score: number; isVisible: boolean; theme: string }) {
  const motionScore = useMotionValue(0);
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        const controls = animate(motionScore, score, {
          duration: 2,
          ease: [0.34, 1.56, 0.64, 1],
        });

        const unsubscribe = motionScore.on('change', (v) => {
          setCurrentScore(Math.round(v));
        });

        return () => {
          controls.stop();
          unsubscribe();
        };
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isVisible, score, motionScore]);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#D4A574';
    if (s >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'EXCELLENT';
    if (s >= 60) return 'GOOD';
    if (s >= 40) return 'NEEDS WORK';
    return 'CRITICAL';
  };

  return (
    <div style={{ position: 'relative', width: '220px', height: '220px' }}>
      {/* Glow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isVisible ? { opacity: 0.4, scale: 1 } : {}}
        transition={{ duration: 1, delay: 0.3 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '280px',
          height: '280px',
          background: `radial-gradient(circle, ${getScoreColor(currentScore)}50 0%, transparent 70%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="14"
        />
        <motion.circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={getScoreColor(currentScore)}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 110 110)"
          style={{
            filter: `drop-shadow(0 0 20px ${getScoreColor(currentScore)}80)`,
            transition: 'stroke 0.3s ease',
          }}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={isVisible ? { scale: 1 } : {}}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
        >
          <span
            style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '64px',
              fontWeight: 700,
              color: theme === 'dark' ? '#FFFFFF' : '#000000',
              lineHeight: 1,
            }}
          >
            {currentScore}
          </span>
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 1.5 }}
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: getScoreColor(currentScore),
            display: 'block',
            marginTop: '8px',
          }}
        >
          {getScoreLabel(currentScore)}
        </motion.span>
      </div>
    </div>
  );
}

// ============================================================================
// Helper function to get influence tier
// ============================================================================
function getInfluenceTier(followers: number): 'Nano' | 'Micro' | 'Mid' | 'Macro' | 'Mega' {
  if (followers >= 1000000) return 'Mega';
  if (followers >= 100000) return 'Macro';
  if (followers >= 10000) return 'Mid';
  if (followers >= 1000) return 'Micro';
  return 'Nano';
}

// ============================================================================
// Helper function to format profile data for display
// ============================================================================
function formatProfileValue(
  dataKey: PhaseItem['dataKey'],
  profile: XProfileData | null
): string | null {
  if (!profile || !dataKey) return null;

  switch (dataKey) {
    case 'name':
      return profile.name;
    case 'username':
      return `@${profile.username}`;
    case 'description':
      return profile.description
        ? (profile.description.length > 100
            ? profile.description.substring(0, 100) + '...'
            : profile.description)
        : 'No bio set';
    case 'verified':
      return profile.verified ? 'Verified ✓' : 'Not verified';
    case 'location':
      return profile.location || 'No location set';
    case 'url':
      return profile.url || 'No link added';
    case 'tweet_count':
      return `${profile.tweet_count.toLocaleString()} posts`;
    case 'followers_count':
      return `${profile.followers_count.toLocaleString()} followers`;
    case 'following_count':
      return `Following ${profile.following_count.toLocaleString()}`;
    case 'ratio':
      const ratio = profile.followers_count / Math.max(profile.following_count, 1);
      return `${ratio.toFixed(2)}:1 ratio`;
    case 'account_age':
      return 'Established account';
    case 'influence_tier':
      const followers = profile.followers_count;
      if (followers >= 1000000) return 'Mega Influencer';
      if (followers >= 100000) return 'Macro Influencer';
      if (followers >= 10000) return 'Mid-Tier';
      if (followers >= 1000) return 'Micro Influencer';
      return 'Nano Creator';
    default:
      return null;
  }
}

// ============================================================================
// Journey Phase Card Component - Enhanced with profile data display
// ============================================================================
function JourneyPhaseCard({
  phase,
  isActive,
  isCompleted,
  itemProgress,
  theme,
  profile,
  profileImage,
}: {
  phase: PhaseConfigItem;
  isActive: boolean;
  isCompleted: boolean;
  itemProgress: number;
  theme: string;
  profile: XProfileData | null;
  profileImage?: string;
}) {
  // Get phase-specific color matching DNA ladder rungs
  const phaseColor = PHASE_COLORS[phase.number - 1] || PHASE_COLORS[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{
        opacity: isActive || isCompleted ? 1 : 0.3,
        scale: isActive ? 1 : 0.95,
        y: 0,
      }}
      exit={{ opacity: 0, scale: 0.9, y: -30 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        width: '100%',
        maxWidth: '560px',
      }}
    >
      {/* Profile image at top during journey */}
      {profileImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ position: 'relative' }}
        >
          <img
            src={profileImage.replace('_normal', '_200x200')}
            alt="Profile"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.4)',
            }}
          />
          {/* Scanning animation ring - uses phase color */}
          <motion.div
            animate={{
              rotate: 360,
              borderColor: [`${phaseColor}99`, `${phaseColor}33`, `${phaseColor}99`]
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              borderColor: { duration: 1, repeat: Infinity }
            }}
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: `2px dashed ${phaseColor}66`,
            }}
          />
        </motion.div>
      )}

      {/* Phase badge - uses phase-specific color */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
          boxShadow: isActive ? `0 0 30px ${phaseColor}4D` : 'none',
        }}
        transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '12px',
          letterSpacing: '0.2em',
          color: phaseColor,
          background: `${phaseColor}26`,
          padding: '10px 24px',
          borderRadius: '30px',
          border: `1px solid ${phaseColor}4D`,
        }}
      >
        PHASE {phase.number} OF 4
      </motion.div>

      {/* Phase title */}
      <motion.h2
        animate={{ scale: isActive ? 1 : 0.9 }}
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: 'clamp(42px, 10vw, 72px)',
          fontWeight: 400,
          letterSpacing: '0.1em',
          color: '#FFFFFF',
          margin: 0,
          textAlign: 'center',
        }}
      >
        {phase.title}
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: 'clamp(16px, 3vw, 20px)',
          fontWeight: 400,
          color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.8)',
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        {phase.subtitle}
      </motion.p>

      {/* Phase explanation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: '14px',
          lineHeight: 1.6,
          color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.7)',
          margin: 0,
          textAlign: 'center',
          maxWidth: '420px',
        }}
      >
        {phase.explanation}
      </motion.p>

      {/* Progress ring - uses phase-specific color */}
      <div style={{ position: 'relative', width: '90px', height: '90px' }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle
            cx="45"
            cy="45"
            r="38"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="5"
          />
          <motion.circle
            cx="45"
            cy="45"
            r="38"
            fill="none"
            stroke={phaseColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 38}
            initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
            animate={{
              strokeDashoffset: isCompleted
                ? 0
                : 2 * Math.PI * 38 * (1 - itemProgress / phase.items.length)
            }}
            transition={{ duration: 0.3 }}
            transform="rotate(-90 45 45)"
            style={{
              filter: `drop-shadow(0 0 8px ${phaseColor}80)`,
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '18px',
            color: '#FFFFFF',
          }}
        >
          {isCompleted ? '100' : Math.round((itemProgress / phase.items.length) * 100)}%
        </div>
      </div>

      {/* Analysis items with detailed info */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '100%',
          background: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '20px',
          padding: '20px',
        }}
      >
        {phase.items.map((item, index) => {
          const isItemComplete = isCompleted || index < itemProgress;
          const isItemActive = !isCompleted && index === Math.floor(itemProgress);
          const profileValue = formatProfileValue(item.dataKey, profile);

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: isItemActive
                  ? (theme === 'dark' ? 'rgba(212, 165, 116, 0.1)' : 'rgba(212, 165, 116, 0.08)')
                  : 'transparent',
                transition: 'background 0.3s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {/* Status indicator */}
                <motion.div
                  animate={{
                    background: isItemComplete
                      ? '#10B981'
                      : isItemActive
                        ? '#D4A574'
                        : 'rgba(255,255,255,0.35)',
                    scale: isItemActive ? [1, 1.3, 1] : 1,
                  }}
                  transition={{
                    scale: { duration: 0.6, repeat: isItemActive ? Infinity : 0 },
                  }}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '14px',
                      letterSpacing: '0.05em',
                      color: isItemComplete
                        ? '#10B981'
                        : isItemActive
                          ? '#FFFFFF'
                          : 'rgba(255,255,255,0.7)',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {item.label}
                    {isItemComplete && ' ✓'}
                  </span>

                  {/* Description - shows when active or complete */}
                  <AnimatePresence>
                    {(isItemActive || isItemComplete) && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: '13px',
                          color: 'rgba(255,255,255,0.6)',
                          margin: '4px 0 0 0',
                          lineHeight: 1.4,
                        }}
                      >
                        {isItemActive ? (
                          <TypewriterText text={item.description} speed={25} />
                        ) : (
                          item.description
                        )}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Profile data value - shows when active */}
              <AnimatePresence>
                {isItemActive && profileValue && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    style={{
                      marginTop: '8px',
                      marginLeft: '22px',
                      padding: '8px 12px',
                      background: theme === 'dark' ? 'rgba(212, 165, 116, 0.15)' : 'rgba(212, 165, 116, 0.1)',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? 'rgba(212, 165, 116, 0.25)' : 'rgba(212, 165, 116, 0.2)'}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.8)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {profileValue}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Journey Progress Indicator
// ============================================================================
function JourneyProgressIndicator({
  currentPhase,
  phaseProgress,
  theme
}: {
  currentPhase: number;
  phaseProgress: number;
  theme: string;
}) {
  const overallProgress = ((currentPhase - 1) + phaseProgress) / 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: '24px',
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* Phase pills - always dark bg since journey has dark DNA background */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '10px 20px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '40px',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        {phaseConfig.map((phase, index) => {
          const phaseNum = index + 1;
          const isActive = currentPhase === phaseNum;
          const isCompleted = currentPhase > phaseNum;

          return (
            <motion.div
              key={phase.id}
              animate={{
                scale: isActive ? 1.05 : 1,
                opacity: isActive || isCompleted ? 1 : 0.4,
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: isActive
                  ? 'rgba(0, 71, 255, 0.15)'
                  : isCompleted
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'transparent',
                border: isActive
                  ? '1px solid rgba(0, 71, 255, 0.3)'
                  : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid transparent',
              }}
            >
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 500,
                  color: isActive
                    ? '#0047FF'
                    : isCompleted
                      ? '#10B981'
                      : 'rgba(255,255,255,0.5)',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: isActive
                    ? 'rgba(0, 71, 255, 0.2)'
                    : isCompleted
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255,255,255,0.1)',
                }}
              >
                {isCompleted ? '✓' : phaseNum}
              </span>
            </motion.div>
          );
        })}
      </div>

      <span
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        {Math.round(overallProgress * 100)}% ANALYZED
      </span>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function XBrandScoreHero({ theme }: XBrandScoreHeroProps) {
  const [flowState, setFlowState] = useState<FlowState>('input');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<XProfileData | null>(null);
  const [brandScore, setBrandScore] = useState<BrandScoreResult | null>(null);
  const [generatedBrandDNA, setGeneratedBrandDNA] = useState<GeneratedBrandDNA | null>(null);
  const [recommendations, setRecommendations] = useState<ImprovementRoadmapData | null>(null);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [itemProgress, setItemProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [email, setEmail] = useState('');
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const apiResultRef = useRef<{ profile: XProfileData; brandScore: BrandScoreResult } | null>(null);
  const apiCompleteRef = useRef(false);
  const apiErrorRef = useRef<string | null>(null);

  const [isValidating, setIsValidating] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter your X username');
      return;
    }

    setError('');
    setIsValidating(true);

    // First, validate that the profile exists before starting the journey
    try {
      const profileResponse = await fetch('/api/x-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok || !profileData.profile) {
        // Profile doesn't exist - show error immediately
        setError(`@${username.trim()} not found on X`);
        setIsValidating(false);
        return;
      }

      // Profile exists - flatten and store it
      const flatProfile: XProfileData = {
        name: profileData.profile.name,
        username: profileData.profile.username,
        description: profileData.profile.description,
        profile_image_url: profileData.profile.profile_image_url,
        followers_count: profileData.profile.public_metrics?.followers_count || 0,
        following_count: profileData.profile.public_metrics?.following_count || 0,
        tweet_count: profileData.profile.public_metrics?.tweet_count || 0,
        verified: profileData.profile.verified || false,
        location: profileData.profile.location,
        url: profileData.profile.url,
      };
      setProfile(flatProfile);

      // Now start the journey
      setIsValidating(false);
      setFlowState('journey');
      setCurrentPhase(1);
      setItemProgress(0);
      apiCompleteRef.current = false;
      apiErrorRef.current = null;

      // Start full brand score API call in background
      fetch('/api/x-brand-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze profile');
          }
          apiResultRef.current = data;
          apiCompleteRef.current = true;
          
          // Also fetch brand identity for Brand DNA generation
          if (data.profile) {
            try {
              const identityResponse = await fetch('/api/x-brand-identity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  profile: {
                    ...data.profile,
                    public_metrics: {
                      followers_count: data.profile.followers_count,
                      following_count: data.profile.following_count,
                      tweet_count: data.profile.tweet_count,
                    },
                  },
                }),
              });
              const identityData = await identityResponse.json();
              
              if (identityData.success && identityData.analysis) {
                // Generate store-ready Brand DNA
                const dnaResponse = await fetch('/api/x-brand-dna/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    profile: data.profile,
                    brandIdentity: identityData.analysis,
                  }),
                });
                const dnaData = await dnaResponse.json();
                
                if (dnaData.success && dnaData.brandDNA) {
                  setGeneratedBrandDNA(dnaData.brandDNA);

                  // Fetch improvement recommendations
                  try {
                    const recommendationsResponse = await fetch('/api/x-brand-dna/recommendations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        username: data.profile.username,
                        displayName: data.profile.name,
                        brandScore: data.brandScore.overallScore,
                        archetype: dnaData.brandDNA.archetype,
                        voiceConsistency: dnaData.brandDNA.performanceInsights?.voiceConsistency || data.brandScore.phases.check.score,
                        personalitySummary: dnaData.brandDNA.personalitySummary,
                        keywords: dnaData.brandDNA.keywords || [],
                        contentPillars: dnaData.brandDNA.contentPillars,
                        performanceInsights: dnaData.brandDNA.performanceInsights,
                        phases: data.brandScore.phases,
                        topStrengths: data.brandScore.topStrengths,
                        topImprovements: data.brandScore.topImprovements,
                        bio: data.profile.description,
                        followersCount: data.profile.public_metrics?.followers_count || 0,
                      }),
                    });
                    const recommendationsData = await recommendationsResponse.json();

                    if (recommendationsData.success && recommendationsData.recommendations) {
                      setRecommendations(recommendationsData.recommendations);
                    }
                  } catch (recError) {
                    console.error('Recommendations fetch error:', recError);
                    // Non-fatal - we still have the score and DNA
                  }
                }
              }
            } catch (identityError) {
              console.error('Brand identity/DNA generation error:', identityError);
              // Non-fatal - we still have the score
            }
          }
        })
        .catch((err) => {
          apiErrorRef.current = err instanceof Error ? err.message : 'Something went wrong';
          apiCompleteRef.current = true;
        });

    } catch {
      setError('Could not connect. Please try again.');
      setIsValidating(false);
    }
  };

  // Auto-progress through phases
  useEffect(() => {
    if (flowState !== 'journey') return;

    // Safety check - ensure we have a valid phase
    const currentPhaseData = phaseConfig[currentPhase - 1];
    if (!currentPhaseData) return;

    const ITEM_DURATION = 2000; // ms per item (increased for better readability)
    const PHASE_PAUSE = 800; // ms pause between phases
    const maxItems = currentPhaseData.items.length;

    const interval = setInterval(() => {
      setItemProgress(prev => {
        if (prev < maxItems) {
          return prev + 0.1; // Smooth progress
        }
        return prev;
      });
    }, ITEM_DURATION / 10);

    // Check for phase completion
    const phaseCheck = setInterval(() => {
      if (itemProgress >= maxItems) {
        if (currentPhase < 4) {
          // Move to next phase
          clearInterval(interval);
          clearInterval(phaseCheck);
          setTimeout(() => {
            setCurrentPhase(prev => prev + 1);
            setItemProgress(0);
          }, PHASE_PAUSE);
        } else {
          // All phases complete - check if API is done
          if (apiCompleteRef.current) {
            clearInterval(interval);
            clearInterval(phaseCheck);

            if (apiResultRef.current) {
              // Success - show results after brief pause
              setTimeout(() => {
                // Flatten the profile to match XProfileData interface
                // API returns profile with public_metrics nested, we flatten it
                const apiProfile = apiResultRef.current!.profile as XProfileData & {
                  public_metrics?: { followers_count?: number; following_count?: number; tweet_count?: number };
                };
                const flatProfile: XProfileData = {
                  name: apiProfile.name,
                  username: apiProfile.username,
                  description: apiProfile.description,
                  profile_image_url: apiProfile.profile_image_url,
                  followers_count: apiProfile.public_metrics?.followers_count || apiProfile.followers_count || 0,
                  following_count: apiProfile.public_metrics?.following_count || apiProfile.following_count || 0,
                  tweet_count: apiProfile.public_metrics?.tweet_count || apiProfile.tweet_count || 0,
                  verified: apiProfile.verified || false,
                  location: apiProfile.location,
                  url: apiProfile.url,
                };
                setProfile(flatProfile);
                setBrandScore(apiResultRef.current!.brandScore);
                setFlowState('reveal');

                // Show confetti for high scores
                if (apiResultRef.current!.brandScore.overallScore >= 70) {
                  setTimeout(() => setShowConfetti(true), 500);
                }
              }, 600);
            } else if (apiErrorRef.current) {
              // API failed - show error and go back to input
              setError(apiErrorRef.current);
              setFlowState('input');
            }
          }
          // If API not complete yet, keep waiting (user will see phase 4 complete)
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(phaseCheck);
    };
  }, [flowState, currentPhase, itemProgress]);

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      return;
    }

    setSignupStatus('loading');

    try {
      // Build brand data for email templates
      const brandData = brandScore && generatedBrandDNA ? {
        displayName: profile?.name || username,
        score: brandScore.overallScore,
        defineScore: brandScore.phases.define.score,
        checkScore: brandScore.phases.check.score,
        generateScore: brandScore.phases.generate.score,
        scaleScore: brandScore.phases.scale.score,
        archetype: generatedBrandDNA.archetype || 'The Creator',
        archetypeEmoji: '✨',
        archetypeTagline: generatedBrandDNA.personalitySummary?.split('.')[0] || '',
        archetypeDescription: generatedBrandDNA.personalitySummary || '',
        archetypeStrengths: brandScore.topStrengths?.slice(0, 3) || [],
        topImprovement: brandScore.topImprovements?.[0] || '',
        topStrength: brandScore.topStrengths?.[0] || '',
      } : undefined;

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'x-brand-score',
          xUsername: username,
          brandData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sign up');
      }

      setSignupStatus('success');
    } catch {
      setSignupStatus('error');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: flowState === 'journey' ? '0' : '48px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* DNA Background - Visible during input & journey, hidden during reveal */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: flowState === 'journey' ? 5 : 0,
          opacity: flowState === 'journey' ? 1 : flowState === 'reveal' ? 0 : 0.6,
          transition: 'opacity 0.5s ease',
          // Enable pointer events during journey for DNA hover interactions
          pointerEvents: flowState === 'journey' ? 'auto' : 'none',
        }}
      >
        <DNAJourneyScene
          flowState={flowState}
          currentPhase={currentPhase}
          itemProgress={itemProgress}
          theme={theme}
        />
      </div>

      {/* Journey Progress */}
      <AnimatePresence>
        {flowState === 'journey' && (
          <JourneyProgressIndicator
            currentPhase={currentPhase}
            phaseProgress={itemProgress / phaseConfig[currentPhase - 1]?.items.length || 0}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Confetti */}
      <Confetti isActive={showConfetti} />

      <AnimatePresence mode="wait">
        {/* INPUT STATE */}
        {flowState === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '36px',
              maxWidth: '900px',
              width: '100%',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Phase tagline - micro copy style */}
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '1.1rem',
                fontWeight: 500,
                letterSpacing: '0.2em',
                color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
                textAlign: 'center',
                margin: 0,
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                textShadow: theme === 'dark'
                  ? '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)'
                  : 'none',
              }}
            >
              Define. Check. Generate. Scale.
            </motion.p>

            {/* Logo - Animated Text Reveal */}
            <motion.div
              className="hero-parallax-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '0',
                willChange: 'transform',
              }}
            >
              <AnimatedText
                text="Brand"
                delay={0.2}
                staggerDelay={0.05}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 800,
                  fontStyle: 'italic',
                  fontSize: '9rem',
                  letterSpacing: '-4px',
                  marginRight: '12px',
                  color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
                }}
              />
              <AnimatedText
                text="OS"
                delay={0.5}
                staggerDelay={0.08}
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '7rem',
                  color: '#0047FF',
                  textShadow: '0 0 35px rgba(0, 71, 255, 0.4)',
                }}
              />
            </motion.div>

            {/* Sub-head - Design #2 Style */}
            <motion.p
              className="hero-parallax-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '0.85rem',
                fontWeight: 400,
                letterSpacing: '0.12em',
                color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
                textAlign: 'center',
                margin: 0,
                marginTop: '-56px',
                marginBottom: '1.5rem',
                textTransform: 'uppercase',
                textShadow: theme === 'dark'
                  ? '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)'
                  : 'none',
                willChange: 'transform',
              }}
            >
              AN AI-POWERED OS THAT BUILDS YOUR BRAND'S DNA.
            </motion.p>

            {/* Input Form */}
            <motion.form
              className="hero-parallax-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                width: '100%',
                maxWidth: '420px',
                willChange: 'transform',
              }}
            >
              {/* Glassmorphic Input - More visible */}
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                  placeholder="@username"
                  maxLength={15}
                  className={theme === 'dark' ? 'landing-input' : 'landing-input-light'}
                  style={{
                    width: '100%',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '1.125rem',
                    padding: '1.125rem',
                    textAlign: 'center',
                    borderRadius: '12px',
                    border: `2px solid ${error ? '#EF4444' : theme === 'dark' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.15)'}`,
                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: theme === 'dark'
                      ? '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      : '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                  }}
                  onFocus={(e) => {
                    if (theme === 'dark') {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)';
                      e.currentTarget.style.borderColor = 'rgba(0, 71, 255, 0.7)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 71, 255, 0.3)';
                    } else {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 71, 255, 0.6)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 20px rgba(0, 71, 255, 0.15)';
                    }
                  }}
                  onBlur={(e) => {
                    if (theme === 'dark') {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                    } else {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
                    }
                  }}
                />
              </div>

              {/* CTA Button */}
              <motion.button
                type="submit"
                disabled={isValidating}
                whileHover={!isValidating ? { scale: 1.02, boxShadow: '0 15px 50px -10px rgba(0, 71, 255, 0.5)' } : {}}
                whileTap={!isValidating ? { scale: 0.98 } : {}}
                style={{
                  width: '100%',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.12em',
                  color: '#ffffff',
                  background: '#0047FF',
                  border: 'none',
                  padding: '1.125rem',
                  borderRadius: '10px',
                  cursor: isValidating ? 'wait' : 'pointer',
                  boxShadow: '0 10px 40px -10px rgba(0, 71, 255, 0.4)',
                  opacity: isValidating ? 0.7 : 1,
                  transition: 'background 0.3s ease',
                }}
              >
                {isValidating ? 'CHECKING...' : "ENTER"}
              </motion.button>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '12px',
                    color: '#EF4444',
                    margin: 0,
                  }}
                >
                  {error}
                </motion.p>
              )}
            </motion.form>

            {/* Footer hint - Design #2 Style */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                color: theme === 'dark' ? '#ffffff' : '#2a2a2a',
                textAlign: 'center',
                marginTop: '7px',
                textShadow: theme === 'dark'
                  ? '0 2px 8px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.5)'
                  : 'none',
              }}
            >
              SEARCH ANY PUBLIC X PROFILE TO GET STARTED
            </motion.p>
          </motion.div>
        )}

        {/* JOURNEY STATE - Split screen layout (responsive) */}
        {flowState === 'journey' && (
          <motion.div
            key="journey"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row w-full min-h-screen md:h-screen relative z-[1]"
          >
            {/* DNA takes left portion - hidden on mobile, 60% on desktop */}
            <div className="hidden md:block md:w-[60%] h-full relative" />

            {/* Analysis panel - Full width on mobile, 40% on desktop */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full md:w-[40%] min-h-screen md:h-full flex flex-col justify-center items-center px-4 py-20 md:px-8 md:py-20"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(180deg, rgba(10, 10, 18, 0.95) 0%, rgba(10, 10, 18, 0.98) 100%)'
                  : 'linear-gradient(180deg, rgba(20, 20, 30, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <AnimatePresence mode="wait">
                <JourneyPhaseCard
                  key={currentPhase}
                  phase={phaseConfig[currentPhase - 1]}
                  isActive={true}
                  isCompleted={false}
                  itemProgress={itemProgress}
                  theme={theme}
                  profile={profile}
                  profileImage={profile?.profile_image_url}
                />
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {/* REVEAL STATE - BrandOS Dashboard Experience */}
        {flowState === 'reveal' && brandScore && profile && generatedBrandDNA && (
          <motion.div
            key="reveal-dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              width: '100%',
              minHeight: '100vh',
              position: 'relative',
              zIndex: 10,
              background: '#050505',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              id="brandos-dashboard-capture"
              style={{
                background: '#050505',
                padding: '24px',
                borderRadius: '8px',
              }}
            >
              <BrandOSDashboard
                data={{
                  profile: {
                    username: profile.username,
                    displayName: profile.name,
                    profileImageUrl: profile.profile_image_url?.replace('_normal', '_200x200') || '',
                    followersCount: formatFollowersDisplay(profile.followers_count || 0),
                    verified: profile.verified,
                  },
                  scores: {
                    brandScore: brandScore.overallScore,
                    voiceConsistency: generatedBrandDNA.performanceInsights?.voiceConsistency || brandScore.phases.check.score,
                    engagementScore: brandScore.phases.scale.score,
                  },
                  personality: {
                    archetype: stripEmoji(generatedBrandDNA.archetype || 'The Creator'),
                    emoji: getArchetypePixelEmoji(stripEmoji(generatedBrandDNA.archetype || '')),
                    type: getPersonalityTypeCode(stripEmoji(generatedBrandDNA.archetype || '')),
                  },
                  tone: {
                    formality: generatedBrandDNA.tone?.minimal || Math.round((brandScore.phases.define.score + brandScore.phases.check.score) / 2),
                    energy: generatedBrandDNA.tone?.playful || Math.round(brandScore.phases.generate.score * 0.8),
                    confidence: generatedBrandDNA.tone?.bold || Math.round((brandScore.phases.scale.score + brandScore.phases.define.score) / 2),
                  },
                  pillars: generatedBrandDNA.contentPillars?.slice(0, 3).map(pillar => ({
                    label: pillar.name,
                    value: pillar.frequency,
                  })) || [],
                  dna: {
                    keywords: generatedBrandDNA.keywords?.slice(0, 5) || brandScore.topStrengths.slice(0, 5).map(s => s.split(' ').filter(w => w.length > 4)[0] || s.split(' ')[0]),
                    voice: generatedBrandDNA.personalitySummary || brandScore.summary || 'Authentic voice that resonates with your audience.',
                  },
                } as BrandOSDashboardData}
              />
            </div>

            {/* Improvement Roadmap */}
            {recommendations && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full"
              >
                <ImprovementRoadmap
                  data={recommendations}
                  onJoinWaitlist={() => setFlowState('signup')}
                />
              </motion.div>
            )}

            {/* Waitlist Banner */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              onClick={() => setFlowState('signup')}
              className="w-full max-w-[600px] mx-4 mt-6 cursor-pointer group"
            >
              <div
                className="relative overflow-hidden rounded-xl p-6 sm:p-8"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.08) 0%, rgba(212, 165, 116, 0.02) 100%)',
                  border: '1px solid rgba(212, 165, 116, 0.25)',
                  boxShadow: '0 0 40px rgba(212, 165, 116, 0.1)',
                }}
              >
                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(212, 165, 116, 0.15) 0%, transparent 70%)',
                  }}
                />

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                  <div className="text-center sm:text-left">
                    <h3
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '14px',
                        letterSpacing: '0.15em',
                        color: '#D4A574',
                        marginBottom: '8px',
                      }}
                    >
                      BE FIRST IN LINE
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      Be among the first to access AI-powered brand management when we launch.
                    </p>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-shrink-0"
                  >
                    <div
                      className="px-6 py-3 rounded-lg"
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '11px',
                        letterSpacing: '0.1em',
                        color: '#050505',
                        background: '#D4A574',
                        boxShadow: '0 0 20px rgba(212, 165, 116, 0.4)',
                      }}
                    >
                      JOIN THE WAITLIST
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons Below Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 w-full sm:w-auto"
            >
              <motion.button
                onClick={async () => {
                  const element = document.getElementById('brandos-dashboard-capture');
                  if (!element) return;

                  try {
                    // Store original styles to restore later
                    const originalWidth = element.style.width;
                    const originalMinWidth = element.style.minWidth;

                    // Add capturing class to remove grayscale filter
                    element.classList.add('capturing');

                    // Force desktop dimensions for consistent capture
                    element.style.width = '1200px';
                    element.style.minWidth = '1200px';

                    const dataUrl = await domToPng(element, {
                      backgroundColor: '#050505',
                      scale: 2,
                      quality: 1,
                      width: 1200,
                    });

                    // Restore original styles
                    element.style.width = originalWidth;
                    element.style.minWidth = originalMinWidth;

                    // Remove capturing class to restore grayscale
                    element.classList.remove('capturing');

                    // Convert data URL to blob
                    const response = await fetch(dataUrl);
                    const blob = await response.blob();

                    try {
                      await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                      ]);
                      alert('Image copied to clipboard! Paste it on X to share.');
                    } catch {
                      // Fallback: download the image
                      const a = document.createElement('a');
                      a.href = dataUrl;
                      a.download = `brandos-score-${profile.username}.png`;
                      a.click();
                    }
                  } catch (err) {
                    console.error('Screenshot failed:', err);
                    alert('Could not capture screenshot. Please try again or use your browser\'s screenshot feature.');
                  }
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 py-3 px-6 sm:py-3.5 sm:px-7 bg-[#2E6AFF] border-none rounded text-white font-bold cursor-pointer w-full sm:w-auto"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                FLEX YOUR SCORE
              </motion.button>
              <motion.button
                onClick={() => {
                  setFlowState('input');
                  setUsername('');
                  setProfile(null);
                  setBrandScore(null);
                  setGeneratedBrandDNA(null);
                  setRecommendations(null);
                  setShowConfetti(false);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 px-6 sm:py-3.5 sm:px-7 bg-transparent border border-[#333] rounded text-[#888] cursor-pointer w-full sm:w-auto"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                }}
              >
                ANALYZE ANOTHER
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* REVEAL STATE - Fallback for no DNA */}
        {flowState === 'reveal' && brandScore && profile && !generatedBrandDNA && (
          <motion.div
            key="reveal-fallback"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px',
              maxWidth: '600px',
              width: '100%',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <ScoreGauge score={brandScore.overallScore} isVisible={true} theme={theme} />
            <ShareableScoreCard
              data={{
                score: brandScore.overallScore,
                username: profile.username,
                displayName: profile.name,
                profileImageUrl: profile.profile_image_url,
                topStrength: brandScore.topStrengths[0] || '',
                summary: brandScore.summary,
              } as ShareCardData}
              theme={theme}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setFlowState('input');
                setUsername('');
                setProfile(null);
                setBrandScore(null);
                setGeneratedBrandDNA(null);
                setRecommendations(null);
                setShowConfetti(false);
              }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '12px',
                letterSpacing: '0.1em',
                color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 16px',
              }}
            >
              ANALYZE ANOTHER PROFILE
            </motion.button>
          </motion.div>
        )}

        {/* SIGNUP STATE */}
        {flowState === 'signup' && profile && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              maxWidth: '500px',
              width: '100%',
              textAlign: 'center',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <motion.h2
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: 'clamp(24px, 5vw, 36px)',
                fontWeight: 600,
                color: theme === 'dark' ? '#FFFFFF' : '#000000',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              You're almost in, @{profile.username}
            </motion.h2>

            <motion.p
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '16px',
                color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Drop your email to secure your spot. We'll notify you the moment BrandOS is ready.
            </motion.p>

            {signupStatus === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '32px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '20px',
                }}
              >
                <span style={{ fontSize: '48px' }}>✓</span>
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '14px',
                    letterSpacing: '0.1em',
                    color: '#10B981',
                  }}
                >
                  YOU'RE IN!
                </span>
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '14px',
                    color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    margin: 0,
                  }}
                >
                  We'll reach out when brandOS is ready for you.
                </p>
              </motion.div>
            ) : (
              <motion.form
                onSubmit={handleSignup}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  width: '100%',
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{
                    width: '100%',
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '16px',
                    padding: '18px 20px',
                    borderRadius: '14px',
                    border: `2px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#D4A574';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(212, 165, 116, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />

                <motion.button
                  type="submit"
                  disabled={signupStatus === 'loading'}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(212, 165, 116, 0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '14px',
                    letterSpacing: '0.15em',
                    color: '#FFFFFF',
                    background: '#D4A574',
                    border: 'none',
                    padding: '18px 32px',
                    borderRadius: '14px',
                    cursor: signupStatus === 'loading' ? 'wait' : 'pointer',
                    boxShadow: '0 0 30px rgba(212, 165, 116, 0.3)',
                    opacity: signupStatus === 'loading' ? 0.7 : 1,
                  }}
                >
                  {signupStatus === 'loading' ? 'JOINING...' : 'JOIN THE WAITLIST'}
                </motion.button>
              </motion.form>
            )}

            {/* Back button */}
            <motion.button
              onClick={() => setFlowState('reveal')}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '12px',
                letterSpacing: '0.1em',
                color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 16px',
                marginTop: '8px',
              }}
            >
              ← BACK TO RESULTS
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor blink animation */}
      <style jsx global>{`
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .typing-cursor {
          animation: cursorBlink 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

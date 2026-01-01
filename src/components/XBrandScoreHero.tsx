'use client';

import { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from 'motion/react';
import dynamic from 'next/dynamic';
import BrandDNAPreview, { GeneratedBrandDNA } from './BrandDNAPreview';
import ShareableScoreCard, { ShareCardData } from './ShareableScoreCard';

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
        type: 'spring',
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
// Phase Configuration - Enhanced with detailed analysis items
// ============================================================================
interface PhaseItem {
  label: string;
  description: string;
  dataKey?: keyof XProfileData | 'ratio' | 'account_age';
}

interface PhaseConfigItem {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  explanation: string;
  items: PhaseItem[];
}

const phaseConfig: PhaseConfigItem[] = [
  {
    id: 'define',
    number: 1,
    title: 'DEFINE',
    subtitle: 'Extracting your brand DNA',
    explanation: 'Identifying the patterns, voice, and signals in your profile that make your content recognizably yours.',
    items: [
      {
        label: 'Display name alignment',
        description: 'Checking if your name reflects your brand identity',
        dataKey: 'name'
      },
      {
        label: 'Bio clarity & messaging',
        description: 'Analyzing your bio for clear value proposition',
        dataKey: 'description'
      },
      {
        label: 'Value proposition',
        description: 'Identifying what makes you unique and valuable'
      },
      {
        label: 'Target audience signals',
        description: 'Detecting who your content speaks to'
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
        label: 'Username/name alignment',
        description: 'Matching @handle with display name for recognition',
        dataKey: 'username'
      },
      {
        label: 'Tone consistency',
        description: 'Evaluating voice consistency in your messaging'
      },
      {
        label: 'Professional presentation',
        description: 'Assessing overall profile polish and quality'
      },
      {
        label: 'Verification status',
        description: 'Checking account verification and credibility',
        dataKey: 'verified'
      },
    ],
  },
  {
    id: 'generate',
    number: 3,
    title: 'GENERATE',
    subtitle: 'Assessing content readiness',
    explanation: 'Determining how ready your brand profile is to power generation that actually sounds like you.',
    items: [
      {
        label: 'Profile completeness',
        description: 'Checking all profile fields are filled',
        dataKey: 'location'
      },
      {
        label: 'Bio formatting',
        description: 'Analyzing structure, emojis, and readability'
      },
      {
        label: 'Link presence',
        description: 'Verifying external links drive traffic',
        dataKey: 'url'
      },
      {
        label: 'Content activity',
        description: 'Reviewing your posting history and engagement',
        dataKey: 'tweet_count'
      },
    ],
  },
  {
    id: 'scale',
    number: 4,
    title: 'SCALE',
    subtitle: 'Activating your system',
    explanation: 'Your Brand DNA is ready to run. Now it can power automations, enforce standards, and scale your brand while you focus on what\'s next.',
    items: [
      {
        label: 'Follower/following ratio',
        description: 'Calculating audience-to-following balance',
        dataKey: 'ratio'
      },
      {
        label: 'Community size',
        description: 'Measuring your current audience reach',
        dataKey: 'followers_count'
      },
      {
        label: 'Network engagement',
        description: 'Analyzing your connections and interactions',
        dataKey: 'following_count'
      },
      {
        label: 'Account maturity',
        description: 'Evaluating account age and establishment',
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
              border: `3px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            }}
          />
          {/* Scanning animation ring */}
          <motion.div
            animate={{
              rotate: 360,
              borderColor: ['rgba(212, 165, 116, 0.6)', 'rgba(212, 165, 116, 0.2)', 'rgba(212, 165, 116, 0.6)']
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              borderColor: { duration: 1, repeat: Infinity }
            }}
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: '2px dashed rgba(212, 165, 116, 0.4)',
            }}
          />
        </motion.div>
      )}

      {/* Phase badge */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
          boxShadow: isActive ? '0 0 30px rgba(212, 165, 116, 0.3)' : 'none',
        }}
        transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '12px',
          letterSpacing: '0.2em',
          color: isCompleted ? '#10B981' : '#D4A574',
          background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(212, 165, 116, 0.15)',
          padding: '10px 24px',
          borderRadius: '30px',
          border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(212, 165, 116, 0.3)'}`,
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
          color: theme === 'dark' ? '#FFFFFF' : '#000000',
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
          color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
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
          color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
          margin: 0,
          textAlign: 'center',
          maxWidth: '420px',
        }}
      >
        {phase.explanation}
      </motion.p>

      {/* Progress ring */}
      <div style={{ position: 'relative', width: '90px', height: '90px' }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle
            cx="45"
            cy="45"
            r="38"
            fill="none"
            stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="5"
          />
          <motion.circle
            cx="45"
            cy="45"
            r="38"
            fill="none"
            stroke={isCompleted ? '#10B981' : '#D4A574'}
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
              filter: `drop-shadow(0 0 8px ${isCompleted ? '#10B981' : '#D4A574'}80)`,
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
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
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
          background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
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
                        : theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
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
                      fontSize: '12px',
                      letterSpacing: '0.05em',
                      color: isItemComplete
                        ? '#10B981'
                        : isItemActive
                          ? (theme === 'dark' ? '#FFFFFF' : '#000000')
                          : (theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
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
                          fontSize: '11px',
                          color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                          margin: '4px 0 0 0',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.description}
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
                        color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
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
      {/* Phase pills */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '10px 20px',
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '40px',
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
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
                  ? 'rgba(212, 165, 116, 0.15)'
                  : isCompleted
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'transparent',
                border: isActive
                  ? '1px solid rgba(212, 165, 116, 0.3)'
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
                    ? '#D4A574'
                    : isCompleted
                      ? '#10B981'
                      : theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: isActive
                    ? 'rgba(212, 165, 116, 0.2)'
                    : isCompleted
                      ? 'rgba(16, 185, 129, 0.2)'
                      : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
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
          color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
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
                setProfile(apiResultRef.current!.profile);
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
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'x-brand-score',
          xUsername: username,
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
      {/* DNA Background - Always visible */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: flowState === 'journey' ? 1 : 0.6,
          transition: 'opacity 0.5s ease',
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
              gap: '24px',
              maxWidth: '600px',
              width: '100%',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Phase tagline - micro copy style */}
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '1rem',
                fontWeight: 400,
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.7)',
                textAlign: 'center',
                margin: 0,
                marginBottom: '2rem',
                textTransform: 'uppercase',
                textShadow: '0 0 10px rgba(255,255,255,0.2)',
              }}
            >
              Define. Check. Generate. Scale.
            </motion.p>

            {/* Logo - Animated Text Reveal */}
            <motion.div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '0.5rem',
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
                  fontSize: '5.5rem',
                  letterSpacing: '-3px',
                  marginRight: '8px',
                  color: '#ffffff',
                }}
              />
              <AnimatedText
                text="OS"
                delay={0.5}
                staggerDelay={0.08}
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '4.5rem',
                  color: '#000000',
                  textShadow: '0 0 25px rgba(0, 0, 0, 0.3)',
                }}
              />
            </motion.div>

            {/* Sub-head - Design #2 Style */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '1rem',
                fontWeight: 400,
                letterSpacing: '0.12em',
                color: '#000000',
                textAlign: 'center',
                margin: 0,
                marginBottom: '4rem',
                textTransform: 'uppercase',
              }}
            >
              AN AI-POWERED OS THAT BUILDS YOUR BRAND'S DNA.
            </motion.p>

            {/* Input Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                width: '100%',
                maxWidth: '500px',
              }}
            >
              {/* Glassmorphic Input - Design #2 */}
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                  placeholder="@username"
                  maxLength={15}
                  style={{
                    width: '100%',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '1.3rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                    borderRadius: '14px',
                    border: `1px solid ${error ? '#EF4444' : 'rgba(255, 255, 255, 0.15)'}`,
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(232, 168, 56, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(232, 168, 56, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* CTA Button */}
              <motion.button
                type="submit"
                disabled={isValidating}
                whileHover={!isValidating ? { scale: 1.02, boxShadow: '0 15px 50px -10px rgba(0, 0, 0, 0.5)' } : {}}
                whileTap={!isValidating ? { scale: 0.98 } : {}}
                style={{
                  width: '100%',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.12em',
                  color: '#ffffff',
                  background: '#000000',
                  border: 'none',
                  padding: '1.5rem',
                  borderRadius: '10px',
                  cursor: isValidating ? 'wait' : 'pointer',
                  boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.4)',
                  opacity: isValidating ? 0.7 : 1,
                  transition: 'background 0.3s ease',
                }}
              >
                {isValidating ? 'CHECKING PROFILE...' : "FIND YOUR BRAND DNA"}
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
                fontSize: '0.8rem',
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
                marginTop: '8px',
              }}
            >
              ENTER ANY PUBLIC X PROFILE TO GET STARTED
            </motion.p>
          </motion.div>
        )}

        {/* JOURNEY STATE - Split screen layout */}
        {flowState === 'journey' && (
          <motion.div
            key="journey"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex',
              width: '100%',
              height: '100vh',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* DNA takes left 60% - handled by DNAJourneyScene in background */}
            <div
              style={{
                width: '60%',
                height: '100%',
                position: 'relative',
              }}
            />

            {/* Analysis panel - Right 40% */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{
                width: '40%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '80px 32px 48px 32px',
                background: theme === 'dark'
                  ? 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.85) 100%)'
                  : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.85) 100%)',
                backdropFilter: 'blur(8px)',
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

        {/* REVEAL STATE */}
        {flowState === 'reveal' && brandScore && profile && (
          <motion.div
            key="reveal"
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
              zIndex: 2,
            }}
          >
            {/* Profile header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <img
                src={profile.profile_image_url.replace('_normal', '_200x200')}
                alt={profile.name}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: `2px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: '20px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#FFFFFF' : '#000000',
                    }}
                  >
                    {profile.name}
                  </span>
                  {profile.verified && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#D4A574">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '14px',
                    color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  }}
                >
                  @{profile.username}
                </span>
              </div>
            </motion.div>

            {/* Score gauge */}
            <ScoreGauge score={brandScore.overallScore} isVisible={true} theme={theme} />

            {/* Summary */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: '16px',
                lineHeight: 1.6,
                color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                textAlign: 'center',
                margin: 0,
              }}
            >
              {brandScore.summary}
            </motion.p>

            {/* Brand DNA Preview - Auto-generated from profile */}
            {generatedBrandDNA && (
              <BrandDNAPreview
                generatedDNA={generatedBrandDNA}
                username={profile.username}
                onClaim={() => setFlowState('signup')}
                theme={theme}
              />
            )}

            {/* Share Your Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                marginTop: '24px',
                padding: '24px',
                background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                borderRadius: '20px',
                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                width: '100%',
              }}
            >
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                }}
              >
                SHARE YOUR BRAND DNA
              </span>
              <ShareableScoreCard
                data={{
                  score: brandScore.overallScore,
                  username: profile.username,
                  displayName: profile.name,
                  profileImageUrl: profile.profile_image_url,
                  topStrength: brandScore.topStrengths[0] || '',
                  summary: brandScore.summary,
                  archetype: generatedBrandDNA ? {
                    primary: generatedBrandDNA.archetype,
                    emoji: generatedBrandDNA.archetypeEmoji,
                    tagline: generatedBrandDNA.voiceProfile,
                  } : undefined,
                  keywords: generatedBrandDNA?.keywords,
                  brandColors: generatedBrandDNA ? {
                    primary: generatedBrandDNA.colors.primary,
                    secondary: generatedBrandDNA.colors.secondary,
                  } : undefined,
                  voiceProfile: generatedBrandDNA?.voiceProfile,
                } as ShareCardData}
                theme={theme}
              />
            </motion.div>

            {/* CTA to signup - Only show if no Brand DNA preview */}
            {!generatedBrandDNA && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5 }}
                onClick={() => setFlowState('signup')}
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(212, 165, 116, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '14px',
                  letterSpacing: '0.15em',
                  color: '#FFFFFF',
                  background: '#D4A574',
                  border: 'none',
                  padding: '20px 40px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(212, 165, 116, 0.3)',
                  marginTop: '16px',
                }}
              >
                IMPROVE MY BRAND SCORE
              </motion.button>
            )}

            {/* Analyze another */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8 }}
              onClick={() => {
                setFlowState('input');
                setUsername('');
                setProfile(null);
                setBrandScore(null);
                setGeneratedBrandDNA(null);
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
              zIndex: 2,
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
              Ready to improve your brand, @{profile.username}?
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
              Join early access to get AI-powered brand improvement suggestions, consistency monitoring, and more.
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
                  {signupStatus === 'loading' ? 'JOINING...' : 'JOIN EARLY ACCESS'}
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

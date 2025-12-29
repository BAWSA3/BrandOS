'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import Leaderboard from './Leaderboard';
import ScoreReveal from './ScoreReveal';
import CompetitorCompare from './CompetitorCompare';
import BrandDNACard from './BrandDNACard';
import type { BioLinguistics, NameAnalysis, ProfileImageAnalysis, BrandDNA, BrandImprovements } from '@/lib/gemini';

// Brand Identity Response type
interface BrandIdentityData {
  bioLinguistics: BioLinguistics;
  nameAnalysis: NameAnalysis;
  profileImage: ProfileImageAnalysis | null;
  brandDNA: BrandDNA | null;
  improvements: BrandImprovements | null;
}

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

interface CreatorArchetype {
  primary: string;
  emoji: string;
  tagline: string;
  description: string;
  strengths: string[];
  growthTip: string;
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
  archetype: CreatorArchetype;
  cryptoContext?: boolean;
}

type FlowState = 'input' | 'journey' | 'reveal' | 'signup';

interface XBrandScoreHeroProps {
  theme: string;
  redirectAfterSignup?: string; // URL to redirect to after signup (e.g., '/thanks')
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
    subtitle: 'Analyzing brand identity',
    explanation: 'We examine how clearly your profile communicates who you are and what value you provide to your audience.',
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
    subtitle: 'Checking consistency',
    explanation: 'We verify that your brand elements work together cohesively and present a unified professional image.',
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
    subtitle: 'Evaluating content quality',
    explanation: 'We assess your profile completeness and how well you\'ve optimized every element for maximum impact.',
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
    subtitle: 'Measuring growth readiness',
    explanation: 'We evaluate your growth metrics and identify opportunities for expanding your brand reach.',
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
// Confetti Component - Enhanced with Klein Blue palette
// ============================================================================
function Confetti({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
    rotation: number;
    size: number;
    shape: 'circle' | 'square' | 'star';
  }>>([]);

  useEffect(() => {
    if (isActive) {
      // Klein Blue palette for confetti
      const colors = ['#0047FF', '#1C60FF', '#3C8AFF', '#66B3FF', '#10B981', '#34D399', '#ffffff'];
      const shapes: ('circle' | 'square' | 'star')[] = ['circle', 'square', 'star'];
      const newParticles = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 120,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.6,
        rotation: Math.random() * 720,
        size: 6 + Math.random() * 8,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
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
            scale: [0, 1.3, 0.6],
            opacity: [1, 1, 0],
            rotate: particle.rotation,
          }}
          transition={{
            duration: 2.8,
            delay: particle.delay,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            background: particle.shape === 'star' ? 'transparent' : particle.color,
            borderRadius: particle.shape === 'circle' ? '50%' : particle.shape === 'square' ? '2px' : '0',
            boxShadow: `0 0 ${particle.size}px ${particle.color}50`,
            ...(particle.shape === 'star' && {
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              background: particle.color,
            }),
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Score Gauge Component - Enhanced with dramatic entrance and glow
// ============================================================================
function ScoreGauge({ score, isVisible, theme }: { score: number; isVisible: boolean; theme: string }) {
  const motionScore = useMotionValue(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [showParticleBurst, setShowParticleBurst] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        const controls = animate(motionScore, score, {
          duration: 2.2,
          ease: [0.34, 1.56, 0.64, 1],
        });

        const unsubscribe = motionScore.on('change', (v) => {
          setCurrentScore(Math.round(v));
        });

        // Show particle burst when animation completes
        setTimeout(() => setShowParticleBurst(true), 2200);

        return () => {
          controls.stop();
          unsubscribe();
        };
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, score, motionScore]);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#0047FF';
    if (s >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'EXCELLENT';
    if (s >= 60) return 'GOOD';
    if (s >= 40) return 'NEEDS WORK';
    return 'CRITICAL';
  };

  // Intensity increases as score fills up
  const glowIntensity = (currentScore / 100) * 0.6 + 0.2;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
      animate={isVisible ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ position: 'relative', width: '220px', height: '220px' }}
    >
      {/* Animated glow effect - intensity increases with score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={isVisible ? { 
          opacity: glowIntensity, 
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ 
          opacity: { duration: 1, delay: 0.5 },
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${getScoreColor(currentScore)}60 0%, ${getScoreColor(currentScore)}20 40%, transparent 70%)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Particle burst effect on completion */}
      {showParticleBurst && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
                x: Math.cos((i * Math.PI * 2) / 8) * 80,
                y: Math.sin((i * Math.PI * 2) / 8) * 80,
              }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 8,
                height: 8,
                background: getScoreColor(currentScore),
                borderRadius: '50%',
                boxShadow: `0 0 10px ${getScoreColor(currentScore)}`,
              }}
            />
          ))}
        </>
      )}

      <svg width="220" height="220" viewBox="0 0 220 220">
        {/* Background track */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
          strokeWidth="14"
        />
        {/* Shimmer track */}
        <motion.circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="url(#shimmerGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 110 110)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Main progress */}
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
            filter: `drop-shadow(0 0 25px ${getScoreColor(currentScore)}90)`,
            transition: 'stroke 0.3s ease',
          }}
        />
        {/* Shimmer gradient definition */}
        <defs>
          <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </linearGradient>
        </defs>
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
          initial={{ scale: 0, rotate: -10 }}
          animate={isVisible ? { scale: 1, rotate: 0 } : {}}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 12 }}
        >
          <span
            style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: '64px',
              fontWeight: 700,
              color: theme === 'dark' ? '#FFFFFF' : '#000000',
              lineHeight: 1,
              textShadow: `0 0 30px ${getScoreColor(currentScore)}40`,
            }}
          >
            {currentScore}
          </span>
        </motion.div>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.8, duration: 0.4 }}
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: getScoreColor(currentScore),
            display: 'block',
            marginTop: '8px',
            textShadow: `0 0 10px ${getScoreColor(currentScore)}60`,
          }}
        >
          {getScoreLabel(currentScore)}
        </motion.span>
      </div>
    </motion.div>
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
// Journey Phase Card Component - Enhanced with scan line and premium animations
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
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        width: '100%',
        maxWidth: '560px',
      }}
    >
      {/* Phase header with profile image and title inline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '8px',
        }}
      >
        {/* Profile image or placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ position: 'relative', flexShrink: 0 }}
        >
          {profileImage ? (
            <img
              src={`${profileImage.replace('_normal', '_200x200')}?v=${Date.now()}`}
              alt="Profile"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: `3px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              }}
            />
          ) : (
            /* Placeholder when profile not loaded */
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, rgba(0, 71, 255, 0.2) 0%, rgba(0, 71, 255, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(0, 71, 255, 0.15) 0%, rgba(0, 71, 255, 0.05) 100%)',
                border: `3px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '20px', opacity: 0.5 }}>👤</span>
            </div>
          )}
          {/* Outer scanning animation ring - refined timing */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
            }}
            style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              border: '2px dashed rgba(0, 71, 255, 0.3)',
            }}
          />
          {/* Inner glow pulse */}
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 1.5, 
              repeat: Infinity, 
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              inset: '-3px',
              borderRadius: '50%',
              border: '2px solid rgba(0, 71, 255, 0.5)',
              boxShadow: '0 0 15px rgba(0, 71, 255, 0.3)',
            }}
          />
        </motion.div>

        {/* Phase title and subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* Phase badge - pixel art style */}
          <motion.div
            animate={{
              opacity: isActive ? [0.7, 1, 0.7] : 1,
            }}
            transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: isCompleted ? '#10B981' : '#0047FF',
              marginBottom: '4px',
              padding: '4px 8px',
              background: isCompleted 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(0, 71, 255, 0.1)',
              borderRadius: '4px',
              border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 71, 255, 0.2)'}`,
            }}
          >
            PHASE {phase.number} OF 4
          </motion.div>

          {/* Phase title */}
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: 'clamp(28px, 7vw, 48px)',
              fontWeight: 400,
              letterSpacing: '0.08em',
              color: theme === 'dark' ? '#FFFFFF' : '#000000',
              margin: 0,
              lineHeight: 1,
              textShadow: theme === 'dark' ? '0 0 20px rgba(0, 71, 255, 0.3)' : 'none',
            }}
          >
            {phase.title}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{
              fontFamily: "'Helvetica Neue', sans-serif",
              fontSize: 'clamp(13px, 2.5vw, 16px)',
              fontWeight: 400,
              color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              margin: '4px 0 0 0',
              fontStyle: 'italic',
            }}
          >
            {phase.subtitle}
          </motion.p>
        </div>
      </div>

      {/* Phase explanation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
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

      {/* Progress ring - enhanced with shimmer */}
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        {/* Glow background */}
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: -10,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 71, 255, 0.3)'} 0%, transparent 70%)`,
            filter: 'blur(10px)',
          }}
        />
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
            strokeWidth="5"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={isCompleted ? '#10B981' : '#0047FF'}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 42}
            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
            animate={{
              strokeDashoffset: isCompleted
                ? 0
                : 2 * Math.PI * 42 * (1 - itemProgress / phase.items.length)
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            transform="rotate(-90 50 50)"
            style={{
              filter: `drop-shadow(0 0 10px ${isCompleted ? '#10B981' : '#0047FF'}90)`,
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
            fontSize: '20px',
            fontWeight: 600,
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
          }}
        >
          {isCompleted ? '100' : Math.round((itemProgress / phase.items.length) * 100)}%
        </div>
      </div>

      {/* Analysis items with scan line effect */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '100%',
          background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: '20px',
          padding: '20px',
          overflow: 'hidden',
        }}
      >
        {/* Scan line effect */}
        <motion.div
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, 
              transparent 0%, 
              ${theme === 'dark' ? 'rgba(0, 71, 255, 0.4)' : 'rgba(0, 71, 255, 0.3)'} 20%,
              ${theme === 'dark' ? 'rgba(0, 71, 255, 0.6)' : 'rgba(0, 71, 255, 0.5)'} 50%, 
              ${theme === 'dark' ? 'rgba(0, 71, 255, 0.4)' : 'rgba(0, 71, 255, 0.3)'} 80%,
              transparent 100%
            )`,
            boxShadow: `0 0 15px ${theme === 'dark' ? 'rgba(0, 71, 255, 0.5)' : 'rgba(0, 71, 255, 0.4)'}`,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />

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
              transition={{ duration: 0.4, delay: index * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: isItemActive
                  ? (theme === 'dark' ? 'rgba(0, 71, 255, 0.12)' : 'rgba(0, 71, 255, 0.1)')
                  : 'transparent',
                transition: 'background 0.4s ease',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {/* Status indicator - enhanced */}
                <motion.div
                  animate={{
                    background: isItemComplete
                      ? '#10B981'
                      : isItemActive
                        ? '#0047FF'
                        : theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                    scale: isItemActive ? [1, 1.4, 1] : 1,
                    boxShadow: isItemActive 
                      ? ['0 0 0px rgba(0, 71, 255, 0.5)', '0 0 12px rgba(0, 71, 255, 0.8)', '0 0 0px rgba(0, 71, 255, 0.5)']
                      : isItemComplete
                        ? '0 0 8px rgba(16, 185, 129, 0.5)'
                        : 'none',
                  }}
                  transition={{
                    scale: { duration: 0.8, repeat: isItemActive ? Infinity : 0 },
                    boxShadow: { duration: 0.8, repeat: isItemActive ? Infinity : 0 },
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
                        transition={{ duration: 0.25 }}
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
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{
                      marginTop: '10px',
                      marginLeft: '22px',
                      padding: '10px 14px',
                      background: theme === 'dark' ? 'rgba(0, 71, 255, 0.15)' : 'rgba(0, 71, 255, 0.1)',
                      borderRadius: '10px',
                      border: `1px solid ${theme === 'dark' ? 'rgba(0, 71, 255, 0.25)' : 'rgba(0, 71, 255, 0.2)'}`,
                      boxShadow: `0 0 15px ${theme === 'dark' ? 'rgba(0, 71, 255, 0.1)' : 'rgba(0, 71, 255, 0.08)'}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '12px',
                        color: theme === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
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
// Journey Progress Indicator - Enhanced with pulsing active state
// ============================================================================
function JourneyProgressIndicator({
  currentPhase,
  theme
}: {
  currentPhase: number;
  phaseProgress: number;
  theme: string;
}) {
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
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {/* Phase pills container */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          display: 'flex',
          gap: '10px',
          padding: '12px 24px',
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          borderRadius: '50px',
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: theme === 'dark' 
            ? '0 4px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.05)' 
            : '0 4px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.02)',
          pointerEvents: 'auto',
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
                scale: isActive ? [1, 1.08, 1] : 1,
                opacity: isActive || isCompleted ? 1 : 0.35,
              }}
              transition={{
                scale: { duration: 1.2, repeat: isActive ? Infinity : 0, ease: 'easeInOut' },
              }}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isActive
                  ? 'rgba(0, 71, 255, 0.15)'
                  : isCompleted
                    ? 'rgba(16, 185, 129, 0.15)'
                    : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                border: isActive
                  ? '2px solid #0047FF'
                  : isCompleted
                    ? '2px solid #10B981'
                    : `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                transition: 'background 0.3s ease, border-color 0.3s ease',
              }}
            >
              {/* Pulse ring for active */}
              {isActive && (
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1.8],
                    opacity: [0.5, 0.2, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  style={{
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '50%',
                    border: '2px solid #0047FF',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isActive
                    ? '#0047FF'
                    : isCompleted
                      ? '#10B981'
                      : theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                }}
              >
                {isCompleted ? '✓' : phaseNum}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function XBrandScoreHero({ theme, redirectAfterSignup }: XBrandScoreHeroProps) {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>('input');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<XProfileData | null>(null);
  const [brandScore, setBrandScore] = useState<BrandScoreResult | null>(null);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [itemProgress, setItemProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [email, setEmail] = useState('');
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCompetitorCompare, setShowCompetitorCompare] = useState(false);
  const [brandIdentity, setBrandIdentity] = useState<BrandIdentityData | null>(null);
  const [showBrandDNA, setShowBrandDNA] = useState(false);
  const [brandIdentityLoading, setBrandIdentityLoading] = useState(false);

  const apiResultRef = useRef<{ profile: XProfileData; brandScore: BrandScoreResult } | null>(null);
  const apiCompleteRef = useRef(false);
  const apiErrorRef = useRef<string | null>(null);

  // Handle checking another user's score from leaderboard
  const handleCheckFromLeaderboard = useCallback((leaderboardUsername: string) => {
    setUsername(leaderboardUsername);
    setShowLeaderboard(false);
    // Trigger the form submission with the new username
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter your X username');
      return;
    }

    setError('');
    setFlowState('journey');
    setCurrentPhase(1);
    setItemProgress(0);
    apiResultRef.current = null;
    apiCompleteRef.current = false;
    apiErrorRef.current = null;

    // First, fetch just the profile data quickly (for display during journey)
    fetch('/api/x-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim() }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok && data.profile) {
          // Flatten the public_metrics into the profile object
          const flatProfile: XProfileData = {
            name: data.profile.name,
            username: data.profile.username,
            description: data.profile.description,
            profile_image_url: data.profile.profile_image_url,
            followers_count: data.profile.public_metrics?.followers_count || 0,
            following_count: data.profile.public_metrics?.following_count || 0,
            tweet_count: data.profile.public_metrics?.tweet_count || 0,
            verified: data.profile.verified || false,
            location: data.profile.location,
            url: data.profile.url,
          };
          setProfile(flatProfile);
        }
      })
      .catch(() => {
        // Profile fetch failed, continue anyway
      });

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
      })
      .catch((err) => {
        apiErrorRef.current = err instanceof Error ? err.message : 'Something went wrong';
        apiCompleteRef.current = true;
      });
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
              // Success - show results
              setProfile(apiResultRef.current.profile);
              setBrandScore(apiResultRef.current.brandScore);
              setFlowState('reveal');

              // Show confetti for high scores
              if (apiResultRef.current.brandScore.overallScore >= 70) {
                setTimeout(() => setShowConfetti(true), 1500);
              }
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

  // Fetch Brand Identity data when entering reveal state
  useEffect(() => {
    if (flowState === 'reveal' && profile && !brandIdentity && !brandIdentityLoading) {
      setBrandIdentityLoading(true);
      
      // Convert flat profile to X API format for the API call
      const xProfileData = {
        name: profile.name,
        username: profile.username,
        description: profile.description,
        profile_image_url: profile.profile_image_url,
        public_metrics: {
          followers_count: profile.followers_count,
          following_count: profile.following_count,
          tweet_count: profile.tweet_count,
          listed_count: 0, // Not available in flat profile
        },
        verified: profile.verified,
        location: profile.location,
        url: profile.url,
      };

      fetch('/api/x-brand-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: xProfileData }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (data.success && data.analysis) {
            setBrandIdentity(data.analysis);
          }
        })
        .catch((err) => {
          console.error('Brand Identity fetch error:', err);
        })
        .finally(() => {
          setBrandIdentityLoading(false);
        });
    }
  }, [flowState, profile, brandIdentity, brandIdentityLoading]);

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

      // Redirect to thanks page after signup if redirectAfterSignup is set
      if (redirectAfterSignup && profile && brandScore) {
        // Build URL with user data
        const params = new URLSearchParams({
          username: profile.username,
          name: profile.name,
          profile_image: profile.profile_image_url,
          score: brandScore.overallScore.toString(),
          scoreData: encodeURIComponent(JSON.stringify(brandScore)),
        });
        
        // Redirect after a short delay to show success state
        setTimeout(() => {
          router.push(`${redirectAfterSignup}?${params.toString()}`);
        }, 1000);
      }
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
        padding: '48px 24px',
        position: 'relative',
      }}
    >
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
            transition={{ duration: 0.6 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px',
              maxWidth: '600px',
              width: '100%',
            }}
          >
            {/* Logo with floating accent shapes */}
            <div style={{ position: 'relative' }}>
              {/* Floating accent - top left */}
              <motion.div
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 5, 0],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '-30px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${theme === 'dark' ? 'rgba(0, 71, 255, 0.4)' : 'rgba(0, 71, 255, 0.3)'}`,
                }}
              />
              {/* Floating accent - bottom right */}
              <motion.div
                animate={{ 
                  y: [0, 10, 0],
                  x: [0, -5, 0],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                style={{
                  position: 'absolute',
                  bottom: '-15px',
                  right: '-40px',
                  width: '14px',
                  height: '14px',
                  background: theme === 'dark' ? 'rgba(0, 71, 255, 0.4)' : 'rgba(0, 71, 255, 0.3)',
                  borderRadius: '3px',
                  transform: 'rotate(45deg)',
                }}
              />
              {/* Pain-point hook */}
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '12px',
                  letterSpacing: '0.15em',
                  color: '#0047FF',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                STOP GUESSING IF YOUR CONTENT SOUNDS LIKE YOU
              </motion.p>

              {/* Floating accent - small dot */}
              <motion.div
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                style={{
                  position: 'absolute',
                  top: '30%',
                  right: '-50px',
                  width: '8px',
                  height: '8px',
                  background: '#0047FF',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px rgba(0, 71, 255, 0.5)',
                }}
              />
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{
                  fontSize: 'clamp(60px, 14vw, 160px)',
                  lineHeight: 1.1,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'baseline',
                  letterSpacing: '-0.05em',
                  overflow: 'visible',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontWeight: 700,
                    fontStyle: 'italic',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000',
                  }}
                >
                  Brand
                </span>
                <span
                  className="os-shimmer"
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontWeight: 400,
                    fontSize: '1.25em',
                    fontStyle: 'italic',
                    display: 'inline-block',
                    paddingRight: '0.1em',
                    position: 'relative',
                    top: '0.05em',
                  }}
                >
                  OS
                </span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 1] }}
                  style={{
                    display: 'inline-block',
                    width: '4px',
                    height: '0.85em',
                    backgroundColor: '#0047FF',
                    marginLeft: '6px',
                    verticalAlign: 'baseline',
                    boxShadow: '0 0 8px rgba(0, 71, 255, 0.6)',
                  }}
                />
              </motion.h1>
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: 'clamp(18px, 3vw, 28px)',
                fontWeight: 400,
                color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                textAlign: 'center',
                margin: 0,
              }}
            >
              The AI operating system that understands, scales and enforces your brand's identity.
            </motion.p>

            {/* Input Form - Enhanced */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                width: '100%',
                maxWidth: '420px',
              }}
            >
              <motion.div 
                style={{ position: 'relative', width: '100%' }}
              >
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                  placeholder="@username"
                  maxLength={15}
                  style={{
                    width: '100%',
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '18px',
                    padding: '20px 24px',
                    borderRadius: '16px',
                    border: `2px solid ${error ? '#EF4444' : theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                    background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(12px)',
                    color: theme === 'dark' ? '#FFFFFF' : '#1a1a1a',
                    outline: 'none',
                    transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme === 'dark' ? '#0047FF' : '#3C8AFF';
                    e.currentTarget.style.boxShadow = theme === 'dark' 
                      ? '0 0 0 4px rgba(0, 71, 255, 0.2), 0 0 30px rgba(0, 71, 255, 0.15)' 
                      : '0 0 0 4px rgba(60, 138, 255, 0.2), 0 0 30px rgba(60, 138, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                />
              </motion.div>

              <motion.button
                type="submit"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: theme === 'dark' 
                    ? '0 0 40px rgba(0, 71, 255, 0.5), 0 8px 30px rgba(0, 71, 255, 0.3)' 
                    : '0 0 40px rgba(60, 138, 255, 0.4), 0 8px 30px rgba(60, 138, 255, 0.25)',
                  y: -2,
                }}
                whileTap={{ scale: 0.98, y: 0 }}
                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  width: '100%',
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '14px',
                  letterSpacing: '0.15em',
                  color: '#FFFFFF',
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #0047FF 0%, #002FA7 100%)'
                    : 'linear-gradient(135deg, #3C8AFF 0%, #0047FF 100%)',
                  border: 'none',
                  padding: '20px 32px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: theme === 'dark' 
                    ? '0 0 25px rgba(0, 71, 255, 0.3), 0 4px 15px rgba(0, 71, 255, 0.2)' 
                    : '0 0 25px rgba(60, 138, 255, 0.25), 0 4px 15px rgba(60, 138, 255, 0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Shimmer effect on button */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />
                <span style={{ position: 'relative', zIndex: 1 }}>GET YOUR BRAND SCORE</span>
              </motion.button>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '12px',
                    color: '#EF4444',
                    margin: 0,
                    padding: '8px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  {error}
                </motion.p>
              )}
            </motion.form>

            {/* Hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)',
                textAlign: 'center',
              }}
            >
              ENTER ANY PUBLIC X PROFILE TO GET STARTED
            </motion.p>

            {/* Leaderboard Toggle */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: showLeaderboard
                  ? (theme === 'dark' ? 'rgba(28, 96, 255, 0.15)' : 'rgba(60, 138, 255, 0.15)')
                  : (theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)'),
                backdropFilter: 'blur(12px)',
                border: `1px solid ${showLeaderboard
                  ? (theme === 'dark' ? 'rgba(28, 96, 255, 0.3)' : 'rgba(60, 138, 255, 0.3)')
                  : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)')}`,
                borderRadius: '30px',
                color: showLeaderboard
                  ? (theme === 'dark' ? '#1C60FF' : '#3C8AFF')
                  : (theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)'),
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.35s ease-out',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              {showLeaderboard ? 'HIDE LEADERBOARD' : 'VIEW LEADERBOARD'}
            </motion.button>

            {/* Leaderboard */}
            <AnimatePresence>
              {showLeaderboard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%', maxWidth: '600px', overflow: 'hidden' }}
                >
                  <Leaderboard
                    theme={theme}
                    onCheckScore={handleCheckFromLeaderboard}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* JOURNEY STATE */}
        {flowState === 'journey' && (
          <motion.div
            key="journey"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '100px',
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
                src={`${profile.profile_image_url.replace('_normal', '_200x200')}?v=${Date.now()}`}
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0047FF">
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

            {/* Creator Archetype Card - Spring bounce entrance */}
            {brandScore.archetype && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 2.2, 
                  type: 'spring', 
                  stiffness: 200, 
                  damping: 15,
                  mass: 0.8,
                }}
                style={{
                  width: '100%',
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, rgba(0, 71, 255, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(60, 138, 255, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(0, 71, 255, 0.2)' : 'rgba(60, 138, 255, 0.2)'}`,
                  borderRadius: '16px',
                  padding: '24px',
                  marginTop: '8px',
                }}
              >
                {/* Archetype Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '32px' }}>{brandScore.archetype.emoji}</span>
                  <div>
                    <div
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '10px',
                        letterSpacing: '0.15em',
                        color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                        marginBottom: '4px',
                      }}
                    >
                      YOUR CREATOR ARCHETYPE
                    </div>
                    <div
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '20px',
                        fontWeight: 700,
                        color: theme === 'dark' ? '#FFFFFF' : '#000000',
                      }}
                    >
                      {brandScore.archetype.primary}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#0047FF',
                        marginTop: '2px',
                      }}
                    >
                      {brandScore.archetype.tagline}
                    </div>
                  </div>
                </div>

                {/* Archetype Description */}
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    margin: '0 0 16px 0',
                  }}
                >
                  {brandScore.archetype.description}
                </p>

                {/* Archetype Strengths */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {brandScore.archetype.strengths.map((strength, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '10px',
                        letterSpacing: '0.05em',
                        color: '#10B981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                      }}
                    >
                      ✓ {strength}
                    </span>
                  ))}
                </div>

                {/* Growth Tip */}
                <div
                  style={{
                    background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>💡</span>
                  <div>
                    <div
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '9px',
                        letterSpacing: '0.1em',
                        color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                        marginBottom: '4px',
                      }}
                    >
                      GROWTH TIP FOR {brandScore.archetype.primary.toUpperCase()}S
                    </div>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '13px',
                        lineHeight: 1.5,
                        color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                        margin: 0,
                      }}
                    >
                      {brandScore.archetype.growthTip}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons - Enhanced with consistent micro-interactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 0.5 }}
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: '16px',
              }}
            >
              {/* Share to X - Primary action */}
              <motion.button
                onClick={() => {
                  const tweetText = `Just got my X Brand Score: ${brandScore.overallScore}/100\n\nI'm a ${brandScore.archetype?.primary || 'Creator'} ${brandScore.archetype?.emoji || ''}\n\nCheck yours:`;
                  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://brandos.ai';
                  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
                  window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
                }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  boxShadow: theme === 'dark' 
                    ? '0 0 40px rgba(0, 71, 255, 0.5), 0 8px 30px rgba(0, 71, 255, 0.3)' 
                    : '0 0 40px rgba(60, 138, 255, 0.4), 0 8px 30px rgba(60, 138, 255, 0.25)',
                }}
                whileTap={{ scale: 0.98, y: 0 }}
                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '13px',
                  letterSpacing: '0.1em',
                  color: '#FFFFFF',
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #0047FF 0%, #002FA7 100%)'
                    : 'linear-gradient(135deg, #3C8AFF 0%, #0047FF 100%)',
                  border: 'none',
                  padding: '16px 28px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  boxShadow: theme === 'dark' 
                    ? '0 0 25px rgba(0, 71, 255, 0.3), 0 4px 15px rgba(0, 71, 255, 0.2)' 
                    : '0 0 25px rgba(60, 138, 255, 0.25), 0 4px 15px rgba(60, 138, 255, 0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Shimmer effect */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />
                {/* X (Twitter) icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ position: 'relative', zIndex: 1 }}>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span style={{ position: 'relative', zIndex: 1 }}>BRAG ON X</span>
              </motion.button>

              {/* CTA to signup - Secondary */}
              <motion.button
                onClick={() => setFlowState('signup')}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
                  borderColor: theme === 'dark' ? 'rgba(0, 71, 255, 0.4)' : 'rgba(60, 138, 255, 0.4)',
                  boxShadow: theme === 'dark' 
                    ? '0 4px 20px rgba(0, 71, 255, 0.15)' 
                    : '0 4px 20px rgba(60, 138, 255, 0.1)',
                }}
                whileTap={{ scale: 0.98, y: 0 }}
                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '13px',
                  letterSpacing: '0.1em',
                  color: theme === 'dark' ? '#FFFFFF' : '#1a1a1a',
                  background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.35)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                  padding: '16px 28px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                }}
              >
                GET MY IMPROVEMENT PLAN
              </motion.button>

              {/* Compare with competitor - Tertiary */}
              <motion.button
                onClick={() => setShowCompetitorCompare(true)}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
                  borderColor: theme === 'dark' ? 'rgba(0, 71, 255, 0.4)' : 'rgba(60, 138, 255, 0.4)',
                  boxShadow: theme === 'dark' 
                    ? '0 4px 20px rgba(0, 71, 255, 0.15)' 
                    : '0 4px 20px rgba(60, 138, 255, 0.1)',
                }}
                whileTap={{ scale: 0.98, y: 0 }}
                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '13px',
                  letterSpacing: '0.1em',
                  color: theme === 'dark' ? '#FFFFFF' : '#1a1a1a',
                  background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.35)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                  padding: '16px 28px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="7" r="4" />
                  <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  <circle cx="19" cy="11" r="3" />
                  <path d="M22 21v-1a3 3 0 0 0-3-3h-1" />
                </svg>
                COMPARE
              </motion.button>
            </motion.div>

            {/* Deep Brand Analysis Toggle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
              style={{
                width: '100%',
                marginTop: '24px',
                borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                paddingTop: '24px',
              }}
            >
              <motion.button
                onClick={() => setShowBrandDNA(!showBrandDNA)}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: theme === 'dark' 
                    ? 'linear-gradient(135deg, rgba(28, 96, 255, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(60, 138, 255, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(28, 96, 255, 0.2)' : 'rgba(60, 138, 255, 0.2)'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🧬</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '12px',
                      letterSpacing: '0.1em',
                      color: theme === 'dark' ? '#FFFFFF' : '#1a1a1a',
                    }}>
                      DEEP BRAND DNA ANALYSIS
                    </div>
                    <div style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: '12px',
                      color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                      marginTop: '2px',
                    }}>
                      {brandIdentityLoading ? 'Analyzing...' : 'Voice profile, colors, bio rewrites & more'}
                    </div>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: showBrandDNA ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ color: '#1C60FF' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </motion.div>
              </motion.button>

              {/* Brand DNA Card */}
              <AnimatePresence>
                {showBrandDNA && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    {brandIdentityLoading ? (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '40px',
                        background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        borderRadius: '16px',
                      }}>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '3px solid transparent',
                            borderTopColor: '#1C60FF',
                            borderRadius: '50%',
                          }}
                        />
                        <div style={{
                          fontFamily: "'VCR OSD Mono', monospace",
                          fontSize: '11px',
                          letterSpacing: '0.1em',
                          color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        }}>
                          EXTRACTING BRAND DNA...
                        </div>
                      </div>
                    ) : brandIdentity && brandIdentity.brandDNA ? (
                      <BrandDNACard
                        brandDNA={brandIdentity.brandDNA}
                        bioLinguistics={brandIdentity.bioLinguistics}
                        nameAnalysis={brandIdentity.nameAnalysis}
                        profileImage={brandIdentity.profileImage}
                        improvements={brandIdentity.improvements}
                        theme={theme as 'light' | 'dark'}
                        profileName={profile.name}
                        profileHandle={profile.username}
                        profileImageUrl={profile.profile_image_url}
                      />
                    ) : (
                      <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        borderRadius: '16px',
                        color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '14px',
                      }}>
                        Unable to generate brand DNA. Try again later.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

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
                setShowConfetti(false);
                setBrandIdentity(null);
                setShowBrandDNA(false);
                apiResultRef.current = null;
                apiCompleteRef.current = false;
                apiErrorRef.current = null;
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
              Ready to stop guessing, @{profile.username}?
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
              Join 1,000+ creators who stopped winging their brand. Get your personalized improvement plan, consistency alerts, and AI-powered content checks—free.
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
                  Check your email for your personalized brand improvement guide.
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
                    border: `2px solid ${theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)'}`,
                    background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(12px)',
                    color: theme === 'dark' ? '#FFFFFF' : '#1a1a1a',
                    outline: 'none',
                    transition: 'all 0.35s ease-out',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme === 'dark' ? '#1C60FF' : '#3C8AFF';
                    e.currentTarget.style.boxShadow = theme === 'dark' ? '0 0 0 4px rgba(28, 96, 255, 0.15)' : '0 0 0 4px rgba(60, 138, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />

                <motion.button
                  type="submit"
                  disabled={signupStatus === 'loading'}
                  whileHover={{ scale: 1.01, boxShadow: theme === 'dark' ? '0 0 30px rgba(28, 96, 255, 0.4)' : '0 0 30px rgba(60, 138, 255, 0.35)' }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{
                    width: '100%',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '14px',
                    letterSpacing: '0.15em',
                    color: '#FFFFFF',
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #1C60FF 0%, #0D1EB8 100%)'
                      : 'linear-gradient(135deg, #3C8AFF 0%, #D0BBEB 100%)',
                    border: 'none',
                    padding: '18px 32px',
                    borderRadius: '14px',
                    cursor: signupStatus === 'loading' ? 'wait' : 'pointer',
                    boxShadow: theme === 'dark' ? '0 0 20px rgba(28, 96, 255, 0.25)' : '0 0 20px rgba(60, 138, 255, 0.2)',
                    opacity: signupStatus === 'loading' ? 0.7 : 1,
                  }}
                >
                  {signupStatus === 'loading' ? 'JOINING...' : 'CLAIM YOUR SPOT'}
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

      {/* Competitor Compare Modal */}
      <AnimatePresence>
        {showCompetitorCompare && profile && brandScore && (
          <CompetitorCompare
            yourProfile={{
              name: profile.name,
              username: profile.username,
              profile_image_url: profile.profile_image_url,
            }}
            yourScore={brandScore}
            theme={theme}
            onClose={() => setShowCompetitorCompare(false)}
          />
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

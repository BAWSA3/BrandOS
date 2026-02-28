'use client';

import { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from 'motion/react';
import BrandDNAPreview, { GeneratedBrandDNA } from './BrandDNAPreview';
import ShareableScoreCard, { ShareCardData } from './ShareableScoreCard';
import BrandAdvisorChat from './BrandAdvisorChat';
import DNAWalkthrough from './DNAWalkthrough';
import BrandOSDashboard, { BrandOSDashboardData } from './BrandOSDashboard';
import BrandIssuesSection from './BrandIssuesSection';
import { SaveResultsPrompt } from './SaveResultsPrompt';
import { useAuth } from '@/hooks/useAuth';
import { domToPng } from 'modern-screenshot';
import { AuthenticityAnalysis, ActivityAnalysis } from '@/lib/gemini';
import { useXBrandScoreDemoCapture } from '@/hooks/useDemoCaptureIntegration';
import DemoModeControls from './DemoModeControls';
import { AttestScoreButton } from '@/components/onchain';
import { PixelWorldScene, PixelHeroBackground, PixelProgressBar, PixelPhaseCard, PixelConfetti } from '@/components/pixel-world';

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

type FlowState = 'input' | 'journey' | 'walkthrough' | 'reveal' | 'signup' | 'insufficient_data';

interface XBrandScoreHeroProps {
  theme: string;
  initialUsername?: string;
  autoStart?: boolean;
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

const PHASE_COLORS = [
  '#5ABF3E', // Phase 1 (Define) - Spring green
  '#FFE066', // Phase 2 (Check) - Summer gold
  '#E88A4A', // Phase 3 (Generate) - Autumn orange
  '#B0D8F0', // Phase 4 (Scale) - Winter ice
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
// Typewriter Placeholder
// ============================================================================
function TypewriterPlaceholder({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        // Blink cursor a few times then hide
        setTimeout(() => setShowCursor(false), 2000);
      }
    }, 80);
    return () => clearInterval(interval);
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
        color: 'rgba(255,255,255,0.35)',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      {displayed}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
          style={{ marginLeft: '2px' }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function XBrandScoreHero({ theme, initialUsername, autoStart }: XBrandScoreHeroProps) {
  // Auth state
  const { user, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();
  const pendingInviteCode = searchParams.get('invite') || undefined;
  const [showSavePrompt, setShowSavePrompt] = useState(true);

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [username, setUsername] = useState(initialUsername || '');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<XProfileData | null>(null);
  const [brandScore, setBrandScore] = useState<BrandScoreResult | null>(null);
  const [generatedBrandDNA, setGeneratedBrandDNA] = useState<GeneratedBrandDNA | null>(null);
  const [accountAuthenticity, setAccountAuthenticity] = useState<AuthenticityAnalysis | null>(null);
  const [accountActivity, setAccountActivity] = useState<ActivityAnalysis | null>(null);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [itemProgress, setItemProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [email, setEmail] = useState('');
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showAdvisorChat, setShowAdvisorChat] = useState(false);

  // Compare state (coming soon)
  const [compareUsername, setCompareUsername] = useState('');

  const apiResultRef = useRef<{ profile: XProfileData; brandScore: BrandScoreResult } | null>(null);
  const apiCompleteRef = useRef(false);
  const apiErrorRef = useRef<string | null>(null);
  const autoStartTriggered = useRef(false);

  const [isValidating, setIsValidating] = useState(false);

  // Demo mode capture integration - automatically captures at key journey moments
  useXBrandScoreDemoCapture({
    flowState,
    currentPhase,
    username,
    isValidating,
  });

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

      // Check for fresh accounts with no posts - show insufficient data state
      if (flatProfile.tweet_count === 0) {
        setIsValidating(false);
        setFlowState('insufficient_data');
        return;
      }

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
                  profile: data.profile,
                }),
              });
              const identityData = await identityResponse.json();
              
              if (identityData.success && identityData.analysis) {
                // Store authenticity and activity analysis
                if (identityData.analysis.authenticity) {
                  setAccountAuthenticity(identityData.analysis.authenticity);
                }
                if (identityData.analysis.activity) {
                  setAccountActivity(identityData.analysis.activity);
                }

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

  // Auto-start analysis when initialUsername is provided
  useEffect(() => {
    if (initialUsername && autoStart && !autoStartTriggered.current && flowState === 'input') {
      autoStartTriggered.current = true;
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        // Create a synthetic form event and trigger submission
        const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(syntheticEvent);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialUsername, autoStart, flowState]);

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
                setFlowState('walkthrough');
                // Confetti will show after walkthrough completes
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

  // Handle compare profile (MVP: coming soon)
  const handleCompareProfile = () => {
    if (!compareUsername) return;
    // MVP: Show coming soon message
    alert('Profile comparison coming soon! We\'ll notify you when it\'s ready.');
  };

  return (
    <div
      className={flowState === 'input' ? 'crt-scanlines' : ''}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: flowState === 'journey' ? '0' : '48px 24px',
        position: 'relative',
        overflow: (flowState === 'walkthrough' || flowState === 'journey') ? 'visible' : 'hidden',
      }}
    >
      {/* Video Sky Background — visible during input state */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: flowState === 'input' ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <PixelHeroBackground />
      </motion.div>

      {/* Pixel World Background - Hidden during input, visible during journey, hidden during reveal */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: flowState === 'journey' ? 5 : 0,
          opacity: flowState === 'input' ? 0 : flowState === 'journey' ? 1 : flowState === 'reveal' ? 0 : 0.6,
          transition: 'opacity 0.8s ease',
          pointerEvents: 'none',
        }}
      >
        <PixelWorldScene
          flowState={flowState}
          currentPhase={currentPhase}
          itemProgress={itemProgress}
          theme={theme}
        />
      </div>

      {/* Journey Progress */}
      <AnimatePresence>
        {flowState === 'journey' && (
          <PixelProgressBar
            currentPhase={currentPhase}
            phaseProgress={itemProgress / phaseConfig[currentPhase - 1]?.items.length || 0}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Confetti */}
      <PixelConfetti isActive={showConfetti} />

      {/* Pixel vine corner decorations */}
      <AnimatePresence>
        {flowState === 'input' && (
          <>
            {[
              { top: 12, left: 12, rotate: '0deg' },
              { top: 12, right: 12, rotate: '90deg' },
              { bottom: 12, left: 12, rotate: '270deg' },
              { bottom: 12, right: 12, rotate: '180deg' },
            ].map((pos, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.25 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
                style={{
                  position: 'fixed', ...pos,
                  width: 24, height: 24,
                  pointerEvents: 'none', zIndex: 20,
                  imageRendering: 'pixelated' as const,
                  transform: `rotate(${pos.rotate})`,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" style={{ imageRendering: 'pixelated' }}>
                  <rect x="0" y="0" width="4" height="2" fill="#4A7A2A" />
                  <rect x="0" y="0" width="2" height="4" fill="#4A7A2A" />
                  <rect x="4" y="2" width="3" height="2" fill="#3A6B1E" />
                  <rect x="2" y="4" width="2" height="3" fill="#3A6B1E" />
                  <rect x="6" y="0" width="2" height="2" fill="#5ABF3E" opacity="0.5" />
                  <rect x="0" y="6" width="2" height="2" fill="#5ABF3E" opacity="0.5" />
                </svg>
              </motion.div>
            ))}

            {/* Version label */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              style={{
                position: 'fixed', top: 18, right: 44,
                fontFamily: "'VCR OSD Mono', 'PP NeueBit', monospace", fontSize: '10px',
                letterSpacing: '0.15em', color: 'rgba(245,222,179,0.3)',
                pointerEvents: 'none', zIndex: 20,
              }}
            >
              v2.0
            </motion.span>

            {/* Bottom-center label */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              style={{
                position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                fontFamily: "'VCR OSD Mono', 'PP NeueBit', monospace", fontSize: '10px',
                letterSpacing: '0.2em', color: 'rgba(245,222,179,0.25)',
                whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20,
              }}
            >
              ▸▸ POWERED BY AI ◂◂
            </motion.span>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* INPUT STATE */}
        {flowState === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '640px',
              width: '100%',
              height: '100vh',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Floating content with radial shadow for readability */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0px',
                padding: '0px 32px',
              }}
            >
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, delay: 0.5 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <img
                  src="/brandos-hero-logo.png"
                  alt="BrandOS"
                  style={{
                    width: 'clamp(600px, 85vw, 1050px)',
                    height: 'auto',
                  }}
                />
              </motion.div>

              {/* Tagline — positioned between logo and CTA */}
              <span style={{
                fontFamily: "'M42 Flight 721', sans-serif",
                fontSize: 'clamp(0.75rem, 1.8vw, 1.1rem)',
                color: 'rgba(0,0,0,0.85)',
                letterSpacing: '0.15em',
                marginTop: '-160px',
                marginBottom: '48px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.5))',
              }}>
                The AI-powered OS that builds your brand
              </span>

              {/* Input Form */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '420px',
                }}
              >
                {/* Terminal Input with > prefix */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  style={{ position: 'relative', width: '100%' }}
                >
                  {/* > prompt character */}
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontFamily: "'VCR OSD Mono', monospace", fontSize: '1.125rem',
                    color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', zIndex: 1,
                  }}>
                    &gt;
                  </span>
                  {/* Typewriter placeholder overlay */}
                  {!username && (
                    <TypewriterPlaceholder text="enter @username" />
                  )}
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                    placeholder=""
                    maxLength={15}
                    className="terminal-input"
                    style={{
                      width: '100%',
                      fontSize: '1.125rem',
                      padding: '1rem 1rem 1rem 32px',
                      textAlign: 'left',
                      borderRadius: '10px',
                      border: `1px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.15)'}`,
                      background: 'rgba(0,0,0,0.45)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffffff',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 71, 255, 0.5)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 71, 255, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = error ? '#EF4444' : 'rgba(255,255,255,0.15)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </motion.div>

                {/* CTA Button with glow */}
                <motion.button
                  type="submit"
                  disabled={isValidating}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                  whileHover={!isValidating ? { scale: 1.02 } : {}}
                  whileTap={!isValidating ? { scale: 0.98 } : {}}
                  style={{
                    width: '100%',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '13px',
                    letterSpacing: '0.15em',
                    color: '#ffffff',
                    background: '#0047FF',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '10px',
                    cursor: isValidating ? 'wait' : 'pointer',
                    opacity: isValidating ? 0.7 : 1,
                    boxShadow: '0 4px 24px rgba(0, 71, 255, 0.4), 0 0 48px rgba(0, 71, 255, 0.2)',
                    transition: 'opacity 0.3s ease, box-shadow 0.3s ease',
                  }}
                >
                  {isValidating ? 'PROCESSING...' : 'RUN ANALYSIS →'}
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
            </motion.div>

            {/* Footer hint — retro terminal style */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.4 }}
              style={{
                fontFamily: "'PP NeueBit', monospace",
                fontSize: '11px',
                letterSpacing: '0.15em',
                color: 'rgba(0,0,0,0.85)',
                textAlign: 'center',
                marginTop: '1.5rem',
              }}
            >
              ── WORKS WITH ANY PUBLIC X ACCOUNT ──
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
                <PixelPhaseCard
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

        {/* WALKTHROUGH STATE - Guided DNA Overview */}
        {flowState === 'walkthrough' && brandScore && profile && generatedBrandDNA && (
          <DNAWalkthrough
            profile={profile}
            brandScore={brandScore}
            generatedBrandDNA={generatedBrandDNA}
            authenticity={accountAuthenticity}
            activity={accountActivity}
            onComplete={() => {
              setFlowState('reveal');
              // Show confetti for high scores after walkthrough
              if (brandScore.overallScore >= 70) {
                setTimeout(() => setShowConfetti(true), 500);
              }
            }}
            theme={theme}
          />
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
                authenticity={accountAuthenticity}
                activity={accountActivity}
                onCopyToClipboard={async () => {
                  const element = document.getElementById('brandos-dashboard-capture');
                  if (!element) return;
                  const originalWidth = element.style.width;
                  const originalMinWidth = element.style.minWidth;
                  element.classList.add('capturing');
                  element.style.width = '1200px';
                  element.style.minWidth = '1200px';
                  const dataUrl = await domToPng(element, {
                    backgroundColor: '#050505',
                    scale: 2,
                    quality: 1,
                    width: 1200,
                  });
                  element.style.width = originalWidth;
                  element.style.minWidth = originalMinWidth;
                  element.classList.remove('capturing');
                  const response = await fetch(dataUrl);
                  const blob = await response.blob();
                  await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                  ]);
                }}
                onDownload={async () => {
                  const element = document.getElementById('brandos-dashboard-capture');
                  if (!element) return;
                  const originalWidth = element.style.width;
                  const originalMinWidth = element.style.minWidth;
                  element.classList.add('capturing');
                  element.style.width = '1200px';
                  element.style.minWidth = '1200px';
                  const dataUrl = await domToPng(element, {
                    backgroundColor: '#050505',
                    scale: 2,
                    quality: 1,
                    width: 1200,
                  });
                  element.style.width = originalWidth;
                  element.style.minWidth = originalMinWidth;
                  element.classList.remove('capturing');
                  const a = document.createElement('a');
                  a.href = dataUrl;
                  a.download = `brandos-dna-${profile.username}.png`;
                  a.click();
                }}
                onShareToX={() => {
                  const archetype = stripEmoji(generatedBrandDNA?.archetype || 'The Creator');
                  const tweetText = `Just discovered I'm "${archetype}" on @BrandOS_xyz

Brand Score: ${brandScore.overallScore}/100

What's YOUR brand archetype?
Get yours → mybrandos.app`;
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
                    '_blank',
                    'noopener,noreferrer,width=600,height=400'
                  );
                }}
              />
            </div>

            {/* Mint Score Onchain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="w-full max-w-[400px] mt-8"
            >
              <AttestScoreButton
                username={profile.username}
                overallScore={brandScore.overallScore}
                phases={{
                  define: { score: brandScore.phases.define.score },
                  check: { score: brandScore.phases.check.score },
                  generate: { score: brandScore.phases.generate.score },
                  scale: { score: brandScore.phases.scale.score },
                }}
                archetype={stripEmoji(generatedBrandDNA?.archetype || 'The Creator')}
              />
            </motion.div>

            {/* Save Results Prompt - Show for unauthenticated users */}
            {!user && !isAuthLoading && showSavePrompt && (
              <SaveResultsPrompt
                inviteCode={pendingInviteCode}
                onDismiss={() => setShowSavePrompt(false)}
              />
            )}

            {/* Dashboard CTA - Navigate to the real dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-full max-w-[600px] mt-16 flex flex-col items-center"
            >
              {/* CTA Card */}
              <div
                style={{
                  width: '100%',
                  padding: '48px 40px',
                  borderRadius: '24px',
                  background: 'rgba(26, 26, 26, 0.6)',
                  border: '1px solid rgba(10, 132, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Decorative line */}
                <div
                  style={{
                    width: '80px',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, rgba(10, 132, 255, 0.6), transparent)',
                    marginBottom: '32px',
                  }}
                />

                <h3
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '14px',
                    letterSpacing: '0.25em',
                    color: '#0A84FF',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                  }}
                >
                  Your Dashboard Awaits
                </h3>
                <p
                  style={{
                    fontSize: '17px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: '32px',
                    textAlign: 'center',
                    maxWidth: '420px',
                    lineHeight: '1.6',
                  }}
                >
                  Your Brand DNA has been analyzed. Open your personalized command center to check, generate, and scale your brand content.
                </p>

                <MagneticButton
                  onClick={() => {
                    // Navigate to the real dashboard — import brand DNA if available
                    if (generatedBrandDNA && profile) {
                      // Store the generated DNA so it can be imported on the dashboard
                      const importData = {
                        name: generatedBrandDNA.name || profile.name,
                        colors: {
                          primary: generatedBrandDNA.colors?.primary || '#000000',
                          secondary: generatedBrandDNA.colors?.secondary || '#ffffff',
                          accent: generatedBrandDNA.colors?.accent || '#6366f1',
                        },
                        tone: generatedBrandDNA.tone || { minimal: 50, playful: 50, bold: 50, experimental: 30 },
                        keywords: generatedBrandDNA.keywords || [],
                        doPatterns: generatedBrandDNA.doPatterns || [],
                        dontPatterns: generatedBrandDNA.dontPatterns || [],
                        voiceSamples: generatedBrandDNA.voiceSamples || [],
                      };
                      try { sessionStorage.setItem('brandos-import', JSON.stringify(importData)); } catch {}
                    }
                    window.location.href = '/app?imported=true';
                  }}
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '14px',
                    letterSpacing: '0.12em',
                    color: '#FFFFFF',
                    background: 'linear-gradient(135deg, #0A84FF 0%, #0060DF 100%)',
                    border: 'none',
                    padding: '18px 40px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 10px 40px -10px rgba(10, 132, 255, 0.4)',
                  }}
                >
                  OPEN YOUR DASHBOARD →
                </MagneticButton>

                {/* Secondary: share/compare options */}
                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}/score/${profile.username}`;
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        const btn = document.activeElement as HTMLButtonElement;
                        const originalText = btn.innerText;
                        btn.innerText = '✓ COPIED!';
                        setTimeout(() => { btn.innerText = originalText; }, 2000);
                      } catch { window.open(shareUrl, '_blank'); }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      color: 'rgba(255,255,255,0.4)',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.12)',
                      cursor: 'pointer',
                      padding: '10px 16px',
                      borderRadius: '8px',
                    }}
                  >
                    SHARE SCORE
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setFlowState('input');
                      setUsername('');
                      setProfile(null);
                      setBrandScore(null);
                      setGeneratedBrandDNA(null);
                      setShowConfetti(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      color: 'rgba(255,255,255,0.4)',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.12)',
                      cursor: 'pointer',
                      padding: '10px 16px',
                      borderRadius: '8px',
                    }}
                  >
                    ANALYZE ANOTHER
                  </motion.button>
                </div>
              </div>

              {/* Bottom decorative element */}
              <div
                style={{
                  marginTop: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: '11px',
                  fontFamily: "'VCR OSD Mono', monospace",
                  letterSpacing: '0.15em',
                }}
              >
                <div style={{ width: '30px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                POWERED BY BRANDOS
                <div style={{ width: '30px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
              </div>
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
            <div className="flex gap-3">
              <motion.button
                onClick={async () => {
                  const shareUrl = `${window.location.origin}/score/${profile.username}`;
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.innerText;
                    btn.innerText = '✓ COPIED!';
                    setTimeout(() => {
                      btn.innerText = originalText;
                    }, 2000);
                  } catch {
                    window.open(shareUrl, '_blank');
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  color: '#000',
                  background: '#D4A574',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                SHARE URL
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
                  border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                  cursor: 'pointer',
                  padding: '12px 20px',
                  borderRadius: '6px',
                }}
              >
                ANALYZE ANOTHER
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* INSUFFICIENT DATA STATE - Fresh accounts with no posts */}
        {flowState === 'insufficient_data' && profile && (
          <motion.div
            key="insufficient-data"
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
              padding: '40px 20px',
            }}
          >
            {/* Profile Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              {profile.profile_image_url && (
                <img
                  src={profile.profile_image_url.replace('_normal', '_200x200')}
                  alt={profile.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: '3px solid rgba(212, 165, 116, 0.3)',
                  }}
                />
              )}
              <div>
                <h3
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: '20px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#FFFFFF' : '#000000',
                    margin: 0,
                  }}
                >
                  {profile.name}
                </h3>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '14px',
                    color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  }}
                >
                  @{profile.username}
                </span>
              </div>
            </div>

            {/* Message */}
            <div
              style={{
                padding: '32px',
                background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: '16px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h2
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '14px',
                  letterSpacing: '0.1em',
                  color: '#D4A574',
                  margin: '0 0 12px 0',
                }}
              >
                NOT ENOUGH DATA
              </h2>
              <p
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '16px',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                We need some posts to analyze your brand DNA. Come back after you've shared some content!
              </p>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: '32px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', marginBottom: '4px' }}>POSTS</div>
                <div style={{ color: '#D4A574', fontSize: '20px', fontWeight: 700 }}>0</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', marginBottom: '4px' }}>FOLLOWERS</div>
                <div style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000', fontSize: '20px', fontWeight: 700 }}>{formatFollowersDisplay(profile.followers_count)}</div>
              </div>
            </div>

            {/* CTA */}
            <motion.button
              onClick={() => {
                setFlowState('input');
                setUsername('');
                setProfile(null);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '12px',
                letterSpacing: '0.1em',
                color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                background: 'transparent',
                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                cursor: 'pointer',
                padding: '14px 24px',
                borderRadius: '8px',
              }}
            >
              ANALYZE ANOTHER ACCOUNT
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

      {/* Brand Advisor Chat Modal */}
      {generatedBrandDNA && (
        <BrandAdvisorChat
          brandDNA={generatedBrandDNA}
          isOpen={showAdvisorChat}
          onClose={() => setShowAdvisorChat(false)}
          onJoinWaitlist={() => {
            setShowAdvisorChat(false);
            setFlowState('signup');
          }}
        />
      )}

      {/* Demo Mode Controls - only visible when demo=true param is present */}
      <DemoModeControls theme={theme} />
    </div>
  );
}

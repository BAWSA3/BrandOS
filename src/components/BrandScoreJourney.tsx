'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from '@/lib/gsap';
import { ScrollTrigger } from '@/lib/gsap/ScrollTrigger';
import PhaseSection from './PhaseSection';
import ScoreReveal from './ScoreReveal';
import JourneyProgress from './JourneyProgress';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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
  archetype?: CreatorArchetype;
  cryptoContext?: boolean;
}

interface BrandScoreJourneyProps {
  theme: string;
  onComplete?: () => void;
}

type JourneyState = 'input' | 'loading' | 'journey' | 'reveal' | 'cta';

const phaseConfig = [
  {
    id: 'define',
    number: 1,
    title: 'DEFINE',
    subtitle: 'Understanding your brand identity',
    description: "We're analyzing your bio for clarity and value proposition...",
    analyzing: ['Display name alignment', 'Bio clarity', 'Value proposition', 'Target audience signals'],
  },
  {
    id: 'check',
    number: 2,
    title: 'CHECK',
    subtitle: 'Checking consistency',
    description: "We're checking if your brand elements align...",
    analyzing: ['Username/name consistency', 'Tone alignment', 'Professional presentation', 'Message coherence'],
  },
  {
    id: 'generate',
    number: 3,
    title: 'GENERATE',
    subtitle: 'Evaluating completeness',
    description: "We're assessing your profile's content quality...",
    analyzing: ['Profile completeness', 'Bio formatting', 'Link presence', 'Call-to-action clarity'],
  },
  {
    id: 'scale',
    number: 4,
    title: 'SCALE',
    subtitle: 'Measuring growth readiness',
    description: "We're evaluating your brand's scaling potential...",
    analyzing: ['Follower ratio health', 'Engagement signals', 'Discovery optimization', 'Platform best practices'],
  },
];

export default function BrandScoreJourney({ theme, onComplete }: BrandScoreJourneyProps) {
  const [journeyState, setJourneyState] = useState<JourneyState>('input');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<XProfileData | null>(null);
  const [brandScore, setBrandScore] = useState<BrandScoreResult | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputSectionRef = useRef<HTMLElement>(null);
  const phaseSectionsRef = useRef<HTMLElement[]>([]);
  const revealSectionRef = useRef<HTMLElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter your X username');
      return;
    }

    setError('');
    setJourneyState('loading');

    try {
      const response = await fetch('/api/x-brand-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze profile');
      }

      setProfile(data.profile);
      setBrandScore(data.brandScore);
      setJourneyState('journey');
      setCurrentPhase(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setJourneyState('input');
    }
  };

  // Set up GSAP scroll animations when journey starts
  useEffect(() => {
    if (journeyState !== 'journey' || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Pin each phase section and track progress
      phaseSectionsRef.current.forEach((section, index) => {
        if (!section) return;

        // @ts-expect-error - GSAP ScrollTrigger plugin types
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: '+=100%',
          pin: true,
          pinSpacing: true,
          scrub: 1,
          onUpdate: (self: { isActive: boolean; progress: number }) => {
            if (self.isActive) {
              setCurrentPhase(index + 1);
              setPhaseProgress(self.progress);
            }
          },
          onEnter: () => setCurrentPhase(index + 1),
        });
      });

      // Score reveal section
      if (revealSectionRef.current) {
        // @ts-expect-error - GSAP ScrollTrigger plugin types
        ScrollTrigger.create({
          trigger: revealSectionRef.current,
          start: 'top center',
          onEnter: () => setJourneyState('reveal'),
        });
      }

      // CTA section
      if (ctaSectionRef.current) {
        // @ts-expect-error - GSAP ScrollTrigger plugin types
        ScrollTrigger.create({
          trigger: ctaSectionRef.current,
          start: 'top center',
          onEnter: () => setJourneyState('cta'),
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [journeyState]);

  // Get profile data for current phase
  const getPhaseProfileData = (phaseId: string): Record<string, string> => {
    if (!profile) return {};

    switch (phaseId) {
      case 'define':
        return {
          'Display Name': profile.name,
          'Bio': profile.description || '(No bio set)',
        };
      case 'check':
        return {
          'Username': `@${profile.username}`,
          'Display Name': profile.name,
          'Alignment': profile.name.toLowerCase().includes(profile.username.toLowerCase()) ? '✓ Aligned' : '⚠ Different',
        };
      case 'generate':
        return {
          'Profile Image': profile.profile_image_url ? '✓ Set' : '✗ Missing',
          'Website': profile.url || '(No link)',
          'Bio Length': profile.description ? `${profile.description.length} chars` : '0 chars',
        };
      case 'scale':
        return {
          'Followers': profile.followers_count.toLocaleString(),
          'Following': profile.following_count.toLocaleString(),
          'Ratio': (profile.followers_count / Math.max(profile.following_count, 1)).toFixed(2),
        };
      default:
        return {};
    }
  };

  return (
    <div ref={containerRef} className="brand-score-journey">
      {/* Progress Indicator - Fixed position */}
      {journeyState === 'journey' && (
        <JourneyProgress 
          currentPhase={currentPhase} 
          totalPhases={4} 
          phaseProgress={phaseProgress}
          theme={theme}
        />
      )}

      {/* Section 1: Hero Input */}
      <section
        ref={inputSectionRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait">
          {(journeyState === 'input' || journeyState === 'loading') && (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '32px',
                maxWidth: '600px',
                width: '100%',
              }}
            >
              {/* Logo */}
              <motion.h1
                style={{
                  fontSize: 'clamp(60px, 12vw, 140px)',
                  lineHeight: 1,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'baseline',
                  letterSpacing: '-0.05em',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontWeight: 700,
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
                    fontSize: '1.15em',
                    fontStyle: 'italic',
                  }}
                >
                  OS
                </span>
              </motion.h1>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(20px, 3vw, 32px)',
                  fontWeight: 400,
                  color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                See your brand through AI eyes
              </motion.p>

              {/* Input Form */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  width: '100%',
                  maxWidth: '400px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    gap: '12px',
                  }}
                >
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '18px',
                        color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                      }}
                    >
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                      placeholder="your_handle"
                      maxLength={15}
                      disabled={journeyState === 'loading'}
                      style={{
                        width: '100%',
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: '18px',
                        padding: '20px 20px 20px 44px',
                        borderRadius: '16px',
                        border: `2px solid ${error ? '#EF4444' : theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                        background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        color: theme === 'dark' ? '#FFFFFF' : '#000000',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#0047FF';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 71, 255, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={journeyState === 'loading'}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(0, 71, 255, 0.5)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '14px',
                    letterSpacing: '0.15em',
                    color: '#FFFFFF',
                    background: '#0047FF',
                    border: 'none',
                    padding: '20px 32px',
                    borderRadius: '16px',
                    cursor: journeyState === 'loading' ? 'wait' : 'pointer',
                    boxShadow: '0 0 30px rgba(0, 71, 255, 0.3)',
                    opacity: journeyState === 'loading' ? 0.7 : 1,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {journeyState === 'loading' ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          display: 'inline-block',
                        }}
                      />
                      ANALYZING...
                    </span>
                  ) : (
                    'ANALYZE MY BRAND'
                  )}
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

              {/* Hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll indicator after journey starts */}
        {journeyState === 'journey' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              bottom: '48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.2em',
                color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              SCROLL TO BEGIN ANALYSIS
            </span>
            <motion.svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              strokeWidth="2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </motion.svg>
          </motion.div>
        )}
      </section>

      {/* Phase Sections - Only render after journey starts */}
      {journeyState !== 'input' && journeyState !== 'loading' && (
        <>
          {phaseConfig.map((phase, index) => (
            <PhaseSection
              key={phase.id}
              ref={(el) => { phaseSectionsRef.current[index] = el!; }}
              phase={phase}
              profileData={getPhaseProfileData(phase.id)}
              profileImage={phase.id === 'generate' ? profile?.profile_image_url : undefined}
              isActive={currentPhase === index + 1}
              progress={currentPhase === index + 1 ? phaseProgress : currentPhase > index + 1 ? 1 : 0}
              theme={theme}
            />
          ))}

          {/* Score Reveal Section */}
          <section
            ref={revealSectionRef}
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '48px',
            }}
          >
            {brandScore && profile && (
              <ScoreReveal
                profile={profile}
                brandScore={brandScore}
                isVisible={journeyState === 'reveal' || journeyState === 'cta'}
                theme={theme}
              />
            )}
          </section>

          {/* CTA Section */}
          <section
            ref={ctaSectionRef}
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '48px',
              gap: '32px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={journeyState === 'cta' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                maxWidth: '500px',
                textAlign: 'center',
              }}
            >
              <h2
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(28px, 5vw, 48px)',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#FFFFFF' : '#000000',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Ready to eliminate brand drift?
              </h2>
              
              <p
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: '18px',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                BrandOS keeps your brand consistent across every channel, every team member, every piece of content.
              </p>

              <motion.button
                onClick={onComplete}
                whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(0, 71, 255, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '14px',
                  letterSpacing: '0.15em',
                  color: '#FFFFFF',
                  background: '#0047FF',
                  border: 'none',
                  padding: '20px 48px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(0, 71, 255, 0.3)',
                  marginTop: '16px',
                }}
              >
                JOIN THE WAITLIST
              </motion.button>

              <p
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)',
                  marginTop: '24px',
                }}
              >
                ONE BRAND. EVERY CHANNEL. ALWAYS CONSISTENT.
              </p>
            </motion.div>
          </section>
        </>
      )}
    </div>
  );
}




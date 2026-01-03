'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useMemo } from 'react';
import {
  HeroIntroSection,
  ScoreSection,
  PersonalitySection,
  ToneSection,
  PillarsSection,
  InfluenceSection,
  ShareSection,
} from './WrappedSections';
import { ShareCardData } from './ShareCardPrototypes';

// =============================================================================
// TYPES
// =============================================================================

interface ContentPillar {
  name: string;
  frequency: number;
  avgEngagement: number;
}

export interface WrappedRevealData {
  // Profile
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  followersCount: number;
  
  // Score
  brandScore: number;
  voiceConsistency: number;
  
  // Personality
  archetype: string;
  archetypeEmoji: string;
  personalityType: string;
  personalitySummary: string;
  
  // Tone
  tone: {
    formality: number;
    energy: number;
    confidence: number;
    style: number;
  };
  
  // Influence
  influenceTier: 'Nano' | 'Micro' | 'Mid' | 'Macro' | 'Mega';
  
  // Brand Colors
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Content
  contentPillars?: ContentPillar[];
}

interface WrappedRevealProps {
  data: WrappedRevealData;
  onAnalyzeAnother: () => void;
  onClaim: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function WrappedReveal({
  data,
  onAnalyzeAnother,
  onClaim,
}: WrappedRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scroll progress for potential parallax effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  
  // Background gradient animation based on scroll
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.3, 1], [0.3, 0.5, 0.3]);
  
  // Map to ShareCardData format for the share section
  const shareCardData: ShareCardData = useMemo(() => ({
    brandScore: data.brandScore,
    voiceConsistency: data.voiceConsistency,
    username: data.username,
    displayName: data.displayName,
    profileImageUrl: data.profileImageUrl,
    followersCount: data.followersCount,
    influenceTier: data.influenceTier,
    archetype: data.archetype,
    archetypeEmoji: data.archetypeEmoji,
    personalityType: data.personalityType,
    personalitySummary: data.personalitySummary,
    tone: data.tone,
    brandColors: data.brandColors,
  }), [data]);
  
  const primaryColor = data.brandColors?.primary || '#0047FF';
  const secondaryColor = data.brandColors?.secondary || '#9d4edd';

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Gradient */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse 150% 80% at 50% 20%, ${primaryColor}20 0%, transparent 50%), 
                       radial-gradient(ellipse 100% 60% at 80% 80%, ${secondaryColor}15 0%, transparent 40%)`,
          opacity: backgroundOpacity,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Section 1: Hero Intro */}
        <HeroIntroSection
          username={data.username}
          displayName={data.displayName}
          profileImageUrl={data.profileImageUrl}
        />
        
        {/* Section Divider */}
        <SectionDivider />
        
        {/* Section 2: Brand Score */}
        <ScoreSection
          score={data.brandScore}
          primaryColor={primaryColor}
        />
        
        {/* Section Divider */}
        <SectionDivider />
        
        {/* Section 3: Personality */}
        <PersonalitySection
          archetype={data.archetype}
          archetypeEmoji={data.archetypeEmoji}
          personalitySummary={data.personalitySummary}
        />
        
        {/* Section Divider */}
        <SectionDivider />
        
        {/* Section 4: Tone of Voice */}
        <ToneSection
          tone={data.tone}
          primaryColor={primaryColor}
        />
        
        {/* Section Divider */}
        <SectionDivider />
        
        {/* Section 5: Content Pillars */}
        <PillarsSection contentPillars={data.contentPillars} />
        
        {/* Section Divider */}
        <SectionDivider />
        
        {/* Section 6: Influence & Colors */}
        <InfluenceSection
          influenceTier={data.influenceTier}
          followersCount={data.followersCount}
          brandColors={data.brandColors}
        />
        
        {/* Section Divider */}
        <SectionDivider />
        
        {/* Section 7: Share Card */}
        <ShareSection
          data={shareCardData}
          onAnalyzeAnother={onAnalyzeAnother}
          onClaim={onClaim}
        />
      </div>
      
      {/* Progress Indicator (fixed on right) */}
      <ScrollProgressIndicator progress={scrollYProgress} />
    </motion.div>
  );
}

// =============================================================================
// SECTION DIVIDER
// =============================================================================

function SectionDivider() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.6 }}
      style={{
        width: '100%',
        maxWidth: '200px',
        height: '1px',
        margin: '0 auto',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
      }}
    />
  );
}

// =============================================================================
// SCROLL PROGRESS INDICATOR
// =============================================================================

interface ScrollProgressIndicatorProps {
  progress: ReturnType<typeof useTransform> | { get(): number };
}

function ScrollProgressIndicator({ progress }: ScrollProgressIndicatorProps) {
  const scaleY = useTransform(
    progress as ReturnType<typeof useScroll>['scrollYProgress'],
    [0, 1],
    [0, 1]
  );
  
  return (
    <>
      {/* Desktop progress indicator (hidden on mobile via CSS) */}
      <div
        style={{
          position: 'fixed',
          right: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '120px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          zIndex: 100,
        }}
        className="scroll-progress-track"
      >
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, #0047FF, #9d4edd)',
            borderRadius: '2px',
            transformOrigin: 'top',
            scaleY,
          }}
        />
      </div>
      
      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .scroll-progress-track {
            display: none;
          }
        }
        @media (min-width: 769px) {
          .scroll-progress-track {
            display: block;
          }
        }
      `}</style>
    </>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { WrappedRevealData };

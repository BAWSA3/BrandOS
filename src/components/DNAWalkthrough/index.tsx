'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GeneratedBrandDNA } from '../BrandDNAPreview';
import { AuthenticityAnalysis, ActivityAnalysis } from '@/lib/gemini';
import WalkthroughProgress from './WalkthroughProgress';
import ScoreWalkthrough from './sections/ScoreWalkthrough';
import IdentityWalkthrough from './sections/IdentityWalkthrough';
import ToneWalkthrough from './sections/ToneWalkthrough';
import ArchetypeWalkthrough from './sections/ArchetypeWalkthrough';
import KeywordsWalkthrough from './sections/KeywordsWalkthrough';
import PillarsWalkthrough from './sections/PillarsWalkthrough';
import JourneyEnd, { JourneyEndData } from '../JourneyEnd';

// Types
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

interface DNAWalkthroughProps {
  profile: XProfileData;
  brandScore: BrandScoreResult;
  generatedBrandDNA: GeneratedBrandDNA;
  authenticity?: AuthenticityAnalysis | null;
  activity?: ActivityAnalysis | null;
  onComplete: () => void;
  theme: string;
}

const SECTION_NAMES = [
  'Brand Score',
  'Identity',
  'Tone',
  'Archetype',
  'Keywords',
  'Content',
];

export default function DNAWalkthrough({
  profile,
  brandScore,
  generatedBrandDNA,
  authenticity,
  activity,
  onComplete,
  theme,
}: DNAWalkthroughProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [showJourneyEnd, setShowJourneyEnd] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to find best phase
  function getBestPhase(phases: BrandScoreResult['phases']) {
    const phaseEntries = Object.entries(phases) as [string, { score: number }][];
    const avgScore = phaseEntries.reduce((sum, [, p]) => sum + p.score, 0) / 4;
    let best = { name: 'Define', score: 0, diff: 0 };
    for (const [name, phase] of phaseEntries) {
      const diff = phase.score - avgScore;
      if (diff > best.diff) {
        best = { name: name.charAt(0).toUpperCase() + name.slice(1), score: phase.score, diff: Math.round(diff) };
      }
    }
    return best;
  }

  // Prepare data for JourneyEnd
  const journeyEndData: JourneyEndData = {
    score: brandScore.overallScore,
    archetype: generatedBrandDNA.archetype,
    archetypeEmoji: generatedBrandDNA.archetypeEmoji || '🧬',
    personalityType: generatedBrandDNA.personalityType,
    username: profile.username,
    displayName: profile.name,
    profileImageUrl: profile.profile_image_url,
    topStrength: brandScore.topStrengths[0] || 'Brand consistency',
    bestPhase: getBestPhase(brandScore.phases),
    voiceProfile: generatedBrandDNA.voiceProfile || '',
    keywords: generatedBrandDNA.keywords,
  };

  // Track which section is in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setActiveSection(index);
          }
        },
        { threshold: [0.3, 0.5] }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewDashboard = () => {
    setShowJourneyEnd(true);
  };

  const handleJourneyEndComplete = () => {
    setShowJourneyEnd(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(onComplete, 300);
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#050505]">
      {/* Progress Indicator */}
      <WalkthroughProgress
        sections={SECTION_NAMES}
        activeIndex={activeSection}
        onSectionClick={scrollToSection}
      />

      {/* Sections - main scrollable content */}
      <div
        className="relative z-10 transition-all duration-300"
        style={{
          filter: showJourneyEnd ? 'blur(20px)' : 'none',
          transform: showJourneyEnd ? 'scale(0.95)' : 'scale(1)',
          opacity: showJourneyEnd ? 0.3 : 1,
        }}
      >
        {/* 1. Brand Score */}
        <div ref={(el) => { sectionRefs.current[0] = el; }}>
          <ScoreWalkthrough
            score={brandScore.overallScore}
            phases={brandScore.phases}
            summary={brandScore.summary}
            theme={theme}
          />
        </div>

        {/* 2. Identity */}
        <div ref={(el) => { sectionRefs.current[1] = el; }}>
          <IdentityWalkthrough
            profile={profile}
            authenticity={authenticity}
            activity={activity}
            theme={theme}
          />
        </div>

        {/* 3. Tone */}
        <div ref={(el) => { sectionRefs.current[2] = el; }}>
          <ToneWalkthrough
            tone={generatedBrandDNA.tone}
            voiceProfile={generatedBrandDNA.voiceProfile}
            theme={theme}
          />
        </div>

        {/* 4. Archetype */}
        <div ref={(el) => { sectionRefs.current[3] = el; }}>
          <ArchetypeWalkthrough
            archetype={generatedBrandDNA.archetype}
            archetypeEmoji={generatedBrandDNA.archetypeEmoji}
            personalityType={generatedBrandDNA.personalityType}
            personalitySummary={generatedBrandDNA.personalitySummary}
            theme={theme}
          />
        </div>

        {/* 5. Keywords */}
        <div ref={(el) => { sectionRefs.current[4] = el; }}>
          <KeywordsWalkthrough
            keywords={generatedBrandDNA.keywords}
            voiceSamples={generatedBrandDNA.voiceSamples}
            doPatterns={generatedBrandDNA.doPatterns}
            dontPatterns={generatedBrandDNA.dontPatterns}
            theme={theme}
          />
        </div>

        {/* 6. Content Pillars */}
        <div ref={(el) => { sectionRefs.current[5] = el; }}>
          <PillarsWalkthrough
            contentPillars={generatedBrandDNA.contentPillars}
            performanceInsights={generatedBrandDNA.performanceInsights}
            theme={theme}
          />
        </div>

        {/* Final CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="min-h-[50vh] flex flex-col items-center justify-center px-6 py-20"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-[500px] flex flex-col items-center"
          >
            {/* CTA Card */}
            <div
              style={{
                width: '100%',
                padding: '48px 40px',
                borderRadius: '24px',
                background: theme === 'dark' ? 'rgba(26, 26, 26, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                border: `1px solid ${theme === 'dark' ? 'rgba(212, 165, 116, 0.15)' : 'rgba(212, 165, 116, 0.3)'}`,
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
                  background: `linear-gradient(90deg, transparent, ${theme === 'dark' ? 'rgba(212, 165, 116, 0.6)' : 'rgba(212, 165, 116, 0.8)'}, transparent)`,
                  marginBottom: '32px',
                }}
              />

              {/* Encouraging tagline */}
              <h3
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '14px',
                  letterSpacing: '0.25em',
                  color: '#D4A574',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                }}
              >
                Your Brand DNA is Ready
              </h3>
              <p
                style={{
                  fontSize: '17px',
                  color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  marginBottom: '32px',
                  textAlign: 'center',
                  maxWidth: '420px',
                  lineHeight: '1.6',
                }}
              >
                Take control of your personal brand with AI-powered tools to check, generate, and scale your content.
              </p>

              {/* View Dashboard Button */}
              <motion.button
                onClick={handleViewDashboard}
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(212, 165, 116, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-5 rounded-xl cursor-pointer border-none font-semibold"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: '15px',
                  letterSpacing: '0.12em',
                  color: '#050505',
                  background: 'linear-gradient(135deg, #E8C49A 0%, #D4A574 100%)',
                  boxShadow: '0 4px 24px rgba(212, 165, 116, 0.3)',
                }}
              >
                VIEW YOUR DASHBOARD
              </motion.button>
            </div>

            {/* Bottom decorative element */}
            <div
              style={{
                marginTop: '40px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                fontSize: '11px',
                fontFamily: "'VCR OSD Mono', monospace",
                letterSpacing: '0.15em',
              }}
            >
              <div style={{ width: '30px', height: '1px', background: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
              POWERED BY BRANDOS
              <div style={{ width: '30px', height: '1px', background: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Journey End Experience */}
      {showJourneyEnd && (
        <JourneyEnd
          data={journeyEndData}
          theme={theme}
          onComplete={handleJourneyEndComplete}
        />
      )}
    </div>
  );
}

'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedBrandDNA } from '../BrandDNAPreview';
import { AuthenticityAnalysis, ActivityAnalysis } from '@/lib/gemini';
import WalkthroughProgress from './WalkthroughProgress';
import ScoreWalkthrough from './sections/ScoreWalkthrough';
import IdentityWalkthrough from './sections/IdentityWalkthrough';
import ToneWalkthrough from './sections/ToneWalkthrough';
import ArchetypeWalkthrough from './sections/ArchetypeWalkthrough';
import KeywordsWalkthrough from './sections/KeywordsWalkthrough';
import PillarsWalkthrough from './sections/PillarsWalkthrough';
import IssuesWalkthrough from './sections/IssuesWalkthrough';

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
  'Issues',
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
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track which section is in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(index);
            if (index === SECTION_NAMES.length - 1) {
              setHasReachedEnd(true);
            }
          }
        },
        { threshold: [0.5] }
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
    // Smooth scroll to top then transition
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(onComplete, 500);
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#050505]">
      {/* Progress Indicator */}
      <WalkthroughProgress
        sections={SECTION_NAMES}
        activeIndex={activeSection}
        onSectionClick={scrollToSection}
      />

      {/* Sections */}
      <div className="relative">
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

        {/* 7. Issues */}
        <div ref={(el) => { sectionRefs.current[6] = el; }}>
          <IssuesWalkthrough
            brandScore={brandScore}
            profile={profile}
            authenticity={authenticity}
            theme={theme}
          />
        </div>

        {/* Final CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center max-w-lg"
          >
            <div className="text-5xl mb-6">
              {generatedBrandDNA.archetypeEmoji || '🧬'}
            </div>
            <h2
              className="text-2xl md:text-3xl font-semibold mb-4"
              style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}
            >
              Your Brand DNA is Complete
            </h2>
            <p
              className="text-base mb-8"
              style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
            >
              You've seen how we analyzed your brand. Now see everything in one view
              and start taking action.
            </p>
            <motion.button
              onClick={handleViewDashboard}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl cursor-pointer border-none font-semibold"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '12px',
                letterSpacing: '0.12em',
                color: '#050505',
                background: 'linear-gradient(135deg, #E8C49A 0%, #D4A574 100%)',
                boxShadow: '0 4px 24px rgba(212, 165, 116, 0.4)',
              }}
            >
              VIEW YOUR DASHBOARD
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

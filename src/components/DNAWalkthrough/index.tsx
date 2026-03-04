'use client';

import { useRef, useState, useEffect } from 'react';
import { GeneratedBrandDNA } from '../BrandDNAPreview';
import { AuthenticityAnalysis, ActivityAnalysis } from '@/lib/gemini';
import WalkthroughProgress from './WalkthroughProgress';
import DataRevealSection from './sections/DataRevealSection';
import AnalysisSection from './sections/AnalysisSection';
import BrandDNASection from './sections/BrandDNASection';
import ActionPlanSection from './sections/ActionPlanSection';
import JourneyEnd, { JourneyEndData } from '../JourneyEnd';
import { useDNAWalkthroughDemoCapture } from '@/hooks/useDemoCaptureIntegration';
import ParallaxBackground from './ParallaxBackground';
import type { RawTweet } from './TweetExcerpt';

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
  rawTweets?: RawTweet[];
  onComplete: () => void;
  theme: string;
}

const SECTION_NAMES = [
  'DEFINE: What We Found',
  'CHECK: What It Means',
  'GENERATE: Your Brand DNA',
  'SCALE: Start Here',
];

export default function DNAWalkthrough({
  profile,
  brandScore,
  generatedBrandDNA,
  rawTweets = [],
  onComplete,
  theme,
}: DNAWalkthroughProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [showJourneyEnd, setShowJourneyEnd] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useDNAWalkthroughDemoCapture({ activeSection });

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

  const journeyEndData: JourneyEndData = {
    score: brandScore.overallScore,
    archetype: generatedBrandDNA.archetype,
    archetypeEmoji: generatedBrandDNA.archetypeEmoji || '🧬',
    personalityType: generatedBrandDNA.personalityType || 'INTJ',
    username: profile.username,
    displayName: profile.name,
    profileImageUrl: profile.profile_image_url,
    topStrength: brandScore.topStrengths[0] || 'Brand consistency',
    bestPhase: getBestPhase(brandScore.phases),
    voiceProfile: generatedBrandDNA.voiceProfile || '',
    keywords: generatedBrandDNA.keywords,
  };

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

  const voiceConsistencyScore =
    generatedBrandDNA.voiceConsistencyReport?.overallScore
    ?? generatedBrandDNA.performanceInsights?.voiceConsistency
    ?? null;

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#050505]">
      <ParallaxBackground theme={theme} />

      <WalkthroughProgress
        sections={SECTION_NAMES}
        activeIndex={activeSection}
        onSectionClick={scrollToSection}
      />

      <div
        className="relative z-10 transition-all duration-300"
        style={{
          filter: showJourneyEnd ? 'blur(20px)' : 'none',
          transform: showJourneyEnd ? 'scale(0.95)' : 'scale(1)',
          opacity: showJourneyEnd ? 0.3 : 1,
        }}
      >
        {/* Chapter 1: What We Found */}
        <div ref={(el) => { sectionRefs.current[0] = el; }}>
          <DataRevealSection
            profile={profile}
            rawTweets={rawTweets}
            theme={theme}
          />
        </div>

        {/* Chapter 2: What It Means */}
        <div ref={(el) => { sectionRefs.current[1] = el; }}>
          <AnalysisSection
            profile={profile}
            brandScore={brandScore}
            tone={generatedBrandDNA.tone}
            voiceProfile={generatedBrandDNA.voiceProfile}
            archetype={generatedBrandDNA.archetype}
            archetypeEmoji={generatedBrandDNA.archetypeEmoji}
            personalityType={generatedBrandDNA.personalityType}
            personalitySummary={generatedBrandDNA.personalitySummary}
            rawTweets={rawTweets}
            theme={theme}
          />
        </div>

        {/* Chapter 3: Your Brand DNA */}
        <div ref={(el) => { sectionRefs.current[2] = el; }}>
          <BrandDNASection
            keywords={generatedBrandDNA.keywords}
            voiceSamples={generatedBrandDNA.voiceSamples}
            doPatterns={generatedBrandDNA.doPatterns}
            dontPatterns={generatedBrandDNA.dontPatterns}
            contentPillars={generatedBrandDNA.contentPillars}
            performanceInsights={generatedBrandDNA.performanceInsights}
            voiceConsistencyReport={generatedBrandDNA.voiceConsistencyReport}
            rawTweets={rawTweets}
            theme={theme}
          />
        </div>

        {/* Chapter 4: Start Here */}
        <div ref={(el) => { sectionRefs.current[3] = el; }}>
          <ActionPlanSection
            profile={profile}
            brandScore={brandScore}
            keywords={generatedBrandDNA.keywords}
            doPatterns={generatedBrandDNA.doPatterns}
            voiceConsistencyScore={voiceConsistencyScore}
            onViewDashboard={handleViewDashboard}
            theme={theme}
          />
        </div>
      </div>

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

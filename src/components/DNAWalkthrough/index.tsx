'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedBrandDNA } from '../BrandDNAPreview';
import { AuthenticityAnalysis, ActivityAnalysis } from '@/lib/gemini';
import WalkthroughProgress from './WalkthroughProgress';
import DataRevealSection from './sections/DataRevealSection';
import PostDeepDiveSection from './sections/PostDeepDiveSection';
import AnalysisSection from './sections/AnalysisSection';
import BrandDNASection from './sections/BrandDNASection';
import ActionPlanSection from './sections/ActionPlanSection';
import JourneyEnd, { JourneyEndData } from '../JourneyEnd';
import { useDNAWalkthroughDemoCapture } from '@/hooks/useDemoCaptureIntegration';
import CodeParallaxBackground from '../backgrounds/CodeParallaxBackground';
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
  'DEEP-DIVE: Post Analysis',
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
  // Click-based section navigation
  const [currentSection, setCurrentSection] = useState(0);
  const [showJourneyEnd, setShowJourneyEnd] = useState(false);

  // If no tweets, skip section 1 (PostDeepDive)
  const hasTweets = rawTweets.length > 0;
  const totalSections = hasTweets ? 5 : 4;

  useDNAWalkthroughDemoCapture({ activeSection: currentSection });

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

  const advanceSection = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
      // Scroll to top smoothly when section changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSectionClick = (index: number) => {
    // Only allow navigating to completed sections or current
    if (index <= currentSection) {
      setCurrentSection(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  // Map currentSection to actual section based on whether we have tweets
  // With tweets: 0=DataReveal, 1=PostDeepDive, 2=Analysis, 3=BrandDNA, 4=ActionPlan
  // No tweets:   0=DataReveal, 1=Analysis, 2=BrandDNA, 3=ActionPlan
  const getSectionToRender = () => {
    if (hasTweets) {
      return currentSection;
    }
    // Skip PostDeepDive (section 1)
    if (currentSection === 0) return 0;
    return currentSection + 1;
  };

  const actualSection = getSectionToRender();

  // Adjust section names based on whether we have tweets
  const displayedSections = hasTweets
    ? SECTION_NAMES
    : [SECTION_NAMES[0], SECTION_NAMES[2], SECTION_NAMES[3], SECTION_NAMES[4]];

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <CodeParallaxBackground theme="light" />

      <WalkthroughProgress
        sections={displayedSections}
        activeIndex={currentSection}
        onSectionClick={handleSectionClick}
      />

      <div
        className="relative z-10 transition-all duration-300"
        style={{
          filter: showJourneyEnd ? 'blur(20px)' : 'none',
          transform: showJourneyEnd ? 'scale(0.95)' : 'scale(1)',
          opacity: showJourneyEnd ? 0.3 : 1,
        }}
      >
        <AnimatePresence mode="wait">
          {/* Section 0: DataReveal */}
          {actualSection === 0 && (
            <motion.div
              key="data-reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <DataRevealSection
                profile={profile}
                rawTweets={rawTweets}
                theme="light"
                onComplete={advanceSection}
              />
            </motion.div>
          )}

          {/* Section 1: PostDeepDive (only if tweets exist) */}
          {actualSection === 1 && hasTweets && (
            <motion.div
              key="post-deep-dive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <PostDeepDiveSection
                profile={profile}
                rawTweets={rawTweets}
                brandScore={brandScore}
                brandDNA={{
                  archetype: generatedBrandDNA.archetype,
                  archetypeEmoji: generatedBrandDNA.archetypeEmoji,
                  keywords: generatedBrandDNA.keywords,
                  tone: generatedBrandDNA.tone,
                  voiceProfile: generatedBrandDNA.voiceProfile,
                  contentPillars: generatedBrandDNA.contentPillars,
                  doPatterns: generatedBrandDNA.doPatterns,
                  dontPatterns: generatedBrandDNA.dontPatterns,
                }}
                onComplete={advanceSection}
              />
            </motion.div>
          )}

          {/* Section 2: Analysis */}
          {actualSection === 2 && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
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
                theme="light"
                onComplete={advanceSection}
              />
            </motion.div>
          )}

          {/* Section 3: BrandDNA */}
          {actualSection === 3 && (
            <motion.div
              key="brand-dna"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <BrandDNASection
                keywords={generatedBrandDNA.keywords}
                voiceSamples={generatedBrandDNA.voiceSamples}
                doPatterns={generatedBrandDNA.doPatterns}
                dontPatterns={generatedBrandDNA.dontPatterns}
                contentPillars={generatedBrandDNA.contentPillars}
                performanceInsights={generatedBrandDNA.performanceInsights}
                voiceConsistencyReport={generatedBrandDNA.voiceConsistencyReport}
                rawTweets={rawTweets}
                theme="light"
                onComplete={advanceSection}
              />
            </motion.div>
          )}

          {/* Section 4: ActionPlan */}
          {actualSection === 4 && (
            <motion.div
              key="action-plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ActionPlanSection
                profile={profile}
                brandScore={brandScore}
                keywords={generatedBrandDNA.keywords}
                doPatterns={generatedBrandDNA.doPatterns}
                voiceConsistencyScore={voiceConsistencyScore}
                onViewDashboard={handleViewDashboard}
                theme="light"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showJourneyEnd && (
        <JourneyEnd
          data={journeyEndData}
          theme="light"
          onComplete={handleJourneyEndComplete}
        />
      )}
    </div>
  );
}

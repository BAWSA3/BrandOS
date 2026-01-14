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
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);
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
      <div className="relative z-10">
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
            className="w-full max-w-md"
          >
            {/* View Dashboard Button */}
            <motion.button
              onClick={handleViewDashboard}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-8 py-4 mb-6 rounded-xl cursor-pointer border-none font-semibold"
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

            {/* Waitlist Card */}
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: theme === 'dark' ? 'rgba(26, 26, 26, 0.8)' : 'rgba(248, 248, 248, 0.9)',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <h2
                className="text-2xl md:text-3xl font-semibold mb-3"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  letterSpacing: '0.05em',
                  color: theme === 'dark' ? '#FFFFFF' : '#000000',
                }}
              >
                JOIN WAITLIST
              </h2>
              <p
                className="text-sm mb-6"
                style={{
                  color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                }}
              >
                Get early full access to BrandOS
              </p>

              {!isSubmitted ? (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                      color: theme === 'dark' ? '#FFFFFF' : '#000000',
                    }}
                  />
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || !email}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-3 rounded-lg cursor-pointer border-none font-semibold transition-opacity"
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '12px',
                      letterSpacing: '0.1em',
                      color: '#050505',
                      background: 'linear-gradient(135deg, #E8C49A 0%, #D4A574 100%)',
                      opacity: isSubmitting || !email ? 0.6 : 1,
                    }}
                  >
                    {isSubmitting ? 'SUBMITTING...' : 'GET EARLY ACCESS'}
                  </motion.button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-4"
                >
                  <div className="text-3xl mb-3">✓</div>
                  <p
                    className="text-sm"
                    style={{
                      color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                    }}
                  >
                    You are on the list! We will notify you when it is ready.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Analyze Another Profile Link */}
            <motion.button
              onClick={onComplete}
              whileHover={{ opacity: 0.8 }}
              className="mt-6 mx-auto block text-sm cursor-pointer bg-transparent border-none"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              ANALYZE ANOTHER PROFILE
            </motion.button>
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

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import WalkthroughSection from '../WalkthroughSection';
import { TypewriterText, ParallaxCard, StaggerContainer, StaggerItem } from '../motion';

interface ArchetypeWalkthroughProps {
  archetype: string;
  archetypeEmoji: string;
  personalityType?: string;
  personalitySummary?: string;
  theme: string;
}

// Map archetype names to custom SVG emoji paths
const ARCHETYPE_EMOJI_MAP: Record<string, string> = {
  'The Professor': '/emojis/Faces & Emotions/🤓 - Nerd Face.svg',
  'The Plug': '/emojis/Gestures & Hands/🤝 - Handshake.svg',
  'Chief Vibes Officer': '/emojis/Faces & Emotions/😎 - Smiling Face with Sunglasses.svg',
  'The Prophet': '/emojis/Creatures & Nature/👀 - Eyes.svg',
  'Ship or Die': '/emojis/Activities & Objects/🚀 - Rocket.svg',
  'Underdog Arc': '/emojis/Gestures & Hands/💪 - Flexed Biceps.svg',
  'The Degen': '/emojis/Creatures & Nature/🔥 - Fire.svg',
  'The Anon': '/emojis/Creatures & Nature/👽 - Alien.svg',
};

// Helper to normalize archetype name (strip emoji prefix if present)
function normalizeArchetypeName(name: string): string {
  return name.replace(/^[\p{Emoji}\p{Emoji_Component}]+\s*/u, '').trim();
}

interface ArchetypeData {
  short: string;
  strengths: string[];
  contentTypes: string[];
  famousExamples: string[];
  rarity: number; // percentage of creators with this archetype
  growthPotential: 'High' | 'Medium' | 'Very High';
  bestFor: string;
  strengthScores: { trait: string; score: number }[];
}

const ARCHETYPE_DESCRIPTIONS: Record<string, ArchetypeData> = {
  'The Professor': {
    short: 'a knowledge authority who builds trust through education and deep expertise',
    strengths: ['Educational threads', 'How-to guides', 'Industry analysis'],
    contentTypes: ['Long-form threads', 'Breakdown posts', 'Case studies'],
    famousExamples: ['@naval', '@SahilBloom', '@david_perell'],
    rarity: 12,
    growthPotential: 'High',
    bestFor: 'Building authority & trust',
    strengthScores: [
      { trait: 'Authority', score: 95 },
      { trait: 'Trust', score: 90 },
      { trait: 'Engagement', score: 75 },
      { trait: 'Virality', score: 60 },
    ],
  },
  'The Plug': {
    short: 'a super connector who brings people and opportunities together',
    strengths: ['Networking content', 'Introductions', 'Resource sharing'],
    contentTypes: ['Curated lists', 'Recommendations', 'Community highlights'],
    famousExamples: ['@dickiebush', '@taborbrooksie', '@alexgarcia_atx'],
    rarity: 8,
    growthPotential: 'Medium',
    bestFor: 'Building community & network',
    strengthScores: [
      { trait: 'Network', score: 95 },
      { trait: 'Trust', score: 85 },
      { trait: 'Authority', score: 70 },
      { trait: 'Virality', score: 65 },
    ],
  },
  'Chief Vibes Officer': {
    short: 'an entertainer who builds community through personality and relatability',
    strengths: ['Engagement bait', 'Memes', 'Hot takes'],
    contentTypes: ['Short punchy posts', 'Relatable content', 'Commentary'],
    famousExamples: ['@garyvee', '@thejustinwelsh', '@nikitabier'],
    rarity: 18,
    growthPotential: 'Very High',
    bestFor: 'Rapid audience growth',
    strengthScores: [
      { trait: 'Virality', score: 95 },
      { trait: 'Engagement', score: 90 },
      { trait: 'Trust', score: 70 },
      { trait: 'Authority', score: 55 },
    ],
  },
  'The Prophet': {
    short: 'a thought leader who shapes narratives and sees what others miss',
    strengths: ['Predictions', 'Contrarian takes', 'Big picture thinking'],
    contentTypes: ['Thought pieces', 'Industry predictions', 'Manifesto posts'],
    famousExamples: ['@balaboris', '@cdixon', '@pmarca'],
    rarity: 6,
    growthPotential: 'High',
    bestFor: 'Building influence & credibility',
    strengthScores: [
      { trait: 'Authority', score: 90 },
      { trait: 'Virality', score: 85 },
      { trait: 'Trust', score: 75 },
      { trait: 'Engagement', score: 70 },
    ],
  },
  'Ship or Die': {
    short: 'a builder who earns credibility by shipping and sharing the journey',
    strengths: ['Build in public', 'Progress updates', 'Technical insights'],
    contentTypes: ['Ship updates', 'Lessons learned', 'Behind-the-scenes'],
    famousExamples: ['@levelsio', '@marc_louvion', '@dvassallo'],
    rarity: 15,
    growthPotential: 'High',
    bestFor: 'Attracting opportunities',
    strengthScores: [
      { trait: 'Trust', score: 95 },
      { trait: 'Authority', score: 85 },
      { trait: 'Engagement', score: 75 },
      { trait: 'Virality', score: 70 },
    ],
  },
  'Underdog Arc': {
    short: 'a rising star whose growth story inspires and creates connection',
    strengths: ['Personal stories', 'Milestone posts', 'Vulnerability'],
    contentTypes: ['Journey updates', 'Win/loss reflections', 'Growth metrics'],
    famousExamples: ['@jasonfried', '@shl', '@agazdecki'],
    rarity: 20,
    growthPotential: 'Medium',
    bestFor: 'Building loyal following',
    strengthScores: [
      { trait: 'Trust', score: 90 },
      { trait: 'Engagement', score: 85 },
      { trait: 'Virality', score: 70 },
      { trait: 'Authority', score: 60 },
    ],
  },
  'The Degen': {
    short: 'a risk-taker who thrives in chaos and builds cult-like followings',
    strengths: ['FOMO creation', 'Bold calls', 'Community rallying'],
    contentTypes: ['Hot takes', 'Speculation', 'Community memes'],
    famousExamples: ['@cobie', '@DegenSpartan', '@0xMert_'],
    rarity: 10,
    growthPotential: 'Very High',
    bestFor: 'Building cult following',
    strengthScores: [
      { trait: 'Virality', score: 95 },
      { trait: 'Engagement', score: 90 },
      { trait: 'Authority', score: 65 },
      { trait: 'Trust', score: 50 },
    ],
  },
  'The Anon': {
    short: 'a mysterious voice whose ideas speak louder than identity',
    strengths: ['Pure ideas', 'Controversial takes', 'Anonymity mystique'],
    contentTypes: ['Insight threads', 'Philosophical posts', 'Industry secrets'],
    famousExamples: ['@punk6529', '@0xfoobar', '@notthreadguy'],
    rarity: 11,
    growthPotential: 'High',
    bestFor: 'Speaking truth freely',
    strengthScores: [
      { trait: 'Authority', score: 85 },
      { trait: 'Virality', score: 80 },
      { trait: 'Engagement', score: 75 },
      { trait: 'Trust', score: 70 },
    ],
  },
};

const DEFAULT_ARCHETYPE_DATA: ArchetypeData = {
  short: 'a unique voice in your space',
  strengths: ['Authentic content', 'Consistent posting', 'Audience engagement'],
  contentTypes: ['Mixed formats', 'Personal style', 'Niche content'],
  famousExamples: ['Various creators'],
  rarity: 5,
  growthPotential: 'Medium',
  bestFor: 'Carving your niche',
  strengthScores: [
    { trait: 'Authority', score: 70 },
    { trait: 'Trust', score: 70 },
    { trait: 'Engagement', score: 70 },
    { trait: 'Virality', score: 70 },
  ],
};

export default function ArchetypeWalkthrough({
  archetype,
  archetypeEmoji,
  personalityType,
  personalitySummary,
  theme,
}: ArchetypeWalkthroughProps) {
  const normalizedArchetype = normalizeArchetypeName(archetype);
  const archetypeInfo = ARCHETYPE_DESCRIPTIONS[normalizedArchetype] || DEFAULT_ARCHETYPE_DATA;
  const customEmojiPath = ARCHETYPE_EMOJI_MAP[normalizedArchetype];
  const isDark = theme === 'dark';

  const howWeCalculated = `Identified by analyzing your content themes, engagement patterns, and communication style against known creator archetypes. Only ${archetypeInfo.rarity}% of creators share this archetype.`;

  const whyItMatters = `Your archetype defines your positioning. Leaning into it makes content feel authentic and attracts the right audience.`;

  const whatYouCanDo = [
    `Lean into your "${normalizedArchetype}" strengths: ${archetypeInfo.strengths.join(', ')}.`,
    `Focus on content types that work for your archetype: ${archetypeInfo.contentTypes.join(', ')}.`,
    `Study creators like ${archetypeInfo.famousExamples.slice(0, 2).join(' and ')} to adapt their strategies.`,
  ];

  return (
    <WalkthroughSection
      label="Archetype"
      howWeCalculated={howWeCalculated}
      whyItMatters={whyItMatters}
      whatYouCanDo={whatYouCanDo}
      theme={theme}
      accentColor="#FFD700"
    >
      {/* Bento Grid Layout for Archetype */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Hero Archetype Card - Gold */}
        <ParallaxCard
          depth={0.3}
          direction="up"
          className="md:col-span-2 rounded-[4px] p-6 md:p-8 relative overflow-hidden"
          style={{
            background: '#FFD700',
            minHeight: '220px',
          }}
        >
          {/* Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div
                className="text-[10px] tracking-wider"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  color: 'rgba(0,0,0,0.5)',
                }}
              >
                ARCHETYPE
              </div>
              {/* Rarity Badge */}
              <div
                className="px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(0, 0, 0, 0.15)',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                }}
              >
                <span
                  style={{
                    fontFamily: "'VCR OSD Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    color: '#000000',
                  }}
                >
                  TOP {archetypeInfo.rarity}%
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, type: 'spring', damping: 12 }}
                  className="mb-3"
                >
                  {customEmojiPath ? (
                    <Image
                      src={customEmojiPath}
                      alt={normalizedArchetype}
                      width={80}
                      height={80}
                      className="w-16 h-16 md:w-20 md:h-20"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <span className="text-6xl md:text-7xl">{archetypeEmoji || '🎭'}</span>
                  )}
                </motion.div>
                <h2
                  className="text-2xl md:text-3xl font-bold"
                  style={{
                    color: '#000000',
                    fontFamily: "'Helvetica Neue', sans-serif",
                  }}
                >
                  {normalizedArchetype}
                </h2>
              </div>

              {personalityType && (
                <div
                  className="px-3 py-1.5 rounded-full mb-2"
                  style={{
                    background: 'rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      color: '#000000',
                      fontWeight: 600,
                    }}
                  >
                    {personalityType}
                  </span>
                </div>
              )}
            </div>
          </div>
        </ParallaxCard>

        {/* Right Column - Stats */}
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Growth Potential Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-[4px] p-4"
            style={{
              background: archetypeInfo.growthPotential === 'Very High'
                ? 'rgba(16, 185, 129, 0.15)'
                : archetypeInfo.growthPotential === 'High'
                ? 'rgba(59, 130, 246, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
              border: archetypeInfo.growthPotential === 'Very High'
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : archetypeInfo.growthPotential === 'High'
                ? '1px solid rgba(59, 130, 246, 0.3)'
                : '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-2"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              GROWTH POTENTIAL
            </div>
            <div
              className="text-xl font-bold"
              style={{
                color: archetypeInfo.growthPotential === 'Very High'
                  ? '#10B981'
                  : archetypeInfo.growthPotential === 'High'
                  ? '#3B82F6'
                  : '#F59E0B',
              }}
            >
              {archetypeInfo.growthPotential}
            </div>
            <div
              className="text-xs mt-1"
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              }}
            >
              Best for: {archetypeInfo.bestFor}
            </div>
          </motion.div>

          {/* Description Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-[4px] p-4 flex-1"
            style={{
              background: isDark ? '#1A1A1A' : '#F8F8F8',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-3"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              YOUR IDENTITY
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              }}
            >
              You are {archetypeInfo.short}.
            </p>
          </motion.div>
        </div>

        {/* Strength Scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-2 rounded-[4px] p-4 md:p-5"
          style={{
            background: isDark ? '#1A1A1A' : '#F8F8F8',
            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <div
            className="text-[10px] tracking-wider mb-4"
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            }}
          >
            ARCHETYPE STRENGTHS
          </div>
          <div className="grid grid-cols-2 gap-4">
            {archetypeInfo.strengthScores.map((item, index) => (
              <motion.div
                key={item.trait}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    }}
                  >
                    {item.trait}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      color: '#FFD700',
                    }}
                  >
                    {item.score}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, #FFD700 0%, ${item.score >= 85 ? '#10B981' : '#FFD700'} 100%)`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Famous Examples Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-[4px] p-4"
          style={{
            background: '#FFFFFF',
          }}
        >
          <div
            className="text-[10px] tracking-wider mb-3"
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              color: 'rgba(0,0,0,0.4)',
            }}
          >
            CREATORS LIKE YOU
          </div>
          <StaggerContainer className="space-y-2" staggerDelay={0.1} initialDelay={0.5}>
            {archetypeInfo.famousExamples.slice(0, 3).map((example) => (
              <StaggerItem
                key={example}
                direction="left"
                className="text-sm"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  color: '#0047FF',
                }}
              >
                {example}
              </StaggerItem>
            ))}
          </StaggerContainer>
        </motion.div>

        {/* Summary Card (if available) */}
        {personalitySummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="md:col-span-3 rounded-[4px] p-4 md:p-5"
            style={{
              background: isDark ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.15)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderLeft: '3px solid #FFD700',
            }}
          >
            <div
              className="text-[10px] tracking-wider mb-2"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                color: '#FFD700',
              }}
            >
              AI INSIGHT
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
              }}
            >
              "<TypewriterText
                text={personalitySummary}
                delay={500}
                charDelay={15}
                cursorColor="#FFD700"
                showCursor={true}
              />"
            </p>
          </motion.div>
        )}
      </div>
    </WalkthroughSection>
  );
}

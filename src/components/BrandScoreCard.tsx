'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Info } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from '@/lib/motion-plus';

// Reveal choreography. AnimateNumber only animates when its value CHANGES, and
// the card used to mount with the final score, so nothing ever counted. Now
// the numbers mount at 0 and flip to the real values once the card has landed:
// score rolls up, phase rows stagger in, then the bottom stats and bar fill.
const REVEAL_DELAY_MS = 450;
const PHASE_STAGGER_S = 0.12;

export interface ScoreContext {
  range: { low: number; high: number; samples: number };
  note: string;
}

export interface BrandScoreCardProps {
  score: number;
  voiceConsistency: number;
  engagementScore: number;
  profileImageUrl: string;
  username: string;
  displayName: string;
  summary?: string;
  phaseScores?: { define: number; check: number; generate: number; scale: number };
  scoreContext?: ScoreContext | null;
}

const BrandScoreCard: React.FC<BrandScoreCardProps> = ({
  score,
  voiceConsistency,
  engagementScore,
  profileImageUrl,
  username,
  displayName,
  summary,
  phaseScores,
  scoreContext,
}) => {
  const reducedMotion = useReducedMotion() ?? false;
  const [revealed, setRevealed] = useState(reducedMotion);
  useEffect(() => {
    if (reducedMotion) {
      setRevealed(true);
      return;
    }
    const t = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [reducedMotion]);
  const shown = (n: number) => (revealed ? n : 0);

  return (
    <>
      <style>{`
        .font-brand { font-family: 'Inter', sans-serif; }
        .font-os { font-family: 'JetBrains Mono', monospace; }
        .bg-grid-pattern {
          background-image: radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
      <div
        id="brandos-score-card"
        // 16:10 + a 480px min-height made CSS derive a 768px minimum WIDTH,
        // so the card overflowed every phone. The ratio is desktop-only now;
        // phones get a shorter, natural-height card. On desktop min-height must
        // stay `auto`: any explicit min-height turns off aspect-ratio's
        // grow-to-fit, so tall content (score + stats + note) spilled out the
        // bottom of the 16:10 box instead of stretching it.
        className="w-full max-w-[1100px] min-h-[400px] md:min-h-[auto] md:aspect-[16/10] bg-[#2E6AFF] rounded-[8px] relative p-6 sm:p-8 md:p-14 flex flex-col justify-between gap-6 overflow-visible"
        style={{
          boxShadow: '0 8px 40px rgba(46, 106, 255, 0.35), 0 2px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

        {/* Top row: label + PFP */}
        <div className="flex justify-between items-start z-10">
          <span className="font-os text-xs md:text-sm text-white/90 tracking-widest border border-white/40 px-2 py-1 rounded-[2px] bg-[#2E6AFF] relative group/info inline-flex items-center gap-1.5">
            BRAND_SCORE
            <span className="relative">
              <Info className="w-3 h-3 text-white/50 hover:text-white/80 cursor-help peer" />
              <span className="absolute left-full bottom-0 ml-2 w-[220px] px-3 py-2 bg-black/95 border border-white/15 rounded text-[10px] leading-relaxed text-white/70 font-os tracking-wide opacity-0 peer-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                Your Brand Score measures how strong, consistent, and recognizable your brand is
                across identity, content, voice, and growth. Scores may shift slightly between scans
                as your profile evolves.
              </span>
            </span>
          </span>
          {/* Profile image + username */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="text-right min-w-0 max-w-[160px] sm:max-w-[200px] md:max-w-[280px]">
              <span className="font-brand font-bold text-white text-lg md:text-xl leading-none block truncate">
                {displayName}
              </span>
              <span className="font-os text-sm text-white/70 block mt-1 truncate">@{username}</span>
            </div>
            <div className="w-14 h-14 md:w-[72px] md:h-[72px] rounded-full border-2 border-white/40 overflow-hidden shrink-0">
              <img src={profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Score number + summary */}
        <div className="relative z-10 my-auto flex items-center justify-between gap-4">
          <h1 className="font-brand font-black italic text-[112px] sm:text-[160px] md:text-[240px] leading-none tracking-tighter text-white drop-shadow-xl shrink-0">
            <AnimateNumber
              transition={{
                y: { type: 'spring', duration: 0.8, bounce: 0 },
                width: { type: 'spring', duration: 0.5, bounce: 0 },
                opacity: { duration: 0.4 },
              }}
              trend={1}
            >
              {shown(score)}
            </AnimateNumber>
          </h1>
          {phaseScores ? (
            <div className="flex flex-col gap-2.5 text-right max-w-[240px] min-w-0">
              {(() => {
                const phases = [
                  { label: 'IDENTITY', value: phaseScores.define },
                  { label: 'CONSISTENCY', value: phaseScores.check },
                  { label: 'CONTENT', value: phaseScores.generate },
                  { label: 'GROWTH', value: phaseScores.scale },
                ];
                const total = phases.reduce((sum, p) => sum + p.value, 0);
                return phases.map(({ label, value }, i) => {
                  const contribution = Math.round((value / total) * score);
                  return (
                    <motion.div
                      key={label}
                      className="flex items-center justify-end gap-3"
                      initial={reducedMotion ? false : { opacity: 0, x: 12 }}
                      animate={revealed ? { opacity: 1, x: 0 } : undefined}
                      transition={{
                        duration: 0.35,
                        delay: 0.35 + i * PHASE_STAGGER_S,
                        ease: 'easeOut',
                      }}
                    >
                      <span className="font-os text-[10px] md:text-xs tracking-wider text-white/40">
                        {label}
                      </span>
                      <span className="font-os text-base md:text-lg font-bold text-white/90">
                        +<AnimateNumber trend={1}>{shown(contribution)}</AnimateNumber>
                      </span>
                    </motion.div>
                  );
                });
              })()}
            </div>
          ) : summary ? (
            <p className="font-os text-sm md:text-base text-white/70 leading-relaxed max-w-[340px] text-right line-clamp-3">
              {summary}
            </p>
          ) : null}
        </div>

        {/* Bottom stats */}
        <div className="z-10 grid grid-cols-2 gap-8 border-t border-white/20 pt-6">
          <div>
            <span className="font-os text-[10px] md:text-xs text-white/70 block mb-1 uppercase tracking-wider">
              Voice Consistency
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-brand font-bold italic text-white">
                <AnimateNumber suffix="%" trend={1}>
                  {shown(voiceConsistency)}
                </AnimateNumber>
              </span>
              <div className="h-1.5 w-12 bg-white/30 rounded-full overflow-hidden">
                <div
                  style={{ width: `${shown(voiceConsistency)}%`, transitionDelay: '700ms' }}
                  className="h-full bg-white transition-all duration-700"
                />
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="font-os text-[10px] md:text-xs text-white/70 block mb-1 uppercase tracking-wider">
              Engagement
            </span>
            <span className="text-2xl font-brand font-bold italic text-white">
              <AnimateNumber suffix="/100" trend={1}>
                {shown(engagementScore)}
              </AnimateNumber>
            </span>
          </div>
        </div>

        {/* Score range context for returning users */}
        {scoreContext && scoreContext.range.samples >= 2 && (
          <div className="z-10 mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
            <Activity className="w-3 h-3 text-white/40 shrink-0" />
            <span className="font-os text-[9px] md:text-[10px] text-white/40 tracking-wide leading-relaxed">
              Your score typically ranges {scoreContext.range.low}–{scoreContext.range.high} based
              on {scoreContext.range.samples} scans. Minor shifts reflect real-time profile and
              content changes.
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default BrandScoreCard;

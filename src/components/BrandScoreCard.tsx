'use client';

import React from 'react';
import { Activity, Info } from 'lucide-react';
import { AnimateNumber } from '@/lib/motion-plus';

export interface BrandScoreCardProps {
  score: number;
  voiceConsistency: number;
  engagementScore: number;
  profileImageUrl: string;
  username: string;
  displayName: string;
  summary?: string;
  phaseScores?: { define: number; check: number; generate: number; scale: number };
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
}) => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,900;1,900&family=JetBrains+Mono:wght@400;700&display=swap');
        .font-brand { font-family: 'Inter', sans-serif; }
        .font-os { font-family: 'JetBrains Mono', monospace; }
        .bg-grid-pattern {
          background-image: radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
      <div
        id="brandos-score-card"
        className="w-full max-w-[1100px] bg-[#2E6AFF] rounded-[8px] relative p-8 md:p-14 flex flex-col justify-between overflow-visible"
        style={{ minHeight: '480px', aspectRatio: '16 / 10', boxShadow: '0 8px 40px rgba(46, 106, 255, 0.35), 0 2px 20px rgba(0, 0, 0, 0.15)' }}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

        {/* Top row: label + PFP */}
        <div className="flex justify-between items-start z-10">
          <span className="font-os text-xs md:text-sm text-white/90 tracking-widest border border-white/40 px-2 py-1 rounded-[2px] bg-[#2E6AFF] relative group/info inline-flex items-center gap-1.5">
            BRAND_SCORE
            <Info className="w-3 h-3 text-white/50 hover:text-white/80 cursor-help" />
          </span>
          {/* Profile image + username */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="text-right min-w-0 max-w-[200px] md:max-w-[280px]">
              <span className="font-brand font-bold text-white text-lg md:text-xl leading-none block truncate">{displayName}</span>
              <span className="font-os text-sm text-white/70 block mt-1 truncate">@{username}</span>
            </div>
            <div className="w-[72px] h-[72px] rounded-full border-2 border-white/40 overflow-hidden shrink-0">
              <img
                src={profileImageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Score number + summary */}
        <div className="relative z-10 my-auto flex items-center justify-between">
          <h1 className="font-brand font-black italic text-[160px] md:text-[240px] leading-none tracking-tighter text-white drop-shadow-xl shrink-0">
            <AnimateNumber
              transition={{
                y: { type: "spring", duration: 0.8, bounce: 0 },
                width: { type: "spring", duration: 0.5, bounce: 0 },
                opacity: { duration: 0.4 },
              }}
              trend={1}
            >
              {score}
            </AnimateNumber>
          </h1>
          {phaseScores ? (
            <div className="flex flex-col gap-2.5 text-right max-w-[240px]">
              {(() => {
                const phases = [
                  { label: 'IDENTITY', value: phaseScores.define },
                  { label: 'CONSISTENCY', value: phaseScores.check },
                  { label: 'CONTENT', value: phaseScores.generate },
                  { label: 'GROWTH', value: phaseScores.scale },
                ];
                const total = phases.reduce((sum, p) => sum + p.value, 0);
                return phases.map(({ label, value }) => {
                  const contribution = Math.round((value / total) * score);
                  return (
                    <div key={label} className="flex items-center justify-end gap-3">
                      <span className="font-os text-[10px] md:text-xs tracking-wider text-white/40">{label}</span>
                      <span className="font-os text-base md:text-lg font-bold text-white/90">+{contribution}</span>
                    </div>
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
            <span className="font-os text-[10px] md:text-xs text-white/70 block mb-1 uppercase tracking-wider">Voice Consistency</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-brand font-bold italic text-white">
                <AnimateNumber suffix="%" trend={1}>
                  {voiceConsistency}
                </AnimateNumber>
              </span>
              <div className="h-1.5 w-12 bg-white/30 rounded-full overflow-hidden">
                <div style={{ width: `${voiceConsistency}%` }} className="h-full bg-white transition-all duration-700" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="font-os text-[10px] md:text-xs text-white/70 block mb-1 uppercase tracking-wider">Engagement</span>
            <span className="text-2xl font-brand font-bold italic text-white">
              <AnimateNumber suffix="/100" trend={1}>
                {engagementScore}
              </AnimateNumber>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrandScoreCard;

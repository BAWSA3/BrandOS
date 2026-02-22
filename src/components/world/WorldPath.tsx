'use client';

import { useRef, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import SeasonalScene from './SeasonalScene';
import PathAvatar from './PathAvatar';
import type { Season } from '../ascii-sky/ascii-sky-engine';
import type { Phase } from '../PhaseNavigation';

interface WorldPathProps {
  activePhase: Phase;
  brandCompleteness: number;
  hasChecked: boolean;
  hasGenerated: boolean;
  onPhaseChange: (phase: Phase) => void;
  height?: number;
  className?: string;
}

const PHASE_TO_SEASON: Record<Phase, Season> = {
  home: 'spring',
  define: 'spring',
  check: 'summer',
  generate: 'autumn',
  scale: 'winter',
};

const PHASE_ORDER: Phase[] = ['define', 'check', 'generate', 'scale'];

const PHASE_UNLOCK = {
  define: () => true,
  check: (completeness: number) => completeness >= 30,
  generate: (completeness: number, hasChecked: boolean) => completeness >= 30 && hasChecked,
  scale: () => true,
};

export default function WorldPath({
  activePhase,
  brandCompleteness,
  hasChecked,
  hasGenerated,
  onPhaseChange,
  height = 180,
  className = '',
}: WorldPathProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSeason = PHASE_TO_SEASON[activePhase];
  const activeIdx = PHASE_ORDER.indexOf(activePhase === 'home' ? 'define' : activePhase);

  // Avatar position: 0-1 across the full path width
  const avatarPosition = useMemo(() => {
    const idx = Math.max(0, activeIdx);
    return (idx + 0.5) / PHASE_ORDER.length;
  }, [activeIdx]);

  const isPhaseUnlocked = useCallback((phase: Phase) => {
    if (phase === 'home' || phase === 'define' || phase === 'scale') return true;
    if (phase === 'check') return PHASE_UNLOCK.check(brandCompleteness);
    if (phase === 'generate') return PHASE_UNLOCK.generate(brandCompleteness, hasChecked);
    return true;
  }, [brandCompleteness, hasChecked]);

  const getGrowthForPhase = useCallback((phase: Phase) => {
    if (phase === 'define') return Math.min(1, brandCompleteness / 100);
    if (phase === 'check') return hasChecked ? 0.7 : 0.1;
    if (phase === 'generate') return hasGenerated ? 0.8 : 0.15;
    if (phase === 'scale') return Math.min(1, brandCompleteness / 100) * 0.5;
    return 0.3;
  }, [brandCompleteness, hasChecked, hasGenerated]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Scrollable path container */}
      <div
        ref={scrollRef}
        className="flex h-full overflow-hidden"
        style={{
          background: '#050510',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {PHASE_ORDER.map((phase, idx) => {
          const season = PHASE_TO_SEASON[phase];
          const isActive = (activePhase === 'home' ? 'define' : activePhase) === phase;
          const unlocked = isPhaseUnlocked(phase);
          const growth = getGrowthForPhase(phase);

          return (
            <motion.div
              key={phase}
              className="relative flex-1 cursor-pointer"
              style={{ minWidth: 0 }}
              onClick={() => unlocked && onPhaseChange(phase)}
              whileHover={unlocked ? { scale: 1.01 } : undefined}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <SeasonalScene
                season={season}
                growth={unlocked ? growth : 0.05}
                height={`${height}px`}
                fontSize="9px"
                dimmed={!isActive}
                showPath
              />

              {/* Phase label overlay */}
              <div
                className="absolute top-2 left-0 right-0 text-center pointer-events-none"
                style={{
                  fontFamily: "'VCR OSD Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.3)',
                  textShadow: isActive ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
                  transition: 'color 0.4s, text-shadow 0.4s',
                }}
              >
                {phase.toUpperCase()}
              </div>

              {/* Lock overlay for locked phases */}
              {!unlocked && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(5,5,16,0.7)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}

              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="active-phase-indicator"
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${
                      season === 'spring' ? '#E8A838' :
                      season === 'summer' ? '#00FF88' :
                      season === 'autumn' ? '#FF6B35' :
                      '#00D4FF'
                    }, transparent)`,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Season transition border */}
              {idx < PHASE_ORDER.length - 1 && (
                <div
                  className="absolute top-0 right-0 bottom-0 w-px"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                />
              )}
            </motion.div>
          );
        })}

        {/* Path avatar overlay */}
        <PathAvatar
          season={activeSeason}
          x={avatarPosition}
          size={14}
        />
      </div>
    </div>
  );
}

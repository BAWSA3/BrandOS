'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AsciiSky from './AsciiSky';
import { SEASON_PALETTES, generateSeasonElements } from './ascii-sky-engine';
import type { GroundElement, PathConfig } from './ascii-sky-engine';

type ArrivalStage = 'stars' | 'dawn' | 'path' | 'life' | 'welcome' | 'exit';

const STAGE_TIMINGS: Record<ArrivalStage, number> = {
  stars: 800,
  dawn: 1400,
  path: 800,
  life: 600,
  welcome: 1800,
  exit: 0,
};

interface AsciiSkyLoadingScreenProps {
  onComplete: () => void;
  brandName?: string;
  minDisplayTime?: number;
}

export default function AsciiSkyLoadingScreen({
  onComplete,
  brandName,
  minDisplayTime = 4500,
}: AsciiSkyLoadingScreenProps) {
  const [show, setShow] = useState(true);
  const [stage, setStage] = useState<ArrivalStage>('stars');
  const completedRef = useRef(false);
  const startRef = useRef(Date.now());

  const stageProgress = useMemo(() => {
    const stages: ArrivalStage[] = ['stars', 'dawn', 'path', 'life', 'welcome', 'exit'];
    return stages.indexOf(stage);
  }, [stage]);

  // Sky colors that transition from night to dawn
  const skyColors = useMemo(() => {
    if (stageProgress <= 0) return { top: '#050510', bottom: '#0D1B2A' };
    if (stageProgress === 1) return { top: '#1A0A2E', bottom: '#2D1B4E' };
    if (stageProgress === 2) return { top: '#2D1B4E', bottom: '#7A4080' };
    return { top: SEASON_PALETTES.spring.skyTop, bottom: SEASON_PALETTES.spring.skyBottom };
  }, [stageProgress]);

  const hillColors = useMemo(() => {
    if (stageProgress <= 1) return { hill: '#0A1520', hillFar: '#060D15' };
    if (stageProgress === 2) return { hill: '#2A4A2A', hillFar: '#1A3A1A' };
    return { hill: SEASON_PALETTES.spring.hillColor, hillFar: SEASON_PALETTES.spring.hillColorFar };
  }, [stageProgress]);

  const cloudColor = stageProgress <= 1 ? '#1A2535' : stageProgress === 2 ? '#8A6080' : SEASON_PALETTES.spring.cloudColor;

  // Path appears at stage 2+
  const pathConfig = useMemo<PathConfig | undefined>(() => {
    if (stageProgress < 2) return undefined;
    return {
      enabled: true,
      amplitude: 0.4,
      color: SEASON_PALETTES.spring.pathColor,
      borderColor: SEASON_PALETTES.spring.pathBorder,
    };
  }, [stageProgress]);

  // Ground elements appear at stage 3+
  const [dims] = useState({ cols: 140, rows: 40 });
  const groundElements = useMemo<GroundElement[] | undefined>(() => {
    if (stageProgress < 3) return undefined;
    return generateSeasonElements('spring', dims.cols, dims.rows, 0.4);
  }, [stageProgress, dims]);

  // Stage progression
  useEffect(() => {
    const stages: ArrivalStage[] = ['stars', 'dawn', 'path', 'life', 'welcome', 'exit'];
    let currentIdx = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const advance = () => {
      currentIdx++;
      if (currentIdx < stages.length) {
        setStage(stages[currentIdx]);
        if (stages[currentIdx] !== 'exit') {
          timers.push(setTimeout(advance, STAGE_TIMINGS[stages[currentIdx]]));
        }
      }
    };

    timers.push(setTimeout(advance, STAGE_TIMINGS.stars));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Trigger exit after min display time
  useEffect(() => {
    if (stage === 'exit' || stage === 'welcome') {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, minDisplayTime - elapsed);
      const timer = setTimeout(() => setShow(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [stage, minDisplayTime]);

  const handleExitComplete = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {show && (
        <motion.div
          key="ascii-sky-loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: '#050510' }}
        >
          {/* Animated ASCII Sky */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <AsciiSky
              cloudCount={stageProgress >= 2 ? 6 : 2}
              showHills={stageProgress >= 1}
              skyColorTop={skyColors.top}
              skyColorBottom={skyColors.bottom}
              cloudColor={cloudColor}
              hillColor={hillColors.hill}
              hillColorFar={hillColors.hillFar}
              fontSize="13px"
              season="spring"
              path={pathConfig}
              groundElements={groundElements}
            />
          </motion.div>

          {/* Film grain overlay */}
          <div className="absolute inset-0 pointer-events-none z-20" style={{ opacity: 0.03 }}>
            <svg width="100%" height="100%">
              <filter id="arrival-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#arrival-grain)" />
            </svg>
          </div>

          {/* Centered welcome content */}
          <div className="relative z-30 text-center pointer-events-none">
            {/* Welcome sign */}
            <AnimatePresence>
              {stageProgress >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  {/* Wooden sign frame */}
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '20px 40px',
                      background: 'rgba(139, 115, 85, 0.15)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 4,
                      border: '2px solid rgba(160, 132, 92, 0.3)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <motion.h1
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      style={{
                        fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
                        fontSize: 'clamp(18px, 4vw, 32px)',
                        fontWeight: 700,
                        color: '#FFE4C4',
                        textShadow: '0 2px 12px rgba(0,0,0,0.5), 0 0 40px rgba(232,160,56,0.2)',
                        letterSpacing: '0.05em',
                        margin: 0,
                      }}
                    >
                      {brandName ? `Welcome, ${brandName}` : 'Welcome to BrandOS'}
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: 11,
                        letterSpacing: '0.2em',
                        color: '#C4A882',
                        textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                        marginTop: 8,
                        textTransform: 'uppercase',
                      }}
                    >
                      Your world awaits
                    </motion.p>
                  </div>

                  {/* Pulsing path dots */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                    className="mt-4 flex items-center justify-center gap-3"
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.2, 0.8, 0.2] }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: 'easeInOut',
                        }}
                        style={{
                          fontFamily: "'VCR OSD Mono', monospace",
                          fontSize: 14,
                          color: SEASON_PALETTES.spring.pathColor,
                          textShadow: `0 0 6px ${SEASON_PALETTES.spring.groundAccent}40`,
                        }}
                      >
                        ·
                      </motion.span>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

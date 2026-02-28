'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const SEASON_COLORS = [
  '#5ABF3E', // Phase 1 (Define) - Spring green
  '#FFE066', // Phase 2 (Check) - Summer gold
  '#E88A4A', // Phase 3 (Generate) - Autumn orange
  '#B0D8F0', // Phase 4 (Scale) - Winter ice
];

const SEASON_NAMES = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];

interface PhaseItem {
  label: string;
  description: string;
  dataKey?: string;
}

interface PhaseConfigItem {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  explanation: string;
  items: PhaseItem[];
}

interface XProfileData {
  name: string;
  username: string;
  description?: string;
  verified?: boolean;
  location?: string;
  url?: string;
  tweet_count: number;
  followers_count: number;
  following_count: number;
  profile_image_url?: string;
  [key: string]: unknown;
}

function PixelTypewriter({ text, speed = 25 }: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <>
      {displayText}
      {currentIndex < text.length && (
        <span style={{ opacity: currentIndex % 2 === 0 ? 0.8 : 0 }}>_</span>
      )}
    </>
  );
}

function formatProfileValue(
  dataKey: string | undefined,
  profile: XProfileData | null
): string | null {
  if (!profile || !dataKey) return null;

  switch (dataKey) {
    case 'name': return profile.name;
    case 'username': return `@${profile.username}`;
    case 'description':
      return profile.description
        ? (profile.description.length > 100
          ? profile.description.substring(0, 100) + '...'
          : profile.description)
        : 'No bio set';
    case 'location': return profile.location || 'No location set';
    case 'url': return profile.url || 'No link added';
    case 'tweet_count': return `${profile.tweet_count.toLocaleString()} posts`;
    case 'followers_count': return `${profile.followers_count.toLocaleString()} followers`;
    case 'following_count': return `Following ${profile.following_count.toLocaleString()}`;
    case 'ratio': {
      const ratio = profile.followers_count / Math.max(profile.following_count, 1);
      return `${ratio.toFixed(2)}:1`;
    }
    default: return null;
  }
}

export default function PixelPhaseCard({
  phase,
  isActive,
  isCompleted,
  itemProgress,
  theme,
  profile,
  profileImage,
}: {
  phase: PhaseConfigItem;
  isActive: boolean;
  isCompleted: boolean;
  itemProgress: number;
  theme: string;
  profile: XProfileData | null;
  profileImage?: string;
}) {
  const phaseColor = SEASON_COLORS[phase.number - 1] || SEASON_COLORS[0];
  const seasonName = SEASON_NAMES[phase.number - 1] || 'SPRING';
  const progress = isCompleted ? 100 : Math.round((itemProgress / phase.items.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{
        opacity: isActive || isCompleted ? 1 : 0.3,
        scale: isActive ? 1 : 0.95,
        y: 0,
      }}
      exit={{ opacity: 0, scale: 0.9, y: -30 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        width: '100%',
        maxWidth: '560px',
      }}
    >
      {/* Profile pixel avatar */}
      {profileImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ position: 'relative' }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              border: `3px solid ${phaseColor}`,
              overflow: 'hidden',
              imageRendering: 'pixelated',
              boxShadow: `0 0 12px ${phaseColor}40`,
            }}
          >
            <img
              src={profileImage.replace('_normal', '_200x200')}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
            />
          </div>
          {/* Pixel scan ring */}
          <motion.div
            animate={{ borderColor: [`${phaseColor}`, `${phaseColor}40`, `${phaseColor}`] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: -4,
              border: `2px solid ${phaseColor}`,
            }}
          />
        </motion.div>
      )}

      {/* Season / Phase badge */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.03, 1] : 1,
          boxShadow: isActive ? `0 0 20px ${phaseColor}40` : 'none',
        }}
        transition={{ duration: 0.8, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
        style={{
          fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
          fontSize: '10px',
          letterSpacing: '0.2em',
          color: phaseColor,
          background: `${phaseColor}15`,
          padding: '8px 20px',
          border: `2px solid ${phaseColor}40`,
          imageRendering: 'pixelated',
        }}
      >
        {seasonName} — PHASE {phase.number} OF 4
      </motion.div>

      {/* Phase title */}
      <motion.h2
        animate={{ scale: isActive ? 1 : 0.9 }}
        style={{
          fontFamily: "'VCR OSD Mono', 'Press Start 2P', monospace",
          fontSize: 'clamp(36px, 8vw, 64px)',
          fontWeight: 400,
          letterSpacing: '0.15em',
          color: '#FFFFFF',
          margin: 0,
          textAlign: 'center',
          textShadow: `0 0 20px ${phaseColor}40`,
        }}
      >
        {phase.title}
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: 'clamp(15px, 2.5vw, 18px)',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.75)',
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        {phase.subtitle}
      </motion.p>

      {/* Pixel XP progress bar */}
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            flex: 1,
            height: 12,
            background: 'rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            imageRendering: 'pixelated',
          }}
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
            style={{
              height: '100%',
              background: `repeating-linear-gradient(90deg, ${phaseColor} 0px, ${phaseColor} 6px, ${phaseColor}80 6px, ${phaseColor}80 8px)`,
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '14px',
            color: phaseColor,
            minWidth: 40,
            textAlign: 'right',
          }}
        >
          {progress}%
        </span>
      </div>

      {/* Retro terminal dialog box */}
      <div
        style={{
          width: '100%',
          background: 'rgba(10, 8, 20, 0.85)',
          border: '3px solid rgba(255,255,255,0.2)',
          padding: '20px',
          position: 'relative',
          imageRendering: 'pixelated',
          boxShadow: `
            inset 3px 3px 0 rgba(255,255,255,0.06),
            inset -3px -3px 0 rgba(0,0,0,0.3),
            0 8px 32px rgba(0,0,0,0.4)
          `,
        }}
      >
        {/* Corner decorations */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
          <div
            key={corner}
            style={{
              position: 'absolute',
              [corner.includes('top') ? 'top' : 'bottom']: -3,
              [corner.includes('left') ? 'left' : 'right']: -3,
              width: 8,
              height: 8,
              background: phaseColor,
              opacity: 0.6,
            }}
          />
        ))}

        {/* Analysis items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {phase.items.map((item, index) => {
            const isItemComplete = isCompleted || index < itemProgress;
            const isItemActive = !isCompleted && index === Math.floor(itemProgress);
            const profileValue = formatProfileValue(item.dataKey, profile);

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                style={{
                  padding: '10px 12px',
                  background: isItemActive ? `${phaseColor}10` : 'transparent',
                  borderLeft: isItemActive ? `3px solid ${phaseColor}` : '3px solid transparent',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Pixel status dot */}
                  <motion.div
                    animate={{
                      background: isItemComplete ? '#10B981' : isItemActive ? phaseColor : 'rgba(255,255,255,0.25)',
                      scale: isItemActive ? [1, 1.4, 1] : 1,
                    }}
                    transition={{
                      scale: { duration: 0.6, repeat: isItemActive ? Infinity : 0 },
                    }}
                    style={{
                      width: 8,
                      height: 8,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '13px',
                        letterSpacing: '0.05em',
                        color: isItemComplete ? '#10B981' : isItemActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {item.label}
                      {isItemComplete && ' ✓'}
                    </span>

                    <AnimatePresence>
                      {(isItemActive || isItemComplete) && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            fontFamily: "'Helvetica Neue', sans-serif",
                            fontSize: '12px',
                            color: 'rgba(255,255,255,0.55)',
                            margin: '3px 0 0 0',
                            lineHeight: 1.4,
                          }}
                        >
                          {isItemActive ? (
                            <PixelTypewriter text={item.description} speed={20} />
                          ) : (
                            item.description
                          )}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Profile data value */}
                <AnimatePresence>
                  {isItemActive && profileValue && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      style={{
                        marginTop: '6px',
                        marginLeft: '18px',
                        padding: '6px 10px',
                        background: `${phaseColor}12`,
                        border: `1px solid ${phaseColor}30`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'VCR OSD Mono', monospace",
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.75)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {'>'} {profileValue}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const PHASE_NAMES = ['DEFINE', 'CHECK', 'GENERATE', 'SCALE'];

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

function TerminalTypewriter({ text, speed = 25 }: { text: string; speed?: number }) {
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
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          style={{ color: '#0047FF' }}
        >
          _
        </motion.span>
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
    case 'username': return `"${profile.username}"`;
    case 'description':
      return profile.description
        ? `"${profile.description.length > 60
          ? profile.description.substring(0, 60) + '...'
          : profile.description}"`
        : '"// No bio set"';
    case 'location': return profile.location ? `"${profile.location}"` : '"// Not specified"';
    case 'url': return profile.url ? `"${profile.url}"` : '"// No link"';
    case 'tweet_count': return `${profile.tweet_count.toLocaleString()}`;
    case 'followers_count': return `${profile.followers_count.toLocaleString()}`;
    case 'following_count': return `${profile.following_count.toLocaleString()}`;
    case 'ratio': {
      const ratio = profile.followers_count / Math.max(profile.following_count, 1);
      return `${ratio.toFixed(2)}`;
    }
    default: return null;
  }
}

export default function TerminalPhaseCard({
  phase,
  isActive,
  isCompleted,
  itemProgress,
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
  const phaseName = PHASE_NAMES[phase.number - 1] || 'DEFINE';
  const progress = isCompleted ? 100 : Math.round((itemProgress / phase.items.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{
        opacity: isActive || isCompleted ? 1 : 0.3,
        scale: isActive ? 1 : 0.95,
        y: 0,
      }}
      exit={{ opacity: 0, scale: 0.95, y: -30 }}
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
      {/* Profile avatar with terminal styling */}
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
              border: '2px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <img
              src={profileImage.replace('_normal', '_200x200')}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          {/* Scanning indicator */}
          <motion.div
            animate={{
              top: ['0%', '100%', '0%'],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              background: 'rgba(0, 71, 255, 0.6)',
              boxShadow: '0 0 8px rgba(0, 71, 255, 0.4)',
            }}
          />
        </motion.div>
      )}

      {/* Phase header as comment block */}
      <div
        style={{
          fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.15em',
          color: 'rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        <div>/* ═══════════════════════════════════════ */</div>
        <div style={{ color: '#0047FF', fontWeight: 500 }}>/*  {phaseName} — PHASE {phase.number} OF 4  */</div>
        <div>/* ═══════════════════════════════════════ */</div>
      </div>

      {/* Phase title */}
      <motion.h2
        animate={{ scale: isActive ? 1 : 0.9 }}
        style={{
          fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
          fontSize: 'clamp(32px, 7vw, 56px)',
          fontWeight: 400,
          letterSpacing: '0.15em',
          color: '#000000',
          margin: 0,
          textAlign: 'center',
        }}
      >
        {phase.title}
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: 'clamp(14px, 2.2vw, 16px)',
          fontWeight: 400,
          color: 'rgba(0, 0, 0, 0.6)',
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        {phase.subtitle}
      </motion.p>

      {/* ASCII Progress bar - centered */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <span
          style={{
            fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
            fontSize: '12px',
            color: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          [{(() => {
            const filled = Math.round((progress / 100) * 20);
            const empty = 20 - filled;
            return '█'.repeat(filled) + '░'.repeat(empty);
          })()}]
        </span>
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '12px',
            color: '#0047FF',
            minWidth: 40,
          }}
        >
          {progress}%
        </span>
      </div>

      {/* Terminal window for analysis items */}
      <div
        style={{
          width: '100%',
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.15)',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Terminal header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(0, 0, 0, 0.03)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
          </div>
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'rgba(0, 0, 0, 0.4)',
              marginLeft: 'auto',
            }}
          >
            brandos-cli v2.0
          </span>
        </div>

        {/* Analysis items as log lines */}
        <div style={{ padding: '16px' }}>
          {phase.items.map((item, index) => {
            const isItemComplete = isCompleted || index < itemProgress;
            const isItemActive = !isCompleted && index === Math.floor(itemProgress);
            const profileValue = formatProfileValue(item.dataKey, profile);

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                style={{
                  padding: '8px 0',
                  borderLeft: isItemActive ? '2px solid #0047FF' : '2px solid transparent',
                  paddingLeft: isItemActive ? '12px' : '14px',
                  marginLeft: '-14px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  {/* Status indicator */}
                  <span
                    style={{
                      fontFamily: "'VCR OSD Mono', monospace",
                      fontSize: '11px',
                      color: isItemComplete ? '#10B981' : isItemActive ? '#0047FF' : 'rgba(0, 0, 0, 0.3)',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    {isItemComplete ? '[✓]' : isItemActive ? '[>]' : '[ ]'}
                  </span>

                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        fontSize: '12px',
                        letterSpacing: '0.05em',
                        color: isItemComplete ? '#10B981' : isItemActive ? '#000000' : 'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {item.label}
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
                            fontSize: '11px',
                            color: 'rgba(0, 0, 0, 0.5)',
                            margin: '4px 0 0 0',
                            lineHeight: 1.4,
                          }}
                        >
                          {isItemActive ? (
                            <TerminalTypewriter text={item.description} speed={20} />
                          ) : (
                            item.description
                          )}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Profile data as TypeScript const */}
                <AnimatePresence>
                  {isItemActive && profileValue && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      style={{
                        marginTop: '8px',
                        marginLeft: '21px',
                        padding: '8px 12px',
                        background: 'rgba(0, 71, 255, 0.04)',
                        border: '1px solid rgba(0, 71, 255, 0.1)',
                        borderRadius: '4px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        color: 'rgba(0, 0, 0, 0.7)',
                      }}
                    >
                      <span style={{ color: '#0047FF' }}>const</span>{' '}
                      <span style={{ color: '#000' }}>{item.dataKey}</span>{' '}
                      <span style={{ color: 'rgba(0,0,0,0.4)' }}>=</span>{' '}
                      <span style={{ color: '#10B981' }}>{profileValue}</span>
                      <span style={{ color: 'rgba(0,0,0,0.4)' }}>;</span>
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

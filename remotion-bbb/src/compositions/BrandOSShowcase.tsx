import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  Easing,
  Sequence,
  staticFile,
} from 'remotion';

// ============================================================================
// Types
// ============================================================================
export interface ShowcaseScreenshot {
  filename: string;
  momentId: string;
  label: string;
  startFrame: number;
  duration: number;
  transition: 'fade' | 'zoom' | 'slide';
  order: number;
  src?: string; // staticFile path or data URL
}

export interface BrandOSShowcaseProps {
  screenshots?: ShowcaseScreenshot[];
  title?: string;
  subtitle?: string;
}

// ============================================================================
// Color Palette
// ============================================================================
const COLORS = {
  bgColor: '#050505',
  gold: '#D4A574',
  goldLight: '#E8C49A',
  goldDark: '#B8956A',
  white: '#FFFFFF',
  whiteMuted: 'rgba(255, 255, 255, 0.7)',
  whiteFaint: 'rgba(255, 255, 255, 0.3)',
  green: '#10B981',
  purple: '#9d4edd',
  orange: '#E8A838',
};

// ============================================================================
// Default Screenshots (using actual captured images from public/captures/)
// ============================================================================
const DEFAULT_SCREENSHOTS: ShowcaseScreenshot[] = [
  {
    filename: '000-score-landing.png',
    momentId: 'score:landing',
    label: 'Landing',
    startFrame: 0,
    duration: 75,
    transition: 'fade',
    order: 0,
    src: staticFile('captures/000-score-landing.png'),
  },
  {
    filename: '001-score-analysis-define.png',
    momentId: 'score:analysis:define',
    label: 'Define Phase',
    startFrame: 75,
    duration: 60,
    transition: 'slide',
    order: 1,
    src: staticFile('captures/001-score-analysis-define.png'),
  },
  {
    filename: '002-score-analysis-check.png',
    momentId: 'score:analysis:check',
    label: 'Check Phase',
    startFrame: 135,
    duration: 60,
    transition: 'slide',
    order: 2,
    src: staticFile('captures/002-score-analysis-check.png'),
  },
  {
    filename: '003-score-analysis-generate.png',
    momentId: 'score:analysis:generate',
    label: 'Generate Phase',
    startFrame: 195,
    duration: 60,
    transition: 'slide',
    order: 3,
    src: staticFile('captures/003-score-analysis-generate.png'),
  },
  {
    filename: '004-score-analysis-scale.png',
    momentId: 'score:analysis:scale',
    label: 'Scale Phase',
    startFrame: 255,
    duration: 60,
    transition: 'slide',
    order: 4,
    src: staticFile('captures/004-score-analysis-scale.png'),
  },
  {
    filename: '005-score-reveal.png',
    momentId: 'score:reveal',
    label: 'Score Reveal',
    startFrame: 315,
    duration: 90,
    transition: 'zoom',
    order: 5,
    src: staticFile('captures/005-score-reveal.png'),
  },
  {
    filename: '006-score-walkthrough-score.png',
    momentId: 'score:walkthrough:score',
    label: 'Score Breakdown',
    startFrame: 405,
    duration: 75,
    transition: 'slide',
    order: 6,
    src: staticFile('captures/006-score-walkthrough-score.png'),
  },
  {
    filename: '007-score-walkthrough-tone.png',
    momentId: 'score:walkthrough:tone',
    label: 'Tone Analysis',
    startFrame: 480,
    duration: 75,
    transition: 'slide',
    order: 7,
    src: staticFile('captures/007-score-walkthrough-tone.png'),
  },
  {
    filename: '008-score-walkthrough-archetype.png',
    momentId: 'score:walkthrough:archetype',
    label: 'Brand Archetype',
    startFrame: 555,
    duration: 75,
    transition: 'zoom',
    order: 8,
    src: staticFile('captures/008-score-walkthrough-archetype.png'),
  },
  {
    filename: '009-score-walkthrough-keywords.png',
    momentId: 'score:walkthrough:keywords',
    label: 'Keywords',
    startFrame: 630,
    duration: 75,
    transition: 'slide',
    order: 9,
    src: staticFile('captures/009-score-walkthrough-keywords.png'),
  },
  {
    filename: '010-score-walkthrough-content.png',
    momentId: 'score:walkthrough:content',
    label: 'Content Pillars',
    startFrame: 705,
    duration: 75,
    transition: 'fade',
    order: 10,
    src: staticFile('captures/010-score-walkthrough-content.png'),
  },
];

// ============================================================================
// Animation Helpers
// ============================================================================
const useSpringAnimation = (frame: number, fps: number, delay: number, config?: { damping?: number; stiffness?: number }) => {
  return spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {
      damping: config?.damping ?? 15,
      stiffness: config?.stiffness ?? 80,
    },
  });
};

// ============================================================================
// Title Overlay Component
// ============================================================================
const TitleOverlay: React.FC<{ delay: number; title: string; subtitle: string }> = ({ delay, title, subtitle }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [delay, delay + 30, delay + 90, delay + 120], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleY = interpolate(frame - delay, [0, 30], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const subtitleY = interpolate(frame - delay, [15, 45], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  if (frame < delay || frame > delay + 150) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        zIndex: 100,
        background: 'linear-gradient(180deg, rgba(5, 5, 5, 0.9) 0%, rgba(5, 5, 5, 0.95) 100%)',
      }}
    >
      {/* Logo/Brand Mark */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          boxShadow: `0 0 60px ${COLORS.gold}40`,
        }}
      >
        <span style={{ fontSize: '36px', fontWeight: 700, color: COLORS.bgColor }}>B</span>
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: "'VCR OSD Mono', Inter, system-ui, sans-serif",
          fontSize: '64px',
          fontWeight: 400,
          letterSpacing: '0.15em',
          color: COLORS.white,
          margin: 0,
          transform: `translateY(${titleY}px)`,
          textShadow: `0 0 40px ${COLORS.gold}40`,
        }}
      >
        {title}
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: "'Helvetica Neue', Inter, system-ui, sans-serif",
          fontSize: '20px',
          fontWeight: 300,
          letterSpacing: '0.1em',
          color: COLORS.whiteMuted,
          margin: '16px 0 0 0',
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        {subtitle}
      </p>

      {/* Decorative line */}
      <div
        style={{
          width: '120px',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
          marginTop: '32px',
        }}
      />
    </div>
  );
};

// ============================================================================
// Screenshot Display Component
// ============================================================================
const ScreenshotFrame: React.FC<{
  screenshot: ShowcaseScreenshot;
  isActive: boolean;
  progress: number;
}> = ({ screenshot, isActive, progress }) => {
  // Calculate transition animations based on type
  let opacity = 0;
  let scale = 1;
  let translateX = 0;
  const translateY = 0;

  if (isActive) {
    switch (screenshot.transition) {
      case 'fade':
        opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        break;

      case 'zoom':
        opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        scale = interpolate(progress, [0, 0.1, 0.5, 0.9, 1], [0.8, 1, 1.02, 1, 0.95], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        break;

      case 'slide':
        opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        translateX = interpolate(progress, [0, 0.15, 0.85, 1], [100, 0, 0, -100], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        break;
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale}) translateX(${translateX}px) translateY(${translateY}px)`,
      }}
    >
      {/* Screenshot Container */}
      <div
        style={{
          position: 'relative',
          width: '85%',
          height: '85%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Screenshot Image */}
        {screenshot.src ? (
          <Img
            src={screenshot.src}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: '16px',
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px ${COLORS.whiteFaint}`,
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${COLORS.bgColor} 0%, #1a1a1a 100%)`,
              borderRadius: '16px',
              border: `1px solid ${COLORS.whiteFaint}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <span style={{ fontSize: '48px' }}>📸</span>
            <span
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                fontSize: '14px',
                letterSpacing: '0.1em',
                color: COLORS.whiteMuted,
              }}
            >
              {screenshot.filename}
            </span>
          </div>
        )}

        {/* Label Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 24px',
            background: 'rgba(5, 5, 5, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '30px',
            border: `1px solid ${COLORS.gold}40`,
          }}
        >
          <span
            style={{
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '12px',
              letterSpacing: '0.15em',
              color: COLORS.gold,
            }}
          >
            {screenshot.label.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Progress Bar Component
// ============================================================================
const ProgressBar: React.FC<{ progress: number; currentIndex: number; total: number }> = ({
  progress,
  currentIndex,
  total,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === currentIndex ? '32px' : '8px',
            height: '8px',
            borderRadius: '4px',
            background:
              i < currentIndex
                ? COLORS.gold
                : i === currentIndex
                  ? `linear-gradient(90deg, ${COLORS.gold} ${progress * 100}%, ${COLORS.whiteFaint} ${progress * 100}%)`
                  : COLORS.whiteFaint,
            transition: 'width 0.3s ease',
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Ending CTA Component
// ============================================================================
const EndingCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = useSpringAnimation(frame, fps, 0, { damping: 20 });
  const scale = interpolate(opacity, [0, 1], [0.9, 1]);

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
          boxShadow: `0 0 80px ${COLORS.gold}50`,
        }}
      >
        <span style={{ fontSize: '48px', fontWeight: 700, color: COLORS.bgColor }}>B</span>
      </div>

      {/* CTA Text */}
      <h2
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: '48px',
          letterSpacing: '0.1em',
          color: COLORS.white,
          margin: 0,
        }}
      >
        BRANDOS
      </h2>

      <p
        style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: '24px',
          color: COLORS.whiteMuted,
          margin: '16px 0 40px 0',
        }}
      >
        Your Brand Operating System
      </p>

      {/* URL */}
      <div
        style={{
          padding: '16px 40px',
          background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
          borderRadius: '12px',
          boxShadow: `0 4px 30px ${COLORS.gold}40`,
        }}
      >
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '18px',
            letterSpacing: '0.1em',
            color: COLORS.bgColor,
            fontWeight: 600,
          }}
        >
          BRANDOS.AI
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// Main Composition
// ============================================================================
export const BrandOSShowcase: React.FC<BrandOSShowcaseProps> = ({
  screenshots = DEFAULT_SCREENSHOTS,
  title = 'BRANDOS',
  subtitle = 'X Brand Score Journey',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Calculate intro and outro timing
  const introFrames = 150;
  const outroFrames = 90;
  const contentStart = introFrames;
  const contentEnd = durationInFrames - outroFrames;

  // Find current screenshot based on frame
  const currentScreenshotIndex = screenshots.findIndex((s, i) => {
    const nextStart = screenshots[i + 1]?.startFrame ?? Infinity;
    const adjustedFrame = frame - contentStart;
    return adjustedFrame >= s.startFrame && adjustedFrame < nextStart;
  });

  const currentScreenshot = screenshots[currentScreenshotIndex];
  const adjustedFrame = frame - contentStart;
  const screenshotProgress = currentScreenshot
    ? (adjustedFrame - currentScreenshot.startFrame) / currentScreenshot.duration
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgColor }}>
      {/* Background Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${COLORS.gold}08 0%, transparent 60%)`,
        }}
      />

      {/* Title Intro */}
      <TitleOverlay delay={0} title={title} subtitle={subtitle} />

      {/* Screenshot Frames */}
      {frame >= contentStart && frame < contentEnd && (
        <>
          {screenshots.map((screenshot, index) => (
            <ScreenshotFrame
              key={screenshot.momentId}
              screenshot={screenshot}
              isActive={index === currentScreenshotIndex}
              progress={index === currentScreenshotIndex ? screenshotProgress : 0}
            />
          ))}

          {/* Progress Indicator */}
          <ProgressBar
            progress={screenshotProgress}
            currentIndex={currentScreenshotIndex}
            total={screenshots.length}
          />
        </>
      )}

      {/* Ending CTA */}
      <Sequence from={contentEnd}>
        <EndingCTA />
      </Sequence>
    </AbsoluteFill>
  );
};

export default BrandOSShowcase;

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
  Sequence,
} from 'remotion';

// =============================================================================
// Color Scheme (BrandOS Brand Kit)
// =============================================================================
const COLORS = {
  bgColor: '#0a0a0a',
  heroBlue: '#2E6AFF',
  cardIdentity: '#FFFFFF',
  cardToneMixer: '#1A1A1A',
  cardArchetype: '#FFD700',
  cardDNA: '#F0F0F0',
  cardContent: '#000000',
  accentGreen: '#00FF41',
  accentOrange: '#FF6B00',
  accentBlue: '#2E6AFF',
  textLight: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.7)',
  textDark: '#000000',
  glowBlue: 'rgba(46, 106, 255, 0.5)',
};

// =============================================================================
// Layout Constants (Centered in 1920x1080)
// =============================================================================
const LAYOUT = {
  // Grid dimensions
  gridWidth: 1200,
  gridHeight: 800,
  gap: 20,

  // Centered offsets
  offsetX: (1920 - 1200) / 2, // 360
  offsetY: (1080 - 800) / 2,  // 140

  // Card sizes
  heroWidth: 580,
  heroHeight: 360,
  identityWidth: 580,
  identityHeight: 160,
  smallCardWidth: 280,
  smallCardHeight: 180,
  bottomCardWidth: 580,
  bottomCardHeight: 380,
};

// =============================================================================
// Sample Data
// =============================================================================
const DEMO_DATA = {
  profile: {
    username: 'banditxbt',
    displayName: 'banditxbt',
    followersCount: '46K',
  },
  scores: {
    brandScore: 83,
    voiceConsistency: 80,
    engagementScore: 85,
  },
  personality: {
    archetype: 'The Professor',
    emoji: '🎓',
    type: 'INTJ',
  },
  tone: {
    formality: 45,
    energy: 78,
    confidence: 65,
  },
  pillars: [
    { label: 'Expertise', value: 85, color: '#FFFFFF' },
    { label: 'Consistency', value: 90, color: '#2E6AFF' },
    { label: 'Content', value: 82, color: '#FF6B00' },
  ],
  dna: {
    keywords: ['philosophy', 'web3', 'growth', 'blockchain'],
    archetypeTag: 'the professor',
    voice: `> As the Professor, you excel at breaking down complex topics and guiding your audience with patience and expertise.
> However, your voice consistency of 75% suggests a lack of cohesion in your brand presence, which may leave your followers unsure of your true persona.
> This week, focus on crafting a clear and consistent tone across all your content.`,
  },
};

// =============================================================================
// Animation Helpers
// =============================================================================
const useSpring = (frame: number, fps: number, delay: number, config?: { damping?: number; stiffness?: number }) => {
  return spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: config?.damping ?? 15, stiffness: config?.stiffness ?? 80 },
  });
};

// =============================================================================
// Zoom Camera System
// =============================================================================
interface CameraState {
  x: number;
  y: number;
  scale: number;
}

const useCameraAnimation = (frame: number, fps: number): CameraState => {
  // Timeline:
  // 0-90: Intro (centered, scale 1)
  // 90-150: Full dashboard reveal
  // 150-210: Zoom to Hero Score
  // 210-270: Zoom to Identity
  // 270-330: Zoom to Tone Mixer
  // 330-390: Zoom to Archetype
  // 390-450: Zoom to DNA Terminal
  // 450-510: Zoom to Content Distribution
  // 510-570: Zoom out to full view
  // 570+: Final CTA

  const zoomTargets: { start: number; end: number; state: CameraState }[] = [
    { start: 0, end: 150, state: { x: 0, y: 0, scale: 1 } }, // Full view intro
    { start: 150, end: 210, state: { x: -180, y: -120, scale: 1.5 } }, // Hero Score
    { start: 210, end: 270, state: { x: 180, y: -180, scale: 1.6 } }, // Identity
    { start: 270, end: 330, state: { x: 120, y: 20, scale: 1.8 } }, // Tone Mixer
    { start: 330, end: 390, state: { x: 280, y: 20, scale: 1.7 } }, // Archetype
    { start: 390, end: 450, state: { x: -180, y: 180, scale: 1.4 } }, // DNA Terminal
    { start: 450, end: 510, state: { x: 200, y: 180, scale: 1.5 } }, // Content Distribution
    { start: 510, end: 600, state: { x: 0, y: 0, scale: 1 } }, // Full view outro
  ];

  let currentState: CameraState = { x: 0, y: 0, scale: 1 };
  let nextState: CameraState = { x: 0, y: 0, scale: 1 };
  let progress = 0;

  for (let i = 0; i < zoomTargets.length; i++) {
    const target = zoomTargets[i];
    if (frame >= target.start && frame < target.end) {
      currentState = target.state;
      nextState = zoomTargets[i + 1]?.state ?? target.state;

      // Transition in last 30 frames of each segment
      const transitionStart = target.end - 30;
      if (frame >= transitionStart) {
        progress = (frame - transitionStart) / 30;
        progress = Easing.inOut(Easing.cubic)(progress);
      }
      break;
    }
  }

  return {
    x: interpolate(progress, [0, 1], [currentState.x, nextState.x]),
    y: interpolate(progress, [0, 1], [currentState.y, nextState.y]),
    scale: interpolate(progress, [0, 1], [currentState.scale, nextState.scale]),
  };
};

// =============================================================================
// Shared Components
// =============================================================================
const GridPattern: React.FC<{ opacity?: number }> = ({ opacity = 0.25 }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      opacity,
      pointerEvents: 'none',
    }}
  />
);

const LineGridPattern: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      pointerEvents: 'none',
    }}
  />
);

const AnimatedNumber: React.FC<{
  value: number;
  startFrame: number;
  duration: number;
  suffix?: string;
}> = ({ value, startFrame, duration, suffix = '' }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - startFrame, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return <span>{Math.round(value * progress)}{suffix}</span>;
};

const ProgressBar: React.FC<{ value: number; color: string; delay: number }> = ({ value, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 20, stiffness: 60 } });

  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 3, width: 60, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${value * progress}%`, background: color, borderRadius: 3 }} />
    </div>
  );
};

// =============================================================================
// Card Components
// =============================================================================

const HeroScoreCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideIn = useSpring(frame, fps, delay, { damping: 18, stiffness: 80 });
  const scale = interpolate(slideIn, [0, 1], [0.9, 1]);
  const opacity = interpolate(slideIn, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT.offsetY,
        left: LAYOUT.offsetX,
        width: LAYOUT.heroWidth,
        height: LAYOUT.heroHeight,
        backgroundColor: COLORS.heroBlue,
        borderRadius: 16,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transform: `scale(${scale})`,
        opacity,
        overflow: 'hidden',
      }}
    >
      <GridPattern />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
        <div style={{
          fontFamily: 'JetBrains Mono',
          fontSize: 13,
          fontWeight: 700,
          color: COLORS.textLight,
          letterSpacing: 1,
          border: '2px solid rgba(255,255,255,0.5)',
          padding: '6px 14px',
          borderRadius: 4,
        }}>
          SYSTEM_SCORE
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <div style={{ zIndex: 1, textAlign: 'center', marginTop: -10 }}>
        <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 180, lineHeight: 0.85, color: COLORS.textLight, letterSpacing: -6 }}>
          <AnimatedNumber value={DEMO_DATA.scores.brandScore} startFrame={delay + 15} duration={45} />
        </div>
      </div>
      <div style={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 6, letterSpacing: 2 }}>VOICE CONSISTENCY</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 28, color: COLORS.textLight }}>
              <AnimatedNumber value={DEMO_DATA.scores.voiceConsistency} startFrame={delay + 30} duration={40} suffix="%" />
            </span>
            <ProgressBar value={DEMO_DATA.scores.voiceConsistency} color="#FFFFFF" delay={delay + 30} />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 6, letterSpacing: 2 }}>ENGAGEMENT</div>
          <span style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 28, color: COLORS.textLight }}>
            <AnimatedNumber value={DEMO_DATA.scores.engagementScore} startFrame={delay + 35} duration={40} />/100
          </span>
        </div>
      </div>
    </div>
  );
};

const IdentityCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideIn = useSpring(frame, fps, delay, { damping: 20, stiffness: 100 });
  const opacity = interpolate(slideIn, [0, 1], [0, 1]);
  const translateY = interpolate(slideIn, [0, 1], [20, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT.offsetY,
        left: LAYOUT.offsetX + LAYOUT.heroWidth + LAYOUT.gap,
        width: LAYOUT.identityWidth,
        height: LAYOUT.identityHeight,
        backgroundColor: COLORS.cardIdentity,
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', backgroundColor: '#E8E8E8', border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
          🤖
        </div>
        <div>
          <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 32, color: COLORS.textDark, letterSpacing: -1 }}>{DEMO_DATA.profile.displayName}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 16, color: '#888' }}>@{DEMO_DATA.profile.username}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#999', letterSpacing: 2, marginBottom: 4 }}>AUDIENCE</div>
        <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 48, color: COLORS.textDark, letterSpacing: -2 }}>{DEMO_DATA.profile.followersCount}</div>
      </div>
    </div>
  );
};

const ToneMixerCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideIn = useSpring(frame, fps, delay, { damping: 20, stiffness: 100 });
  const opacity = interpolate(slideIn, [0, 1], [0, 1]);
  const translateY = interpolate(slideIn, [0, 1], [20, 0]);

  const bars = [
    { label: 'FRM', value: DEMO_DATA.tone.formality, color: '#666666' },
    { label: 'NRG', value: DEMO_DATA.tone.energy, color: COLORS.accentGreen },
    { label: 'CNF', value: DEMO_DATA.tone.confidence, color: COLORS.accentBlue },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT.offsetY + LAYOUT.identityHeight + LAYOUT.gap,
        left: LAYOUT.offsetX + LAYOUT.heroWidth + LAYOUT.gap,
        width: LAYOUT.smallCardWidth,
        height: LAYOUT.smallCardHeight,
        backgroundColor: COLORS.cardToneMixer,
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(255,255,255,0.08)',
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#555', marginBottom: 16, letterSpacing: 2 }}>TONE_MIXER</div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        {bars.map((bar, i) => {
          const barScale = spring({ frame: Math.max(0, frame - delay - 15 - i * 6), fps, config: { damping: 12, stiffness: 60 } });
          return (
            <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ width: '100%', height: 40, backgroundColor: bar.color, borderRadius: 4, transform: `scaleX(${barScale})`, transformOrigin: 'left', boxShadow: bar.color !== '#666666' ? `0 0 15px ${bar.color}40` : 'none' }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: bar.color, fontWeight: 700, marginTop: 8 }}>{bar.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ArchetypeCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideIn = useSpring(frame, fps, delay, { damping: 20, stiffness: 100 });
  const opacity = interpolate(slideIn, [0, 1], [0, 1]);
  const translateY = interpolate(slideIn, [0, 1], [20, 0]);
  const emojiRotate = spring({ frame: Math.max(0, frame - delay - 10), fps, config: { damping: 8, stiffness: 50 } });
  const rotation = interpolate(emojiRotate, [0, 1], [45, -12]);
  const emojiScale = interpolate(emojiRotate, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT.offsetY + LAYOUT.identityHeight + LAYOUT.gap,
        left: LAYOUT.offsetX + LAYOUT.heroWidth + LAYOUT.gap + LAYOUT.smallCardWidth + LAYOUT.gap,
        width: LAYOUT.smallCardWidth,
        height: LAYOUT.smallCardHeight,
        backgroundColor: COLORS.cardArchetype,
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transform: `translateY(${translateY}px)`,
        opacity,
        overflow: 'visible',
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: COLORS.textDark, fontWeight: 700, backgroundColor: '#FFF', padding: '5px 10px', borderRadius: 4, width: 'fit-content', letterSpacing: 1 }}>ARCHETYPE</div>
      <div style={{ position: 'absolute', right: -20, top: 5, fontSize: 90, transform: `rotate(${rotation}deg) scale(${emojiScale})`, filter: 'drop-shadow(3px 3px 0 rgba(0,0,0,0.1))' }}>🎓</div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 28, color: COLORS.textDark, letterSpacing: -1 }}>{DEMO_DATA.personality.archetype}</div>
        <div style={{ display: 'inline-block', marginTop: 8, backgroundColor: COLORS.accentBlue, color: COLORS.textLight, fontSize: 11, padding: '5px 12px', fontFamily: 'JetBrains Mono', fontWeight: 700, borderRadius: 4 }}>{DEMO_DATA.personality.type}</div>
      </div>
    </div>
  );
};

const DNATerminalCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideIn = useSpring(frame, fps, delay, { damping: 20, stiffness: 100 });
  const opacity = interpolate(slideIn, [0, 1], [0, 1]);
  const translateY = interpolate(slideIn, [0, 1], [20, 0]);

  const charsToShow = Math.floor((frame - delay - 40) * 2);
  const displayText = DEMO_DATA.dna.voice.slice(0, Math.max(0, charsToShow));

  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT.offsetY + LAYOUT.heroHeight + LAYOUT.gap,
        left: LAYOUT.offsetX,
        width: LAYOUT.bottomCardWidth,
        height: LAYOUT.bottomCardHeight,
        backgroundColor: COLORS.cardDNA,
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: COLORS.textDark }}>{'>_'}</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: COLORS.textDark, fontWeight: 700, letterSpacing: 1 }}>{'>'} EXECUTE_DNA_SEQUENCE</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {DEMO_DATA.dna.keywords.map((word, i) => {
          const tagIn = spring({ frame: Math.max(0, frame - delay - 20 - i * 4), fps, config: { damping: 15, stiffness: 100 } });
          return (
            <div key={word} style={{ backgroundColor: COLORS.textDark, color: COLORS.textLight, padding: '6px 12px', fontSize: 13, fontFamily: 'JetBrains Mono', borderRadius: 6, transform: `scale(${tagIn})`, opacity: tagIn }}>[{word}]</div>
          );
        })}
      </div>
      <div style={{ backgroundColor: COLORS.textDark, color: COLORS.textLight, padding: '6px 12px', fontSize: 13, fontFamily: 'JetBrains Mono', borderRadius: 6, display: 'inline-flex', width: 'fit-content', marginBottom: 14 }}>[🎓 {DEMO_DATA.dna.archetypeTag}]</div>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.95)', padding: 16, borderRadius: 8, flex: 1 }}>
        <pre style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#E0E0E0', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {displayText}
          <span style={{ display: 'inline-block', width: 7, height: 14, backgroundColor: '#E0E0E0', marginLeft: 2, verticalAlign: 'middle', opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0 }} />
        </pre>
      </div>
    </div>
  );
};

const ContentDistributionCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideIn = useSpring(frame, fps, delay, { damping: 20, stiffness: 100 });
  const opacity = interpolate(slideIn, [0, 1], [0, 1]);
  const translateY = interpolate(slideIn, [0, 1], [20, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT.offsetY + LAYOUT.identityHeight + LAYOUT.gap + LAYOUT.smallCardHeight + LAYOUT.gap,
        left: LAYOUT.offsetX + LAYOUT.heroWidth + LAYOUT.gap,
        width: LAYOUT.bottomCardWidth,
        height: LAYOUT.bottomCardHeight - LAYOUT.smallCardHeight - LAYOUT.gap,
        backgroundColor: COLORS.cardContent,
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #333',
        transform: `translateY(${translateY}px)`,
        opacity,
        overflow: 'hidden',
      }}
    >
      <LineGridPattern />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, zIndex: 1 }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#666', letterSpacing: 2 }}>CONTENT_DISTRIBUTION</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', flex: 1, paddingBottom: 30, zIndex: 1 }}>
        {DEMO_DATA.pillars.map((pillar, i) => {
          const barHeight = spring({ frame: Math.max(0, frame - delay - 20 - i * 8), fps, config: { damping: 15, stiffness: 50 } });
          return (
            <div key={pillar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 100, height: 140 * barHeight, backgroundColor: pillar.color, borderRadius: 8, border: `3px solid ${pillar.color}` }} />
              <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 13, color: pillar.color, marginTop: 12 }}>{pillar.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Spotlight Overlay Component
// =============================================================================
const SpotlightOverlay: React.FC<{
  title: string;
  description: string;
  frame: number;
  startFrame: number;
  endFrame: number;
  position: 'left' | 'right';
}> = ({ title, description, frame, startFrame, endFrame, position }) => {
  if (frame < startFrame || frame > endFrame) return null;

  const progress = interpolate(frame - startFrame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [endFrame - 20, endFrame], [1, 0], { extrapolateLeft: 'clamp' });
  const opacity = progress * fadeOut;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        [position]: 80,
        transform: `translateY(-50%) translateX(${(1 - progress) * (position === 'left' ? -30 : 30)}px)`,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: `2px solid ${COLORS.heroBlue}`,
        borderRadius: 16,
        padding: '24px 32px',
        maxWidth: 320,
        zIndex: 200,
        opacity,
        boxShadow: `0 0 40px ${COLORS.glowBlue}`,
      }}
    >
      <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: COLORS.heroBlue, marginBottom: 12 }}>{title}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 15, color: COLORS.textMuted, lineHeight: 1.5 }}>{description}</div>
    </div>
  );
};

// =============================================================================
// Title Overlay
// =============================================================================
const TitleOverlay: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 20, stiffness: 60 } });
  const fadeOut = frame > delay + 60 ? spring({ frame: Math.max(0, frame - delay - 60), fps, config: { damping: 30, stiffness: 100 } }) : 0;
  const opacity = fadeIn * (1 - fadeOut);
  const scale = interpolate(fadeIn, [0, 1], [0.9, 1]);

  if (opacity < 0.01) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10, 10, 10, 0.98)', zIndex: 100, opacity }}>
      <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 100, color: COLORS.textLight, letterSpacing: -3, transform: `scale(${scale})` }}>
        brand<span style={{ color: COLORS.heroBlue }}>OS</span>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, color: COLORS.textMuted, marginTop: 20, letterSpacing: 6, transform: `scale(${scale})` }}>YOUR BRAND DNA DASHBOARD</div>
    </div>
  );
};

// =============================================================================
// Ending CTA
// =============================================================================
const EndingCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = spring({ frame, fps, config: { damping: 20, stiffness: 60 } });

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10, 10, 10, 0.95)', zIndex: 100, opacity: fadeIn }}>
      <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 48, color: COLORS.textLight, marginBottom: 24, transform: `translateY(${(1 - fadeIn) * 20}px)` }}>Discover your Brand DNA</div>
      <div style={{ backgroundColor: COLORS.heroBlue, color: COLORS.textLight, padding: '20px 48px', borderRadius: 12, fontFamily: 'Inter', fontWeight: 700, fontSize: 24, boxShadow: `0 0 50px ${COLORS.glowBlue}`, transform: `translateY(${(1 - fadeIn) * 20}px)` }}>
        Try BrandOS Free →
      </div>
    </div>
  );
};

// =============================================================================
// Main Composition
// =============================================================================
export const BentoDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const camera = useCameraAnimation(frame, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgColor, fontFamily: 'Inter, sans-serif' }}>
      {/* Title intro */}
      <TitleOverlay delay={0} />

      {/* Camera container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* All cards */}
        <HeroScoreCard delay={90} />
        <IdentityCard delay={100} />
        <ToneMixerCard delay={110} />
        <ArchetypeCard delay={120} />
        <DNATerminalCard delay={130} />
        <ContentDistributionCard delay={140} />
      </div>

      {/* Spotlight overlays during zoom sequences */}
      <SpotlightOverlay
        title="Brand Score"
        description="Your overall brand strength measured across voice consistency, engagement, and influence metrics."
        frame={frame}
        startFrame={160}
        endFrame={200}
        position="right"
      />
      <SpotlightOverlay
        title="Profile Identity"
        description="Quick snapshot of your social presence including follower count and verification status."
        frame={frame}
        startFrame={220}
        endFrame={260}
        position="left"
      />
      <SpotlightOverlay
        title="Tone Analysis"
        description="Real-time breakdown of your communication style: formality, energy, and confidence levels."
        frame={frame}
        startFrame={280}
        endFrame={320}
        position="left"
      />
      <SpotlightOverlay
        title="Brand Archetype"
        description="Discover your unique brand personality type and how it resonates with your audience."
        frame={frame}
        startFrame={340}
        endFrame={380}
        position="left"
      />
      <SpotlightOverlay
        title="DNA Terminal"
        description="AI-powered insights analyzing your content patterns and generating actionable recommendations."
        frame={frame}
        startFrame={400}
        endFrame={440}
        position="right"
      />
      <SpotlightOverlay
        title="Content Distribution"
        description="Visual breakdown of your content themes and how they perform across your audience."
        frame={frame}
        startFrame={460}
        endFrame={500}
        position="left"
      />

      {/* Ending CTA */}
      <Sequence from={durationInFrames - 90}>
        <EndingCTA />
      </Sequence>
    </AbsoluteFill>
  );
};

export default BentoDashboard;

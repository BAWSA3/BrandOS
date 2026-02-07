import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

// Motivational phrases
const PHRASES = [
  { text: "DREAM", emphasis: "BIG", color: "#FF6B6B" },
  { text: "WORK", emphasis: "HARD", color: "#4ECDC4" },
  { text: "STAY", emphasis: "FOCUSED", color: "#FFE66D" },
  { text: "NEVER", emphasis: "GIVE UP", color: "#95E1D3" },
  { text: "SUCCESS IS", emphasis: "BUILT", color: "#F38181" },
  { text: "ONE DAY", emphasis: "AT A TIME", color: "#AA96DA" },
];

const PHRASE_DURATION = 45; // frames per phrase
const TRANSITION_OVERLAP = 5;

// Animated word component with spring physics
const AnimatedWord: React.FC<{
  text: string;
  delay: number;
  color: string;
  fontSize: number;
  fontWeight: number;
  yOffset?: number;
}> = ({ text, delay, color, fontSize, fontWeight, yOffset = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  const scale = interpolate(entrance, [0, 1], [0.3, 1]);
  const opacity = interpolate(entrance, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(entrance, [0, 1], [80 + yOffset, yOffset]);
  const rotation = interpolate(entrance, [0, 1], [-15, 0]);

  return (
    <div
      style={{
        color,
        fontSize,
        fontWeight,
        fontFamily: "'Inter', sans-serif",
        transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
        opacity,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        textShadow: `0 4px 30px ${color}40`,
      }}
    >
      {text}
    </div>
  );
};

// Single phrase scene with two-part text
const PhraseScene: React.FC<{
  text: string;
  emphasis: string;
  color: string;
}> = ({ text, emphasis, color }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Background pulse effect
  const pulse = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const bgScale = interpolate(pulse, [0, 1], [1, 1.02]);

  // Exit animation
  const exitProgress = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const exitScale = interpolate(exitProgress, [0, 1], [1, 0.8]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0f",
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${bgScale * exitScale})`,
        opacity: exitOpacity,
      }}
    >
      {/* Animated background gradient */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)`,
          transform: `scale(${1 + pulse * 0.1})`,
        }}
      />

      {/* Text container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          zIndex: 1,
        }}
      >
        <AnimatedWord
          text={text}
          delay={0}
          color="#ffffff80"
          fontSize={60}
          fontWeight={500}
          yOffset={-20}
        />
        <AnimatedWord
          text={emphasis}
          delay={8}
          color={color}
          fontSize={140}
          fontWeight={900}
          yOffset={20}
        />
      </div>

      {/* Decorative lines */}
      <DecorativeLines color={color} />
    </AbsoluteFill>
  );
};

// Decorative animated lines
const DecorativeLines: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineProgress = spring({
    frame: frame - 5,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const lineWidth = interpolate(lineProgress, [0, 1], [0, 300]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: "50%",
          transform: "translateX(-50%)",
          width: lineWidth,
          height: 2,
          backgroundColor: `${color}40`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "35%",
          left: "50%",
          transform: "translateX(-50%)",
          width: lineWidth,
          height: 2,
          backgroundColor: `${color}40`,
        }}
      />
    </>
  );
};

// Intro scene
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const scale = interpolate(titleSpring, [0, 1], [0.5, 1]);
  const opacity = interpolate(titleSpring, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Particle effect simulation
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const distance = interpolate(titleSpring, [0, 1], [0, 200 + i * 10]);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const particleOpacity = interpolate(titleSpring, [0.5, 1], [1, 0], {
      extrapolateLeft: "clamp",
    });

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          width: 4,
          height: 4,
          borderRadius: "50%",
          backgroundColor: "#FFE66D",
          transform: `translate(${x}px, ${y}px)`,
          opacity: particleOpacity,
        }}
      />
    );
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0f",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ position: "relative" }}>
        {particles}
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            fontFamily: "'Inter', sans-serif",
            color: "#ffffff",
            transform: `scale(${scale})`,
            opacity,
            textAlign: "center",
            letterSpacing: "0.1em",
          }}
        >
          BELIEVE IN
          <br />
          <span style={{ color: "#FFE66D" }}>YOURSELF</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Outro scene with all colors
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const words = ["YOUR", "STORY", "STARTS", "NOW"];
  const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#ffffff"];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0f",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Gradient background */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 30,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1200,
          zIndex: 1,
        }}
      >
        {words.map((word, i) => {
          const delay = i * 8;
          const wordSpring = spring({
            frame: frame - delay,
            fps,
            config: { damping: 10, stiffness: 150 },
          });

          const y = interpolate(wordSpring, [0, 1], [100, 0]);
          const opacity = interpolate(wordSpring, [0, 0.3], [0, 1], {
            extrapolateRight: "clamp",
          });
          const rotation = interpolate(wordSpring, [0, 1], [10, 0]);

          return (
            <div
              key={word}
              style={{
                fontSize: 100,
                fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
                color: colors[i],
                transform: `translateY(${y}px) rotate(${rotation}deg)`,
                opacity,
                textShadow: `0 0 40px ${colors[i]}60`,
              }}
            >
              {word}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Main composition
export const KineticTypography: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0f" }}>
      {/* Intro */}
      <Sequence durationInFrames={60} premountFor={fps}>
        <IntroScene />
      </Sequence>

      {/* Phrase sequences */}
      {PHRASES.map((phrase, index) => (
        <Sequence
          key={index}
          from={60 + index * (PHRASE_DURATION - TRANSITION_OVERLAP)}
          durationInFrames={PHRASE_DURATION}
          premountFor={fps}
        >
          <PhraseScene
            text={phrase.text}
            emphasis={phrase.emphasis}
            color={phrase.color}
          />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence
        from={60 + PHRASES.length * (PHRASE_DURATION - TRANSITION_OVERLAP)}
        durationInFrames={90}
        premountFor={fps}
      >
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

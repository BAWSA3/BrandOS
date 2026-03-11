import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { GlowOrb } from "../components";
import { colors } from "../utils/colors";
import { easeOutQuart, easeOutBack, easeOutExpo } from "../utils/easing";
import {
  ceTiming,
  HANDLE_ROULETTE,
  EXAMPLE_POST,
  VOICE_TRAITS,
} from "../utils/content-engine-timing";

// ============================================================
// SCENE 1: Hook — "what if your content wrote itself"
// ============================================================
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();

  const line1 = "what if your content";
  const line2 = "wrote itself";
  const line3 = "— in YOUR voice?";

  // Typing effect for line 1
  const line1Chars = Math.min(
    Math.floor(interpolate(frame, [0, 20], [0, line1.length], { extrapolateRight: "clamp" })),
    line1.length
  );

  // Line 2 starts after line 1
  const line2Chars = Math.min(
    Math.floor(interpolate(frame, [22, 38], [0, line2.length], { extrapolateRight: "clamp" })),
    line2.length
  );

  // Line 3 — punchline, slight pause then appears
  const line3Opacity = interpolate(frame, [45, 55], [0, 1], { extrapolateRight: "clamp" });
  const line3Y = interpolate(frame, [45, 55], [15, 0], {
    extrapolateRight: "clamp",
    easing: easeOutQuart,
  });

  // Cursor blink
  const cursorVisible = Math.floor(frame / 8) % 2 === 0;

  // Overall fade out at end of scene
  const fadeOut = interpolate(frame, [60, 75], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut,
      }}
    >
      <div style={{ textAlign: "left", padding: "0 200px" }}>
        {/* Line 1 */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 42,
            color: "rgba(255, 255, 255, 0.5)",
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
          }}
        >
          {line1.slice(0, line1Chars)}
          {line1Chars < line1.length && cursorVisible && (
            <span style={{ color: colors.primary }}>▌</span>
          )}
        </div>

        {/* Line 2 */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 42,
            color: "rgba(255, 255, 255, 0.5)",
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
          }}
        >
          {line2.slice(0, line2Chars)}
          {line2Chars > 0 && line2Chars < line2.length && cursorVisible && (
            <span style={{ color: colors.primary }}>▌</span>
          )}
        </div>

        {/* Line 3 — punchline */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 48,
            fontWeight: 700,
            color: colors.white,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            marginTop: 8,
            opacity: line3Opacity,
            transform: `translateY(${line3Y}px)`,
          }}
        >
          {line3}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// SCENE 2: Product Reveal — "content engine_"
// ============================================================
const RevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });

  const titleOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });

  const glowIntensity = interpolate(frame, [0, 10, 30], [60, 40, 20], {
    extrapolateRight: "clamp",
  });

  // Subtitle fade in
  const subOpacity = interpolate(frame, [12, 22], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(frame, [12, 22], [10, 0], {
    extrapolateRight: "clamp",
    easing: easeOutQuart,
  });

  // Status dot pulse
  const dotScale = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.8, 1.2]
  );

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          filter: `drop-shadow(0 0 ${glowIntensity}px ${colors.primary})`,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'VCR OSD Mono', monospace",
            fontSize: 72,
            fontWeight: 700,
            color: colors.white,
            letterSpacing: "-0.02em",
          }}
        >
          content engine
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 72,
            fontWeight: 700,
            color: colors.primary,
          }}
        >
          _
        </span>
      </div>

      {/* Subtitle line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 20,
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: colors.primary,
            transform: `scale(${dotScale})`,
            boxShadow: `0 0 8px ${colors.primary}`,
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 16,
            color: colors.primary,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          brandos · powered by claude
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// SCENE 3: Handle Roulette + Voice Scan
// ============================================================
const ScanScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase 1: Handle roulette (frames 0-45)
  // Phase 2: Voice scan (frames 45-90)

  const isRoulettePhase = frame < 50;

  // Handle roulette — fast cycling that slows down
  const handleIndex = (() => {
    if (frame >= 50) return HANDLE_ROULETTE.length - 1; // final: banditxbt
    // Ease-out cycling: starts fast, slows down
    const progress = interpolate(frame, [0, 48], [0, 1], { extrapolateRight: "clamp" });
    const easedProgress = easeOutExpo(progress);
    return Math.floor(easedProgress * (HANDLE_ROULETTE.length - 1));
  })();

  const currentHandle = HANDLE_ROULETTE[handleIndex];
  const isLanded = frame >= 50;

  // Scan progress bar
  const scanProgress = interpolate(frame, [52, 80], [0, 100], { extrapolateRight: "clamp" });
  const barFilled = Math.round((scanProgress / 100) * 24);

  // Voice traits appearing
  const traitCount = Math.floor(
    interpolate(frame, [60, 85], [0, VOICE_TRAITS.length], { extrapolateRight: "clamp" })
  );

  // "VOICE LOCKED" flash
  const lockedOpacity = interpolate(frame, [82, 88], [0, 1], { extrapolateRight: "clamp" });

  // Container fade in
  const containerOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: containerOpacity,
      }}
    >
      <div
        style={{
          width: 700,
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 12,
          padding: "40px 48px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "rgba(255, 255, 255, 0.3)",
              letterSpacing: "0.12em",
            }}
          >
            VOICE SCANNER
          </span>
        </div>

        {/* Handle input area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            padding: "16px 20px",
            background: "rgba(255, 255, 255, 0.04)",
            border: `1px solid ${isLanded ? colors.primary + "60" : "rgba(255, 255, 255, 0.06)"}`,
            borderRadius: 8,
            transition: "border-color 0.3s",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              color: "rgba(255, 255, 255, 0.3)",
            }}
          >
            @
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              color: isLanded ? colors.white : "rgba(255, 255, 255, 0.7)",
              fontWeight: isLanded ? 600 : 400,
            }}
          >
            {currentHandle}
          </span>
          {!isLanded && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 18,
                color: colors.primary,
                opacity: Math.floor(frame / 4) % 2 === 0 ? 1 : 0,
              }}
            >
              ▌
            </span>
          )}
        </div>

        {/* Scan progress */}
        {isLanded && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "rgba(255, 255, 255, 0.4)",
                  letterSpacing: "0.1em",
                }}
              >
                SCANNING VOICE
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: colors.primary,
                }}
              >
                {Math.round(scanProgress)}%
              </span>
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                color: "rgba(255, 255, 255, 0.2)",
                letterSpacing: "0.02em",
              }}
            >
              {"█".repeat(barFilled)}
              {"░".repeat(24 - barFilled)}
            </div>
          </div>
        )}

        {/* Voice traits */}
        {traitCount > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {VOICE_TRAITS.slice(0, traitCount).map((trait, i) => (
              <div
                key={trait}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: colors.green,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  {trait}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* VOICE LOCKED */}
        {lockedOpacity > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: `${colors.primary}15`,
              border: `1px solid ${colors.primary}40`,
              borderRadius: 6,
              opacity: lockedOpacity,
              display: "inline-block",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: colors.primary,
                letterSpacing: "0.12em",
                fontWeight: 600,
              }}
            >
              VOICE LOCKED
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// SCENE 4: Topic Select + Generation
// ============================================================
const GenerateScene: React.FC = () => {
  const frame = useCurrentFrame();

  const topics = ["build updates", "market takes", "lessons learned", "hot takes"];
  const selectedIndex = 3; // "hot takes"

  // Topic pills appearing
  const pillCount = Math.floor(
    interpolate(frame, [0, 16], [0, topics.length], { extrapolateRight: "clamp" })
  );

  // Selection highlight
  const selectedAt = 20;
  const isSelected = frame >= selectedAt;

  // Generate button press
  const buttonPressed = frame >= 28;
  const buttonScale = buttonPressed
    ? interpolate(frame, [28, 32, 36], [1, 0.95, 1], { extrapolateRight: "clamp" })
    : 1;

  // Post typing starts
  const postLines = EXAMPLE_POST.split("\n");
  const typingStart = 38;
  const charsPerFrame = 3;
  const totalTyped = Math.max(0, (frame - typingStart) * charsPerFrame);

  // Calculate which characters to show
  let charsRemaining = totalTyped;
  const visibleLines: string[] = [];
  for (const line of postLines) {
    if (charsRemaining <= 0) break;
    if (charsRemaining >= line.length) {
      visibleLines.push(line);
      charsRemaining -= line.length + 1; // +1 for newline
    } else {
      visibleLines.push(line.slice(0, charsRemaining));
      charsRemaining = 0;
    }
  }

  const containerOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: containerOpacity,
      }}
    >
      <div style={{ width: 700 }}>
        {/* Topic pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {topics.slice(0, pillCount).map((topic, i) => {
            const active = isSelected && i === selectedIndex;
            return (
              <div
                key={topic}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  letterSpacing: "0.02em",
                  background: active ? colors.primary : "transparent",
                  color: active ? colors.white : "rgba(255, 255, 255, 0.4)",
                  border: `1px solid ${active ? colors.primary : "rgba(255, 255, 255, 0.1)"}`,
                }}
              >
                {topic}
              </div>
            );
          })}
        </div>

        {/* Generate button */}
        <div
          style={{
            padding: "14px 0",
            background: buttonPressed ? colors.primary : "rgba(255, 255, 255, 0.06)",
            borderRadius: 6,
            textAlign: "center",
            marginBottom: 20,
            transform: `scale(${buttonScale})`,
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: buttonPressed ? colors.white : "rgba(255, 255, 255, 0.4)",
              letterSpacing: "0.1em",
            }}
          >
            {frame >= typingStart ? "generating..." : "→ generate post"}
          </span>
        </div>

        {/* Typing output */}
        {visibleLines.length > 0 && (
          <div
            style={{
              padding: "24px 28px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 10,
            }}
          >
            {visibleLines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: "rgba(255, 255, 255, 0.8)",
                  lineHeight: 1.7,
                  minHeight: line === "" ? 14 : undefined,
                }}
              >
                {line}
                {i === visibleLines.length - 1 && frame < 85 && (
                  <span
                    style={{
                      color: colors.primary,
                      opacity: Math.floor(frame / 4) % 2 === 0 ? 1 : 0,
                    }}
                  >
                    ▌
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// SCENE 5: Output Card — polished result
// ============================================================
const OutputScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 150, mass: 0.5 },
  });

  const cardOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  // Metadata badges slide in
  const badgeOpacity = interpolate(frame, [10, 18], [0, 1], { extrapolateRight: "clamp" });
  const badgeX = interpolate(frame, [10, 18], [-15, 0], {
    extrapolateRight: "clamp",
    easing: easeOutQuart,
  });

  // "sounds just like you?" text
  const nudgeOpacity = interpolate(frame, [35, 45], [0, 1], { extrapolateRight: "clamp" });

  // Copy button flash
  const copyFlash = frame >= 50;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 680,
          opacity: cardOpacity,
          transform: `scale(${cardScale})`,
        }}
      >
        {/* Card */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Metadata header */}
          <div
            style={{
              padding: "12px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              gap: 20,
              opacity: badgeOpacity,
              transform: `translateX(${badgeX}px)`,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "rgba(255, 255, 255, 0.3)",
                  letterSpacing: "0.08em",
                }}
              >
                Format:
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: colors.primary,
                  fontWeight: 600,
                }}
              >
                Hot Take
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "rgba(255, 255, 255, 0.3)",
                  letterSpacing: "0.08em",
                }}
              >
                CTA:
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                Agree/Disagree
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "rgba(255, 255, 255, 0.3)",
                  letterSpacing: "0.08em",
                }}
              >
                Voice:
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: colors.green,
                }}
              >
                98% match
              </span>
            </div>
          </div>

          {/* Post content */}
          <div style={{ padding: "24px 28px" }}>
            {EXAMPLE_POST.split("\n").map((line, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: "rgba(255, 255, 255, 0.8)",
                  lineHeight: 1.75,
                  minHeight: line === "" ? 12 : undefined,
                }}
              >
                {line}
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div
            style={{
              padding: "12px 24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: "8px 20px",
                borderRadius: 6,
                background: copyFlash ? colors.green : "transparent",
                border: `1px solid ${copyFlash ? colors.green : colors.primary}`,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: copyFlash ? colors.white : colors.primary,
                letterSpacing: "0.06em",
              }}
            >
              {copyFlash ? "[OK] copied" : "copy post"}
            </div>
            <div
              style={{
                padding: "8px 20px",
                borderRadius: 6,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "rgba(255, 255, 255, 0.4)",
                letterSpacing: "0.06em",
              }}
            >
              regenerate
            </div>
          </div>
        </div>

        {/* "sounds just like you?" nudge */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            opacity: nudgeOpacity,
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            sounds just like you?
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// SCENE 6: CTA + Logo
// ============================================================
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo scale in
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.6 },
  });
  const logoOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Tagline
  const tagOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const tagY = interpolate(frame, [20, 35], [15, 0], {
    extrapolateRight: "clamp",
    easing: easeOutQuart,
  });

  // URL
  const urlOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" });

  // Glow on logo
  const glowIntensity = interpolate(frame, [0, 15, 50], [0, 40, 25], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: "flex",
          alignItems: "baseline",
          filter: `drop-shadow(0 0 ${glowIntensity}px ${colors.primary})`,
        }}
      >
        <span
          style={{
            fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
            fontSize: 80,
            fontWeight: 700,
            fontStyle: "italic",
            color: colors.white,
            letterSpacing: "-0.02em",
          }}
        >
          Brand
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'VCR OSD Mono', monospace",
            fontSize: 80,
            fontWeight: 400,
            color: colors.primary,
            letterSpacing: "0.02em",
          }}
        >
          OS
        </span>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 24,
          fontWeight: 500,
          color: colors.gold,
          margin: 0,
          marginTop: 28,
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
          letterSpacing: "0.04em",
        }}
      >
        post like you. every single day.
      </p>

      {/* URL */}
      <div
        style={{
          position: "absolute",
          bottom: "14%",
          opacity: urlOpacity,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.5)",
            letterSpacing: "0.1em",
          }}
        >
          mybrandos.app
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// MAIN COMPOSITION
// ============================================================
export const ContentEngine: React.FC = () => {
  const frame = useCurrentFrame();

  // Dynamic glow color based on current scene
  const getSceneColor = () => {
    if (frame < ceTiming.reveal.start) return colors.primary;
    if (frame < ceTiming.scan.start) return colors.primary;
    if (frame < ceTiming.generate.start) return colors.cyan;
    if (frame < ceTiming.output.start) return colors.green;
    return colors.primary;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: colors.dark }}>
      {/* === AMBIENT BACKGROUND === */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${colors.deepBlue} 0%, ${colors.dark} 70%)`,
          opacity: 0.4,
        }}
      />

      {/* Animated glow orbs */}
      <GlowOrb
        color={getSceneColor()}
        size={500}
        x="35%"
        y="45%"
        opacity={0.25}
        blur={120}
      />
      <GlowOrb
        color={colors.kleinBlue}
        size={400}
        x="65%"
        y="55%"
        opacity={0.2}
        pulseSpeed={0.02}
        blur={100}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: colors.gradients.vignette,
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />

      {/* === SCENES === */}

      <Sequence from={ceTiming.hook.start} durationInFrames={ceTiming.hook.duration}>
        <HookScene />
      </Sequence>

      <Sequence from={ceTiming.reveal.start} durationInFrames={ceTiming.reveal.duration}>
        <RevealScene />
      </Sequence>

      <Sequence from={ceTiming.scan.start} durationInFrames={ceTiming.scan.duration}>
        <ScanScene />
      </Sequence>

      <Sequence from={ceTiming.generate.start} durationInFrames={ceTiming.generate.duration}>
        <GenerateScene />
      </Sequence>

      <Sequence from={ceTiming.output.start} durationInFrames={ceTiming.output.duration}>
        <OutputScene />
      </Sequence>

      <Sequence from={ceTiming.cta.start} durationInFrames={ceTiming.cta.duration}>
        <CTAScene />
      </Sequence>

      {/* === NOISE OVERLAY === */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: "none",
        }}
      />

      {/* === SCANLINES === */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

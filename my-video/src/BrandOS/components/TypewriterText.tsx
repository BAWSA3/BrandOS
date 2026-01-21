import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../styles";

interface TypewriterTextProps {
  text: string;
  startFrame?: number;
  charsPerFrame?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  showCursor?: boolean;
  fontWeight?: number;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  charsPerFrame = 0.5,
  fontSize = 48,
  color = COLORS.text,
  fontFamily = FONTS.heading,
  showCursor = true,
  fontWeight = 600,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = frame - startFrame;

  // Calculate visible characters
  const visibleChars = Math.min(
    Math.floor(Math.max(0, adjustedFrame) * charsPerFrame),
    text.length
  );

  const displayText = text.slice(0, visibleChars);
  const isComplete = visibleChars >= text.length;

  // Cursor blink (visible for 15 frames, hidden for 15 frames)
  const cursorVisible = !isComplete || (adjustedFrame % 30) < 15;

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        letterSpacing: "-0.02em",
        display: "flex",
        alignItems: "center",
      }}
    >
      {displayText}
      {showCursor && cursorVisible && (
        <span
          style={{
            display: "inline-block",
            width: 3,
            height: fontSize * 0.8,
            backgroundColor: COLORS.primary,
            marginLeft: 4,
          }}
        />
      )}
    </div>
  );
};

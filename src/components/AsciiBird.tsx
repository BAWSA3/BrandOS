'use client';

import { useMemo } from 'react';

const FRAME_W = 256;
const FRAME_H = 226;
const DENSE_CHARS = 'M8@#%WBRANDOS';
const FLIGHT_DURATION = '18s';
const FLAP_DURATION = '0.5s';

export type BirdMode = 'fly' | 'perch' | 'guide' | 'idle';

const SEASON_BIRD_COLORS: Record<string, string> = {
  spring: '#E8A838',
  summer: '#1D1D1F',
  autumn: '#D4781E',
  winter: '#88BBDD',
};

function generateAsciiBlock(length: number): string {
  let text = '';
  while (text.length < length) {
    text += DENSE_CHARS;
  }
  return text.slice(0, length);
}

export default function AsciiBird({
  color,
  scale = 1,
  flightDuration = FLIGHT_DURATION,
  startDelay = '0s',
  top = '30%',
  mode = 'fly',
  season = 'summer',
  perchX,
}: {
  color?: string;
  scale?: number;
  flightDuration?: string;
  startDelay?: string;
  top?: string;
  mode?: BirdMode;
  season?: string;
  perchX?: number;
}) {
  const birdColor = color || SEASON_BIRD_COLORS[season] || '#1D1D1F';
  const w = Math.round(FRAME_W * scale);
  const h = Math.round(FRAME_H * scale);
  const spriteW = Math.round(1024 * scale);

  const cols = Math.ceil(w / 4);
  const rows = Math.ceil(h / 5);
  const totalChars = cols * rows;

  const ascii = useMemo(() => generateAsciiBlock(totalChars), [totalChars]);

  const glowColor = SEASON_BIRD_COLORS[season] || '#ffffff';

  if (mode === 'perch') {
    return (
      <>
        <style>{`
          @keyframes ascii-bird-flap-perch-${w} {
            0%, 80% { -webkit-mask-position: 0 0; mask-position: 0 0; }
            90% { -webkit-mask-position: -${Math.round(256 * scale)}px 0; mask-position: -${Math.round(256 * scale)}px 0; }
            100% { -webkit-mask-position: 0 0; mask-position: 0 0; }
          }
          @keyframes ascii-bird-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
        `}</style>
        <div
          style={{
            position: 'absolute',
            top,
            left: perchX !== undefined ? `${perchX}%` : '50%',
            zIndex: 15,
            pointerEvents: 'none',
            filter: `drop-shadow(0 0 3px ${glowColor}40)`,
            animation: 'ascii-bird-bob 3s ease-in-out infinite',
          }}
        >
          <div
            style={{
              width: `${w}px`,
              height: `${h}px`,
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '5px',
              lineHeight: '5px',
              letterSpacing: '-0.5px',
              color: birdColor,
              wordBreak: 'break-all',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              WebkitMaskImage: `url('/bird-sprite-row.png')`,
              maskImage: `url('/bird-sprite-row.png')`,
              WebkitMaskSize: `${spriteW}px ${h}px`,
              maskSize: `${spriteW}px ${h}px`,
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat' as string,
              animation: `ascii-bird-flap-perch-${w} 4s steps(4) infinite`,
            }}
          >
            {ascii}
          </div>
        </div>
      </>
    );
  }

  if (mode === 'guide') {
    return (
      <>
        <style>{`
          @keyframes ascii-bird-flap-guide-${w} {
            from { -webkit-mask-position: 0 0; mask-position: 0 0; }
            to { -webkit-mask-position: -${spriteW}px 0; mask-position: -${spriteW}px 0; }
          }
          @keyframes ascii-bird-guide-path {
            0% { transform: translateX(-20px) translateY(0); }
            25% { transform: translateX(10vw) translateY(-8px); }
            50% { transform: translateX(20vw) translateY(0); }
            75% { transform: translateX(30vw) translateY(-5px); }
            100% { transform: translateX(40vw) translateY(0); }
          }
        `}</style>
        <div
          style={{
            position: 'fixed',
            top,
            left: 0,
            zIndex: 15,
            pointerEvents: 'none',
            filter: `drop-shadow(0 0 6px ${glowColor}60)`,
            animation: `ascii-bird-guide-path 6s ease-in-out ${startDelay} forwards`,
          }}
        >
          <div
            style={{
              width: `${w}px`,
              height: `${h}px`,
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '5px',
              lineHeight: '5px',
              letterSpacing: '-0.5px',
              color: birdColor,
              wordBreak: 'break-all',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              WebkitMaskImage: `url('/bird-sprite-row.png')`,
              maskImage: `url('/bird-sprite-row.png')`,
              WebkitMaskSize: `${spriteW}px ${h}px`,
              maskSize: `${spriteW}px ${h}px`,
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat' as string,
              animation: `ascii-bird-flap-guide-${w} ${FLAP_DURATION} steps(4) infinite`,
            }}
          >
            {ascii}
          </div>
        </div>
      </>
    );
  }

  // Default: fly mode (original behavior)
  return (
    <>
      <style>{`
        @keyframes ascii-bird-flap-${w} {
          from { -webkit-mask-position: 0 0; mask-position: 0 0; }
          to { -webkit-mask-position: -${spriteW}px 0; mask-position: -${spriteW}px 0; }
        }
        @keyframes ascii-bird-fly-${w} {
          from { transform: translateX(-${w + 40}px); }
          to { transform: translateX(calc(100vw + ${w + 40}px)); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top,
          left: 0,
          zIndex: 5,
          pointerEvents: 'none',
          filter: `drop-shadow(0 0 4px ${glowColor}80)`,
          animation: `ascii-bird-fly-${w} ${flightDuration} linear ${startDelay} infinite`,
        }}
      >
        <div
          style={{
            width: `${w}px`,
            height: `${h}px`,
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '5px',
            lineHeight: '5px',
            letterSpacing: '-0.5px',
            color: birdColor,
            wordBreak: 'break-all',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            WebkitMaskImage: `url('/bird-sprite-row.png')`,
            maskImage: `url('/bird-sprite-row.png')`,
            WebkitMaskSize: `${spriteW}px ${h}px`,
            maskSize: `${spriteW}px ${h}px`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat' as string,
            animation: `ascii-bird-flap-${w} ${FLAP_DURATION} steps(4) infinite`,
          }}
        >
          {ascii}
        </div>
      </div>
    </>
  );
}

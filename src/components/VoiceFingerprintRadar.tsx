'use client';

import { motion } from 'framer-motion';

interface RadarData {
  vocabulary: number;
  sentenceRhythm: number;
  formatting: number;
  rhetoric: number;
  signatureElements: number;
  opinionStrength: number;
  storytelling: number;
}

interface VoiceFingerprintRadarProps {
  data: RadarData;
  size?: number;
  animated?: boolean;
}

const LABELS = [
  { key: 'vocabulary', label: 'Vocab' },
  { key: 'sentenceRhythm', label: 'Rhythm' },
  { key: 'formatting', label: 'Format' },
  { key: 'rhetoric', label: 'Rhetoric' },
  { key: 'signatureElements', label: 'Signature' },
  { key: 'opinionStrength', label: 'Opinion' },
  { key: 'storytelling', label: 'Story' },
] as const;

const LEVELS = [25, 50, 75, 100];

export default function VoiceFingerprintRadar({
  data,
  size = 280,
  animated = true,
}: VoiceFingerprintRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) - 40;
  const angleStep = (2 * Math.PI) / LABELS.length;
  const startAngle = -Math.PI / 2; // Start from top

  function getPoint(index: number, value: number): { x: number; y: number } {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  // Build polygon path for a given level
  function buildLevelPath(level: number): string {
    return LABELS.map((_, i) => {
      const { x, y } = getPoint(i, level);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ') + 'Z';
  }

  // Build data polygon path
  const dataPath = LABELS.map((label, i) => {
    const value = data[label.key as keyof RadarData] || 0;
    const { x, y } = getPoint(i, value);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ') + 'Z';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      {/* Grid levels */}
      {LEVELS.map((level) => (
        <path
          key={level}
          d={buildLevelPath(level)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.5}
        />
      ))}

      {/* Axis lines */}
      {LABELS.map((_, i) => {
        const { x, y } = getPoint(i, 100);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.3}
          />
        );
      })}

      {/* Data polygon */}
      {animated ? (
        <motion.path
          d={dataPath}
          fill="rgba(10, 132, 255, 0.12)"
          stroke="#0A84FF"
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ) : (
        <path
          d={dataPath}
          fill="rgba(10, 132, 255, 0.12)"
          stroke="#0A84FF"
          strokeWidth={2}
        />
      )}

      {/* Data points */}
      {LABELS.map((label, i) => {
        const value = data[label.key as keyof RadarData] || 0;
        const { x, y } = getPoint(i, value);
        return animated ? (
          <motion.circle
            key={label.key}
            cx={x}
            cy={y}
            r={4}
            fill="#0A84FF"
            stroke="var(--surface)"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i, duration: 0.3 }}
          />
        ) : (
          <circle
            key={label.key}
            cx={x}
            cy={y}
            r={4}
            fill="#0A84FF"
            stroke="var(--surface)"
            strokeWidth={2}
          />
        );
      })}

      {/* Labels */}
      {LABELS.map((label, i) => {
        const { x, y } = getPoint(i, 118);
        const value = data[label.key as keyof RadarData] || 0;
        return (
          <g key={label.key}>
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: 11,
                fontWeight: 500,
                fill: 'var(--text-secondary)',
                fontFamily: 'inherit',
              }}
            >
              {label.label}
            </text>
            <text
              x={x}
              y={y + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: 10,
                fill: 'var(--text-tertiary)',
                fontFamily: 'inherit',
              }}
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

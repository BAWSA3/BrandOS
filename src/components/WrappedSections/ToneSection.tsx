'use client';

import { motion } from 'motion/react';

interface ToneSectionProps {
  tone: {
    formality: number;
    energy: number;
    confidence: number;
    style: number;
  };
  primaryColor?: string;
}

const TONE_LABELS: Record<string, { label: string; lowLabel: string; highLabel: string }> = {
  formality: { label: 'Formality', lowLabel: 'Casual', highLabel: 'Formal' },
  energy: { label: 'Energy', lowLabel: 'Calm', highLabel: 'Energetic' },
  confidence: { label: 'Confidence', lowLabel: 'Humble', highLabel: 'Bold' },
  style: { label: 'Style', lowLabel: 'Classic', highLabel: 'Experimental' },
};

const TONE_COLORS = ['#0047FF', '#10B981', '#F59E0B', '#9d4edd'];

export default function ToneSection({ tone, primaryColor = '#0047FF' }: ToneSectionProps) {
  const toneEntries = [
    { key: 'formality', value: tone.formality },
    { key: 'energy', value: tone.energy },
    { key: 'confidence', value: tone.confidence },
    { key: 'style', value: tone.style },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(40px, 8vw, 60px) clamp(16px, 4vw, 24px)',
        maxWidth: '600px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Section Label */}
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          fontSize: '12px',
          fontFamily: "'VCR OSD Mono', monospace",
          letterSpacing: '0.15em',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        Tone of Voice
      </motion.span>

      {/* Section Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          fontSize: '28px',
          fontWeight: 300,
          color: '#FFFFFF',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          marginBottom: '60px',
          textAlign: 'center',
        }}
      >
        How you communicate
      </motion.h2>

      {/* Tone Bars */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
        }}
      >
        {toneEntries.map(({ key, value }, index) => {
          const { label, lowLabel, highLabel } = TONE_LABELS[key];
          const color = TONE_COLORS[index];

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              style={{ width: '100%' }}
            >
              {/* Label Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 500,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                    color: '#FFFFFF',
                    fontWeight: 600,
                  }}
                >
                  {value}%
                </span>
              </div>

              {/* Bar Container */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Animated Fill */}
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                    borderRadius: '4px',
                    boxShadow: `0 0 20px ${color}40`,
                  }}
                />
              </div>

              {/* Spectrum Labels */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "'VCR OSD Mono', monospace",
                    color: 'rgba(255, 255, 255, 0.3)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {lowLabel}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "'VCR OSD Mono', monospace",
                    color: 'rgba(255, 255, 255, 0.3)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {highLabel}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

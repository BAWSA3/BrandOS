'use client';

import { motion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';

interface ScoreSectionProps {
  score: number;
  primaryColor?: string;
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'EXCEPTIONAL';
  if (score >= 80) return 'EXCELLENT';
  if (score >= 70) return 'STRONG';
  if (score >= 60) return 'GOOD';
  if (score >= 50) return 'DECENT';
  if (score >= 40) return 'NEEDS WORK';
  return 'CRITICAL';
}

function getScorePercentile(score: number): string {
  if (score >= 90) return "You're in the top 5% of creators";
  if (score >= 80) return "You're in the top 15% of creators";
  if (score >= 70) return "You're in the top 25% of creators";
  if (score >= 60) return "You're ahead of most creators";
  if (score >= 50) return 'You have solid foundations';
  return 'Room to grow your brand';
}

export default function ScoreSection({ score, primaryColor = '#0047FF' }: ScoreSectionProps) {
  const label = getScoreLabel(score);
  const percentile = getScorePercentile(score);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(40px, 8vw, 60px) clamp(16px, 4vw, 24px)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Glow Effect */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: `radial-gradient(circle, ${primaryColor}30 0%, transparent 70%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

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
          marginBottom: '40px',
        }}
      >
        Brand Score
      </motion.span>

      {/* Big Score Number */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2, type: 'spring', damping: 15 }}
        style={{
          fontSize: 'clamp(120px, 25vw, 180px)',
          fontWeight: 700,
          color: '#FFFFFF',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          letterSpacing: '-0.04em',
          lineHeight: 1,
          textShadow: `0 0 80px ${primaryColor}50`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimateNumber>{score}</AnimateNumber>
      </motion.div>

      {/* Score Label Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{
          marginTop: '24px',
          padding: '12px 28px',
          background: `${primaryColor}20`,
          border: `1px solid ${primaryColor}40`,
          borderRadius: '30px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontFamily: "'VCR OSD Mono', monospace",
            letterSpacing: '0.1em',
            color: primaryColor,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </motion.div>

      {/* Percentile Message */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.7 }}
        style={{
          marginTop: '32px',
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontWeight: 400,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {percentile}
      </motion.p>
    </motion.section>
  );
}

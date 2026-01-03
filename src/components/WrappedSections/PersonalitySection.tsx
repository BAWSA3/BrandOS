'use client';

import { motion } from 'motion/react';

interface PersonalitySectionProps {
  archetype: string;
  archetypeEmoji: string;
  personalitySummary: string;
}

export default function PersonalitySection({
  archetype,
  archetypeEmoji,
  personalitySummary,
}: PersonalitySectionProps) {
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
        maxWidth: '600px',
        margin: '0 auto',
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
          marginBottom: '48px',
        }}
      >
        Your Personality
      </motion.span>

      {/* Emoji */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2, type: 'spring', damping: 12 }}
        style={{
          fontSize: '72px',
          marginBottom: '24px',
        }}
      >
        {archetypeEmoji}
      </motion.div>

      {/* Archetype Name */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          fontSize: 'clamp(32px, 8vw, 48px)',
          fontWeight: 700,
          color: '#FFFFFF',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        {archetype}
      </motion.h2>

      {/* Decorative Line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5 }}
        style={{
          width: '60px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          marginBottom: '40px',
        }}
      />

      {/* Personality Summary (3 sentences) */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.6 }}
        style={{
          fontSize: '20px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontWeight: 400,
          fontStyle: 'italic',
          textAlign: 'center',
          lineHeight: 1.7,
          maxWidth: '500px',
        }}
      >
        "{personalitySummary}"
      </motion.p>
    </motion.section>
  );
}

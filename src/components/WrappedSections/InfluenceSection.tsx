'use client';

import { motion } from 'motion/react';

interface InfluenceSectionProps {
  influenceTier: 'Nano' | 'Micro' | 'Mid' | 'Macro' | 'Mega';
  followersCount: number;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

const TIER_ORDER = ['Nano', 'Micro', 'Mid', 'Macro', 'Mega'];

export default function InfluenceSection({
  influenceTier,
  followersCount,
  brandColors,
}: InfluenceSectionProps) {
  const tierIndex = TIER_ORDER.indexOf(influenceTier);
  const colors = [brandColors.primary, brandColors.secondary, brandColors.accent].filter(Boolean);

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
          marginBottom: '48px',
        }}
      >
        Influence & Identity
      </motion.span>

      {/* Influence Tier */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}
        >
          {influenceTier}
        </span>
        <span
          style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}
        >
          Tier
        </span>
      </motion.div>

      {/* Tier Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          alignItems: 'flex-end',
          height: '52px',
        }}
      >
        {TIER_ORDER.map((tier, index) => (
          <motion.div
            key={tier}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
            style={{
              width: '24px',
              height: `${12 + index * 8}px`,
              background: index <= tierIndex ? brandColors.primary : 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </motion.div>

      {/* Follower Count */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          marginBottom: '80px',
        }}
      >
        {formatFollowers(followersCount)} followers
      </motion.p>

      {/* Brand Colors Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.6 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontFamily: "'VCR OSD Mono', monospace",
            letterSpacing: '0.1em',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
          }}
        >
          Your Brand Colors
        </span>

        {/* Color Swatches */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {colors.map((color, index) => (
            <motion.div
              key={color + index}
              initial={{ scale: 0, rotate: -10 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.7 + index * 0.1,
                type: 'spring',
                damping: 12,
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: color,
                  boxShadow: `0 8px 32px ${color}40`,
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: "'VCR OSD Mono', monospace",
                  color: 'rgba(255, 255, 255, 0.5)',
                  letterSpacing: '0.05em',
                }}
              >
                {color.toUpperCase()}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}

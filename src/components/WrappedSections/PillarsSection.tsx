'use client';

import { motion } from 'motion/react';

interface ContentPillar {
  name: string;
  frequency: number;
  avgEngagement: number;
}

interface PillarsSectionProps {
  contentPillars?: ContentPillar[];
}

const PILLAR_COLORS = ['#0047FF', '#10B981', '#F59E0B', '#9d4edd', '#EF4444'];

const DEFAULT_PILLARS: ContentPillar[] = [
  { name: 'Insights', frequency: 40, avgEngagement: 0 },
  { name: 'Stories', frequency: 30, avgEngagement: 0 },
  { name: 'Tips', frequency: 20, avgEngagement: 0 },
  { name: 'News', frequency: 10, avgEngagement: 0 },
];

export default function PillarsSection({ contentPillars }: PillarsSectionProps) {
  const pillars = contentPillars && contentPillars.length > 0 ? contentPillars : DEFAULT_PILLARS;

  // Sort by frequency and take top 4
  const topPillars = [...pillars].sort((a, b) => b.frequency - a.frequency).slice(0, 4);
  const totalFrequency = topPillars.reduce((sum, p) => sum + p.frequency, 0);

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
        maxWidth: '700px',
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
        Content Pillars
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
        What you post about
      </motion.h2>

      {/* Pillar Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          width: '100%',
          maxWidth: '600px',
        }}
      >
        {topPillars.map((pillar, index) => {
          const percentage = totalFrequency > 0 
            ? Math.round((pillar.frequency / totalFrequency) * 100) 
            : 25;
          const color = PILLAR_COLORS[index % PILLAR_COLORS.length];

          return (
            <motion.div
              key={pillar.name}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.3 + index * 0.1,
                type: 'spring',
                damping: 15,
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {/* Color accent line at top */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: '3px',
                  background: color,
                  borderRadius: '0 0 2px 2px',
                }}
              />

              {/* Pillar Name */}
              <span
                style={{
                  fontSize: pillar.name.length > 20 ? '13px' : '15px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  textAlign: 'center',
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  maxWidth: '100%',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {pillar.name}
              </span>

              {/* Percentage */}
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1, type: 'spring' }}
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: color,
                  fontFamily: "'Helvetica Neue', Arial, sans-serif",
                }}
              >
                {percentage}%
              </motion.span>

              {/* Mini bar */}
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  style={{
                    height: '100%',
                    background: color,
                    borderRadius: '2px',
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

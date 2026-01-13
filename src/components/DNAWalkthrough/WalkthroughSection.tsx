'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from './motion';

interface WalkthroughSectionProps {
  label: string;
  children: ReactNode;
  howWeCalculated: string;
  whyItMatters: string;
  whatYouCanDo: string[];
  theme: string;
  accentColor?: string;
}

export default function WalkthroughSection({
  label,
  children,
  howWeCalculated,
  whyItMatters,
  whatYouCanDo,
  theme,
  accentColor = '#D4A574',
}: WalkthroughSectionProps) {
  const isDark = theme === 'dark';

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center px-4 md:px-6 py-12 md:py-16"
      style={{ boxSizing: 'border-box' }}
    >
      <div className="w-full max-w-5xl">
        {/* Section Label */}
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="block text-center mb-6"
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: accentColor,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </motion.span>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Main Visualization Card - spans full width on mobile, left side on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-2 rounded-[4px] p-5 md:p-6"
            style={{
              background: isDark ? '#1A1A1A' : '#F8F8F8',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            {children}
          </motion.div>

          {/* How We Calculated Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-[4px] p-4 md:p-5"
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <h3
              className="text-[10px] mb-3"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                letterSpacing: '0.1em',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              HOW WE CALCULATED THIS
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              }}
            >
              {howWeCalculated}
            </p>
          </motion.div>

          {/* Why It Matters Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-[4px] p-4 md:p-5"
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <h3
              className="text-[10px] mb-3"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                letterSpacing: '0.1em',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}
            >
              WHY THIS MATTERS
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              }}
            >
              {whyItMatters}
            </p>
          </motion.div>

          {/* What You Can Do Card - spans full width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="md:col-span-2 rounded-[4px] p-4 md:p-5"
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              borderLeft: `3px solid ${accentColor}`,
            }}
          >
            <h3
              className="text-[10px] mb-3"
              style={{
                fontFamily: "'VCR OSD Mono', monospace",
                letterSpacing: '0.1em',
                color: accentColor,
              }}
            >
              WHAT YOU CAN DO
            </h3>
            <StaggerContainer className="space-y-2" staggerDelay={0.1} initialDelay={0.5}>
              {whatYouCanDo.map((item, index) => (
                <StaggerItem
                  key={index}
                  direction="left"
                  className="flex items-start gap-3 text-sm"
                  style={{
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                    color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                  }}
                >
                  <span style={{ color: accentColor, fontWeight: 600 }}>→</span>
                  <span>{item}</span>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

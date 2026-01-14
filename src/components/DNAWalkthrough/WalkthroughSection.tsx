'use client';

import { ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';
import { ParallaxLayer } from './motion';
import type { ParallaxLayerConfig } from './motion';

interface WalkthroughSectionProps {
  label: string;
  children: ReactNode;
  howWeCalculated: string;
  whyItMatters: string;
  whatYouCanDo: string[];
  theme: string;
  accentColor?: string;
  parallaxLayers?: ParallaxLayerConfig[];
}

// Simple viewport-based reveal animation
const revealVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function WalkthroughSection({
  label,
  children,
  howWeCalculated,
  whyItMatters,
  whatYouCanDo,
  theme,
  accentColor = '#D4A574',
  parallaxLayers = [],
}: WalkthroughSectionProps) {
  const isDark = theme === 'dark';
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="flex flex-col items-center px-4 md:px-6 py-12 md:py-16 relative overflow-hidden"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Parallax floating elements */}
      {parallaxLayers.map((layer) => (
        <ParallaxLayer
          key={layer.id}
          {...layer}
          containerRef={sectionRef}
        />
      ))}

      <div className="w-full max-w-5xl relative z-10">
        {/* Section Label */}
        <motion.div
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
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
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Main Visualization Card - spans full width on mobile, left side on desktop */}
          <motion.div
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: 0.1 }}
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
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.2 }}
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
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.3 }}
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
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.4 }}
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
            <div className="space-y-2">
              {whatYouCanDo.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-sm"
                  style={{
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                    color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                  }}
                >
                  <span style={{ color: accentColor, fontWeight: 600 }}>→</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

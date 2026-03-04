'use client';

import { ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';
import { ParallaxLayer } from './motion';
import type { ParallaxLayerConfig } from './motion';

export interface NarrativeBlock {
  type: 'context' | 'callout' | 'action';
  label?: string;
  content: string;
  items?: string[];
}

interface WalkthroughSectionProps {
  label: string;
  children: ReactNode;
  theme: string;
  accentColor?: string;
  parallaxLayers?: ParallaxLayerConfig[];
  // Legacy props (still used by old sections if needed)
  howWeCalculated?: string;
  whyItMatters?: string;
  whatYouCanDo?: string[];
  // New narrative-driven blocks
  narrativeBlocks?: NarrativeBlock[];
}

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
  narrativeBlocks,
}: WalkthroughSectionProps) {
  const isDark = theme === 'dark';
  const sectionRef = useRef<HTMLElement>(null);

  const useNarrative = !!narrativeBlocks?.length;

  return (
    <section
      ref={sectionRef}
      className="flex flex-col items-center px-4 md:px-6 py-12 md:py-16 relative overflow-hidden"
      style={{ boxSizing: 'border-box' }}
    >
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Narrative context block (above main visualization) */}
          {useNarrative && narrativeBlocks.filter(b => b.type === 'context').map((block, i) => (
            <motion.div
              key={`ctx-${i}`}
              variants={revealVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="md:col-span-2 rounded-[4px] p-4 md:p-5"
              style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <p
                className="text-sm md:text-base leading-relaxed"
                style={{
                  fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                  margin: 0,
                }}
              >
                {block.content}
              </p>
            </motion.div>
          ))}

          {/* Main Visualization */}
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

          {/* Narrative blocks below visualization */}
          {useNarrative ? (
            <>
              {narrativeBlocks.filter(b => b.type === 'callout').map((block, i) => (
                <motion.div
                  key={`callout-${i}`}
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="md:col-span-2 rounded-[4px] p-4 md:p-5"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    borderLeft: `3px solid ${accentColor}`,
                  }}
                >
                  {block.label && (
                    <h3
                      className="text-[10px] mb-3"
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        letterSpacing: '0.1em',
                        color: accentColor,
                      }}
                    >
                      {block.label}
                    </h3>
                  )}
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      fontFamily: "'Helvetica Neue', Arial, sans-serif",
                      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      margin: 0,
                    }}
                  >
                    {block.content}
                  </p>
                </motion.div>
              ))}

              {narrativeBlocks.filter(b => b.type === 'action').map((block, i) => (
                <motion.div
                  key={`action-${i}`}
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="md:col-span-2 rounded-[4px] p-4 md:p-5"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    borderLeft: `3px solid ${accentColor}`,
                  }}
                >
                  {block.label && (
                    <h3
                      className="text-[10px] mb-3"
                      style={{
                        fontFamily: "'VCR OSD Mono', monospace",
                        letterSpacing: '0.1em',
                        color: accentColor,
                      }}
                    >
                      {block.label}
                    </h3>
                  )}
                  {block.items?.length ? (
                    <div className="space-y-2">
                      {block.items.map((item, idx) => (
                        <div
                          key={idx}
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
                  ) : (
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        fontFamily: "'Helvetica Neue', Arial, sans-serif",
                        color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        margin: 0,
                      }}
                    >
                      {block.content}
                    </p>
                  )}
                </motion.div>
              ))}
            </>
          ) : (
            <>
              {/* Legacy: How We Calculated */}
              {howWeCalculated && (
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
              )}

              {/* Legacy: Why It Matters */}
              {whyItMatters && (
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
              )}

              {/* Legacy: What You Can Do */}
              {whatYouCanDo && whatYouCanDo.length > 0 && (
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
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

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

// Terminal window wrapper component
function TerminalWindow({
  children,
  title = 'brandos-cli v2.0',
  className = '',
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.15)',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Terminal header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(0, 0, 0, 0.03)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
        </div>
        <span
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: 'rgba(0, 0, 0, 0.4)',
            marginLeft: 'auto',
          }}
        >
          {title}
        </span>
      </div>
      {/* Terminal content */}
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

export default function WalkthroughSection({
  label,
  children,
  howWeCalculated,
  whyItMatters,
  whatYouCanDo,
  theme,
  accentColor = '#0047FF',
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

      <div className="w-full max-w-4xl relative z-10">
        {/* Section Label as comment block */}
        <motion.div
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6"
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <div>/* ═══════════════════════════════════════ */</div>
          <div style={{ color: accentColor, fontWeight: 500 }}>/*  {label.toUpperCase()}  */</div>
          <div>/* ═══════════════════════════════════════ */</div>
        </motion.div>

        {/* Main Terminal Window */}
        <motion.div
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <TerminalWindow title={`brandos://analysis/${label.split(':')[0]?.toLowerCase() || 'section'}`}>
            <div className="space-y-5">
              {/* Narrative context block */}
              {useNarrative && narrativeBlocks.filter(b => b.type === 'context').map((block, i) => (
                <div
                  key={`ctx-${i}`}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(0, 71, 255, 0.04)',
                    border: '1px solid rgba(0, 71, 255, 0.1)',
                    borderRadius: '4px',
                  }}
                >
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      fontFamily: "'Helvetica Neue', Arial, sans-serif",
                      color: 'rgba(0, 0, 0, 0.75)',
                      margin: 0,
                    }}
                  >
                    <span style={{ color: accentColor, fontFamily: "'VCR OSD Mono', monospace", marginRight: '8px' }}>&gt;</span>
                    {block.content}
                  </p>
                </div>
              ))}

              {/* Main Visualization */}
              <div
                style={{
                  background: '#F8F8F8',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '4px',
                  padding: '20px',
                }}
              >
                {children}
              </div>

              {/* Narrative blocks below visualization */}
              {useNarrative && (
                <>
                  {narrativeBlocks.filter(b => b.type === 'callout').map((block, i) => (
                    <div
                      key={`callout-${i}`}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderLeft: `3px solid ${accentColor}`,
                        borderRadius: '0 4px 4px 0',
                      }}
                    >
                      {block.label && (
                        <h3
                          style={{
                            fontFamily: "'VCR OSD Mono', monospace",
                            fontSize: '10px',
                            letterSpacing: '0.1em',
                            color: accentColor,
                            marginBottom: '8px',
                          }}
                        >
                          [{block.label}]
                        </h3>
                      )}
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          fontFamily: "'Helvetica Neue', Arial, sans-serif",
                          color: 'rgba(0, 0, 0, 0.7)',
                          margin: 0,
                        }}
                      >
                        {block.content}
                      </p>
                    </div>
                  ))}

                  {narrativeBlocks.filter(b => b.type === 'action').map((block, i) => (
                    <div
                      key={`action-${i}`}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(16, 185, 129, 0.04)',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderRadius: '4px',
                      }}
                    >
                      {block.label && (
                        <h3
                          style={{
                            fontFamily: "'VCR OSD Mono', monospace",
                            fontSize: '10px',
                            letterSpacing: '0.1em',
                            color: '#10B981',
                            marginBottom: '8px',
                          }}
                        >
                          [{block.label}]
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
                                color: 'rgba(0, 0, 0, 0.75)',
                              }}
                            >
                              <span style={{ color: '#10B981', fontFamily: "'VCR OSD Mono', monospace" }}>[✓]</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p
                          className="text-sm leading-relaxed"
                          style={{
                            fontFamily: "'Helvetica Neue', Arial, sans-serif",
                            color: 'rgba(0, 0, 0, 0.7)',
                            margin: 0,
                          }}
                        >
                          {block.content}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Legacy blocks */}
              {!useNarrative && (
                <>
                  {howWeCalculated && (
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '4px',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'VCR OSD Mono', monospace",
                          fontSize: '10px',
                          letterSpacing: '0.1em',
                          color: 'rgba(0, 0, 0, 0.4)',
                          marginBottom: '8px',
                        }}
                      >
                        [HOW_WE_CALCULATED]
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          fontFamily: "'Helvetica Neue', Arial, sans-serif",
                          color: 'rgba(0, 0, 0, 0.7)',
                          margin: 0,
                        }}
                      >
                        {howWeCalculated}
                      </p>
                    </div>
                  )}

                  {whyItMatters && (
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '4px',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'VCR OSD Mono', monospace",
                          fontSize: '10px',
                          letterSpacing: '0.1em',
                          color: 'rgba(0, 0, 0, 0.4)',
                          marginBottom: '8px',
                        }}
                      >
                        [WHY_IT_MATTERS]
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          fontFamily: "'Helvetica Neue', Arial, sans-serif",
                          color: 'rgba(0, 0, 0, 0.7)',
                          margin: 0,
                        }}
                      >
                        {whyItMatters}
                      </p>
                    </div>
                  )}

                  {whatYouCanDo && whatYouCanDo.length > 0 && (
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(16, 185, 129, 0.04)',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderRadius: '4px',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'VCR OSD Mono', monospace",
                          fontSize: '10px',
                          letterSpacing: '0.1em',
                          color: '#10B981',
                          marginBottom: '8px',
                        }}
                      >
                        [ACTION_ITEMS]
                      </h3>
                      <div className="space-y-2">
                        {whatYouCanDo.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 text-sm"
                            style={{
                              fontFamily: "'Helvetica Neue', Arial, sans-serif",
                              color: 'rgba(0, 0, 0, 0.75)',
                            }}
                          >
                            <span style={{ color: '#10B981', fontFamily: "'VCR OSD Mono', monospace" }}>[✓]</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TerminalWindow>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import BrandOSLogo from './BrandOSLogo';
import SwissBackground from './SwissBackground';

interface PhaseDetail {
  title: string;
  description: string;
}

interface Phase {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  details: PhaseDetail[];
  icon: React.ReactNode;
}

const phases: Phase[] = [
  {
    number: 1,
    title: 'DEFINE',
    subtitle: 'Build Your System',
    description: 'Turn your intuition into rules AI can follow. Define what makes your brand yours—so it stays consistent whether you\'re creating or someone else is.',
    features: ['Brand Identity', 'Safe Zones', 'Design Intents', 'Voice & Tone'],
    details: [
      { title: 'Brand Identity', description: 'Define your name, colors, and core visual elements that make your brand recognizable.' },
      { title: 'Tone Spectrum', description: 'Set sliders for formality, energy, confidence, and style to capture your unique voice.' },
      { title: 'Safe Zones', description: 'Lock critical brand elements while allowing flexibility in others.' },
      { title: 'Voice Samples', description: 'Add examples of your brand writing to train the AI on your style.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    number: 2,
    title: 'CHECK',
    subtitle: 'Score Against Your DNA',
    description: 'Run any content through your DNA. Get a score, see what\'s off, and know exactly what to fix—before it goes live.',
    features: ['Content Scoring', 'Brand Cohesion', 'Guardrails', 'Consistency'],
    details: [
      { title: 'Content Scoring', description: 'Get a 0-100 score showing how well your content aligns with your brand.' },
      { title: 'Real-time Analysis', description: 'See tone analysis as you type with instant feedback.' },
      { title: 'Guardrails', description: 'Review content from creators and agencies against your guidelines.' },
      { title: 'Suggestions', description: 'Receive AI-powered rewrites that match your brand voice.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    number: 3,
    title: 'GENERATE',
    subtitle: 'Create From Your DNA',
    description: 'Generate content that sounds like you from the start. Your DNA shapes every output—so you create faster without losing your voice.',
    features: ['Multi-format', 'Platform Adapt', 'Visual Concepts', 'Templates'],
    details: [
      { title: 'Multi-format Output', description: 'Generate tweets, emails, headlines, taglines, and more.' },
      { title: 'Platform Adaptation', description: 'Automatically adjust content for different social platforms.' },
      { title: 'Visual Concepts', description: 'Get AI-powered design direction and mood boards.' },
      { title: 'Brand Kit', description: 'Manage logos, colors, typography, and templates in one place.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 5v14M5 12h14" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    number: 4,
    title: 'SCALE',
    subtitle: 'Let Your System Run',
    description: 'You\'ve built the system. Now let it work. Automate content, enforce your DNA across tools, and watch your brand scale—without you in the middle of every decision.',
    features: ['Dashboard', 'History', 'Export', 'Compare'],
    details: [
      { title: 'Analytics Dashboard', description: 'Track content checks, scores, and brand health over time.' },
      { title: 'History & Memory', description: 'Review past generations and learn what works for your brand.' },
      { title: 'Export Guidelines', description: 'Download your brand guidelines as JSON or shareable links.' },
      { title: 'Competitor Analysis', description: 'Compare your brand voice against competitors.' },
    ],
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    ),
  },
];

interface PhasesBreakdownProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

export default function PhasesBreakdown({ onGetStarted, onSkip }: PhasesBreakdownProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const handlePhaseClick = (phaseNumber: number) => {
    setExpandedPhase(expandedPhase === phaseNumber ? null : phaseNumber);
  };

  return (
    <SwissBackground mode="full" className="overflow-y-auto">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="min-h-screen flex flex-col items-center justify-center px-12"
      >
        {/* Large BrandOS Logo */}
        <div className="mb-6">
          <BrandOSLogo size="hero" variant="landing" />
        </div>

        {/* Tagline */}
        <p className="font-mono text-xs tracking-widest uppercase text-brand-black-swiss/50 text-center mb-12">
          Your Brand Journey in Four Phases
        </p>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-2 mt-12 animate-bounce">
          <span className="font-mono text-[10px] tracking-widest uppercase text-brand-black-swiss/30">
            Scroll to explore
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand-black-swiss/30" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </motion.section>

      {/* Phases Grid */}
      <section className="px-12 pb-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 gap-6">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.number}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.15 + 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={() => handlePhaseClick(phase.number)}
              className={`
                bg-white/50 border rounded-sm p-8 cursor-pointer
                hover:shadow-[0_0_0_2px_rgba(47,84,235,0.4)] hover:scale-[1.01] transition-all duration-300
                ${expandedPhase === phase.number
                  ? 'col-span-2 border-brand-blue-swiss/30 shadow-[0_0_0_2px_rgba(47,84,235,0.4)]'
                  : 'border-brand-black-swiss/10'
                }
              `}
            >
              {/* Phase Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  {/* Phase badge */}
                  <span className="inline-block mb-4 bg-brand-blue-swiss/10 text-brand-blue-swiss font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-sm">
                    PHASE {phase.number}
                  </span>

                  {/* Title */}
                  <h2 className={`font-sans font-bold text-brand-black-swiss mb-2 transition-all duration-500 ${
                    expandedPhase === phase.number ? 'text-5xl' : 'text-3xl'
                  }`}>
                    {phase.title}
                  </h2>

                  {/* Subtitle */}
                  <p className="font-sans text-base text-brand-black-swiss/50">
                    {phase.subtitle}
                  </p>
                </div>

                {/* Icon */}
                <div className={`transition-all duration-500 ${
                  expandedPhase === phase.number
                    ? 'text-brand-blue-swiss scale-110'
                    : 'text-brand-black-swiss/30'
                }`}>
                  {phase.icon}
                </div>
              </div>

              {/* Expanded description */}
              <div
                className={`overflow-hidden transition-all duration-700 ${
                  expandedPhase === phase.number
                    ? 'max-h-[800px] opacity-100 pt-4'
                    : 'max-h-0 opacity-0'
                }`}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                }}
              >
                <p className="font-sans text-lg leading-relaxed text-brand-black-swiss/70 mb-8 max-w-[600px]">
                  {phase.description}
                </p>

                {/* Detail cards grid */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 pt-6 border-t border-brand-black-swiss/10">
                  {phase.details.map((detail) => (
                    <div
                      key={detail.title}
                      className="bg-white/30 rounded-sm p-5 border border-brand-black-swiss/5"
                    >
                      <h4 className="font-mono text-xs tracking-wider text-brand-blue-swiss mb-2">
                        {detail.title}
                      </h4>
                      <p className="font-sans text-sm leading-relaxed text-brand-black-swiss/60">
                        {detail.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature tags (shown when collapsed) */}
              {expandedPhase !== phase.number && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {phase.features.map((feature) => (
                    <span
                      key={feature}
                      className="bg-white/60 border border-brand-black-swiss/10 rounded-sm font-sans text-xs px-3 py-1.5 text-brand-black-swiss/50"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}

              {/* Expand/Collapse indicator */}
              <div className="flex items-center justify-center mt-6 text-brand-black-swiss/30">
                <span className="font-mono text-[10px] tracking-wider mr-2">
                  {expandedPhase === phase.number ? 'COLLAPSE' : 'EXPAND'}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={`transition-transform duration-500 ${
                    expandedPhase === phase.number ? 'rotate-180' : ''
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
        className="py-24 px-12 flex flex-col items-center gap-6"
      >
        <p className="font-mono text-xs tracking-widest uppercase text-brand-black-swiss/50 text-center">
          Ready to build your brand system?
        </p>

        <button
          onClick={onGetStarted}
          className="px-16 py-5 rounded-full bg-brand-black-swiss text-brand-cream text-base font-medium shadow-[0_0_0_2px_rgba(47,84,235,0.5)] hover:shadow-[0_0_12px_rgba(47,84,235,0.6)] transition-shadow"
        >
          GET STARTED
        </button>

        <button
          onClick={onSkip}
          className="font-sans text-sm text-brand-black-swiss/70 underline underline-offset-4 decoration-brand-black-swiss/30 hover:text-brand-black-swiss hover:decoration-brand-black-swiss transition-colors py-3 px-6"
        >
          Skip for now
        </button>
      </motion.section>
    </SwissBackground>
  );
}

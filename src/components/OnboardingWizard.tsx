'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useBrandStore, useCurrentBrand } from '@/lib/store';
import { brandTemplates } from '@/lib/templates';
import BrandOSLogo from './BrandOSLogo';
import SwissBackground from './SwissBackground';

type Step = 'welcome' | 'name' | 'template' | 'colors' | 'tone' | 'keywords' | 'samples' | 'complete';

const steps: { id: Step; label: string; title: string; subtitle: string }[] = [
  { id: 'welcome', label: 'Welcome', title: 'Welcome to BrandOS', subtitle: "Let's set up your brand in minutes" },
  { id: 'name', label: 'Name', title: 'Name Your Brand', subtitle: 'What should we call your brand?' },
  { id: 'template', label: 'Template', title: 'Choose a Starting Point', subtitle: 'Pick a template or start fresh' },
  { id: 'colors', label: 'Colors', title: 'Brand Colors', subtitle: 'Define your visual identity' },
  { id: 'tone', label: 'Tone', title: 'Brand Tone', subtitle: 'How should your brand sound?' },
  { id: 'keywords', label: 'Keywords', title: 'Brand Keywords', subtitle: 'Words that define your brand' },
  { id: 'samples', label: 'Samples', title: 'Voice Samples', subtitle: 'Show us your best writing' },
  { id: 'complete', label: 'Done', title: 'Your Brand is Ready', subtitle: 'Your dashboard awaits' },
];

const toneSliders = [
  { key: 'minimal' as const, label: 'FORMALITY', left: 'Casual', right: 'Formal' },
  { key: 'playful' as const, label: 'ENERGY', left: 'Reserved', right: 'Energetic' },
  { key: 'bold' as const, label: 'CONFIDENCE', left: 'Humble', right: 'Bold' },
  { key: 'experimental' as const, label: 'STYLE', left: 'Classic', right: 'Experimental' },
];

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

/* ── Gradient Tone Slider (drag-based with Motion springs) ── */
function GradientSlider({
  label,
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Motion values for smooth spring-driven thumb
  const thumbX = useMotionValue(0);
  const springX = useSpring(thumbX, { stiffness: 400, damping: 35, mass: 0.5 });

  // Gradient fill width follows the spring
  const fillWidth = useTransform(springX, (x) => {
    if (!trackRef.current) return `${value}%`;
    const w = trackRef.current.offsetWidth;
    return `${Math.max(0, Math.min(100, (x / w) * 100))}%`;
  });

  // Sync motion value when value prop changes externally
  useEffect(() => {
    if (!isDragging.current && trackRef.current) {
      thumbX.set((value / 100) * trackRef.current.offsetWidth);
    }
  }, [value, thumbX]);

  const clampToTrack = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      thumbX.set(x);
      const pct = Math.round((x / rect.width) * 100);
      onChange(pct);
    },
    [onChange, thumbX],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      clampToTrack(e.clientX);
    },
    [clampToTrack],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      clampToTrack(e.clientX);
    },
    [clampToTrack],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-widest text-brand-black-swiss/50">{label}</span>
        <span className="font-mono text-[10px] tabular-nums text-brand-black-swiss/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {value}
        </span>
      </div>

      {/* Track — pointer events drive the drag */}
      <div
        ref={trackRef}
        className="relative h-2.5 rounded-sm cursor-pointer select-none"
        style={{ background: 'rgba(15,15,15,0.06)' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Gradient fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{
            width: fillWidth,
            background: 'linear-gradient(90deg, #2F54EB 0%, #7B5CEB 40%, #FA8C16 100%)',
            filter: 'blur(0.5px)',
          }}
        />

        {/* Glow halo behind thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full pointer-events-none"
          style={{
            left: springX,
            x: '-50%',
            background: 'radial-gradient(circle, rgba(47,84,235,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-sm bg-white border border-brand-black-swiss/15 shadow-sm pointer-events-none"
          style={{ left: springX, x: '-50%' }}
          whileHover={{ scale: 1.15 }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-[9px] text-brand-black-swiss/30">{leftLabel}</span>
        <span className="font-mono text-[9px] text-brand-black-swiss/30">{rightLabel}</span>
      </div>
    </div>
  );
}

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const { setBrandDNA } = useBrandStore();
  const brandDNA = useCurrentBrand();

  const [keywordInput, setKeywordInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = (currentStepIndex / (steps.length - 1)) * 100;

  const goToStep = (step: Step) => {
    const nextIndex = steps.findIndex(s => s.id === step);
    setDirection(nextIndex > currentStepIndex ? 1 : -1);
    setCurrentStep(step);
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      goToStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(steps[prevIndex].id);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = brandTemplates.find(t => t.id === templateId);
    if (template?.preview) {
      setBrandDNA(template.preview);
      nextStep();
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      setBrandDNA({ keywords: [...(brandDNA?.keywords || []), keywordInput.trim()] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setBrandDNA({ keywords: brandDNA?.keywords?.filter((_, i) => i !== index) });
  };

  const addSample = () => {
    if (sampleInput.trim()) {
      setBrandDNA({ voiceSamples: [...(brandDNA?.voiceSamples || []), sampleInput.trim()] });
      setSampleInput('');
    }
  };

  const removeSample = (index: number) => {
    setBrandDNA({ voiceSamples: brandDNA?.voiceSamples?.filter((_, i) => i !== index) });
  };

  /* ── Shared animation variants ── */
  const pageVariants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  };

  return (
    <SwissBackground mode="full" className="items-center justify-center">
      {/* ── Top bar: progress dots + skip ── */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-6">
        {/* Step dots */}
        <div className="flex items-center gap-2">
          {steps.slice(0, -1).map((step, index) => (
            <div
              key={step.id}
              className="transition-all duration-300"
              style={{
                width: index === currentStepIndex ? 28 : 8,
                height: 8,
                borderRadius: 2,
                background:
                  index < currentStepIndex
                    ? '#2F54EB'
                    : index === currentStepIndex
                      ? '#0F0F0F'
                      : 'rgba(15,15,15,0.15)',
              }}
            />
          ))}
        </div>

        {/* Skip */}
        <button
          onClick={onSkip}
          className="font-mono text-sm tracking-wide text-brand-black-swiss/40 hover:text-brand-black-swiss transition-colors"
        >
          Skip for now
        </button>
      </div>

      {/* ── Thin gradient progress bar ── */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-brand-black-swiss/5">
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #2F54EB, #FA8C16)' }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>

      {/* ── Main content area ── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
          className="relative z-10 w-full max-w-2xl px-8"
        >
          {/* ════════ WELCOME ════════ */}
          {currentStep === 'welcome' && (
            <div className="text-center">
              {/* Logo */}
              <div className="mb-12 flex justify-center">
                <BrandOSLogo size="hero" variant="landing" />
              </div>

              <h2 className="font-sans text-5xl font-bold tracking-tight text-brand-black-swiss mb-4">
                Let&apos;s set up your brand
              </h2>
              <p className="font-sans text-lg text-brand-black-swiss/50 mb-14 max-w-md mx-auto leading-relaxed">
                Answer a few quick questions to capture your brand identity. This takes about 2 minutes.
              </p>

              <button
                onClick={nextStep}
                className="px-14 py-4 bg-brand-black-swiss text-brand-cream rounded-full text-base font-medium shadow-[0_0_0_2px_rgba(47,84,235,0.5)] hover:shadow-[0_0_12px_rgba(47,84,235,0.6)] transition-shadow"
              >
                Begin Setup
              </button>
            </div>
          )}

          {/* ════════ NAME ════════ */}
          {currentStep === 'name' && (
            <div className="text-center">
              <h2 className="font-sans text-5xl font-bold tracking-tight text-brand-black-swiss mb-4">
                {steps[1].title}
              </h2>
              <p className="font-sans text-lg text-brand-black-swiss/50 mb-12">
                {steps[1].subtitle}
              </p>

              <input
                type="text"
                value={brandDNA?.name || ''}
                onChange={(e) => setBrandDNA({ name: e.target.value })}
                placeholder="Enter your brand name"
                className="w-full text-center text-lg font-sans bg-white/50 border border-brand-black-swiss/10 rounded-sm px-6 py-5 outline-none focus:border-brand-blue-swiss transition-colors placeholder:text-brand-black-swiss/30 text-brand-black-swiss"
                autoFocus
              />

              <div className="flex items-center justify-center gap-8 mt-12">
                <button
                  onClick={prevStep}
                  className="font-sans text-base text-brand-black-swiss/70 underline underline-offset-4 decoration-brand-black-swiss/30 hover:text-brand-black-swiss hover:decoration-brand-black-swiss transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!brandDNA?.name?.trim()}
                  className="px-14 py-4 bg-brand-black-swiss text-brand-cream rounded-full text-base font-medium shadow-[0_0_0_2px_rgba(47,84,235,0.5)] hover:shadow-[0_0_12px_rgba(47,84,235,0.6)] transition-shadow disabled:opacity-30"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ════════ TEMPLATE ════════ */}
          {currentStep === 'template' && (
            <div>
              <div className="text-center mb-12">
                <h2 className="font-sans text-5xl font-bold tracking-tight text-brand-black-swiss mb-4">
                  {steps[2].title}
                </h2>
                <p className="font-sans text-lg text-brand-black-swiss/50">
                  {steps[2].subtitle}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-12">
                {brandTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template.id)}
                    className="bg-white/50 border border-brand-black-swiss/10 rounded-sm p-6 text-left hover:shadow-[0_0_0_2px_rgba(47,84,235,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex gap-2 mb-3">
                      {Object.values(template.preview.colors || {}).map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-sm border border-brand-black-swiss/5"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="font-sans text-base font-medium text-brand-black-swiss">{template.name}</p>
                    <p className="font-mono text-xs text-brand-black-swiss/40 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={prevStep}
                  className="font-sans text-base text-brand-black-swiss/70 underline underline-offset-4 decoration-brand-black-swiss/30 hover:text-brand-black-swiss hover:decoration-brand-black-swiss transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="font-sans text-base text-brand-black-swiss/70 underline underline-offset-4 decoration-brand-black-swiss/30 hover:text-brand-black-swiss hover:decoration-brand-black-swiss transition-colors"
                >
                  Skip, start fresh
                </button>
              </div>
            </div>
          )}

          {/* ════════ COLORS ════════ */}
          {currentStep === 'colors' && (
            <div>
              <div className="text-center mb-12">
                <h2 className="font-sans text-5xl font-bold tracking-tight text-brand-black-swiss mb-4">
                  {steps[3].title}
                </h2>
                <p className="font-sans text-lg text-brand-black-swiss/50">
                  {steps[3].subtitle}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-8">
                {[
                  { key: 'primary', label: 'PRIMARY' },
                  { key: 'secondary', label: 'SECONDARY' },
                  { key: 'accent', label: 'ACCENT' },
                ].map(({ key, label }) => (
                  <div key={key} className="text-center group">
                    <label className="block cursor-pointer">
                      <div
                        className="w-full aspect-square rounded-sm border border-brand-black-swiss/10 transition-all group-hover:scale-105 group-hover:shadow-[0_0_0_2px_rgba(47,84,235,0.4)] mb-4"
                        style={{ backgroundColor: brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000' }}
                      />
                      <input
                        type="color"
                        value={brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000'}
                        onChange={(e) => setBrandDNA({
                          colors: { ...brandDNA?.colors!, [key]: e.target.value },
                        })}
                        className="sr-only"
                      />
                    </label>
                    <p className="font-mono text-xs tracking-widest text-brand-black-swiss/40">{label}</p>
                    <p className="font-mono text-xs text-brand-black-swiss/25 mt-1">
                      {brandDNA?.colors?.[key as keyof typeof brandDNA.colors] || '#000000'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-8 mt-14">
                <button
                  onClick={prevStep}
                  className="font-sans text-base text-brand-black-swiss/70 underline underline-offset-4 decoration-brand-black-swiss/30 hover:text-brand-black-swiss hover:decoration-brand-black-swiss transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-14 py-4 bg-brand-black-swiss text-brand-cream rounded-full text-base font-medium shadow-[0_0_0_2px_rgba(47,84,235,0.5)] hover:shadow-[0_0_12px_rgba(47,84,235,0.6)] transition-shadow"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ════════ TONE ════════ */}
          {currentStep === 'tone' && (
            <div>
              <div className="text-center mb-12">
                <h2 className="font-sans text-5xl font-bold tracking-tight text-brand-black-swiss mb-4">
                  {steps[4].title}
                </h2>
                <p className="font-sans text-lg text-brand-black-swiss/50">
                  {steps[4].subtitle}
                </p>
              </div>

              <div className="space-y-8">
                {toneSliders.map((slider) => (
                  <GradientSlider
                    key={slider.key}
                    label={slider.label}
                    value={brandDNA?.tone?.[slider.key] ?? 50}
                    onChange={(v) => setBrandDNA({ tone: { ...brandDNA?.tone!, [slider.key]: v } })}
                    leftLabel={slider.left}
                    rightLabel={slider.right}
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-8 mt-14">
                <button
                  onClick={prevStep}
                  className="font-sans text-base text-brand-black-swiss/70 underline underline-offset-4 decoration-brand-black-swiss/30 hover:text-brand-black-swiss hover:decoration-brand-black-swiss transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-14 py-4 bg-brand-black-swiss text-brand-cream rounded-full text-base font-medium shadow-[0_0_0_2px_rgba(47,84,235,0.5)] hover:shadow-[0_0_12px_rgba(47,84,235,0.6)] transition-shadow"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ════════ KEYWORDS ════════ */}
          {currentStep === 'keywords' && (
            <div>
              <div className="text-center mb-12">
                <h2 className="font-sans text-5xl font-bold tracking-tight text-brand-black-swiss mb-4">
                  {steps[5].title}
                </h2>
                <p className="font-sans text-lg text-brand-black-swiss/50">
                  {steps[5].subtitle}
                </p>
              </div>

              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="Type a keyword and press Enter"
                  className="flex-1 px-6 py-4 bg-white/50 rounded-sm outline-none placeholder:text-brand-black-swiss/30 text-base text-brand-black-swiss border border-brand-black-swiss/10 focus:border-brand-blue-swiss transition-colors"
                />
                <button
                  onClick={addKeyword}
                  disabled={!keywordInput.trim()}
                  className="px-6 py-4 bg-brand-black-swiss text-brand-cream rounded-sm text-base disabled:opacity-30 transition-opacity"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5 min-h-[56px] mb-4">
                {brandDNA?.keywords?.map((keyword, i) => (
                  <motion.span
                    key={`${keyword}-${i}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => removeKeyword(i)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 rounded-sm text-base text-brand-black-swiss cursor-pointer hover:bg-white transition-colors border border-brand-black-swiss/10"
                  >
                    {keyword}
                    <span className="text-brand-black-swiss/30">&times;</span>
                  </motion.span>
                ))}
                {(!brandDNA?.keywords || brandDNA.keywords.length === 0) && (
                  <p className="font-mono text-xs text-brand-black-swiss/30">No keywords yet</p>
                )}
              </div>

              <p className="font-mono text-xs text-brand-black-swiss/30 text-center mb-2">
                Suggestions: innovative, premium, friendly, bold, minimal, playful, trustworthy
              </p>

              <div className="flex items-center justify-center gap-8 mt-14">
                <button
                  onClick={prevStep}
                  className="font-sans text-base text-brand-black-swiss/70 underline underline-offset-4 decoration-brand-black-swiss/30 hover:text-brand-black-swiss hover:decoration-brand-black-swiss transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-14 py-4 bg-brand-black-swiss text-brand-cream rounded-full text-base font-medium shadow-[0_0_0_2px_rgba(47,84,235,0.5)] hover:shadow-[0_0_12px_rgba(47,84,235,0.6)] transition-shadow"
                >
                  {brandDNA?.keywords?.length ? 'Continue' : 'Skip'}
                </button>
              </div>
            </div>
          )}

          {/* ════════ VOICE SAMPLES ════════ */}
          {currentStep === 'samples' && (
            <div>
              <div className="text-center mb-12">
                <h2 className="font-sans text-5xl font-bold tracking-tight text-brand-black-swiss mb-4">
                  {steps[6].title}
                </h2>
                <p className="font-sans text-lg text-brand-black-swiss/50">
                  {steps[6].subtitle}
                </p>
              </div>

              <textarea
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                placeholder="Paste an example of your brand's writing... A tagline, marketing copy, or any text that represents your voice."
                rows={3}
                className="w-full px-6 py-4 bg-white/50 rounded-sm outline-none placeholder:text-brand-black-swiss/30 text-base text-brand-black-swiss resize-none mb-4 border border-brand-black-swiss/10 focus:border-brand-blue-swiss transition-colors"
              />

              <button
                onClick={addSample}
                disabled={!sampleInput.trim()}
                className="w-full py-3.5 border border-brand-black-swiss/10 rounded-sm text-base text-brand-black-swiss/60 hover:border-brand-black-swiss/30 transition-colors disabled:opacity-30"
              >
                Add Sample
              </button>

              <div className="space-y-2.5 mt-5 max-h-40 overflow-y-auto">
                {brandDNA?.voiceSamples?.map((sample, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onClick={() => removeSample(i)}
                    className="p-4 bg-white/50 rounded-sm text-base cursor-pointer hover:bg-white transition-colors group border border-brand-black-swiss/10"
                  >
                    <p className="italic text-brand-black-swiss/60 line-clamp-2">&ldquo;{sample}&rdquo;</p>
                    <p className="font-mono text-xs text-brand-black-swiss/20 group-hover:text-brand-black-swiss/50 mt-1">Click to remove</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-8 mt-14">
                <button
                  onClick={prevStep}
                  className="font-sans text-base text-brand-black-swiss/70 underline underline-offset-4 decoration-brand-black-swiss/30 hover:text-brand-black-swiss hover:decoration-brand-black-swiss transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-14 py-4 bg-brand-black-swiss text-brand-cream rounded-full text-base font-medium shadow-[0_0_0_2px_rgba(47,84,235,0.5)] hover:shadow-[0_0_12px_rgba(47,84,235,0.6)] transition-shadow"
                >
                  {brandDNA?.voiceSamples?.length ? 'Finish Setup' : 'Skip & Finish'}
                </button>
              </div>
            </div>
          )}

          {/* ════════ COMPLETE ════════ */}
          {currentStep === 'complete' && (
            <div className="text-center">
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-8 rounded-full bg-brand-blue-swiss/10 flex items-center justify-center"
              >
                <svg className="w-10 h-10 text-brand-blue-swiss" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              <h2 className="font-sans text-5xl font-bold tracking-tight text-brand-black-swiss mb-4">
                {steps[7].title}
              </h2>
              <p className="font-sans text-lg text-brand-black-swiss/50 mb-12">
                {steps[7].subtitle}
              </p>

              {/* Brand preview card */}
              <div className="bg-white/50 border border-brand-black-swiss/10 rounded-sm p-8 mb-12 text-left">
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex -space-x-1">
                    {Object.values(brandDNA?.colors || {}).map((color, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-sm border-2 border-brand-cream"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="font-sans text-lg font-medium text-brand-black-swiss">{brandDNA?.name}</p>
                    <p className="font-mono text-xs text-brand-black-swiss/30">
                      {brandDNA?.keywords?.slice(0, 3).join(' / ') || 'No keywords'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  {toneSliders.map((slider) => (
                    <div key={slider.key}>
                      <p className="font-mono text-xs text-brand-black-swiss/30">{slider.label}</p>
                      <p className="font-sans text-base font-medium text-brand-black-swiss">{brandDNA?.tone?.[slider.key] ?? 50}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onComplete}
                className="w-full px-14 py-4 bg-brand-black-swiss text-brand-cream rounded-full text-base font-medium shadow-[0_0_0_2px_rgba(47,84,235,0.5)] hover:shadow-[0_0_12px_rgba(47,84,235,0.6)] transition-shadow"
              >
                Open Your Dashboard
              </button>
              <p className="font-mono text-sm text-brand-black-swiss/30 mt-5">
                Your personalized command center is ready
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </SwissBackground>
  );
}

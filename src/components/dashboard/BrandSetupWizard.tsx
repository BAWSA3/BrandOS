'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBrandStore, useCurrentBrand } from '@/lib/store';
import { brandTemplates } from '@/lib/templates';
import {
  MONO,
  asciiBar,
  Cursor,
  TerminalButton,
  ToneSlider,
  TONE_SLIDERS,
  terminalInputStyle,
} from './terminal-ui';

// First-run brand setup, ported from the legacy /app OnboardingWizard onto
// the dashboard. Reads as a terminal boot sequence (brand.init()) and styles
// exclusively through the world CSS variables so every world themes it.

type Step = 'boot' | 'name' | 'template' | 'colors' | 'tone' | 'keywords' | 'samples' | 'complete';

const STEPS: { id: Step; label: string; comment: string; prompt: string }[] = [
  { id: 'boot', label: 'INIT', comment: '// initialize', prompt: 'brand.init()' },
  { id: 'name', label: 'NAME', comment: '// step 01 — name your brand', prompt: 'brand.name = ?' },
  {
    id: 'template',
    label: 'BASE',
    comment: '// step 02 — choose a starting point',
    prompt: 'brand.extends = ?',
  },
  {
    id: 'colors',
    label: 'COLOR',
    comment: '// step 03 — define your palette',
    prompt: 'brand.colors = ?',
  },
  {
    id: 'tone',
    label: 'TONE',
    comment: '// step 04 — calibrate your voice',
    prompt: 'brand.tone = ?',
  },
  {
    id: 'keywords',
    label: 'WORDS',
    comment: '// step 05 — words that define you',
    prompt: 'brand.keywords = ?',
  },
  {
    id: 'samples',
    label: 'VOICE',
    comment: '// step 06 — show us your writing',
    prompt: 'brand.voice_samples = ?',
  },
  { id: 'complete', label: 'DONE', comment: '// sequence complete', prompt: 'brand.save()' },
];

const BOOT_LINES = [
  '> brandos v2.0 — workspace online',
  '> scanning for brand DNA...',
  '> brand profiles found: 0',
  '> run brand.init()? [Y/n]',
];

interface BrandSetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function BrandSetupWizard({ onComplete, onSkip }: BrandSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('boot');
  const [direction, setDirection] = useState(1);
  const { setBrandDNA } = useBrandStore();
  const brandDNA = useCurrentBrand();

  const [keywordInput, setKeywordInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [bootLineCount, setBootLineCount] = useState(0);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = Math.round((stepIndex / (STEPS.length - 1)) * 100);
  const step = STEPS[stepIndex];

  // Boot sequence: reveal log lines one at a time.
  useEffect(() => {
    if (currentStep !== 'boot' || bootLineCount >= BOOT_LINES.length) return;
    const t = setTimeout(() => setBootLineCount((n) => n + 1), 350);
    return () => clearTimeout(t);
  }, [currentStep, bootLineCount]);

  const goToStep = (next: Step) => {
    const nextIndex = STEPS.findIndex((s) => s.id === next);
    setDirection(nextIndex > stepIndex ? 1 : -1);
    setCurrentStep(next);
  };
  const nextStep = () => stepIndex < STEPS.length - 1 && goToStep(STEPS[stepIndex + 1].id);
  const prevStep = () => stepIndex > 0 && goToStep(STEPS[stepIndex - 1].id);

  const applyTemplate = (templateId: string) => {
    const template = brandTemplates.find((t) => t.id === templateId);
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

  const addSample = () => {
    if (sampleInput.trim()) {
      setBrandDNA({ voiceSamples: [...(brandDNA?.voiceSamples || []), sampleInput.trim()] });
      setSampleInput('');
    }
  };

  const pageVariants = {
    enter: (dir: number) => ({ x: dir * 32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -32, opacity: 0 }),
  };

  // The store seeds a placeholder brand named 'My Brand' — the name input
  // must start visually empty so typing doesn't append to the placeholder.
  const displayName = !brandDNA?.name || brandDNA.name === 'My Brand' ? '' : brandDNA.name;

  const completeSummary = useMemo(() => {
    if (currentStep !== 'complete' || !brandDNA) return '';
    const shown = brandDNA.keywords.slice(0, 5).map((k) => `"${k}"`);
    const extra = brandDNA.keywords.length - shown.length;
    const kw = shown.join(', ') + (extra > 0 ? ` /* +${extra} more */` : '');
    return [
      'const brand: BrandDNA = {',
      `  name: "${brandDNA.name}",`,
      `  colors: ["${brandDNA.colors.primary}", "${brandDNA.colors.secondary}", "${brandDNA.colors.accent}"],`,
      `  tone: { formality: ${brandDNA.tone.minimal}, energy: ${brandDNA.tone.playful}, confidence: ${brandDNA.tone.bold}, style: ${brandDNA.tone.experimental} },`,
      `  keywords: [${kw}],`,
      `  voice_samples: ${brandDNA.voiceSamples.length},`,
      '};',
    ].join('\n');
  }, [currentStep, brandDNA]);

  return (
    <section
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      {/* ── Header bar: sequencer label + progress + skip ── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.15em',
            color: 'var(--text-tertiary)',
          }}
        >
          {'// BRAND DNA SEQUENCER'}
        </span>
        <div className="flex items-center gap-3">
          <span
            className="whitespace-pre hidden sm:inline"
            style={{ fontFamily: MONO, fontSize: 11, color: 'var(--text-secondary)' }}
          >
            {asciiBar(progress)}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--accent)' }}>
            {String(progress).padStart(3, ' ')}%
          </span>
          {currentStep !== 'complete' && (
            <button
              onClick={onSkip}
              className="hover:opacity-70 transition-opacity"
              style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-tertiary)' }}
            >
              [skip]
            </button>
          )}
        </div>
      </div>

      {/* ── Step tabs ── */}
      <div
        className="flex flex-wrap gap-x-3 gap-y-1 px-5 py-2 border-b"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-tertiary)' }}
      >
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            style={{
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: '0.12em',
              color:
                i < stepIndex
                  ? 'var(--success)'
                  : i === stepIndex
                    ? 'var(--accent)'
                    : 'var(--text-tertiary)',
              opacity: i > stepIndex ? 0.5 : 1,
            }}
          >
            {i < stepIndex ? '✓' : i === stepIndex ? '>' : `${i}.`} {s.label}
          </span>
        ))}
      </div>

      {/* ── Step body ── */}
      <div className="px-5 sm:px-8 py-8 min-h-[320px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
          >
            {/* Step comment + prompt shared header (skipped on boot) */}
            {currentStep !== 'boot' && (
              <div className="mb-6">
                <p style={{ fontFamily: MONO, fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {step.comment}
                </p>
                <p
                  className="mt-1"
                  style={{ fontFamily: MONO, fontSize: 14, color: 'var(--text-primary)' }}
                >
                  <span style={{ color: 'var(--accent)' }}>$</span> {step.prompt}
                </p>
              </div>
            )}

            {/* ════════ BOOT ════════ */}
            {currentStep === 'boot' && (
              <div>
                <div className="space-y-1.5 mb-8">
                  {BOOT_LINES.slice(0, bootLineCount).map((line, i) => (
                    <motion.p
                      key={line}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        fontFamily: MONO,
                        fontSize: 13,
                        color:
                          i === BOOT_LINES.length - 1
                            ? 'var(--text-primary)'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {line}
                      {i === bootLineCount - 1 && bootLineCount < BOOT_LINES.length && <Cursor />}
                    </motion.p>
                  ))}
                </div>
                {bootLineCount >= BOOT_LINES.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4"
                  >
                    <TerminalButton primary onClick={nextStep}>
                      [ INITIALIZE ]
                    </TerminalButton>
                    <button
                      onClick={onSkip}
                      className="hover:opacity-70 transition-opacity"
                      style={{ fontFamily: MONO, fontSize: 12, color: 'var(--text-tertiary)' }}
                    >
                      n — later
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {/* ════════ NAME ════════ */}
            {currentStep === 'name' && (
              <div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setBrandDNA({ name: e.target.value })}
                  placeholder="your brand name"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && displayName.trim() && nextStep()}
                  className="w-full px-4 py-3.5 text-base placeholder:opacity-40"
                  style={terminalInputStyle}
                />
                <div className="flex items-center gap-4 mt-8">
                  <TerminalButton primary onClick={nextStep} disabled={!displayName.trim()}>
                    [ CONTINUE ]
                  </TerminalButton>
                  <BackLink onClick={prevStep} />
                </div>
              </div>
            )}

            {/* ════════ TEMPLATE ════════ */}
            {currentStep === 'template' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {brandTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template.id)}
                      className="p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 2,
                        backgroundColor: 'var(--surface-tertiary)',
                      }}
                    >
                      <div className="flex gap-1.5 mb-2.5">
                        {Object.values(template.preview.colors || {}).map((color, i) => (
                          <div
                            key={i}
                            className="w-5 h-5"
                            style={{ backgroundColor: color, borderRadius: 1 }}
                          />
                        ))}
                      </div>
                      <p style={{ fontFamily: MONO, fontSize: 12, color: 'var(--text-primary)' }}>
                        {template.name}
                      </p>
                      <p
                        className="mt-1 line-clamp-1"
                        style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-tertiary)' }}
                      >
                        {template.description}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <TerminalButton onClick={nextStep}>[ START FRESH ]</TerminalButton>
                  <BackLink onClick={prevStep} />
                </div>
              </div>
            )}

            {/* ════════ COLORS ════════ */}
            {currentStep === 'colors' && (
              <div>
                <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
                  {(
                    [
                      { key: 'primary', label: 'PRIMARY' },
                      { key: 'secondary', label: 'SECONDARY' },
                      { key: 'accent', label: 'ACCENT' },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key} className="text-center group">
                      <label className="block cursor-pointer">
                        <div
                          className="w-full aspect-square mb-2.5 transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: brandDNA?.colors?.[key] || '#000000',
                            border: '1px solid var(--border)',
                            borderRadius: 2,
                          }}
                        />
                        <input
                          type="color"
                          value={brandDNA?.colors?.[key] || '#000000'}
                          onChange={(e) =>
                            setBrandDNA({ colors: { ...brandDNA!.colors, [key]: e.target.value } })
                          }
                          className="sr-only"
                        />
                      </label>
                      <p
                        style={{
                          fontFamily: MONO,
                          fontSize: 9,
                          letterSpacing: '0.15em',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {label}
                      </p>
                      <p style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-secondary)' }}>
                        {brandDNA?.colors?.[key] || '#000000'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <TerminalButton primary onClick={nextStep}>
                    [ CONTINUE ]
                  </TerminalButton>
                  <BackLink onClick={prevStep} />
                </div>
              </div>
            )}

            {/* ════════ TONE ════════ */}
            {currentStep === 'tone' && (
              <div>
                <div className="space-y-6 mb-8">
                  {TONE_SLIDERS.map((slider) => (
                    <ToneSlider
                      key={slider.key}
                      label={slider.label}
                      value={brandDNA?.tone?.[slider.key] ?? 50}
                      onChange={(v) =>
                        setBrandDNA({ tone: { ...brandDNA!.tone, [slider.key]: v } })
                      }
                      left={slider.left}
                      right={slider.right}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <TerminalButton primary onClick={nextStep}>
                    [ CONTINUE ]
                  </TerminalButton>
                  <BackLink onClick={prevStep} />
                </div>
              </div>
            )}

            {/* ════════ KEYWORDS ════════ */}
            {currentStep === 'keywords' && (
              <div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                    placeholder="type a keyword, press enter"
                    className="flex-1 px-4 py-3 text-sm placeholder:opacity-40"
                    style={terminalInputStyle}
                  />
                  <TerminalButton onClick={addKeyword} disabled={!keywordInput.trim()}>
                    [+]
                  </TerminalButton>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px] mb-2">
                  {brandDNA?.keywords?.map((keyword, i) => (
                    <motion.button
                      key={`${keyword}-${i}`}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() =>
                        setBrandDNA({ keywords: brandDNA.keywords.filter((_, j) => j !== i) })
                      }
                      className="px-3 py-1.5 hover:opacity-70 transition-opacity"
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 2,
                        backgroundColor: 'var(--surface-tertiary)',
                      }}
                    >
                      {keyword} <span style={{ color: 'var(--text-tertiary)' }}>×</span>
                    </motion.button>
                  ))}
                  {(!brandDNA?.keywords || brandDNA.keywords.length === 0) && (
                    <p style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {'// none yet — try: innovative, premium, friendly, bold, minimal'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-8">
                  <TerminalButton primary onClick={nextStep}>
                    {brandDNA?.keywords?.length ? '[ CONTINUE ]' : '[ SKIP ]'}
                  </TerminalButton>
                  <BackLink onClick={prevStep} />
                </div>
              </div>
            )}

            {/* ════════ VOICE SAMPLES ════════ */}
            {currentStep === 'samples' && (
              <div>
                <textarea
                  value={sampleInput}
                  onChange={(e) => setSampleInput(e.target.value)}
                  placeholder="paste a tagline, a tweet, any writing that sounds like you..."
                  rows={3}
                  className="w-full px-4 py-3 text-sm resize-none placeholder:opacity-40 mb-3"
                  style={terminalInputStyle}
                />
                <TerminalButton onClick={addSample} disabled={!sampleInput.trim()}>
                  [ + ADD SAMPLE ]
                </TerminalButton>
                <div className="space-y-2 mt-4 max-h-36 overflow-y-auto">
                  {brandDNA?.voiceSamples?.map((sample, i) => (
                    <motion.button
                      key={i}
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      onClick={() =>
                        setBrandDNA({
                          voiceSamples: brandDNA.voiceSamples.filter((_, j) => j !== i),
                        })
                      }
                      className="block w-full p-3 text-left hover:opacity-70 transition-opacity"
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 2,
                        backgroundColor: 'var(--surface-tertiary)',
                      }}
                    >
                      <p
                        className="line-clamp-2 text-sm italic"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        &ldquo;{sample}&rdquo;
                      </p>
                      <p style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-tertiary)' }}>
                        click to remove
                      </p>
                    </motion.button>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-8">
                  <TerminalButton primary onClick={nextStep}>
                    {brandDNA?.voiceSamples?.length ? '[ FINISH SETUP ]' : '[ SKIP & FINISH ]'}
                  </TerminalButton>
                  <BackLink onClick={prevStep} />
                </div>
              </div>
            )}

            {/* ════════ COMPLETE ════════ */}
            {currentStep === 'complete' && (
              <div>
                <pre
                  className="p-4 overflow-x-auto mb-4"
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    lineHeight: 1.7,
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 2,
                    backgroundColor: 'var(--surface-tertiary)',
                  }}
                >
                  {completeSummary}
                </pre>
                <p
                  className="mb-8"
                  style={{ fontFamily: MONO, fontSize: 11, color: 'var(--success)' }}
                >
                  ✓ sequence complete — DNA synced to your workspace
                </p>
                <TerminalButton primary onClick={onComplete}>
                  [ OPEN DASHBOARD ]
                </TerminalButton>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hover:opacity-70 transition-opacity"
      style={{ fontFamily: MONO, fontSize: 12, color: 'var(--text-tertiary)' }}
    >
      &lt; back
    </button>
  );
}

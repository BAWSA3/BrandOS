'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBrandStore, useCurrentBrand } from '@/lib/store';
import { brandHasContent } from '@/hooks/useBrandHydration';
import { summarizeFingerprint, VoiceFingerprint } from '@/lib/voice-fingerprint';
import { MONO, asciiBar, TerminalButton } from './terminal-ui';

// Voice Fingerprint (consolidation step 5) — extracts a writing-style
// fingerprint from the brand's voice samples. PRO feature: the server
// enforces the gate; this panel mirrors it with an upsell state.

interface VoiceFingerprintPanelProps {
  plan: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-1.5"
      style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '0.15em',
        color: 'var(--text-tertiary)',
      }}
    >
      {children}
    </p>
  );
}

function MarkerList({ items, marker, color }: { items: string[]; marker: string; color: string }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ fontFamily: MONO, color, flexShrink: 0 }}>{marker}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function VoiceFingerprintPanel({ plan }: VoiceFingerprintPanelProps) {
  const { brands, voiceFingerprints, setVoiceFingerprint } = useBrandStore();
  const brandDNA = useCurrentBrand();
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBrand = brands.some(brandHasContent);
  const isPro = plan !== 'FREE';
  const fingerprint: VoiceFingerprint | undefined = brandDNA
    ? voiceFingerprints[brandDNA.id]
    : undefined;
  const sampleCount = brandDNA?.voiceSamples.length ?? 0;

  async function extract() {
    if (!brandDNA || extracting) return;
    setExtracting(true);
    setError(null);
    try {
      const res = await fetch('/api/voice-fingerprint/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          samples: brandDNA.voiceSamples,
          existingFingerprint: fingerprint,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.code === 'PLAN_REQUIRED'
            ? 'Voice Fingerprint requires PRO.'
            : data.error || 'Extraction failed'
        );
      }
      // Writes both the record and brand.voiceFingerprint — the hydration
      // debounce persists it to the workspace brand.
      setVoiceFingerprint(brandDNA.id, data.fingerprint as VoiceFingerprint);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  }

  if (!hasBrand) return null;

  const summary = fingerprint ? summarizeFingerprint(fingerprint) : null;

  return (
    <section
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      {/* ── Header ── */}
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
          {'// VOICE FINGERPRINT'}
        </span>
        <div className="flex items-center gap-3">
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: '0.12em',
              color: isPro ? 'var(--success)' : 'var(--warning)',
            }}
          >
            [PRO]
          </span>
          {fingerprint && (
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-tertiary)' }}>
              confidence {fingerprint.metadata.confidence}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 sm:px-6 py-6">
        {/* ── Locked (FREE plan) ── */}
        {!isPro && (
          <div>
            <p
              className="mb-2"
              style={{ fontFamily: MONO, fontSize: 13, color: 'var(--text-secondary)' }}
            >
              &gt; voice fingerprint locked — requires PRO
            </p>
            <p className="mb-5 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Extract a fingerprint of how you actually write — sentence rhythm, vocabulary,
              signature moves — and every content check also scores authenticity against it.
            </p>
            <a
              href="/pricing"
              className="inline-block px-5 py-2.5 text-sm transition-opacity hover:opacity-80"
              style={{
                fontFamily: MONO,
                letterSpacing: '0.08em',
                border: '1px solid var(--accent)',
                backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                color: 'var(--accent)',
                borderRadius: 2,
              }}
            >
              [ UPGRADE TO PRO ]
            </a>
          </div>
        )}

        {/* ── PRO, no fingerprint yet ── */}
        {isPro && !fingerprint && (
          <div>
            <p
              className="mb-3"
              style={{ fontFamily: MONO, fontSize: 13, color: 'var(--text-primary)' }}
            >
              <span style={{ color: 'var(--accent)' }}>$</span> voice.extract(samples)
            </p>
            {sampleCount === 0 ? (
              <p style={{ fontFamily: MONO, fontSize: 11, color: 'var(--text-tertiary)' }}>
                {'// add voice samples in BRAND DNA first — the fingerprint is extracted from them'}
              </p>
            ) : (
              <>
                <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {sampleCount} voice sample{sampleCount === 1 ? '' : 's'} ready
                  {sampleCount < 3 && ' — 3+ gives a sharper fingerprint'}.
                </p>
                <div className="flex items-center gap-4">
                  <TerminalButton primary onClick={extract} disabled={extracting}>
                    {extracting ? '[ EXTRACTING... ]' : '[ EXTRACT FINGERPRINT ]'}
                  </TerminalButton>
                  {extracting && (
                    <motion.span
                      animate={{ opacity: [1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ fontFamily: MONO, fontSize: 11, color: 'var(--text-tertiary)' }}
                    >
                      {'> sequencing your writing style...'}
                    </motion.span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Fingerprint view ── */}
        <AnimatePresence>
          {isPro && fingerprint && summary && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <SectionLabel>CONFIDENCE</SectionLabel>
                  <span style={{ fontFamily: MONO, fontSize: 14, color: 'var(--accent)' }}>
                    {fingerprint.metadata.confidence}
                  </span>
                </div>
                <span
                  className="block whitespace-pre text-sm"
                  style={{ fontFamily: MONO, color: 'var(--accent)' }}
                >
                  {asciiBar(fingerprint.metadata.confidence, 28)}
                </span>
              </div>

              <div>
                <SectionLabel>{'// your voice'}</SectionLabel>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {summary.voiceDescription}
                </p>
              </div>

              {summary.keyRules.length > 0 && (
                <div>
                  <SectionLabel>{'// key rules'}</SectionLabel>
                  <MarkerList items={summary.keyRules} marker="✓" color="var(--success)" />
                </div>
              )}

              {summary.antiRules.length > 0 && (
                <div>
                  <SectionLabel>{'// never'}</SectionLabel>
                  <MarkerList items={summary.antiRules} marker="✗" color="var(--danger)" />
                </div>
              )}

              {summary.signatureMarkers.length > 0 && (
                <div>
                  <SectionLabel>{'// signature markers'}</SectionLabel>
                  <MarkerList items={summary.signatureMarkers} marker=">" color="var(--accent)" />
                </div>
              )}

              <div className="flex items-center gap-4">
                <TerminalButton onClick={extract} disabled={extracting || sampleCount === 0}>
                  {extracting ? '[ RE-EXTRACTING... ]' : '[ RE-EXTRACT ]'}
                </TerminalButton>
                <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-tertiary)' }}>
                  from {fingerprint.metadata.sampleCount} samples ·{' '}
                  {new Date(fingerprint.metadata.extractedAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-3" style={{ fontFamily: MONO, fontSize: 11, color: 'var(--danger)' }}>
            ✗ {error}
          </p>
        )}
      </div>
    </section>
  );
}

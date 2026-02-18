'use client';

import { useState } from 'react';
import { useBrandStore, useCurrentBrand } from '@/lib/store';
import {
  VoiceFingerprint as VoiceFingerprintType,
  AuthenticityScore,
  summarizeFingerprint,
} from '@/lib/voice-fingerprint';
import VoiceFingerprintRadar from './VoiceFingerprintRadar';
import { useToast } from '@/components/ToastProvider';

// Dimension detail panel
function DimensionPanel({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'all 150ms ease',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-primary)',
        }}
      >
        {title}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-tertiary)"
          strokeWidth={2}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 150ms ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {items.map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{item.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VoiceFingerprint() {
  const brandDNA = useCurrentBrand();
  const { currentBrandId, voiceFingerprints, setVoiceFingerprint } = useBrandStore();
  const toast = useToast();

  const fingerprint = currentBrandId ? voiceFingerprints[currentBrandId] : null;

  const [sampleText, setSampleText] = useState('');
  const [samples, setSamples] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [beforeAfterResult, setBeforeAfterResult] = useState<{
    generic: string;
    fingerprinted: string;
    genericScore: AuthenticityScore | null;
    fingerprintedScore: AuthenticityScore | null;
  } | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const addSample = () => {
    if (!sampleText.trim()) return;
    setSamples((prev) => [...prev, sampleText.trim()]);
    setSampleText('');
  };

  const removeSample = (index: number) => {
    setSamples((prev) => prev.filter((_, i) => i !== index));
  };

  // Pull from existing voice samples
  const importVoiceSamples = () => {
    if (!brandDNA?.voiceSamples?.length) return;
    setSamples((prev) => [...prev, ...brandDNA.voiceSamples]);
    toast.success('Imported!', `${brandDNA.voiceSamples.length} voice samples added.`);
  };

  const handleExtract = async () => {
    if (samples.length === 0) return;
    setIsExtracting(true);

    try {
      const res = await fetch('/api/voice-fingerprint/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          samples,
          existingFingerprint: fingerprint || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Extraction failed');
      }

      const { fingerprint: fp } = await res.json();
      if (currentBrandId) {
        setVoiceFingerprint(currentBrandId, fp);
      }
      toast.success('Voice Print created!', `Confidence: ${fp.metadata.confidence}%`);
    } catch (error) {
      toast.error('Extraction failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleShowDifference = async () => {
    if (!fingerprint || !brandDNA) return;
    setIsGeneratingPreview(true);
    setShowBeforeAfter(true);
    setBeforeAfterResult(null);

    const testPrompt = 'Write a short social media post about the importance of building in public';

    try {
      // Generate WITHOUT fingerprint
      const genericRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandDNA, prompt: testPrompt, contentType: 'social-twitter' }),
      });
      const genericData = await genericRes.json();

      // Generate WITH fingerprint
      const summary = summarizeFingerprint(fingerprint);
      const fpRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          prompt: testPrompt,
          contentType: 'social-twitter',
          voiceFingerprint: summary,
        }),
      });
      const fpData = await fpRes.json();

      // Score both
      let genericScore: AuthenticityScore | null = null;
      let fpScore: AuthenticityScore | null = null;

      try {
        const gScoreRes = await fetch('/api/voice-fingerprint/check-authenticity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: genericData.content, fingerprint }),
        });
        if (gScoreRes.ok) {
          const d = await gScoreRes.json();
          genericScore = d.score;
        }
      } catch {}

      try {
        const fpScoreRes = await fetch('/api/voice-fingerprint/check-authenticity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: fpData.content, fingerprint }),
        });
        if (fpScoreRes.ok) {
          const d = await fpScoreRes.json();
          fpScore = d.score;
        }
      } catch {}

      setBeforeAfterResult({
        generic: genericData.content || 'Generation failed',
        fingerprinted: fpData.content || 'Generation failed',
        genericScore,
        fingerprintedScore: fpScore,
      });
    } catch {
      toast.error('Preview failed', 'Could not generate comparison.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Build radar data from fingerprint
  const radarData = fingerprint
    ? {
        vocabulary: fingerprint.vocabulary.complexity === 'advanced' ? 85 : fingerprint.vocabulary.complexity === 'moderate' ? 60 : 35,
        sentenceRhythm: fingerprint.sentencePatterns.lengthVariation === 'dramatic' ? 90 : fingerprint.sentencePatterns.lengthVariation === 'mixed' ? 65 : 40,
        formatting: fingerprint.formatting.useOfEmphasis === 'heavy' ? 85 : fingerprint.formatting.useOfEmphasis === 'moderate' ? 60 : 30,
        rhetoric: fingerprint.rhetoric.emotionalRange === 'expressive' ? 85 : fingerprint.rhetoric.emotionalRange === 'moderate' ? 60 : 35,
        signatureElements: Math.min(100, fingerprint.signatureElements.length * 20),
        opinionStrength: fingerprint.thinkingStyle.certaintyLevel === 'assertive' ? 90 : fingerprint.thinkingStyle.certaintyLevel === 'balanced' ? 60 : 30,
        storytelling: fingerprint.contentStructure.pacing === 'building' ? 80 : fingerprint.contentStructure.pacing === 'front-loaded' ? 70 : 50,
      }
    : null;

  return (
    <div>
      <section className="pb-8">
        <h2
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}
        >
          Voice Print
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
          A granular model of how you actually write — sentence rhythms, vocabulary quirks, formatting
          habits, and rhetorical patterns. Every piece of AI-generated content gets filtered through this
          so it sounds unmistakably like <em>you</em>.
        </p>
      </section>

      <section className="max-w-3xl mx-auto">
        {/* Status Card */}
        <div
          style={{
            padding: 20,
            background: 'var(--surface)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                Voice Print Status
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                {fingerprint ? (
                  <>
                    Active
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--success, #34C759)',
                        marginLeft: 8,
                        verticalAlign: 'middle',
                      }}
                    />
                  </>
                ) : (
                  <>
                    Not configured
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--text-quaternary)',
                        marginLeft: 8,
                        verticalAlign: 'middle',
                      }}
                    />
                  </>
                )}
              </div>
            </div>
            {fingerprint && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Confidence</div>
                <div style={{ fontSize: 24, fontWeight: 300, color: 'var(--text-primary)' }}>
                  {fingerprint.metadata.confidence}
                  <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>%</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-quaternary)' }}>
                  {fingerprint.metadata.sampleCount} samples analyzed
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Radar Chart (if fingerprint exists) */}
        {fingerprint && radarData && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 32,
              padding: 24,
              background: 'var(--surface)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            <VoiceFingerprintRadar data={radarData} size={300} />
          </div>
        )}

        {/* Dimension Details (if fingerprint exists) */}
        {fingerprint && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 32 }}>
            <DimensionPanel
              title="Sentence Patterns"
              items={[
                { label: 'Average Length', value: fingerprint.sentencePatterns.avgLength },
                { label: 'Length Variation', value: fingerprint.sentencePatterns.lengthVariation },
                { label: 'Opening Style', value: fingerprint.sentencePatterns.openingStyle || '—' },
                { label: 'Closing Style', value: fingerprint.sentencePatterns.closingStyle || '—' },
                { label: 'Fragment Usage', value: fingerprint.sentencePatterns.fragmentUsage },
                { label: 'List Style', value: fingerprint.sentencePatterns.listStyle },
              ]}
            />
            <DimensionPanel
              title="Vocabulary"
              items={[
                { label: 'Complexity', value: fingerprint.vocabulary.complexity },
                { label: 'Jargon Level', value: fingerprint.vocabulary.jargonLevel },
                { label: 'Signature Words', value: fingerprint.vocabulary.signatureWords.join(', ') || '—' },
                { label: 'Avoided Words', value: fingerprint.vocabulary.avoidedWords.join(', ') || '—' },
                { label: 'Contractions', value: fingerprint.vocabulary.contractionUsage },
                { label: 'Slang', value: fingerprint.vocabulary.slangComfort },
              ]}
            />
            <DimensionPanel
              title="Formatting"
              items={[
                { label: 'Paragraph Length', value: fingerprint.formatting.paragraphLength },
                { label: 'Emphasis', value: fingerprint.formatting.useOfEmphasis },
                { label: 'Emoji Usage', value: fingerprint.formatting.emojiUsage },
                { label: 'Line Breaks', value: fingerprint.formatting.lineBreakStyle },
                { label: 'Hashtags', value: fingerprint.formatting.hashtagStyle },
              ]}
            />
            <DimensionPanel
              title="Rhetoric & Persuasion"
              items={[
                { label: 'Primary Device', value: fingerprint.rhetoric.primaryDevice || '—' },
                { label: 'Proof Style', value: fingerprint.rhetoric.proofStyle || '—' },
                { label: 'Emotional Range', value: fingerprint.rhetoric.emotionalRange },
                { label: 'Humor Style', value: fingerprint.rhetoric.humorStyle },
                { label: 'Controversy', value: fingerprint.rhetoric.controversyComfort },
              ]}
            />
            <DimensionPanel
              title="Thinking Style"
              items={[
                { label: 'Perspective', value: fingerprint.thinkingStyle.perspective },
                { label: 'Abstract vs Concrete', value: fingerprint.thinkingStyle.abstractVsConcrete },
                { label: 'Certainty Level', value: fingerprint.thinkingStyle.certaintyLevel },
                { label: 'Nuance Level', value: fingerprint.thinkingStyle.nuanceLevel },
              ]}
            />
            <DimensionPanel
              title="Signature Elements"
              items={fingerprint.signatureElements.map((el, i) => ({
                label: `#${i + 1}`,
                value: el,
              }))}
            />
            <DimensionPanel
              title="Anti-Patterns (what you never do)"
              items={fingerprint.antiPatterns.map((ap, i) => ({
                label: `#${i + 1}`,
                value: ap,
              }))}
            />
          </div>
        )}

        {/* Sample Collection */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <label style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>
              Writing Samples
            </label>
            {brandDNA?.voiceSamples && brandDNA.voiceSamples.length > 0 && (
              <button
                onClick={importVoiceSamples}
                style={{
                  fontSize: 12,
                  color: 'var(--accent, #0A84FF)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Import from Voice Samples ({brandDNA.voiceSamples.length})
              </button>
            )}
          </div>
          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Paste a writing sample — tweets, blog posts, emails, anything you've written..."
            rows={4}
            style={{
              width: '100%',
              background: 'transparent',
              fontSize: 14,
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 14,
              outline: 'none',
              resize: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={addSample}
              disabled={!sampleText.trim()}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                border: '1px solid var(--border)',
                borderRadius: 20,
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: sampleText.trim() ? 'pointer' : 'default',
                opacity: sampleText.trim() ? 1 : 0.3,
                transition: 'all 150ms ease',
              }}
            >
              Add Sample
            </button>
          </div>

          {/* Existing samples */}
          {samples.length > 0 && (
            <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
              {samples.map((sample, i) => (
                <div
                  key={i}
                  onClick={() => removeSample(i)}
                  style={{
                    padding: 12,
                    background: 'var(--surface)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 150ms ease',
                  }}
                  className="group"
                >
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    &ldquo;{sample.length > 200 ? sample.slice(0, 200) + '...' : sample}&rdquo;
                  </p>
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 12,
                      fontSize: 12,
                      color: 'var(--text-quaternary)',
                      opacity: 0,
                      transition: 'opacity 150ms ease',
                    }}
                    className="group-hover:!opacity-100"
                  >
                    remove
                  </span>
                </div>
              ))}
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 4 }}>
                {samples.length} sample{samples.length !== 1 ? 's' : ''} ready
                {samples.length < 5 && ' — 5+ recommended for best results'}
              </div>
            </div>
          )}
        </div>

        {/* Extract Button */}
        <button
          onClick={handleExtract}
          disabled={isExtracting || samples.length === 0}
          style={{
            width: '100%',
            padding: '14px 0',
            fontSize: 14,
            fontWeight: 500,
            background: 'var(--text-primary)',
            color: 'var(--background)',
            border: 'none',
            borderRadius: 24,
            cursor: samples.length > 0 && !isExtracting ? 'pointer' : 'default',
            opacity: samples.length > 0 && !isExtracting ? 1 : 0.3,
            transition: 'opacity 150ms ease',
          }}
        >
          {isExtracting
            ? 'Analyzing your writing...'
            : fingerprint
              ? 'Update Voice Print with New Samples'
              : 'Analyze & Create Voice Print'}
        </button>

        {/* Before/After Preview */}
        {fingerprint && (
          <div style={{ marginTop: 32 }}>
            <button
              onClick={handleShowDifference}
              disabled={isGeneratingPreview}
              style={{
                width: '100%',
                padding: '12px 0',
                fontSize: 13,
                fontWeight: 500,
                background: 'transparent',
                color: 'var(--accent, #0A84FF)',
                border: '1px solid var(--accent, #0A84FF)',
                borderRadius: 24,
                cursor: isGeneratingPreview ? 'default' : 'pointer',
                opacity: isGeneratingPreview ? 0.5 : 1,
                transition: 'all 150ms ease',
              }}
            >
              {isGeneratingPreview ? 'Generating comparison...' : 'Show Me The Difference'}
            </button>

            {showBeforeAfter && beforeAfterResult && (
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div
                  style={{
                    padding: 16,
                    background: 'var(--surface)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>
                      Without Voice Print
                    </span>
                    {beforeAfterResult.genericScore && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: beforeAfterResult.genericScore.overall < 50 ? '#FF453A' : '#FF9F0A',
                        }}
                      >
                        {beforeAfterResult.genericScore.overall}/100
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {beforeAfterResult.generic}
                  </p>
                </div>
                <div
                  style={{
                    padding: 16,
                    background: 'var(--surface)',
                    borderRadius: 12,
                    border: '1px solid rgba(10, 132, 255, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0A84FF' }}>
                      With Voice Print
                    </span>
                    {beforeAfterResult.fingerprintedScore && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: beforeAfterResult.fingerprintedScore.overall >= 70 ? 'var(--success, #34C759)' : '#FF9F0A',
                        }}
                      >
                        {beforeAfterResult.fingerprintedScore.overall}/100
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {beforeAfterResult.fingerprinted}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

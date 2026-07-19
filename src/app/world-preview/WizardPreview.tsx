'use client';

import { useEffect, useState } from 'react';
import BrandSetupWizard from '@/components/dashboard/BrandSetupWizard';
import BrandDNAPanel from '@/components/dashboard/BrandDNAPanel';
import ContentCheckPanel from '@/components/dashboard/ContentCheckPanel';
import VoiceFingerprintPanel from '@/components/dashboard/VoiceFingerprintPanel';
import { createEmptyFingerprint } from '@/lib/voice-fingerprint';
import { useBrandStore } from '@/lib/store';
import { brandHasContent } from '@/hooks/useBrandHydration';
import { brandTemplates } from '@/lib/templates';

// Design-iteration harness for the dashboard brand surfaces.
//   ?wizard=1 — first-run BrandSetupWizard
//   ?dna=1    — BrandDNAPanel editor (seeds a template brand if the local
//               store is empty so the editor has data to show)
//   ?check=1  — ContentCheckPanel (seeded brand; the check API itself
//               requires auth, so [RUN CHECK] will error here — this mode is
//               for layout/typography iteration)
// Local store only; nothing syncs from this page.

export default function WizardPreview({ mode }: { mode: 'wizard' | 'dna' | 'check' | 'voice' }) {
  const [done, setDone] = useState(false);
  const [reinit, setReinit] = useState(false);
  const { brands, setBrandDNA, voiceFingerprints, setVoiceFingerprint } = useBrandStore();

  // dna/check modes: seed the store so the panels render populated.
  useEffect(() => {
    if (mode !== 'wizard' && !brands.some(brandHasContent)) {
      const t = brandTemplates[0];
      setBrandDNA({ ...t.preview, name: 'Phantom Labs' });
    }
  }, [mode, brands, setBrandDNA]);

  // voice mode: seed a plausible fingerprint so the extracted view renders.
  const currentId = brands[0]?.id;
  useEffect(() => {
    if (mode !== 'voice' || !currentId || voiceFingerprints[currentId]) return;
    const fp = createEmptyFingerprint();
    fp.sentencePatterns.openingStyle = 'bold claims';
    fp.sentencePatterns.closingStyle = 'mic drop';
    fp.vocabulary.signatureWords = ['premium', 'nostalgic', 'tactile'];
    fp.vocabulary.avoidedWords = ['epic', 'game-changer'];
    fp.signatureElements = ['em-dashes for emphasis', 'short declarative closers'];
    fp.antiPatterns = ['never opens with a question', "never says 'excited to announce'"];
    fp.metadata = {
      sampleCount: 5,
      totalWordCount: 640,
      extractedAt: new Date().toISOString(),
      confidence: 82,
      version: 1,
    };
    setVoiceFingerprint(currentId, fp);
  }, [mode, currentId, voiceFingerprints, setVoiceFingerprint]);

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {mode === 'wizard' || reinit ? (
          done ? (
            <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
              wizard finished — reload to run it again
            </p>
          ) : (
            <BrandSetupWizard onComplete={() => setDone(true)} onSkip={() => setDone(true)} />
          )
        ) : mode === 'check' ? (
          <ContentCheckPanel />
        ) : mode === 'voice' ? (
          <VoiceFingerprintPanel plan="PRO" />
        ) : (
          <BrandDNAPanel
            sync={{ isSyncing: false, lastSyncedAt: new Date(), syncError: null }}
            onReinit={() => setReinit(true)}
          />
        )}
      </div>
    </div>
  );
}

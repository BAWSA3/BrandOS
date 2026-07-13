'use client';

import { useEffect, useState } from 'react';
import BrandSetupWizard from '@/components/dashboard/BrandSetupWizard';
import BrandDNAPanel from '@/components/dashboard/BrandDNAPanel';
import { useBrandStore } from '@/lib/store';
import { brandHasContent } from '@/hooks/useBrandHydration';
import { brandTemplates } from '@/lib/templates';

// Design-iteration harness for the dashboard brand surfaces.
//   ?wizard=1 — first-run BrandSetupWizard
//   ?dna=1    — BrandDNAPanel editor (seeds a template brand if the local
//               store is empty so the editor has data to show)
// Local store only; nothing syncs from this page.

export default function WizardPreview({ mode }: { mode: 'wizard' | 'dna' }) {
  const [done, setDone] = useState(false);
  const [reinit, setReinit] = useState(false);
  const { brands, setBrandDNA } = useBrandStore();

  // dna mode: seed the store so the editor renders populated.
  useEffect(() => {
    if (mode === 'dna' && !brands.some(brandHasContent)) {
      const t = brandTemplates[0];
      setBrandDNA({ ...t.preview, name: 'Phantom Labs' });
    }
  }, [mode, brands, setBrandDNA]);

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

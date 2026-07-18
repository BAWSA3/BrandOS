'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandImportHub from '@/components/import/BrandImportHub';
import { ExtractedBrand } from '@/lib/importTypes';
import { useBrandStore, useHasHydrated } from '@/lib/store';
import { useBrandHydration } from '@/hooks/useBrandHydration';
import { MONO } from '@/components/dashboard/terminal-ui';

// Import Hub page (consolidation step 7). The legacy /app shell used this
// flow as its first-run gate and wrote the result into the browser-global
// localStorage blob. Here the output lands on the workspace brand: hydrate
// server state first, apply the extracted fields to the current brand, then
// force-sync before leaving so the import survives the redirect.

export default function ImportPageClient() {
  const router = useRouter();
  const storeReady = useHasHydrated();
  const { isHydrated, forceSync } = useBrandHydration();
  const { brands, currentBrandId, setBrandDNA } = useBrandStore();
  const [saving, setSaving] = useState(false);

  const ready = storeReady && isHydrated;

  const handleImportComplete = async (extracted: ExtractedBrand) => {
    const current = brands.find((b) => b.id === currentBrandId) ?? brands[0];

    // Same field mapping the legacy /app shell used, as one atomic update:
    // formality→minimal, energy→playful, confidence→bold, style→experimental.
    setBrandDNA({
      ...(extracted.name?.value ? { name: extracted.name.value } : {}),
      ...(extracted.colors
        ? {
            colors: {
              primary: extracted.colors.primary?.value || current?.colors?.primary || '#000000',
              secondary:
                extracted.colors.secondary?.value || current?.colors?.secondary || '#F2F0EF',
              accent: extracted.colors.accent?.value || current?.colors?.accent || '#6366f1',
            },
          }
        : {}),
      ...(extracted.tone
        ? {
            tone: {
              minimal: extracted.tone.formality?.value ?? current?.tone?.minimal ?? 50,
              playful: extracted.tone.energy?.value ?? current?.tone?.playful ?? 50,
              bold: extracted.tone.confidence?.value ?? current?.tone?.bold ?? 50,
              experimental: extracted.tone.style?.value ?? current?.tone?.experimental ?? 30,
            },
          }
        : {}),
      ...(extracted.keywords?.length ? { keywords: extracted.keywords.map((k) => k.value) } : {}),
      ...(extracted.doPatterns?.length
        ? { doPatterns: extracted.doPatterns.map((p) => p.value) }
        : {}),
      ...(extracted.dontPatterns?.length
        ? { dontPatterns: extracted.dontPatterns.map((p) => p.value) }
        : {}),
      ...(extracted.voiceSamples?.length
        ? { voiceSamples: extracted.voiceSamples.map((s) => s.value) }
        : {}),
    });

    // Push before navigating — the debounced sync would be unmounted with
    // this page and the import lost until the next local edit.
    setSaving(true);
    try {
      await forceSync();
    } finally {
      router.push('/dashboard');
    }
  };

  if (!ready || saving) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--text-tertiary)' }}>
          {saving ? 'saving imported brand...' : 'hydrating brand data...'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* The hub renders on the Swiss (light) background, so the exit link
          uses a fixed dark ink rather than the world's theme vars. */}
      <Link
        href="/dashboard"
        className="fixed top-4 left-4 z-50 transition-opacity hover:opacity-70"
        style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}
      >
        ← cd /dashboard
      </Link>
      <BrandImportHub
        onStartFresh={() => router.push('/dashboard')}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

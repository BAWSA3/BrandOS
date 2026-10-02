'use client';

import { useWorld } from '@/components/world/WorldProvider';

export default function PreviewPanel() {
  const { world, t, reducedMotion } = useWorld();

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-8">
        <header>
          <h1 className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {t('dashboardTitle', world.name)}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            World preview — {world.id} · tier: {world.tier}
          </p>
        </header>

        <section
          className="rounded-lg p-6 border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-4 font-mono"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {world.tagline}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {world.description}
          </p>
          <button
            className="mt-4 py-2 px-6 text-sm font-medium rounded-lg font-mono"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--background)' }}
          >
            {t('scanCta', 'Run Scan')}
          </button>
        </section>

        <section
          className="rounded-lg p-6 border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h3
            className="text-sm font-semibold uppercase tracking-wide mb-3 font-mono"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Palette sample
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {(['accent', 'success', 'warning', 'danger', 'foreground'] as const).map((key) => (
              <div key={key} className="text-center">
                <div
                  className="w-full aspect-square rounded"
                  style={{ backgroundColor: `var(--${key})` }}
                />
                <div className="text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {key}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
          <div>
            data-world: <span style={{ color: 'var(--text-primary)' }}>{world.id}</span>
          </div>
          <div>
            reduced-motion:{' '}
            <span style={{ color: 'var(--text-primary)' }}>{String(reducedMotion)}</span>
          </div>
          <div>
            font-mono:{' '}
            <span style={{ color: 'var(--text-primary)' }}>{world.typography.fontMono}</span>
          </div>
          <div>{t('scanCompleteToast', 'scan complete.')}</div>
        </section>
      </div>
    </div>
  );
}

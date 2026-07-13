'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useWorld } from '@/components/world/WorldProvider';
import { useBrandStore, useHasHydrated } from '@/lib/store';
import { useBrandHydration, brandHasContent } from '@/hooks/useBrandHydration';
import ScanResultPanel, { type ScanResponse } from '@/components/dashboard/ScanResultPanel';
import ScoreHistoryCard from '@/components/dashboard/ScoreHistoryCard';
import BrandSetupWizard from '@/components/dashboard/BrandSetupWizard';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

interface DashboardClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    xUsername: string | null;
    avatar: string | null;
    role: string;
  };
  workspace: {
    id: string;
    name: string;
    type: string;
    plan: string;
    activeWorldId: string | null;
  } | null;
  xConnections: Array<{
    id: string;
    username: string;
    status: string;
    connectedAt: string;
  }>;
}

export default function DashboardClient({ user, workspace, xConnections }: DashboardClientProps) {
  const { world, t } = useWorld();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  // Bumped after each successful scan so ScoreHistoryCard refetches
  const [historyKey, setHistoryKey] = useState(0);

  const activeConnection = xConnections.find((c) => c.status === 'active');

  // First-run brand setup: wait for both the persisted store and the server
  // hydration before deciding, so the wizard never flashes for users who
  // already have a brand.
  const storeReady = useHasHydrated();
  const { isHydrated, forceSync } = useBrandHydration();
  const { brands, phaseProgress, completeOnboarding } = useBrandStore();
  const needsSetup =
    storeReady &&
    isHydrated &&
    !phaseProgress.hasCompletedOnboarding &&
    !brands.some(brandHasContent);

  function handleSetupComplete() {
    completeOnboarding();
    // Push the finished brand now rather than waiting out the debounce.
    void forceSync();
  }

  async function handleConnect() {
    setConnecting(true);
    setConnectError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      });
      if (error) throw error;
      // On success the browser navigates away to X — leave the spinner on.
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Could not start X sign-in');
      setConnecting(false);
    }
  }

  async function handleScan() {
    if (!activeConnection) return;
    setScanning(true);
    setScanError(null);

    try {
      const res = await fetch('/api/x-brand-score-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: activeConnection.username,
          workspaceId: workspace?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setScanResult(data as ScanResponse);
      setHistoryKey((k) => k + 1);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ color: 'var(--text-primary)' }}>
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-mono">{t('dashboardTitle', world.name)}</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {workspace?.name || 'Personal Workspace'} · {workspace?.plan || 'FREE'} plan
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user.avatar && <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />}
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {user.name || user.email}
            </span>
          </div>
        </header>

        {/* First-run: brand DNA setup replaces the dashboard body until done */}
        {needsSetup && (
          <BrandSetupWizard onComplete={handleSetupComplete} onSkip={completeOnboarding} />
        )}

        {!needsSetup && (
          <>
            {/* X Account Connections */}
            <section
              className="rounded-lg p-6 border"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            >
              <h2
                className="text-sm font-semibold uppercase tracking-wide mb-4 font-mono"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Connected X Accounts
              </h2>

              {xConnections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {t('emptyConnections', 'Connect your X account to scan your brand.')}
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="inline-block py-2 px-6 text-sm font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--background)',
                    }}
                  >
                    {connecting
                      ? t('connectingLabel', 'Redirecting to X...')
                      : t('connectCta', 'Connect X Account')}
                  </button>
                  {connectError && (
                    <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>
                      {connectError}
                    </p>
                  )}
                  <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    We verify ownership via X OAuth. Only you can scan your handle.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {xConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--surface-tertiary)' }}
                    >
                      <div>
                        <span className="font-medium text-sm">@{conn.username}</span>
                        <span
                          className="ml-2 text-xs px-2 py-0.5 rounded-full"
                          style={
                            conn.status === 'active'
                              ? {
                                  backgroundColor:
                                    'color-mix(in srgb, var(--success) 20%, transparent)',
                                  color: 'var(--success)',
                                }
                              : {
                                  backgroundColor: 'var(--surface-hover)',
                                  color: 'var(--text-tertiary)',
                                }
                          }
                        >
                          {conn.status}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Connected {new Date(conn.connectedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Scan Section */}
            {activeConnection && (
              <section
                className="rounded-lg p-6 border"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
              >
                <h2
                  className="text-sm font-semibold uppercase tracking-wide mb-4 font-mono"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Brand Scan
                </h2>

                <div className="flex items-center gap-4">
                  <p className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>
                    Scan{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      @{activeConnection.username}
                    </strong>{' '}
                    for a fresh brand score.
                  </p>
                  <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="py-2 px-6 text-sm font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--background)',
                    }}
                  >
                    {scanning ? t('scanningLabel', 'Scanning...') : t('scanCta', 'Scan Now')}
                  </button>
                </div>

                {scanError && (
                  <div
                    className="mt-4 rounded-lg p-3 text-sm border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)',
                      color: 'var(--danger)',
                    }}
                  >
                    {scanError}
                  </div>
                )}

                {scanResult && (
                  <ScanResultPanel
                    result={scanResult}
                    fallbackUsername={activeConnection.username}
                  />
                )}
              </section>
            )}

            {/* Score History */}
            {activeConnection && (
              <ScoreHistoryCard key={historyKey} username={activeConnection.username} />
            )}

            {/* Quick Links */}
            <section className="grid grid-cols-2 gap-4">
              <a
                href="/pricing"
                className="rounded-lg p-4 border transition-colors"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
              >
                <h3 className="text-sm font-semibold font-mono">
                  {t('upgradeCta', 'Upgrade Plan')}
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Unlock multi-platform, watchlists, and more.
                </p>
              </a>
              {activeConnection ? (
                <a
                  href={`/card/${activeConnection.username}`}
                  className="rounded-lg p-4 border transition-colors"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <h3 className="text-sm font-semibold font-mono">
                    {t('shareableCardTitle', 'Shareable Card')}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {t('shareableCardSubtitle', 'View and share your public brand card.')}
                  </p>
                </a>
              ) : (
                <div
                  className="rounded-lg p-4 border opacity-60"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <h3 className="text-sm font-semibold font-mono">
                    {t('shareableCardTitle', 'Shareable Card')}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Connect an X account to unlock your public brand card.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

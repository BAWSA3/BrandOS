'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  } | null;
  xConnections: Array<{
    id: string;
    username: string;
    status: string;
    connectedAt: string;
  }>;
}

export default function DashboardClient({ user, workspace, xConnections }: DashboardClientProps) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Record<string, unknown> | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const activeConnection = xConnections.find((c) => c.status === 'active');

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
      setScanResult(data);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              BrandOS Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              {workspace?.name || 'Personal Workspace'} &middot; {workspace?.plan || 'FREE'} plan
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user.avatar && (
              <img
                src={user.avatar}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700">{user.name || user.email}</span>
          </div>
        </header>

        {/* X Account Connections */}
        <section className="border border-gray-200 rounded-lg p-6">
          <h2
            className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Connected X Accounts
          </h2>

          {xConnections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm mb-4">
                Connect your X account to scan your brand.
              </p>
              <button
                onClick={async () => {
                  await supabase.auth.signInWithOAuth({
                    provider: 'twitter',
                    options: {
                      redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
                    },
                  });
                }}
                className="inline-block py-2 px-6 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Connect X Account
              </button>
              <p className="mt-2 text-xs text-gray-400">
                We verify ownership via X OAuth. Only you can scan your handle.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {xConnections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-sm">@{conn.username}</span>
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        conn.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {conn.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Connected {new Date(conn.connectedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Scan Section */}
        {activeConnection && (
          <section className="border border-gray-200 rounded-lg p-6">
            <h2
              className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Brand Scan
            </h2>

            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600 flex-1">
                Scan <strong>@{activeConnection.username}</strong> for a fresh brand score.
              </p>
              <button
                onClick={handleScan}
                disabled={scanning}
                className="py-2 px-6 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {scanning ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>

            {scanError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {scanError}
              </div>
            )}

            {scanResult && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium">
                  Score: {(scanResult as { brandScore?: { overallScore?: number } }).brandScore?.overallScore ?? 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(scanResult as { meta?: { cached?: boolean } }).meta?.cached
                    ? 'Returned from 24h cache'
                    : 'Fresh analysis'}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-4">
          <a
            href="/pricing"
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <h3
              className="text-sm font-semibold"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Upgrade Plan
            </h3>
            <p className="text-xs text-gray-500 mt-1">Unlock multi-platform, watchlists, and more.</p>
          </a>
          <a
            href={activeConnection ? `/card/${activeConnection.username}` : '#'}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <h3
              className="text-sm font-semibold"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Shareable Card
            </h3>
            <p className="text-xs text-gray-500 mt-1">View and share your public brand card.</p>
          </a>
        </section>
      </div>
    </div>
  );
}

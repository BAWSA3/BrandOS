'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import UserActivityTable from './UserActivityTable';

interface ContentEngineStats {
  totals: {
    totalUsers: number;
    totalGenerations: number;
    totalTimeMs: number;
    totalInvitesSent: number;
    totalInvitesRedeemed: number;
  };
  users: Array<{
    id: string;
    username: string;
    name: string | null;
    avatar: string | null;
    tier: string;
    generations: number;
    totalTimeMs: number;
    sessionCount: number;
    invitesSent: number;
    invitesRedeemed: number;
    lastActive: string;
  }>;
}

function formatDuration(ms: number): string {
  if (ms === 0) return '0m';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return `${hours}h ${remaining}m`;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-4">
      <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50">
        {label}
      </span>
      <div className="mt-2">
        <span className="text-3xl font-light text-white">{value}</span>
      </div>
    </div>
  );
}

export default function ContentEngineDashboard({ adminKey }: { adminKey: string }) {
  const [stats, setStats] = useState<ContentEngineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/content-engine-stats', {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-white/50 py-12 justify-center">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading content engine stats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      {/* Headline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Generations" value={stats.totals.totalGenerations} />
        <StatCard label="Total Time" value={formatDuration(stats.totals.totalTimeMs)} />
        <StatCard label="Invites Sent" value={stats.totals.totalInvitesSent} />
        <StatCard label="Invites Redeemed" value={stats.totals.totalInvitesRedeemed} />
        <StatCard label="Active Users" value={stats.totals.totalUsers} />
      </div>

      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchStats}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* User Activity Table */}
      <UserActivityTable users={stats.users} />
    </div>
  );
}

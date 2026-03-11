'use client';

import { useState } from 'react';

interface UserActivity {
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
}

type SortKey = 'generations' | 'totalTimeMs' | 'invitesSent' | 'lastActive' | 'username';

function formatDuration(ms: number): string {
  if (ms === 0) return '—';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return `${hours}h ${remaining}m`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UserActivityTable({ users }: { users: UserActivity[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('generations');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...users].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'username') {
      cmp = a.username.localeCompare(b.username);
    } else if (sortKey === 'lastActive') {
      cmp = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
    } else {
      cmp = (a[sortKey] as number) - (b[sortKey] as number);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {[
                { key: 'username' as SortKey, label: 'User' },
                { key: 'generations' as SortKey, label: 'Generations' },
                { key: 'totalTimeMs' as SortKey, label: 'Time Spent' },
                { key: 'invitesSent' as SortKey, label: 'Invites' },
                { key: 'lastActive' as SortKey, label: 'Last Active' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="text-left text-xs font-mono uppercase tracking-wider text-white/50 px-4 py-3 cursor-pointer hover:text-white/70 select-none"
                >
                  {col.label}{sortArrow(col.key)}
                </th>
              ))}
              <th className="text-left text-xs font-mono uppercase tracking-wider text-white/50 px-4 py-3">Tier</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(user => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {user.avatar && (
                      <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                    )}
                    <span className="font-mono text-[#0047FF]">@{user.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/70 font-mono">{user.generations}</td>
                <td className="px-4 py-3 text-white/70 font-mono">{formatDuration(user.totalTimeMs)}</td>
                <td className="px-4 py-3 text-white/70 font-mono">
                  {user.invitesSent > 0
                    ? `${user.invitesSent} sent / ${user.invitesRedeemed} used`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-white/50 text-sm">{formatDate(user.lastActive)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.tier === 'FREE'
                      ? 'bg-white/10 text-white/60'
                      : user.tier === 'CREATOR'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {user.tier}
                  </span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/50">
                  No user activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

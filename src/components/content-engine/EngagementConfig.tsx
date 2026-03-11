'use client';

import { useState } from 'react';
import { ContentEngineConfig, EngagementContext } from '@/lib/agents/content-engine.types';

interface EngagementConfigProps {
  config: ContentEngineConfig;
  onSave: (config: ContentEngineConfig) => void;
}

export default function EngagementConfig({ config, onSave }: EngagementConfigProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(config.engagement);
  const [voiceConstraints, setVoiceConstraints] = useState(config.voiceConstraints.join(', '));
  const [neverSay, setNeverSay] = useState(config.neverSay.join(', '));
  const [themes, setThemes] = useState(config.themes.join(', '));

  const update = (field: keyof EngagementContext, value: string) => {
    setDraft(prev => ({
      ...prev,
      [field]: field === 'topGaps' || field === 'targetDate'
        ? value
        : value === '' ? undefined : Number(value),
    }));
  };

  const handleSave = () => {
    onSave({
      ...config,
      engagement: {
        ...draft,
        topGaps: typeof draft.topGaps === 'string'
          ? (draft.topGaps as unknown as string).split(',').map(s => s.trim()).filter(Boolean)
          : draft.topGaps,
      },
      voiceConstraints: voiceConstraints.split(',').map(s => s.trim()).filter(Boolean),
      neverSay: neverSay.split(',').map(s => s.trim()).filter(Boolean),
      themes: themes.split(',').map(s => s.trim()).filter(Boolean),
    });
    setEditing(false);
  };

  if (!editing) {
    const eng = config.engagement;
    const hasData = eng.followerCount || eng.engagementRate || eng.topGaps.length > 0;
    return (
      <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="label-mono text-[var(--text-tertiary)]">Context & Voice</h3>
          <button
            onClick={() => setEditing(true)}
            className="label-mono text-[var(--text-quaternary)] hover:text-[var(--text-secondary)] border border-[var(--surface-tertiary)] px-3 py-1.5 rounded-[var(--radius-sm)] transition-[var(--transition-fast)]"
          >
            {hasData ? 'edit' : 'configure'}
          </button>
        </div>
        {hasData ? (
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {eng.followerCount && <span className="label-mono text-[var(--text-quaternary)]">Followers: <span className="text-[var(--text-primary)]">{eng.followerCount.toLocaleString()}</span></span>}
            {eng.followerTarget && <span className="label-mono text-[var(--text-quaternary)]">Target: <span className="text-[var(--text-primary)]">{eng.followerTarget.toLocaleString()}</span></span>}
            {eng.engagementRate && <span className="label-mono text-[var(--text-quaternary)]">Eng Rate: <span className="text-[var(--text-primary)]">{eng.engagementRate}%</span></span>}
            {eng.topGaps.length > 0 && <span className="label-mono text-[var(--text-quaternary)]">Gaps: <span className="text-[var(--warning)]">{eng.topGaps.join(', ')}</span></span>}
          </div>
        ) : (
          <p className="font-mono text-xs text-[var(--text-quaternary)]">Add your metrics and voice settings to improve generation quality.</p>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] p-5 mb-4">
      <h3 className="label-mono text-[var(--text-tertiary)] mb-4">Context & Voice</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="Current Followers" value={draft.followerCount ?? ''} onChange={v => update('followerCount', v)} placeholder="e.g. 33000" />
        <Field label="Target Followers" value={draft.followerTarget ?? ''} onChange={v => update('followerTarget', v)} placeholder="e.g. 50000" />
        <Field label="Target Date" value={draft.targetDate ?? ''} onChange={v => setDraft(prev => ({ ...prev, targetDate: v || undefined }))} placeholder="e.g. mid-July 2026" />
        <Field label="Engagement Rate %" value={draft.engagementRate ?? ''} onChange={v => update('engagementRate', v)} placeholder="e.g. 6.5" />
        <Field label="Avg Retweets" value={draft.avgRetweets ?? ''} onChange={v => update('avgRetweets', v)} placeholder="e.g. 1.15" />
        <Field label="CTA Score (0-100)" value={draft.ctaScore ?? ''} onChange={v => update('ctaScore', v)} placeholder="e.g. 45" />
        <Field label="CTA Target" value={draft.ctaTarget ?? ''} onChange={v => update('ctaTarget', v)} placeholder="e.g. 65" />
        <Field label="Top Gaps (comma-separated)" value={Array.isArray(draft.topGaps) ? draft.topGaps.join(', ') : ''} onChange={v => setDraft(prev => ({ ...prev, topGaps: v.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="e.g. CTA, Hook" />
      </div>
      <div className="space-y-3 mb-4">
        <div>
          <label className="label-mono text-[var(--text-quaternary)] block mb-1">Voice Constraints (comma-separated)</label>
          <input value={voiceConstraints} onChange={e => setVoiceConstraints(e.target.value)} placeholder="e.g. lowercase, no em dashes, 0-2 emojis" className="terminal-input w-full bg-[var(--surface)] border border-[var(--surface-tertiary)] rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-primary)] text-xs outline-none focus:border-[var(--accent)]" />
        </div>
        <div>
          <label className="label-mono text-[var(--text-quaternary)] block mb-1">Never Say (comma-separated phrases)</label>
          <input value={neverSay} onChange={e => setNeverSay(e.target.value)} placeholder="e.g. let's dive in, game-changer, here's the thing" className="terminal-input w-full bg-[var(--surface)] border border-[var(--surface-tertiary)] rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-primary)] text-xs outline-none focus:border-[var(--accent)]" />
        </div>
        <div>
          <label className="label-mono text-[var(--text-quaternary)] block mb-1">Quick Topic Themes (comma-separated)</label>
          <input value={themes} onChange={e => setThemes(e.target.value)} placeholder="e.g. build updates, content systems, creator economy" className="terminal-input w-full bg-[var(--surface)] border border-[var(--surface-tertiary)] rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-primary)] text-xs outline-none focus:border-[var(--accent)]" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="btn-primary px-4 py-2 text-xs font-medium rounded-[var(--radius-sm)]">
          Save
        </button>
        <button onClick={() => setEditing(false)} className="label-mono text-[var(--text-quaternary)] border border-[var(--surface-tertiary)] px-4 py-2 rounded-[var(--radius-sm)] hover:text-[var(--text-secondary)] transition-[var(--transition-fast)]">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string | number; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="label-mono text-[var(--text-quaternary)] block mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="terminal-input w-full bg-[var(--surface)] border border-[var(--surface-tertiary)] rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-primary)] text-xs outline-none focus:border-[var(--accent)]"
      />
    </div>
  );
}

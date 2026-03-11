'use client';

import {
  ContentEngineConfig,
  DAYS_OF_WEEK,
} from '@/lib/agents/content-engine.types';

interface ScheduleEditorProps {
  config: ContentEngineConfig;
  onSave: (config: ContentEngineConfig) => void;
}

export default function ScheduleEditor({ config }: ScheduleEditorProps) {
  return (
    <div className="glass-card border border-[var(--surface-tertiary)] rounded-[var(--radius-md)] p-5 mb-4">
      <h3 className="label-mono text-[var(--text-tertiary)] mb-4">Weekly Schedule</h3>
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center">
            <div className="label-mono text-[var(--text-quaternary)] mb-1.5" style={{ fontSize: 9 }}>{day.slice(0, 3)}</div>
            <div className="font-mono text-[10px] text-[var(--accent)] font-medium">{config.schedule[day].post1.format}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

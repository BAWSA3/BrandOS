'use client';

import { Palette, CheckCircle, Zap, BarChart3 } from 'lucide-react';
import type { Phase } from '@/components/PhaseNavigation';

interface PhaseQuickAccessProps {
  brandCompleteness: number;
  hasChecked: boolean;
  hasGenerated: boolean;
  onNavigate: (phase: Phase) => void;
}

const phaseCards = [
  {
    id: 'define' as Phase,
    label: 'Define',
    number: '01',
    description: 'Brand DNA',
    icon: Palette,
    color: '#0047FF',
    getProgress: (completeness: number) => completeness,
    getStatus: (completeness: number) => completeness >= 70 ? 'Complete' : `${completeness}%`,
  },
  {
    id: 'check' as Phase,
    label: 'Check',
    number: '02',
    description: 'Content scoring',
    icon: CheckCircle,
    color: '#00FF41',
    getProgress: (_c: number, hasChecked: boolean) => hasChecked ? 100 : 0,
    getStatus: (_c: number, hasChecked: boolean) => hasChecked ? 'Active' : 'Locked',
  },
  {
    id: 'generate' as Phase,
    label: 'Generate',
    number: '03',
    description: 'Content workflow',
    icon: Zap,
    color: '#A855F7',
    getProgress: (_c: number, _h: boolean, hasGenerated: boolean) => hasGenerated ? 100 : 0,
    getStatus: (_c: number, _h: boolean, hasGenerated: boolean) => hasGenerated ? 'Active' : 'Locked',
  },
  {
    id: 'scale' as Phase,
    label: 'Scale',
    number: '04',
    description: 'Analytics & export',
    icon: BarChart3,
    color: '#FFD700',
    getProgress: () => 0,
    getStatus: () => 'Ready',
  },
];

export default function PhaseQuickAccess({
  brandCompleteness,
  hasChecked,
  hasGenerated,
  onNavigate,
}: PhaseQuickAccessProps) {
  return (
    <div
      className="col-span-1 rounded-2xl border p-5"
      style={{
        background: 'rgba(15, 15, 15, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium mb-3">
        Phase Tools
      </h3>

      <div className="space-y-2">
        {phaseCards.map((phase) => {
          const progress = phase.getProgress(brandCompleteness, hasChecked, hasGenerated);
          const status = phase.getStatus(brandCompleteness, hasChecked, hasGenerated);
          const isLocked = status === 'Locked';

          return (
            <button
              key={phase.id}
              onClick={() => !isLocked && onNavigate(phase.id)}
              disabled={isLocked}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                isLocked
                  ? 'opacity-40 cursor-not-allowed border-white/[0.04] bg-white/[0.01]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
              }`}
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${phase.color}12` }}
              >
                <phase.icon className="w-4 h-4" style={{ color: phase.color }} />
              </div>

              {/* Label + progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/30">{phase.number}</span>
                  <span className="text-[11px] font-medium text-white/70">{phase.label}</span>
                </div>
                {/* Mini progress bar */}
                <div className="mt-1 h-0.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(progress, 2)}%`, backgroundColor: phase.color }}
                  />
                </div>
              </div>

              {/* Status */}
              <span
                className={`text-[9px] font-mono shrink-0 ${
                  status === 'Complete' || status === 'Active'
                    ? 'text-[#00FF41]/70'
                    : status === 'Locked'
                    ? 'text-white/20'
                    : 'text-white/30'
                }`}
              >
                {status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

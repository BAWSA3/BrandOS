'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import { useWorkflowStore } from '../useWorkflowStore';
import { TONE_OPTIONS, TonePill } from '../workflow.types';

function ToneContextNode(_props: NodeProps) {
  const { tone, setTone } = useWorkflowStore();

  return (
    <BaseNode
      nodeType="toneContext"
      title="Tone / Context"
      subtitle={tone ? TONE_OPTIONS.find((t) => t.value === tone)?.label : 'Select'}
      inputs={[{ id: 'topic-in', color: '#2E6AFF' }]}
      outputs={[{ id: 'tone-out', color: '#FFD700' }]}
      isActive={tone !== null}
    >
      <div className="grid grid-cols-2 gap-1.5">
        {TONE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() =>
              setTone(tone === option.value ? null : (option.value as TonePill))
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all border ${
              tone === option.value
                ? 'bg-[#FFD700]/15 border-[#FFD700]/40 text-[#FFD700]'
                : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:text-white/70 hover:border-white/10'
            }`}
          >
            <span className="text-xs">{option.emoji}</span>
            {option.label}
          </button>
        ))}
      </div>
    </BaseNode>
  );
}

export default memo(ToneContextNode);

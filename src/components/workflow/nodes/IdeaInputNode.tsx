'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import { useWorkflowStore } from '../useWorkflowStore';

function IdeaInputNode(_props: NodeProps) {
  const { topic, setTopic } = useWorkflowStore();

  const charCount = topic.length;

  return (
    <BaseNode
      nodeType="ideaInput"
      title="Idea"
      subtitle={charCount > 0 ? `${charCount} chars` : undefined}
      outputs={[{ id: 'topic', color: '#2E6AFF' }]}
      isActive={topic.length > 0}
    >
      <div className="space-y-3">
        <p className="text-[11px] text-white/40 leading-relaxed">
          What do you want to talk about today?
        </p>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Drop your idea here..."
          rows={4}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/20 resize-none outline-none focus:border-[#2E6AFF]/50 transition-colors"
          style={{ fontFamily: 'inherit' }}
        />
      </div>
    </BaseNode>
  );
}

export default memo(IdeaInputNode);
